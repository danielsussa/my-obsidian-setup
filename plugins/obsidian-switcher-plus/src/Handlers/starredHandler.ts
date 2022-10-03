import { getInternalPluginById, isFileStarredItem, isTFile } from 'src/utils';
import { InputInfo } from 'src/switcherPlus';
import {
  AnySuggestion,
  MatchType,
  Mode,
  SearchResultWithFallback,
  StarredSuggestion,
  SuggestionType,
} from 'src/types';
import {
  InstalledPlugin,
  SearchResult,
  sortSearchResults,
  WorkspaceLeaf,
  StarredPluginItem,
  StarredPluginInstance,
  TFile,
  FileStarredItem,
} from 'obsidian';
import { Handler } from './handler';

export const STARRED_PLUGIN_ID = 'starred';

interface StarredItemInfo {
  file: TFile;
  item: StarredPluginItem;
}

export class StarredHandler extends Handler<StarredSuggestion> {
  override get commandString(): string {
    return this.settings?.starredListCommand;
  }

  validateCommand(
    inputInfo: InputInfo,
    index: number,
    filterText: string,
    _activeSuggestion: AnySuggestion,
    _activeLeaf: WorkspaceLeaf,
  ): void {
    if (this.isStarredPluginEnabled()) {
      inputInfo.mode = Mode.StarredList;

      const starredCmd = inputInfo.parsedCommand(Mode.StarredList);
      starredCmd.index = index;
      starredCmd.parsedInput = filterText;
      starredCmd.isValidated = true;
    }
  }

  getSuggestions(inputInfo: InputInfo): StarredSuggestion[] {
    const suggestions: StarredSuggestion[] = [];

    if (inputInfo) {
      inputInfo.buildSearchQuery();
      const { hasSearchTerm, prepQuery } = inputInfo.searchQuery;
      const itemsInfo = this.getItems();

      itemsInfo.forEach(({ file, item }) => {
        let shouldPush = true;
        let result: SearchResultWithFallback = { matchType: MatchType.None, match: null };

        if (hasSearchTerm) {
          result = this.fuzzySearchWithFallback(prepQuery, item.title, file);
          shouldPush = result.matchType !== MatchType.None;
        }

        if (shouldPush) {
          suggestions.push({ type: SuggestionType.StarredList, file, item, ...result });
        }
      });

      if (hasSearchTerm) {
        sortSearchResults(suggestions);
      }
    }

    return suggestions;
  }

  renderSuggestion(sugg: StarredSuggestion, parentEl: HTMLElement): void {
    if (sugg) {
      const { file, matchType, match } = sugg;
      let contentMatch: SearchResult = match;
      let pathMatch: SearchResult = null;

      if (matchType === MatchType.ParentPath) {
        contentMatch = null;
        pathMatch = match;
      }

      this.addClassesToSuggestionContainer(parentEl, ['qsp-suggestion-starred']);

      const contentEl = this.renderContent(parentEl, sugg.item.title, contentMatch);
      this.renderPath(contentEl, file, true, pathMatch, !!pathMatch);
    }
  }

  onChooseSuggestion(sugg: StarredSuggestion, evt: MouseEvent | KeyboardEvent): void {
    if (sugg) {
      const { item } = sugg;

      if (isFileStarredItem(item)) {
        const { file } = sugg;

        this.navigateToLeafOrOpenFile(
          evt,
          file,
          `Unable to open Starred file ${file.path}`,
        );
      }
    }
  }

  getTFileByPath(path: string): TFile | null {
    let file: TFile = null;
    const abstractItem = this.app.vault.getAbstractFileByPath(path);

    if (isTFile(abstractItem)) {
      file = abstractItem;
    }

    return file;
  }

  getItems(): StarredItemInfo[] {
    const itemsInfo: StarredItemInfo[] = [];
    const starredItems = this.getSystemStarredPluginInstance()?.items;

    if (starredItems) {
      starredItems.forEach((starredItem) => {
        // Only support displaying of starred files for now
        if (isFileStarredItem(starredItem)) {
          const file = this.getTFileByPath(starredItem.path);

          // 2022-apr when a starred file is deleted, the underlying data stored in the
          // Starred plugin data file (starred.json) for that file remain in there, but
          // at runtime the deleted file info is not displayed. Do the same here.
          if (file) {
            // 2022-apr when a starred file is renamed, the 'title' property stored in
            // the underlying Starred plugin data file (starred.json) is not updated, but
            // at runtime, the title that is displayed in the UI does reflect the updated
            // filename. So do the same thing here in order to display the current
            // filename as the starred file title
            const title = file.basename;

            const item: FileStarredItem = {
              type: 'file',
              title,
              path: starredItem.path,
            };

            itemsInfo.push({ file, item });
          }
        }
      });
    }

    return itemsInfo;
  }

  private isStarredPluginEnabled(): boolean {
    const plugin = this.getSystemStarredPlugin();
    return plugin?.enabled;
  }

  private getSystemStarredPlugin(): InstalledPlugin {
    return getInternalPluginById(this.app, STARRED_PLUGIN_ID);
  }

  private getSystemStarredPluginInstance(): StarredPluginInstance {
    const starredPlugin = this.getSystemStarredPlugin();
    return starredPlugin?.instance as StarredPluginInstance;
  }
}
