import * as vscode from "vscode";

const TERMINAL_NAME = "zellij";
const ZELLIJ_SESSION_NAME = "cursor";

export async function openZellij(): Promise<void> {
  if (!(await focusZellijTerminal())) {
    await newZellijTerminal();
  }
}

async function focusZellijTerminal(): Promise<boolean> {
  for (const terminal of vscode.window.terminals) {
    if (terminal.name === TERMINAL_NAME) {
      terminal.show();
      return true;
    }
  }
  return false;
}

async function newZellijTerminal(): Promise<void> {
  const activeEditor = vscode.window.activeTextEditor;

  await vscode.commands.executeCommand("workbench.action.terminal.newInActiveWorkspace");
  const terminal = vscode.window.activeTerminal!;

  const command = `zellij attach ${ZELLIJ_SESSION_NAME} 2>/dev/null || zellij -s ${ZELLIJ_SESSION_NAME}; exit`;

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
