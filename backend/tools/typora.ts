import * as vscode from "vscode";

export async function openTypora(): Promise<void> {
  await vscode.commands.executeCommand("workbench.action.terminal.newInActiveWorkspace");
  const terminal = vscode.window.activeTerminal!;

  const command = "typora . && exit";
  terminal.sendText(command);
}
