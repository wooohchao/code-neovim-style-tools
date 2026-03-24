import * as vscode from "vscode";
import { FromWebviewKindMessage } from "../../../../shared/extension-webview-protocol";
import { IWebviewMessageHandler } from "../../abstractions/webview-message-handler";
import { WebviewMessageHandler } from "../../decorators/webview-message-handler.decorator";
import { FuzzyFinderPanelController } from "../fuzzy-panel.controller";
import { WebviewController } from "../webview.controller";

@WebviewMessageHandler()
export class CloseActiveTabHandler implements IWebviewMessageHandler<"closeActiveTab"> {
  readonly type = "closeActiveTab";

  async handle(msg: Extract<FromWebviewKindMessage, { type: "closeActiveTab" }>, wv: vscode.Webview) {
    const { filePath } = msg.data;

    // 检查是否为系统 tab（JSON 格式标识符）
    if (filePath.startsWith("{")) {
      await this.closeSystemTab(filePath, wv);
      return;
    }

    // 普通文件
    for (const group of vscode.window.tabGroups.all) {
      for (const tab of group.tabs) {
        const input = tab.input as any;
        if (input?.uri instanceof vscode.Uri && input.uri.fsPath === filePath) {
          await this.closeTabAndRefresh(tab, wv);
          return;
        }
      }
    }
  }

  private async closeSystemTab(identifier: string, wv: vscode.Webview): Promise<void> {
    try {
      const { label, uri } = JSON.parse(identifier);

      for (const group of vscode.window.tabGroups.all) {
        for (const tab of group.tabs) {
          const input = tab.input as any;
          // 优先通过 label 匹配
          if (label && tab.label === label) {
            await this.closeTabAndRefresh(tab, wv);
            return;
          }
          // 通过 URI 匹配
          if (uri && input?.uri?.toString() === uri) {
            await this.closeTabAndRefresh(tab, wv);
            return;
          }
        }
      }
    } catch {
      // 解析失败，忽略
    }
  }

  private async closeTabAndRefresh(tab: vscode.Tab, wv: vscode.Webview): Promise<void> {
    try {
      await vscode.window.tabGroups.close(tab, true);
      await this.refreshOptionList(wv);
    } catch {}
  }

  private async refreshOptionList(wv: vscode.Webview) {
    const provider = FuzzyFinderPanelController.instance?.provider;
    if (!provider) return;

    const allItems = await provider.querySelectableOptions();
    const totalLimit = Array.isArray(allItems) ? allItems.length : 0;

    await WebviewController.sendMessage(wv, {
      type: "optionList",
      data: allItems,
      fuzzyProviderType: provider.fuzzyAdapterType,
      dataAdapterType: provider.dataAdapterType,
      totalLimit,
      query: Date.now().toString(),
    });
  }
}
