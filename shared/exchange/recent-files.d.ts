export interface RecentFileData {
  path: string;
  relativePath: string;
  lastModified: Date;
  exists: boolean;
  /** 是否为系统 tab（如 Settings、Keybindings 等） */
  isSystemTab: boolean;
  /** 完整的 URI 字符串，用于系统 tab */
  uri?: string;
  /** 系统 tab 的显示标题 */
  label?: string;
  /** 系统 tab 的类型（用于打开时识别） */
  type?: string;
}

export interface RecentFilesFinderData {
  files: RecentFileData[];
  displayTexts: string[];
}
