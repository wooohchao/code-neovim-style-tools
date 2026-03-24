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

    // Find and close the corresponding tab
    for (const group of vscode.window.tabGroups.all) {
      for (const tab of group.tabs) {
        const input = tab.input as any;
        if (input?.uri instanceof vscode.Uri) {
          const tabFsPath = input.uri.fsPath;
          // Use fsPath for reliable cross-platform comparison
          if (tabFsPath === filePath) {
            try {
              await vscode.window.tabGroups.close(tab, true);
              // Refresh the option list after closing
              await this.refreshOptionList(wv);
            } catch {}
            return;
          }
        }
      }
    }
  }

  private async refreshOptionList(wv: vscode.Webview) {
    const provider = FuzzyFinderPanelController.instance?.provider;
    if (!provider) return;

    const allItems = await provider.querySelectableOptions();
    const totalLimit = Array.isArray(allItems) ? allItems.length : 0;

    // Use timestamp as query to force clear existing list and refresh
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
