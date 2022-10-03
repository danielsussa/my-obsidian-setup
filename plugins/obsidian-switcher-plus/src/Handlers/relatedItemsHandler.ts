import {
  sortSearchResults,
  WorkspaceLeaf,
  TFile,
  TAbstractFile,
  TFolder,
  SearchResult,
} from 'obsidian';
import {
  AnySuggestion,
  MatchType,
  Mode,
  RelatedItemsSuggestion,
  SearchResultWithFallback,
  SourceInfo,
  SuggestionType,
} from 'src/types';
import { InputInfo, SourcedParsedCommand } from 'src/switcherPlus';
import { Handler } from './handler';
import { isTFile, matcherFnForRegExList } from 'src/utils';

export class RelatedItemsHandler extends Handler<RelatedItemsSuggestion> {
  private inputInfo: InputInfo;

  override get commandString(): string {
    return this.settings?.relatedItemsListCommand;
  }

  validateCommand(
    inputInfo: InputInfo,
    index: number,
    filterText: string,
    activeSuggestion: AnySuggestion,
    activeLeaf: WorkspaceLeaf,
  ): void {
    const sourceInfo = this.getSourceInfo(activeSuggestion, activeLeaf, index === 0);

    if (sourceInfo) {
      inputInfo.mode = Mode.RelatedItemsList;

      const cmd = inputInfo.parsedCommand(Mode.RelatedItemsList) as SourcedParsedCommand;

      cmd.source = sourceInfo;
      cmd.index = index;
      cmd.parsedInput = filterText;
      cmd.isValidated = true;
    }
  }

  getSuggestions(inputInfo: InputInfo): RelatedItemsSuggestion[] {
    const suggestions: RelatedItemsSuggestion[] = [];

    if (inputInfo) {
      this.inputInfo = inputInfo;
      inputInfo.buildSearchQuery();

      const { hasSearchTerm, prepQuery } = inputInfo.searchQuery;
      const cmd = inputInfo.parsedCommand(Mode.RelatedItemsList) as SourcedParsedCommand;
      const items = this.getRelatedFiles(cmd.source.file);

      items.forEach((item) => {
        let shouldPush = true;
        let result: SearchResultWithFallback = { matchType: MatchType.None, match: null };

        if (hasSearchTerm) {
          result = this.fuzzySearchWithFallback(prepQuery, null, item);
          shouldPush = result.matchType !== MatchType.None;
        }

        if (shouldPush) {
          suggestions.push({
            type: SuggestionType.RelatedItemsList,
            relationType: 'diskLocation',
            file: item,
            ...result,
          });
        }
      });

      if (hasSearchTerm) {
        sortSearchResults(suggestions);
      }
    }

    return suggestions;
  }

  renderSuggestion(sugg: RelatedItemsSuggestion, parentEl: HTMLElement): void {
    if (sugg) {
      const { file, matchType, match } = sugg;
      const content = this.getTitleText(file);
      let contentMatch: SearchResult = match;
      let pathMatch: SearchResult = null;

      if (matchType === MatchType.ParentPath) {
        contentMatch = null;
        pathMatch = match;
      }

      this.addClassesToSuggestionContainer(parentEl, ['qsp-suggestion-related']);

      const contentEl = this.renderContent(parentEl, content, contentMatch);
      this.renderPath(contentEl, file, true, pathMatch, !!pathMatch);
    }
  }

  onChooseSuggestion(
    sugg: RelatedItemsSuggestion,
    evt: MouseEvent | KeyboardEvent,
  ): void {
    if (sugg) {
      const { file } = sugg;

      this.navigateToLeafOrOpenFile(
        evt,
        file,
        `Unable to open related file ${file.path}`,
      );
    }
  }

  override getTitleText(sourceFile: TFile): string {
    return sourceFile?.basename;
  }

  getRelatedFiles(sourceFile: TFile): TFile[] {
    const relatedFiles: TFile[] = [];
    const { excludeRelatedFolders, excludeOpenRelatedFiles } = this.settings;

    const isExcludedFolder = matcherFnForRegExList(excludeRelatedFolders);
    let nodes: TAbstractFile[] = [...sourceFile.parent.children];

    while (nodes.length > 0) {
      const node = nodes.pop();

      if (isTFile(node)) {
        const isSourceFile = node === sourceFile;
        const isExcluded =
          isSourceFile || (excludeOpenRelatedFiles && !!this.findMatchingLeaf(node).leaf);

        if (!isExcluded) {
          relatedFiles.push(node);
        }
      } else if (!isExcludedFolder(node.path)) {
        nodes = nodes.concat((node as TFolder).children);
      }
    }

    return relatedFiles;
  }

  reset(): void {
    this.inputInfo = null;
  }

  private getSourceInfo(
    activeSuggestion: AnySuggestion,
    activeLeaf: WorkspaceLeaf,
    isPrefixCmd: boolean,
  ): SourceInfo {
    const prevInputInfo = this.inputInfo;
    let prevSourceInfo: SourceInfo = null;
    let prevMode: Mode = Mode.Standard;

    if (prevInputInfo) {
      prevSourceInfo = (prevInputInfo.parsedCommand() as SourcedParsedCommand).source;
      prevMode = prevInputInfo.mode;
    }

    // figure out if the previous operation was a symbol operation
    const hasPrevSource = prevMode === Mode.RelatedItemsList && !!prevSourceInfo;

    const activeEditorInfo = this.getEditorInfo(activeLeaf);
    const activeSuggInfo = this.getSuggestionInfo(activeSuggestion);

    // Pick the source file for the operation, prioritizing
    // any pre-existing operation that was in progress
    let sourceInfo: SourceInfo = null;
    if (hasPrevSource) {
      sourceInfo = prevSourceInfo;
    } else if (activeSuggInfo.isValidSource) {
      sourceInfo = activeSuggInfo;
    } else if (activeEditorInfo.isValidSource && isPrefixCmd) {
      sourceInfo = activeEditorInfo;
    }

    return sourceInfo;
  }
}
