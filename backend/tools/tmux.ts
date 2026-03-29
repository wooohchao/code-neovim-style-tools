import * as vscode from "vscode";

const TERMINAL_NAME = "tmux";
const TMUX_SESSION_NAME = "cursor";

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
  const activeEditor = vscode.window.activeTextEditor;

  await vscode.commands.executeCommand("workbench.action.terminal.newInActiveWorkspace");
  const terminal = vscode.window.activeTerminal!;

  // 在 terminal 中判断 session 是否存在并执行对应命令
  const command = `tmux has-session -t ${TMUX_SESSION_NAME} 2>/dev/null && tmux attach-session -t ${TMUX_SESSION_NAME} || tmux new-session -s ${TMUX_SESSION_NAME}; exit`;

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
