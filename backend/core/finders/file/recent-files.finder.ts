import * as fs from "fs";
import * as vscode from "vscode";
import { RecentFileData, RecentFilesFinderData } from "../../../../shared/exchange/recent-files";
import { TextPreviewData } from "../../../../shared/extension-webview-protocol";
import { Globals } from "../../../globals";
import { execCmd } from "../../../utils/commands";
import { FileReader } from "../../common/file-reader";
import { FuzzyFinderAdapter, FuzzyFinderProvider } from "../../decorators/fuzzy-finder-provider.decorator";

/**
 * Fuzzy provider that retrieves recently opened files and system tabs.
 */
@FuzzyFinderAdapter({
  fuzzy: "workspace.recentFiles",
  previewRenderer: "preview.buffer",
  dataAdapter: "workspaceRecentFilesAdapter",
  name: "Recent Files",
  description: "Browse recently opened files",
})
export class RecentFilesFinder implements FuzzyFinderProvider {
  async querySelectableOptions(): Promise<RecentFilesFinderData> {
    const files = await this.getRecentFiles();

    const { displayTexts } = files.reduce<{ displayTexts: string[] }>(
      (acc, f) => {
        acc.displayTexts.push(f.relativePath.padEnd(50));
        return acc;
      },
      { displayTexts: [] },
    );

    return { files, displayTexts };
  }

  async onSelect(identifier: string) {
    // 检查是否为系统 tab（JSON 格式标识符）
    if (identifier.startsWith("{")) {
      try {
        const parsed = JSON.parse(identifier);
        if (parsed.isSystemTab) {
          await this.openSystemTab(parsed.type);
          return;
        }
      } catch {
        // 解析失败，继续尝试作为文件路径处理
      }
    }

    // 普通文件
    const uri = vscode.Uri.file(identifier);
    await execCmd(Globals.cmds.openFile, uri);
  }

  async getPreviewData(identifier: string): Promise<TextPreviewData> {
    // 检查是否为系统 tab
    if (identifier.startsWith("{")) {
      try {
        const parsed = JSON.parse(identifier);
        if (parsed.isSystemTab) {
          return {
            content: `[System Tab] ${parsed.label || "Unknown"}`,
            kind: "text",
            metadata: { filePath: parsed.type || identifier },
          };
        }
      } catch {
        // 解析失败，继续尝试作为文件路径处理
      }
    }

    const content = await FileReader.read(identifier);
    return {
      content: content as string,
      kind: "text",
      metadata: { filePath: identifier },
    };
  }

  /**
   * 打开系统 tab
   */
  private async openSystemTab(type?: string): Promise<void> {
    const commandMap: Record<string, string> = {
      settings: "workbench.action.openSettings",
      keybindings: "workbench.action.openGlobalKeybindings",
      extensions: "workbench.view.extensions",
      walkthrough: "workbench.action.openWalkthrough",
    };

    if (type && commandMap[type]) {
      await vscode.commands.executeCommand(commandMap[type]);
    } else {
      vscode.window.showInformationMessage(`Cannot reopen this system tab: ${type || "unknown"}`);
    }
  }

  private async getRecentFiles(): Promise<RecentFileData[]> {
    const recentFiles = new Map<string, RecentFileData>();

    for (const group of vscode.window.tabGroups.all) {
      for (const tab of group.tabs) {
        const input = tab.input as any;

        if (input && "uri" in input && input.uri instanceof vscode.Uri) {
          const uri = input.uri;
          const uriString = uri.toString();

          // 系统 tab（非 file scheme）
          if (uri.scheme !== "file") {
            if (recentFiles.has(uriString)) continue;
            const tabInfo = this.getSystemTabInfo(tab, uri);
            recentFiles.set(uriString, this.createSystemTabData(uriString, tabInfo));
            continue;
          }

          // 普通文件
          const filePath = uri.fsPath;
          if (recentFiles.has(filePath)) continue;

          const exists = fs.existsSync(filePath);
          let lastModified = new Date();
          if (exists) {
            try {
              lastModified = fs.statSync(filePath).mtime;
            } catch {}
          }

          recentFiles.set(filePath, {
            path: filePath,
            relativePath: vscode.workspace.asRelativePath(filePath),
            lastModified,
            exists,
            isSystemTab: false,
          });
        } else {
          // 没有 URI 的编辑器 tab
          const tabInfo = this.getEditorTabInfo(tab);
          if (tabInfo) {
            const key = JSON.stringify({ isSystemTab: true, ...tabInfo });
            if (recentFiles.has(key)) continue;
            recentFiles.set(key, this.createSystemTabData(key, tabInfo));
          }
        }
      }
    }

    return Array.from(recentFiles.values()).sort((a, b) => b.lastModified.getTime() - a.lastModified.getTime());
  }

  private createSystemTabData(uri: string, info: { label: string; type: string }): RecentFileData {
    return {
      path: uri,
      relativePath: info.label,
      lastModified: new Date(),
      exists: true,
      isSystemTab: true,
      uri,
      label: info.label,
      type: info.type,
    };
  }

  private getSystemTabInfo(tab: vscode.Tab, uri: vscode.Uri): { label: string; type: string } {
    const schemeMap: Record<string, string> = {
      "vscode-settings": "settings",
      "vscode-keybindings": "keybindings",
      "vscode-extensions": "extensions",
      walkthrough: "walkthrough",
      output: "output",
      debugconsole: "debugconsole",
      terminal: "terminal",
    };

    const type = schemeMap[uri.scheme] || uri.scheme;
    return { label: tab.label || type, type };
  }

  private getEditorTabInfo(tab: vscode.Tab): { label: string; type: string } | null {
    const label = tab.label || "";

    // 过滤掉 Code Telescope 自己的面板
    if (label.startsWith("Code Telescope")) {
      return null;
    }

    // 通过 label 识别常见系统编辑器
    const labelTypeMap: Record<string, string> = {
      Settings: "settings",
      "Keyboard Shortcuts": "keybindings",
      Keybindings: "keybindings",
      Extensions: "extensions",
    };

    if (labelTypeMap[label]) {
      return { label, type: labelTypeMap[label] };
    }

    // 其他有 label 的 tab
    if (label) {
      return { label, type: (tab.input as any)?.constructor?.name || "unknown" };
    }

    return null;
  }
}
