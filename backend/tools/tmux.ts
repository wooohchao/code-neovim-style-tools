import * as vscode from "vscode";

const TERMINAL_NAME = "tmux";

export async function openTmux(): Promise<void> {
  if (!(await focusTmuxTerminal())) {
    await newTmuxTerminal();
  }
}

async function focusTmuxTerminal(): Promise<boolean> {
  for (const terminal of vscode.window.terminals) {
    if (terminal.name === TERMINAL_NAME) {
      terminal.show();
      return true;
    }
  }
  return false;
}

async function newTmuxTerminal(): Promise<void> {
  await vscode.commands.executeCommand("workbench.action.terminal.newInActiveWorkspace");
  const terminal = vscode.window.activeTerminal!;

  const command = "tmux && exit";
  terminal.sendText(command);
  terminal.show();

  await vscode.commands.executeCommand("workbench.action.terminal.moveToEditor");
  await vscode.commands.executeCommand("workbench.action.focusActiveEditorGroup");
  if (vscode.window.terminals.length > 1) {
    await vscode.commands.executeCommand("workbench.action.togglePanel");
  }
}
