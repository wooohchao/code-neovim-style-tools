import * as fs from "fs";
import os from "os";
import * as path from "path";
import * as vscode from "vscode";
import { Logger } from "../log";

export class ExtensionRootsResolver {
  private static wslRoots: string[] | null = null;
  private static devcontainerRoots: string[] | null = null;

  static getWslRoots(): string[] {
    if (this.wslRoots !== null) return this.wslRoots;

    const config = vscode.workspace.getConfiguration("codeTelescope.highlighter");
    const configuredRoots = config.get<string[]>("wslExtensionPaths", []);
    Logger.info(`[ExtensionRootsResolver] WSL Roots: ${configuredRoots}`);

    return (this.wslRoots = configuredRoots.filter((p) => fs.existsSync(p)));
  }

  static getDevcontainerRoots(): string[] {
    if (this.devcontainerRoots !== null) return this.devcontainerRoots;

    const roots: string[] = [];
    const vscodeServerBase = path.join(os.homedir(), ".vscode-server");

    const serverExtensions = path.join(vscodeServerBase, "extensions");
    if (fs.existsSync(serverExtensions)) roots.push(serverExtensions);

    try {
      const binDir = path.join(vscodeServerBase, "bin");
      for (const hash of fs.readdirSync(binDir)) {
        const candidate = path.join(binDir, hash, "extensions");
        if (fs.existsSync(candidate)) roots.push(candidate);
      }
    } catch {}

    return (this.devcontainerRoots = roots);
  }
}
