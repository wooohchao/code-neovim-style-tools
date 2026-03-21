import { exec } from "child_process";
import { promisify } from "util";
import * as vscode from "vscode";

const execAsync = promisify(exec);
const TERMINAL_NAME = "tmux";
const TMUX_SESSION_NAME = "cursor";

async function sessionExists(sessionName: string): Promise<boolean> {
  try {
    await execAsync(`tmux has-session -t ${sessionName}`);
    return true;
  } catch {
    return false;
  }
}

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

  const exists = await sessionExists(TMUX_SESSION_NAME);
  const command = exists
    ? `tmux attach-session -t ${TMUX_SESSION_NAME} && exit`
    : `tmux new-session -s ${TMUX_SESSION_NAME} && exit`;

  terminal.sendText(command);
  terminal.show();

  await vscode.commands.executeCommand("workbench.action.terminal.moveToEditor");
  await vscode.commands.executeCommand("workbench.action.focusActiveEditorGroup");
  if (vscode.window.terminals.length > 1) {
    await vscode.commands.executeCommand("workbench.action.closePanel");
  }
}
