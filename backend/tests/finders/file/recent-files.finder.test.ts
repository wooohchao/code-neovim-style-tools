import { beforeEach, describe, expect, it, vi } from "vitest";
import { FileReader } from "../../../core/common/file-reader";
import { RecentFilesFinder } from "../../../core/finders/file/recent-files.finder";
import { execCmd } from "../../../utils/commands";

vi.mock("@backend/utils/files", () => ({
  getSvgIconUrl: vi.fn().mockReturnValue("svg://file"),
}));

vi.mock("@backend/core/common/file-reader", () => ({
  FileReader: {
    read: vi.fn().mockResolvedValue("file content"),
  },
}));

vi.mock("@backend/utils/commands", () => ({
  execCmd: vi.fn(),
}));

// Mock vscode module
vi.mock("vscode", () => ({
  Uri: {
    file: vi.fn((path: string) => ({ fsPath: path, scheme: "file" })),
    parse: vi.fn((uri: string) => ({ toString: () => uri })),
  },
  commands: {
    executeCommand: vi.fn(),
  },
  window: {
    tabGroups: {
      all: [],
    },
  },
  workspace: {
    asRelativePath: vi.fn((path: string) => path),
  },
}));

describe("RecentFilesFinder", () => {
  let finder: RecentFilesFinder;

  beforeEach(() => {
    vi.clearAllMocks();
    finder = new RecentFilesFinder();
  });

  describe("onSelect", () => {
    it("should execute openFile command for regular file path", async () => {
      await finder.onSelect("/workspace/src/index.ts");
      expect(execCmd).toHaveBeenCalled();
    });

    it("should handle system tab identifier", async () => {
      const systemTabIdentifier = JSON.stringify({
        isSystemTab: true,
        uri: "vscode-settings://",
        label: "[Settings]",
      });

      // Should not throw
      await expect(finder.onSelect(systemTabIdentifier)).resolves.not.toThrow();
    });

    it("should handle invalid JSON gracefully", async () => {
      await finder.onSelect("{invalid json");
      expect(execCmd).toHaveBeenCalled();
    });
  });

  describe("getPreviewData", () => {
    it("should return text preview data for regular file", async () => {
      vi.mocked(FileReader.read).mockResolvedValue("console.log('test')");

      const result = await finder.getPreviewData("/workspace/src/index.ts");

      expect(result.kind).toBe("text");
      expect(result.content).toBe("console.log('test')");
    });

    it("should return system tab indicator for system tabs", async () => {
      const systemTabIdentifier = JSON.stringify({
        isSystemTab: true,
        uri: "vscode-settings://",
        label: "[Settings]",
      });

      const result = await finder.getPreviewData(systemTabIdentifier);

      expect(result.kind).toBe("text");
      expect(result.content).toContain("[System Tab]");
    });
  });
});
