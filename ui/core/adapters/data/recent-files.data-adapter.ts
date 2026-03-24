import { IFuzzyFinderDataAdapter } from "../../../../shared/abstractions/fuzzy-finder-data-adapter";
import { DataAdapterType } from "../../../../shared/adapters-namespace";
import { RecentFileData, RecentFilesFinderData } from "../../../../shared/exchange/recent-files";
import { formatFileOptionHtml } from "../../../utils/html";
import { getSvgIconUrl } from "../../../utils/icon";
import { FuzzyFinderDataAdapter } from "../../decorators/fuzzy-data-adapter.decorator";

export interface RecentFileOption {
  index: number;
  file: RecentFileData;
  displayText: string;
}

@FuzzyFinderDataAdapter({
  type: "workspaceRecentFilesAdapter",
})
export class RecentFilesFinderDataAdapter implements IFuzzyFinderDataAdapter<RecentFilesFinderData, RecentFileOption> {
  typeName: DataAdapterType;

  parseOptions(data: RecentFilesFinderData): RecentFileOption[] {
    const options: RecentFileOption[] = [];

    for (let i = 0; i < data.files.length; i++) {
      options.push({
        index: i,
        file: data.files[i],
        displayText: data.displayTexts[i],
      });
    }

    return options;
  }

  getSearchText(option: RecentFileOption): string {
    return option.file.relativePath;
  }

  getHtmlWrapper(option: RecentFileOption, highlightedContent: string): string {
    // 系统 tab 使用不同的图标样式
    if (option.file.isSystemTab) {
      return this.formatSystemTabHtml(highlightedContent);
    }

    const svgIconUrl = getSvgIconUrl(option.file.path);
    return formatFileOptionHtml(svgIconUrl, highlightedContent);
  }

  getSelectionValue(option: RecentFileOption): string {
    // 系统 tab 返回 JSON 格式的标识符
    if (option.file.isSystemTab) {
      return JSON.stringify({
        isSystemTab: true,
        uri: option.file.uri,
        label: option.file.label,
        type: option.file.type,
      });
    }

    return option.file.path;
  }

  /**
   * 格式化系统 tab 的 HTML 展示
   */
  private formatSystemTabHtml(content: string): string {
    return `<div class="file-option">
  <div class="file-icon" style="opacity: 0.8;">
    <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
      <path d="M14.5 2H9V1H8v1H1.5l-.5.5v12l.5.5h13l.5-.5v-12l-.5-.5zm-.5 12H2V5h12v9zm0-10H2V3h5v1h1V3h6v1z"/>
    </svg>
  </div>
  <span class="file-name">${content}</span>
</div>`;
  }
}
