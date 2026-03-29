import * as vscode from "vscode";

const TERMINAL_NAME = "lazygit";

export async function openLazygit(): Promise<void> {
  if (!(await focusLazygitTerminal())) {
    await newLazygitTerminal();
  }
}

async function focusLazygitTerminal(): Promise<boolean> {
  for (const terminal of vscode.window.terminals) {
    if (terminal.name === TERMINAL_NAME) {
      terminal.show();
      return true;
    }
  }
  return false;
}

async function newLazygitTerminal(): Promise<void> {
  const activeEditor = vscode.window.activeTextEditor;

  await vscode.commands.executeCommand("workbench.action.terminal.newInActiveWorkspace");
  const terminal = vscode.window.activeTerminal!;

  const command = "lazygit && exit";
  terminal.sendText(command);
  terminal.show();

  vscode.window.onDidCloseTerminal((closedTerminal) => {
    if (closedTerminal === terminal) {
      if (activeEditor && activeEditor.viewColumn) {
        vscode.window.showTextDocument(activeEditor.document, activeEditor.viewColumn);
      } else {
        vscode.commands.executeCommand("workbench.action.focusActiveEditorGroup");
      }
    }
  });

  await vscode.commands.executeCommand("workbench.action.terminal.moveToEditor");
  await vscode.commands.executeCommand("workbench.action.focusActiveEditorGroup");
  if (vscode.window.terminals.length > 1) {
    await vscode.commands.executeCommand("workbench.action.closePanel");
  }
}
