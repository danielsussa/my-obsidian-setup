'use strict';

var obsidian = require('obsidian');

var EditorNavigationType;
(function (EditorNavigationType) {
    EditorNavigationType[EditorNavigationType["ReuseExistingLeaf"] = 1] = "ReuseExistingLeaf";
    EditorNavigationType[EditorNavigationType["NewLeaf"] = 2] = "NewLeaf";
    EditorNavigationType[EditorNavigationType["PopoutLeaf"] = 3] = "PopoutLeaf";
})(EditorNavigationType || (EditorNavigationType = {}));
var PathDisplayFormat;
(function (PathDisplayFormat) {
    PathDisplayFormat[PathDisplayFormat["None"] = 0] = "None";
    PathDisplayFormat[PathDisplayFormat["Full"] = 1] = "Full";
    PathDisplayFormat[PathDisplayFormat["FolderOnly"] = 2] = "FolderOnly";
    PathDisplayFormat[PathDisplayFormat["FolderWithFilename"] = 3] = "FolderWithFilename";
    PathDisplayFormat[PathDisplayFormat["FolderPathFilenameOptional"] = 4] = "FolderPathFilenameOptional";
})(PathDisplayFormat || (PathDisplayFormat = {}));
var Mode;
(function (Mode) {
    Mode[Mode["Standard"] = 1] = "Standard";
    Mode[Mode["EditorList"] = 2] = "EditorList";
    Mode[Mode["SymbolList"] = 4] = "SymbolList";
    Mode[Mode["WorkspaceList"] = 8] = "WorkspaceList";
    Mode[Mode["HeadingsList"] = 16] = "HeadingsList";
    Mode[Mode["StarredList"] = 32] = "StarredList";
    Mode[Mode["CommandList"] = 64] = "CommandList";
    Mode[Mode["RelatedItemsList"] = 128] = "RelatedItemsList";
})(Mode || (Mode = {}));
var SymbolType;
(function (SymbolType) {
    SymbolType[SymbolType["Link"] = 1] = "Link";
    SymbolType[SymbolType["Embed"] = 2] = "Embed";
    SymbolType[SymbolType["Tag"] = 4] = "Tag";
    SymbolType[SymbolType["Heading"] = 8] = "Heading";
})(SymbolType || (SymbolType = {}));
var LinkType;
(function (LinkType) {
    LinkType[LinkType["None"] = 0] = "None";
    LinkType[LinkType["Normal"] = 1] = "Normal";
    LinkType[LinkType["Heading"] = 2] = "Heading";
    LinkType[LinkType["Block"] = 4] = "Block";
})(LinkType || (LinkType = {}));
const SymbolIndicators = {};
SymbolIndicators[SymbolType.Link] = '🔗';
SymbolIndicators[SymbolType.Embed] = '!';
SymbolIndicators[SymbolType.Tag] = '#';
SymbolIndicators[SymbolType.Heading] = 'H';
const HeadingIndicators = {};
HeadingIndicators[1] = 'H₁';
HeadingIndicators[2] = 'H₂';
HeadingIndicators[3] = 'H₃';
HeadingIndicators[4] = 'H₄';
HeadingIndicators[5] = 'H₅';
HeadingIndicators[6] = 'H₆';
var SuggestionType;
(function (SuggestionType) {
    SuggestionType["EditorList"] = "editorList";
    SuggestionType["SymbolList"] = "symbolList";
    SuggestionType["WorkspaceList"] = "workspaceList";
    SuggestionType["HeadingsList"] = "headingsList";
    SuggestionType["StarredList"] = "starredList";
    SuggestionType["CommandList"] = "commandList";
    SuggestionType["RelatedItemsList"] = "relatedItemsList";
    SuggestionType["File"] = "file";
    SuggestionType["Alias"] = "alias";
    SuggestionType["Unresolved"] = "unresolved";
})(SuggestionType || (SuggestionType = {}));
var MatchType;
(function (MatchType) {
    MatchType[MatchType["None"] = 0] = "None";
    MatchType[MatchType["Primary"] = 1] = "Primary";
    MatchType[MatchType["Basename"] = 2] = "Basename";
    MatchType[MatchType["ParentPath"] = 3] = "ParentPath";
})(MatchType || (MatchType = {}));

function isOfType(obj, discriminator, val) {
    let ret = false;
    if (obj && obj[discriminator] !== undefined) {
        ret = true;
        if (val !== undefined && val !== obj[discriminator]) {
            ret = false;
        }
    }
    return ret;
}
function isSymbolSuggestion(obj) {
    return isOfType(obj, 'type', SuggestionType.SymbolList);
}
function isEditorSuggestion(obj) {
    return isOfType(obj, 'type', SuggestionType.EditorList);
}
function isWorkspaceSuggestion(obj) {
    return isOfType(obj, 'type', SuggestionType.WorkspaceList);
}
function isHeadingSuggestion(obj) {
    return isOfType(obj, 'type', SuggestionType.HeadingsList);
}
function isCommandSuggestion(obj) {
    return isOfType(obj, 'type', SuggestionType.CommandList);
}
function isFileSuggestion(obj) {
    return isOfType(obj, 'type', SuggestionType.File);
}
function isAliasSuggestion(obj) {
    return isOfType(obj, 'type', SuggestionType.Alias);
}
function isUnresolvedSuggestion(obj) {
    return isOfType(obj, 'type', SuggestionType.Unresolved);
}
function isSystemSuggestion(obj) {
    return isFileSuggestion(obj) || isUnresolvedSuggestion(obj) || isAliasSuggestion(obj);
}
function isExSuggestion(sugg) {
    return sugg && !isSystemSuggestion(sugg);
}
function isHeadingCache(obj) {
    return isOfType(obj, 'level');
}
function isTagCache(obj) {
    return isOfType(obj, 'tag');
}
function isTFile(obj) {
    return isOfType(obj, 'extension');
}
function isFileStarredItem(obj) {
    return isOfType(obj, 'type', 'file');
}
function escapeRegExp(str) {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
function getInternalPluginById(app, id) {
    return app?.internalPlugins?.getPluginById(id);
}
function getSystemSwitcherInstance(app) {
    const plugin = getInternalPluginById(app, 'switcher');
    return plugin?.instance;
}
function stripMDExtensionFromPath(file) {
    let retVal = null;
    if (file) {
        const { path } = file;
        retVal = path;
        if (file.extension === 'md') {
            const index = path.lastIndexOf('.');
            if (index !== -1 && index !== path.length - 1 && index !== 0) {
                retVal = path.slice(0, index);
            }
        }
    }
    return retVal;
}
function filenameFromPath(path) {
    let retVal = null;
    if (path) {
        const index = path.lastIndexOf('/');
        retVal = index === -1 ? path : path.slice(index + 1);
    }
    return retVal;
}
function matcherFnForRegExList(regExStrings) {
    regExStrings = regExStrings ?? [];
    const regExList = [];
    for (const str of regExStrings) {
        try {
            const rx = new RegExp(str);
            regExList.push(rx);
        }
        catch (err) {
            console.log(`Switcher++: error creating RegExp from string: ${str}`, err);
        }
    }
    const isMatchFn = (input) => {
        for (const rx of regExList) {
            if (rx.test(input)) {
                return true;
            }
        }
        return false;
    };
    return isMatchFn;
}
function getLinkType(linkCache) {
    let type = LinkType.None;
    if (linkCache) {
        // remove the display text before trying to parse the link target
        const linkStr = linkCache.link.split('|')[0];
        if (linkStr.includes('#^')) {
            type = LinkType.Block;
        }
        else if (linkStr.includes('#')) {
            type = LinkType.Heading;
        }
        else {
            type = LinkType.Normal;
        }
    }
    return type;
}

class FrontMatterParser {
    static getAliases(frontMatter) {
        let aliases = [];
        if (frontMatter) {
            aliases = FrontMatterParser.getValueForKey(frontMatter, /^alias(es)?$/i);
        }
        return aliases;
    }
    static getValueForKey(frontMatter, keyPattern) {
        const retVal = [];
        const fmKeys = Object.keys(frontMatter);
        const key = fmKeys.find((val) => keyPattern.test(val));
        if (key) {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
            let value = frontMatter[key];
            if (typeof value === 'string') {
                value = value.split(',');
            }
            if (Array.isArray(value)) {
                value.forEach((val) => {
                    if (typeof val === 'string') {
                        retVal.push(val.trim());
                    }
                });
            }
        }
        return retVal;
    }
}

class SwitcherPlusSettings {
    constructor(plugin) {
        this.plugin = plugin;
        this.data = SwitcherPlusSettings.defaults;
    }
    static get defaults() {
        const enabledSymbolTypes = {};
        enabledSymbolTypes[SymbolType.Link] = true;
        enabledSymbolTypes[SymbolType.Embed] = true;
        enabledSymbolTypes[SymbolType.Tag] = true;
        enabledSymbolTypes[SymbolType.Heading] = true;
        return {
            onOpenPreferNewPane: true,
            alwaysNewPaneForSymbols: false,
            useActivePaneForSymbolsOnMobile: false,
            symbolsInLineOrder: true,
            editorListCommand: 'edt ',
            symbolListCommand: '@',
            workspaceListCommand: '+',
            headingsListCommand: '#',
            starredListCommand: "'",
            commandListCommand: '>',
            relatedItemsListCommand: '~',
            strictHeadingsOnly: false,
            searchAllHeadings: true,
            excludeViewTypes: ['empty'],
            referenceViews: ['backlink', 'localgraph', 'outgoing-link', 'outline'],
            limit: 50,
            includeSidePanelViewTypes: ['backlink', 'image', 'markdown', 'pdf'],
            enabledSymbolTypes,
            selectNearestHeading: true,
            excludeFolders: [],
            excludeLinkSubTypes: 0,
            excludeRelatedFolders: [''],
            excludeOpenRelatedFiles: false,
            excludeObsidianIgnoredFiles: false,
            shouldSearchFilenames: false,
            pathDisplayFormat: PathDisplayFormat.FolderWithFilename,
            hidePathIfRoot: true,
        };
    }
    get builtInSystemOptions() {
        return getSystemSwitcherInstance(this.plugin.app)?.options;
    }
    get showAllFileTypes() {
        // forward to core switcher settings
        return this.builtInSystemOptions?.showAllFileTypes;
    }
    get showAttachments() {
        // forward to core switcher settings
        return this.builtInSystemOptions?.showAttachments;
    }
    get showExistingOnly() {
        // forward to core switcher settings
        return this.builtInSystemOptions?.showExistingOnly;
    }
    get onOpenPreferNewPane() {
        return this.data.onOpenPreferNewPane;
    }
    set onOpenPreferNewPane(value) {
        this.data.onOpenPreferNewPane = value;
    }
    get alwaysNewPaneForSymbols() {
        return this.data.alwaysNewPaneForSymbols;
    }
    set alwaysNewPaneForSymbols(value) {
        this.data.alwaysNewPaneForSymbols = value;
    }
    get useActivePaneForSymbolsOnMobile() {
        return this.data.useActivePaneForSymbolsOnMobile;
    }
    set useActivePaneForSymbolsOnMobile(value) {
        this.data.useActivePaneForSymbolsOnMobile = value;
    }
    get symbolsInLineOrder() {
        return this.data.symbolsInLineOrder;
    }
    set symbolsInLineOrder(value) {
        this.data.symbolsInLineOrder = value;
    }
    get editorListPlaceholderText() {
        return SwitcherPlusSettings.defaults.editorListCommand;
    }
    get editorListCommand() {
        return this.data.editorListCommand;
    }
    set editorListCommand(value) {
        this.data.editorListCommand = value;
    }
    get symbolListPlaceholderText() {
        return SwitcherPlusSettings.defaults.symbolListCommand;
    }
    get symbolListCommand() {
        return this.data.symbolListCommand;
    }
    set symbolListCommand(value) {
        this.data.symbolListCommand = value;
    }
    get workspaceListCommand() {
        return this.data.workspaceListCommand;
    }
    set workspaceListCommand(value) {
        this.data.workspaceListCommand = value;
    }
    get workspaceListPlaceholderText() {
        return SwitcherPlusSettings.defaults.workspaceListCommand;
    }
    get headingsListCommand() {
        return this.data.headingsListCommand;
    }
    set headingsListCommand(value) {
        this.data.headingsListCommand = value;
    }
    get headingsListPlaceholderText() {
        return SwitcherPlusSettings.defaults.headingsListCommand;
    }
    get starredListCommand() {
        return this.data.starredListCommand;
    }
    set starredListCommand(value) {
        this.data.starredListCommand = value;
    }
    get starredListPlaceholderText() {
        return SwitcherPlusSettings.defaults.starredListCommand;
    }
    get commandListCommand() {
        return this.data.commandListCommand;
    }
    set commandListCommand(value) {
        this.data.commandListCommand = value;
    }
    get commandListPlaceholderText() {
        return SwitcherPlusSettings.defaults.commandListCommand;
    }
    get relatedItemsListCommand() {
        return this.data.relatedItemsListCommand;
    }
    set relatedItemsListCommand(value) {
        this.data.relatedItemsListCommand = value;
    }
    get relatedItemsListPlaceholderText() {
        return SwitcherPlusSettings.defaults.relatedItemsListCommand;
    }
    get strictHeadingsOnly() {
        return this.data.strictHeadingsOnly;
    }
    set strictHeadingsOnly(value) {
        this.data.strictHeadingsOnly = value;
    }
    get searchAllHeadings() {
        return this.data.searchAllHeadings;
    }
    set searchAllHeadings(value) {
        this.data.searchAllHeadings = value;
    }
    get excludeViewTypes() {
        return this.data.excludeViewTypes;
    }
    get referenceViews() {
        return this.data.referenceViews;
    }
    get limit() {
        return this.data.limit;
    }
    set limit(value) {
        this.data.limit = value;
    }
    get includeSidePanelViewTypes() {
        return this.data.includeSidePanelViewTypes;
    }
    set includeSidePanelViewTypes(value) {
        // remove any duplicates before storing
        this.data.includeSidePanelViewTypes = [...new Set(value)];
    }
    get includeSidePanelViewTypesPlaceholder() {
        return SwitcherPlusSettings.defaults.includeSidePanelViewTypes.join('\n');
    }
    get selectNearestHeading() {
        return this.data.selectNearestHeading;
    }
    set selectNearestHeading(value) {
        this.data.selectNearestHeading = value;
    }
    get excludeFolders() {
        return this.data.excludeFolders;
    }
    set excludeFolders(value) {
        // remove any duplicates before storing
        this.data.excludeFolders = [...new Set(value)];
    }
    get excludeLinkSubTypes() {
        return this.data.excludeLinkSubTypes;
    }
    set excludeLinkSubTypes(value) {
        this.data.excludeLinkSubTypes = value;
    }
    get excludeRelatedFolders() {
        return this.data.excludeRelatedFolders;
    }
    set excludeRelatedFolders(value) {
        this.data.excludeRelatedFolders = [...new Set(value)];
    }
    get excludeOpenRelatedFiles() {
        return this.data.excludeOpenRelatedFiles;
    }
    set excludeOpenRelatedFiles(value) {
        this.data.excludeOpenRelatedFiles = value;
    }
    get excludeObsidianIgnoredFiles() {
        return this.data.excludeObsidianIgnoredFiles;
    }
    set excludeObsidianIgnoredFiles(value) {
        this.data.excludeObsidianIgnoredFiles = value;
    }
    get shouldSearchFilenames() {
        return this.data.shouldSearchFilenames;
    }
    set shouldSearchFilenames(value) {
        this.data.shouldSearchFilenames = value;
    }
    get pathDisplayFormat() {
        return this.data.pathDisplayFormat;
    }
    set pathDisplayFormat(value) {
        this.data.pathDisplayFormat = value;
    }
    get hidePathIfRoot() {
        return this.data.hidePathIfRoot;
    }
    set hidePathIfRoot(value) {
        this.data.hidePathIfRoot = value;
    }
    async loadSettings() {
        const copy = (source, target, keys) => {
            for (const key of keys) {
                if (key in source) {
                    target[key] = source[key];
                }
            }
        };
        try {
            const savedData = (await this.plugin?.loadData());
            if (savedData) {
                const keys = Object.keys(SwitcherPlusSettings.defaults);
                copy(savedData, this.data, keys);
            }
        }
        catch (err) {
            console.log('Switcher++: error loading settings, using defaults. ', err);
        }
    }
    async saveSettings() {
        const { plugin, data } = this;
        await plugin?.saveData(data);
    }
    save() {
        this.saveSettings().catch((e) => {
            console.log('Switcher++: error saving changes to settings', e);
        });
    }
    isSymbolTypeEnabled(symbol) {
        return this.data.enabledSymbolTypes[symbol];
    }
    setSymbolTypeEnabled(symbol, isEnabled) {
        this.data.enabledSymbolTypes[symbol] = isEnabled;
    }
}

class SettingsTabSection {
    constructor(app, mainSettingsTab, config) {
        this.app = app;
        this.mainSettingsTab = mainSettingsTab;
        this.config = config;
    }
    /**
     * Creates a new Setting with the given name and description.
     * @param  {HTMLElement} containerEl
     * @param  {string} name
     * @param  {string} desc
     * @returns Setting
     */
    createSetting(containerEl, name, desc) {
        const setting = new obsidian.Setting(containerEl);
        setting.setName(name);
        setting.setDesc(desc);
        return setting;
    }
    /**
     * Create section title elements and divider.
     * @param  {HTMLElement} containerEl
     * @param  {string} title
     * @param  {string} desc?
     * @returns Setting
     */
    addSectionTitle(containerEl, title, desc = '') {
        const setting = this.createSetting(containerEl, title, desc);
        setting.setHeading();
        return setting;
    }
    /**
     * Creates a HTMLInput element setting.
     * @param  {HTMLElement} containerEl The element to attach the setting to.
     * @param  {string} name
     * @param  {string} desc
     * @param  {string} initialValue
     * @param  {StringTypedConfigKey} configStorageKey The SwitcherPlusSettings key where the value for this setting should be stored.
     * @param  {string} placeholderText?
     * @returns Setting
     */
    addTextSetting(containerEl, name, desc, initialValue, configStorageKey, placeholderText) {
        const setting = this.createSetting(containerEl, name, desc);
        setting.addText((comp) => {
            comp.setPlaceholder(placeholderText);
            comp.setValue(initialValue);
            comp.onChange((rawValue) => {
                const value = rawValue.length ? rawValue : initialValue;
                this.saveChangesToConfig(configStorageKey, value);
            });
        });
        return setting;
    }
    /**
     * Create a Checkbox element setting.
     * @param  {HTMLElement} containerEl The element to attach the setting to.
     * @param  {string} name
     * @param  {string} desc
     * @param  {boolean} initialValue
     * @param  {BooleanTypedConfigKey} configStorageKey The SwitcherPlusSettings key where the value for this setting should be stored.
     * @returns Setting
     */
    addToggleSetting(containerEl, name, desc, initialValue, configStorageKey) {
        const setting = this.createSetting(containerEl, name, desc);
        setting.addToggle((comp) => {
            comp.setValue(initialValue);
            comp.onChange((value) => this.saveChangesToConfig(configStorageKey, value));
        });
        return setting;
    }
    /**
     * Create a TextArea element setting.
     * @param  {HTMLElement} containerEl The element to attach the setting to.
     * @param  {string} name
     * @param  {string} desc
     * @param  {string} initialValue
     * @param  {ListTypedConfigKey|StringTypedConfigKey} configStorageKey The SwitcherPlusSettings key where the value for this setting should be stored.
     * @param  {string} placeholderText?
     * @returns Setting
     */
    addTextAreaSetting(containerEl, name, desc, initialValue, configStorageKey, placeholderText) {
        const setting = this.createSetting(containerEl, name, desc);
        setting.addTextArea((comp) => {
            comp.setPlaceholder(placeholderText);
            comp.setValue(initialValue);
            comp.onChange((rawValue) => {
                const value = rawValue.length ? rawValue : initialValue;
                const isArray = Array.isArray(this.config[configStorageKey]);
                this.saveChangesToConfig(configStorageKey, isArray ? value.split('\n') : value);
            });
        });
        return setting;
    }
    addDropdownSetting(containerEl, name, desc, initialValue, options, configStorageKey, onChange) {
        const setting = this.createSetting(containerEl, name, desc);
        setting.addDropdown((comp) => {
            comp.addOptions(options);
            comp.setValue(initialValue);
            comp.onChange((rawValue) => {
                if (onChange) {
                    onChange(rawValue, this.config);
                }
                else {
                    this.saveChangesToConfig(configStorageKey, rawValue);
                }
            });
        });
        return setting;
    }
    /**
     * Updates the internal SwitcherPlusSettings configStorageKey with value, and writes it to disk.
     * @param  {K} configStorageKey The SwitcherPlusSettings key where the value for this setting should be stored.
     * @param  {SwitcherPlusSettings[K]} value
     * @returns void
     */
    saveChangesToConfig(configStorageKey, value) {
        if (configStorageKey) {
            const { config } = this;
            config[configStorageKey] = value;
            config.save();
        }
    }
}

class StarredSettingsTabSection extends SettingsTabSection {
    display(containerEl) {
        const { config } = this;
        this.addSectionTitle(containerEl, 'Starred List Mode Settings');
        this.addTextSetting(containerEl, 'Starred list mode trigger', 'Character that will trigger starred list mode in the switcher', config.starredListCommand, 'starredListCommand', config.starredListPlaceholderText);
    }
}

class CommandListSettingsTabSection extends SettingsTabSection {
    display(containerEl) {
        const { config } = this;
        this.addSectionTitle(containerEl, 'Command List Mode Settings');
        this.addTextSetting(containerEl, 'Command list mode trigger', 'Character that will trigger command list mode in the switcher', config.commandListCommand, 'commandListCommand', config.commandListPlaceholderText);
    }
}

class RelatedItemsSettingsTabSection extends SettingsTabSection {
    display(containerEl) {
        const { config } = this;
        this.addSectionTitle(containerEl, 'Related Items List Mode Settings');
        this.addTextSetting(containerEl, 'Related Items list mode trigger', 'Character that will trigger related items list mode in the switcher', config.relatedItemsListCommand, 'relatedItemsListCommand', config.relatedItemsListPlaceholderText);
        this.addToggleSetting(containerEl, 'Exclude open files', 'Enable, related files which are already open will not be displayed in the list. Disabled, All related files will be displayed in the list.', config.excludeOpenRelatedFiles, 'excludeOpenRelatedFiles');
    }
}

class GeneralSettingsTabSection extends SettingsTabSection {
    display(containerEl) {
        this.addSectionTitle(containerEl, 'General Settings');
        this.addToggleSetting(containerEl, 'Default to open in new pane', 'When enabled, navigating to un-opened files will open a new editor pane whenever possible (as if cmd/ctrl were held). When the file is already open, the existing pane will be activated. This overrides all other pane settings.', this.config.onOpenPreferNewPane, 'onOpenPreferNewPane');
        this.setPathDisplayFormat(containerEl, this.config);
    }
    setPathDisplayFormat(containerEl, config) {
        const options = {};
        options[PathDisplayFormat.None.toString()] = 'Hide path';
        options[PathDisplayFormat.Full.toString()] = 'Full path';
        options[PathDisplayFormat.FolderOnly.toString()] = 'Only parent folder';
        options[PathDisplayFormat.FolderWithFilename.toString()] = 'Parent folder & filename';
        options[PathDisplayFormat.FolderPathFilenameOptional.toString()] =
            'Parent folder path (filename optional)';
        this.addDropdownSetting(containerEl, 'Preferred file path display format', 'The preferred way to display file paths in suggestions', config.pathDisplayFormat.toString(), options, null, (rawValue, config) => {
            config.pathDisplayFormat = Number(rawValue);
            config.save();
        });
    }
}

class WorkspaceSettingsTabSection extends SettingsTabSection {
    display(containerEl) {
        const { config } = this;
        this.addSectionTitle(containerEl, 'Workspace List Mode Settings');
        this.addTextSetting(containerEl, 'Workspace list mode trigger', 'Character that will trigger workspace list mode in the switcher', config.workspaceListCommand, 'workspaceListCommand', config.workspaceListPlaceholderText);
    }
}

class EditorSettingsTabSection extends SettingsTabSection {
    display(containerEl) {
        const { config } = this;
        this.addSectionTitle(containerEl, 'Editor List Mode Settings');
        this.addTextSetting(containerEl, 'Editor list mode trigger', 'Character that will trigger editor list mode in the switcher', config.editorListCommand, 'editorListCommand', config.editorListPlaceholderText);
        this.setIncludeSidePanelViews(containerEl, config);
    }
    setIncludeSidePanelViews(containerEl, config) {
        const viewsListing = Object.keys(this.app.viewRegistry.viewByType).sort().join(' ');
        const desc = `When in Editor list mode, show the following view types from the side panels. Add one view type per line. Available view types: ${viewsListing}`;
        this.addTextAreaSetting(containerEl, 'Include side panel views', desc, config.includeSidePanelViewTypes.join('\n'), 'includeSidePanelViewTypes', config.includeSidePanelViewTypesPlaceholder);
    }
}

class HeadingsSettingsTabSection extends SettingsTabSection {
    display(containerEl) {
        const { config } = this;
        this.addSectionTitle(containerEl, 'Headings List Mode Settings');
        this.addTextSetting(containerEl, 'Headings list mode trigger', 'Character that will trigger headings list mode in the switcher', config.headingsListCommand, 'headingsListCommand', config.headingsListPlaceholderText);
        this.addToggleSetting(containerEl, 'Show headings only', 'Enabled, strictly search through only the headings contained in the file. Note: this setting overrides the "Show existing only", and "Search filenames" settings. Disabled, fallback to searching against the filename when there is not a match in the first H1 contained in the file. This will also allow searching through filenames, Aliases, and Unresolved links to be enabled.', config.strictHeadingsOnly, 'strictHeadingsOnly');
        this.addToggleSetting(containerEl, 'Search all headings', 'Enabled, search through all headings contained in each file. Disabled, only search through the first H1 in each file.', config.searchAllHeadings, 'searchAllHeadings');
        this.addToggleSetting(containerEl, 'Search filenames', "Enabled, search and show suggestions for filenames. Disabled, Don't search through filenames (except for fallback searches)", config.shouldSearchFilenames, 'shouldSearchFilenames');
        this.setExcludeFolders(containerEl, config);
        this.addToggleSetting(containerEl, 'Hide Obsidian "Excluded files"', 'Enabled, do not display suggestions for files that are in Obsidian\'s "Options > Files & Links > Excluded files" list. Disabled, suggestions for those files will be displayed but downranked.', config.excludeObsidianIgnoredFiles, 'excludeObsidianIgnoredFiles');
    }
    setExcludeFolders(containerEl, config) {
        const settingName = 'Exclude folders';
        this.createSetting(containerEl, settingName, 'When in Headings list mode, folder path that match any regex listed here will not be searched for suggestions. Path should start from the Vault Root. Add one path per line.').addTextArea((textArea) => {
            textArea.setValue(config.excludeFolders.join('\n'));
            textArea.inputEl.addEventListener('blur', () => {
                const excludes = textArea
                    .getValue()
                    .split('\n')
                    .filter((v) => v.length > 0);
                if (this.validateExcludeFolderList(settingName, excludes)) {
                    config.excludeFolders = excludes;
                    config.save();
                }
            });
        });
    }
    validateExcludeFolderList(settingName, excludes) {
        let isValid = true;
        let failedMsg = '';
        for (const str of excludes) {
            try {
                new RegExp(str);
            }
            catch (err) {
                // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
                failedMsg += `<span class="qsp-warning">${str}</span><br/>${err}<br/><br/>`;
                isValid = false;
            }
        }
        if (!isValid) {
            const popup = new obsidian.Modal(this.app);
            popup.titleEl.setText(settingName);
            popup.contentEl.innerHTML = `Changes not saved. The following regex contain errors:<br/><br/>${failedMsg}`;
            popup.open();
        }
        return isValid;
    }
}

class SwitcherPlusSettingTab extends obsidian.PluginSettingTab {
    constructor(app, plugin, config) {
        super(app, plugin);
        this.config = config;
    }
    display() {
        const { app, containerEl, config } = this;
        const generalSection = new GeneralSettingsTabSection(app, this, config);
        const tabSections = [
            HeadingsSettingsTabSection,
            EditorSettingsTabSection,
            RelatedItemsSettingsTabSection,
            StarredSettingsTabSection,
            CommandListSettingsTabSection,
            WorkspaceSettingsTabSection,
        ];
        containerEl.empty();
        containerEl.createEl('h2', { text: 'Quick Switcher++ Settings' });
        generalSection.display(containerEl);
        this.setSymbolModeSettingsGroup(containerEl, config);
        tabSections.forEach((tabSectionClass) => {
            const tabSection = new tabSectionClass(app, this, config);
            tabSection.display(containerEl);
        });
    }
    setSymbolModeSettingsGroup(containerEl, config) {
        new obsidian.Setting(containerEl).setHeading().setName('Symbol List Mode Settings');
        SwitcherPlusSettingTab.setSymbolListCommand(containerEl, config);
        SwitcherPlusSettingTab.setSymbolsInLineOrder(containerEl, config);
        SwitcherPlusSettingTab.setAlwaysNewPaneForSymbols(containerEl, config);
        SwitcherPlusSettingTab.setUseActivePaneForSymbolsOnMobile(containerEl, config);
        SwitcherPlusSettingTab.setSelectNearestHeading(containerEl, config);
        this.setEnabledSymbolTypes(containerEl, config);
    }
    static setAlwaysNewPaneForSymbols(containerEl, config) {
        new obsidian.Setting(containerEl)
            .setName('Open Symbols in new pane')
            .setDesc('Enabled, always open a new pane when navigating to Symbols. Disabled, navigate in an already open pane (if one exists)')
            .addToggle((toggle) => toggle.setValue(config.alwaysNewPaneForSymbols).onChange((value) => {
            config.alwaysNewPaneForSymbols = value;
            config.save();
        }));
    }
    static setUseActivePaneForSymbolsOnMobile(containerEl, config) {
        new obsidian.Setting(containerEl)
            .setName('Open Symbols in active pane on mobile devices')
            .setDesc('Enabled, navigate to the target file and symbol in the active editor pane. Disabled, open a new pane when navigating to Symbols, even on mobile devices.')
            .addToggle((toggle) => toggle.setValue(config.useActivePaneForSymbolsOnMobile).onChange((value) => {
            config.useActivePaneForSymbolsOnMobile = value;
            config.save();
        }));
    }
    static setSelectNearestHeading(containerEl, config) {
        new obsidian.Setting(containerEl)
            .setName('Auto-select nearest heading')
            .setDesc('Enabled, in an unfiltered symbol list, select the closest preceding Heading to the current cursor position. Disabled, the first symbol in the list is selected.')
            .addToggle((toggle) => toggle.setValue(config.selectNearestHeading).onChange((value) => {
            config.selectNearestHeading = value;
            config.save();
        }));
    }
    static setSymbolsInLineOrder(containerEl, config) {
        new obsidian.Setting(containerEl)
            .setName('List symbols as indented outline')
            .setDesc('Enabled, symbols will be displayed in the (line) order they appear in the source text, indented under any preceding heading. Disabled, symbols will be grouped by type: Headings, Tags, Links, Embeds.')
            .addToggle((toggle) => toggle.setValue(config.symbolsInLineOrder).onChange((value) => {
            config.symbolsInLineOrder = value;
            config.save();
        }));
    }
    setEnabledSymbolTypes(containerEl, config) {
        new obsidian.Setting(containerEl).setName('Show Headings').addToggle((toggle) => toggle
            .setValue(config.isSymbolTypeEnabled(SymbolType.Heading))
            .onChange((value) => {
            config.setSymbolTypeEnabled(SymbolType.Heading, value);
            config.save();
        }));
        new obsidian.Setting(containerEl).setName('Show Tags').addToggle((toggle) => toggle.setValue(config.isSymbolTypeEnabled(SymbolType.Tag)).onChange((value) => {
            config.setSymbolTypeEnabled(SymbolType.Tag, value);
            config.save();
        }));
        new obsidian.Setting(containerEl).setName('Show Embeds').addToggle((toggle) => toggle.setValue(config.isSymbolTypeEnabled(SymbolType.Embed)).onChange((value) => {
            config.setSymbolTypeEnabled(SymbolType.Embed, value);
            config.save();
        }));
        this.setEnableLinks(containerEl, config);
    }
    setEnableLinks(containerEl, config) {
        const isLinksEnabled = config.isSymbolTypeEnabled(SymbolType.Link);
        new obsidian.Setting(containerEl).setName('Show Links').addToggle((toggle) => {
            toggle.setValue(isLinksEnabled).onChange(async (value) => {
                config.setSymbolTypeEnabled(SymbolType.Link, value);
                // have to await the save here because the call to display() will trigger a read
                // of the updated data
                await config.saveSettings();
                // reload the settings panel. This will cause the sublink types toggle
                // controls to be shown/hidden based on isLinksEnabled status
                this.display();
            });
        });
        if (isLinksEnabled) {
            SwitcherPlusSettingTab.addSubLinkTypeToggle(containerEl, config, LinkType.Heading, 'Links to headings');
            SwitcherPlusSettingTab.addSubLinkTypeToggle(containerEl, config, LinkType.Block, 'Links to blocks');
        }
    }
    static addSubLinkTypeToggle(containerEl, config, linkType, name) {
        new obsidian.Setting(containerEl)
            .setClass('qsp-setting-item-indent')
            .setName(name)
            .addToggle((toggle) => {
            const isExcluded = (config.excludeLinkSubTypes & linkType) === linkType;
            toggle.setValue(!isExcluded).onChange((isEnabled) => {
                let exclusions = config.excludeLinkSubTypes;
                if (isEnabled) {
                    // remove from exclusion list
                    exclusions &= ~linkType;
                }
                else {
                    // add to exclusion list
                    exclusions |= linkType;
                }
                config.excludeLinkSubTypes = exclusions;
                config.save();
            });
        });
    }
    static setSymbolListCommand(containerEl, config) {
        new obsidian.Setting(containerEl)
            .setName('Symbol list mode trigger')
            .setDesc('Character that will trigger symbol list mode in the switcher')
            .addText((text) => text
            .setPlaceholder(config.symbolListPlaceholderText)
            .setValue(config.symbolListCommand)
            .onChange((value) => {
            const val = value.length ? value : config.symbolListPlaceholderText;
            config.symbolListCommand = val;
            config.save();
        }));
    }
}

class Handler {
    constructor(app, settings) {
        this.app = app;
        this.settings = settings;
    }
    get commandString() {
        return null;
    }
    getEditorInfo(leaf) {
        const { excludeViewTypes } = this.settings;
        let file = null;
        let isValidSource = false;
        let cursor = null;
        if (leaf) {
            const { view } = leaf;
            const viewType = view.getViewType();
            file = view.file;
            cursor = this.getCursorPosition(view);
            // determine if the current active editor pane is valid
            const isCurrentEditorValid = !excludeViewTypes.includes(viewType);
            // whether or not the current active editor can be used as the target for
            // symbol search
            isValidSource = isCurrentEditorValid && !!file;
        }
        return { isValidSource, leaf, file, suggestion: null, cursor };
    }
    getSuggestionInfo(suggestion) {
        const info = this.getSourceInfoFromSuggestion(suggestion);
        let leaf = info.leaf;
        if (info.isValidSource) {
            // try to find a matching leaf for suggestion types that don't explicitly
            // provide one. This is primarily needed to be able to focus an
            // existing pane if there is one
            ({ leaf } = this.findMatchingLeaf(info.file, info.leaf));
        }
        // Get the cursor information to support `selectNearestHeading`
        const cursor = this.getCursorPosition(leaf?.view);
        return { ...info, leaf, cursor };
    }
    getSourceInfoFromSuggestion(suggestion) {
        let file = null;
        let leaf = null;
        // Can't use a symbol, workspace, unresolved (non-existent file) suggestions as
        // the target for another symbol command, because they don't point to a file
        const isFileBasedSuggestion = suggestion &&
            !isSymbolSuggestion(suggestion) &&
            !isUnresolvedSuggestion(suggestion) &&
            !isWorkspaceSuggestion(suggestion) &&
            !isCommandSuggestion(suggestion);
        if (isFileBasedSuggestion) {
            file = suggestion.file;
        }
        if (isEditorSuggestion(suggestion)) {
            leaf = suggestion.item;
        }
        const isValidSource = !!file;
        return { isValidSource, leaf, file, suggestion };
    }
    /**
     * Retrieves the position of the cursor, given that view is in a Mode that supports cursors.
     * @param  {View} view
     * @returns EditorPosition
     */
    getCursorPosition(view) {
        let cursor = null;
        if (view?.getViewType() === 'markdown') {
            const md = view;
            if (md.getMode() !== 'preview') {
                const { editor } = md;
                cursor = editor.getCursor('head');
            }
        }
        return cursor;
    }
    /**
     * Returns the text of the first H1 contained in sourceFile, or sourceFile
     * path if an H1 does not exist
     * @param  {TFile} sourceFile
     * @returns string
     */
    getTitleText(sourceFile) {
        const path = stripMDExtensionFromPath(sourceFile);
        const h1 = this.getFirstH1(sourceFile);
        return h1?.heading ?? path;
    }
    /**
     * Finds and returns the first H1 from sourceFile
     * @param  {TFile} sourceFile
     * @returns HeadingCache
     */
    getFirstH1(sourceFile) {
        let h1 = null;
        const { metadataCache } = this.app;
        const headingList = metadataCache.getFileCache(sourceFile)?.headings?.filter((v) => v.level === 1) ??
            [];
        if (headingList.length) {
            h1 = headingList.reduce((acc, curr) => {
                const { line: currLine } = curr.position.start;
                const accLine = acc.position.start.line;
                return currLine < accLine ? curr : acc;
            });
        }
        return h1;
    }
    /**
     * Finds the first open WorkspaceLeaf that is showing source file.
     * @param  {TFile} file The source file that is being shown to find
     * @param  {WorkspaceLeaf} leaf An already open editor, or, a 'reference' WorkspaceLeaf (example: backlinks, outline, etc.. views) that is used to find the associated editor if one exists.
     * @param  {} shouldIncludeRefViews=false set to true to make reference view types valid return candidates.
     * @returns TargetInfo
     */
    findMatchingLeaf(file, leaf, shouldIncludeRefViews = false) {
        let matchingLeaf = null;
        const hasSourceLeaf = !!leaf;
        const { settings: { referenceViews, excludeViewTypes, includeSidePanelViewTypes }, app: { workspace }, } = this;
        const isMatch = (candidateLeaf) => {
            let val = false;
            if (candidateLeaf?.view) {
                const isCandidateRefView = referenceViews.includes(candidateLeaf.view.getViewType());
                const isValidCandidate = shouldIncludeRefViews || !isCandidateRefView;
                const isSourceRefView = hasSourceLeaf && referenceViews.includes(leaf.view.getViewType());
                if (isValidCandidate) {
                    if (hasSourceLeaf && (shouldIncludeRefViews || !isSourceRefView)) {
                        val = candidateLeaf === leaf;
                    }
                    else {
                        val = candidateLeaf.view.file === file;
                    }
                }
            }
            return val;
        };
        // Prioritize the active leaf matches first, otherwise find the first matching leaf
        if (isMatch(workspace.activeLeaf)) {
            matchingLeaf = workspace.activeLeaf;
        }
        else {
            const leaves = this.getOpenLeaves(excludeViewTypes, includeSidePanelViewTypes);
            // put leaf at the first index so it gets checked first
            matchingLeaf = [leaf, ...leaves].find(isMatch);
        }
        return {
            leaf: matchingLeaf ?? null,
            file,
            suggestion: null,
            isValidSource: false,
        };
    }
    /**
     * Determines whether or not a new leaf should be created taking user
     * settings into account
     * @param  {boolean} isNewPaneRequested Set to true if the user holding cmd/ctrl
     * @param  {} isAlreadyOpen=false Set to true if there is a pane showing the file already
     * @param  {Mode} mode? Only Symbol mode has special handling.
     * @returns boolean
     */
    shouldCreateNewLeaf(isNewPaneRequested, isAlreadyOpen = false, mode) {
        const { onOpenPreferNewPane, alwaysNewPaneForSymbols, useActivePaneForSymbolsOnMobile, } = this.settings;
        const isNewPanePreferred = !isAlreadyOpen && onOpenPreferNewPane;
        let shouldCreateNew = isNewPaneRequested || isNewPanePreferred;
        if (mode === Mode.SymbolList && !onOpenPreferNewPane) {
            const { isMobile } = obsidian.Platform;
            shouldCreateNew = alwaysNewPaneForSymbols || isNewPaneRequested;
            if (isMobile) {
                shouldCreateNew = isNewPaneRequested || !useActivePaneForSymbolsOnMobile;
            }
        }
        return shouldCreateNew;
    }
    /**
     * Determines if a leaf belongs to the main editor panel (workspace.rootSplit)
     * as opposed to the side panels
     * @param  {WorkspaceLeaf} leaf
     * @returns boolean
     */
    isMainPanelLeaf(leaf) {
        return leaf?.getRoot() === this.app.workspace.rootSplit;
    }
    /**
     * Reveals and optionally bring into focus a WorkspaceLeaf, including leaves
     * from the side panels.
     * @param  {WorkspaceLeaf} leaf
     * @param  {boolean} pushHistory?
     * @param  {Record<string} eState?
     * @param  {} unknown>
     * @returns void
     */
    activateLeaf(leaf, pushHistory, eState) {
        const { workspace } = this.app;
        const isInSidePanel = !this.isMainPanelLeaf(leaf);
        const state = { focus: true, ...eState };
        if (isInSidePanel) {
            workspace.revealLeaf(leaf);
        }
        workspace.setActiveLeaf(leaf, pushHistory);
        leaf.view.setEphemeralState(state);
    }
    /**
     * Returns a array of all open WorkspaceLeaf taking into account
     * excludeMainPanelViewTypes and includeSidePanelViewTypes.
     * @param  {string[]} excludeMainPanelViewTypes?
     * @param  {string[]} includeSidePanelViewTypes?
     * @returns WorkspaceLeaf[]
     */
    getOpenLeaves(excludeMainPanelViewTypes, includeSidePanelViewTypes) {
        const leaves = [];
        const saveLeaf = (l) => {
            const viewType = l.view?.getViewType();
            if (this.isMainPanelLeaf(l)) {
                if (!excludeMainPanelViewTypes?.includes(viewType)) {
                    leaves.push(l);
                }
            }
            else if (includeSidePanelViewTypes?.includes(viewType)) {
                leaves.push(l);
            }
        };
        this.app.workspace.iterateAllLeaves(saveLeaf);
        return leaves;
    }
    /**
     * Loads a file into a WorkspaceLeaf based on {@link EditorNavigationType}
     * @param  {TFile} file
     * @param  {EditorNavigationType} navType
     * @param  {OpenViewState} openState?
     * @param  {} errorContext=''
     * @returns void
     */
    openFileInLeaf(file, navType, openState, errorContext) {
        const { workspace } = this.app;
        errorContext = errorContext ?? '';
        const message = `Switcher++: error opening file. ${errorContext}`;
        const getLeaf = () => {
            let leaf = null;
            if (navType === EditorNavigationType.PopoutLeaf) {
                leaf = workspace.openPopoutLeaf();
            }
            else {
                const shouldCreateNew = navType === EditorNavigationType.NewLeaf;
                leaf = workspace.getLeaf(shouldCreateNew);
            }
            return leaf;
        };
        try {
            getLeaf()
                .openFile(file, openState)
                .catch((reason) => {
                // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
                console.log(`${message} ${reason}`);
            });
        }
        catch (error) {
            // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
            console.log(`${message} ${error}`);
        }
    }
    /**
     * Determines whether to activate (make active and focused) an existing WorkspaceLeaf
     * (searches through all leaves), or create a new WorkspaceLeaf, or reuse an unpinned
     * WorkspaceLeaf, or create a new window in order to display file. This takes user
     * settings and event status into account.
     * @param  {MouseEvent|KeyboardEvent} evt navigation trigger event
     * @param  {TFile} file The file to display
     * @param  {string} errorContext Custom text to save in error messages
     * @param  {OpenViewState} openState? State to pass to the new, or activated view. If
     * falsy, default values will be used
     * @param  {WorkspaceLeaf} leaf? WorkspaceLeaf, or reference WorkspaceLeaf
     * (backlink, outline, etc..) to activate if it's already known
     * @param  {Mode} mode? Only Symbol mode has custom handling
     * @param  {} shouldIncludeRefViews=false whether reference WorkspaceLeaves are valid
     * targets for activation
     * @returns void
     */
    navigateToLeafOrOpenFile(evt, file, errorContext, openState, leaf, mode, shouldIncludeRefViews = false) {
        const { leaf: targetLeaf } = this.findMatchingLeaf(file, leaf, shouldIncludeRefViews);
        const isAlreadyOpen = !!targetLeaf;
        const isModDown = obsidian.Keymap.isModEvent(evt);
        const key = evt.key;
        const isPopoutRequested = isModDown && key === 'o';
        let navType = EditorNavigationType.ReuseExistingLeaf;
        if (isPopoutRequested) {
            navType = EditorNavigationType.PopoutLeaf;
        }
        else if (this.shouldCreateNewLeaf(isModDown, isAlreadyOpen, mode)) {
            navType = EditorNavigationType.NewLeaf;
        }
        this.activateLeafOrOpenFile(navType, file, errorContext, targetLeaf, openState);
    }
    /**
     * Activates leaf (if provided), or load file into another leaf based on navType
     * @param  {EditorNavigationType} navType
     * @param  {TFile} file
     * @param  {string} errorContext
     * @param  {WorkspaceLeaf} leaf? optional if supplied and navType is
     * {@link EditorNavigationType.ReuseExistingLeaf} then leaf will be activated
     * @param  {OpenViewState} openState?
     * @returns void
     */
    activateLeafOrOpenFile(navType, file, errorContext, leaf, openState) {
        // default to having the pane active and focused
        openState = openState ?? { active: true, eState: { active: true, focus: true } };
        if (leaf && navType === EditorNavigationType.ReuseExistingLeaf) {
            const eState = openState?.eState;
            this.activateLeaf(leaf, true, eState);
        }
        else {
            this.openFileInLeaf(file, navType, openState, errorContext);
        }
    }
    /**
     * Renders the UI elements to display path information for file using the
     * stored configuration settings
     * @param  {HTMLElement} parentEl containing element, this should be the element with
     * the "suggestion-content" style
     * @param  {TFile} file
     * @param  {boolean} excludeOptionalFilename? set to true to hide the filename in cases
     * where when {PathDisplayFormat} is set to FolderPathFilenameOptional
     * @param  {SearchResult} match?
     * @param  {boolean} overridePathFormat? set to true force display the path and set
     * {PathDisplayFormat} to FolderPathFilenameOptional
     * @returns void
     */
    renderPath(parentEl, file, excludeOptionalFilename, match, overridePathFormat) {
        if (parentEl && file) {
            const isRoot = file.parent.isRoot();
            let format = this.settings.pathDisplayFormat;
            let hidePath = format === PathDisplayFormat.None || (isRoot && this.settings.hidePathIfRoot);
            if (overridePathFormat) {
                format = PathDisplayFormat.FolderPathFilenameOptional;
                hidePath = false;
            }
            if (!hidePath) {
                const wrapperEl = parentEl.createDiv({ cls: ['suggestion-note', 'qsp-note'] });
                const path = this.getPathDisplayText(file, format, excludeOptionalFilename);
                const iconEl = wrapperEl.createSpan({ cls: ['qsp-path-indicator'] });
                obsidian.setIcon(iconEl, 'folder', 13);
                const pathEl = wrapperEl.createSpan({ cls: 'qsp-path' });
                obsidian.renderResults(pathEl, path, match);
            }
        }
    }
    /**
     * Formats the path of file based on displayFormat
     * @param  {TFile} file
     * @param  {PathDisplayFormat} displayFormat
     * @param  {boolean} excludeOptionalFilename? Only applicable to
     * {PathDisplayFormat.FolderPathFilenameOptional}. When true will exclude the filename from the returned string
     * @returns string
     */
    getPathDisplayText(file, displayFormat, excludeOptionalFilename) {
        let text = '';
        if (file) {
            const { parent } = file;
            const dirname = parent.name;
            const isRoot = parent.isRoot();
            // root path is expected to always be "/"
            const rootPath = this.app.vault.getRoot().path;
            switch (displayFormat) {
                case PathDisplayFormat.FolderWithFilename:
                    text = isRoot ? `${file.name}` : obsidian.normalizePath(`${dirname}/${file.name}`);
                    break;
                case PathDisplayFormat.FolderOnly:
                    text = isRoot ? rootPath : dirname;
                    break;
                case PathDisplayFormat.Full:
                    text = file.path;
                    break;
                case PathDisplayFormat.FolderPathFilenameOptional:
                    if (excludeOptionalFilename) {
                        text = parent.path;
                        if (!isRoot) {
                            text += rootPath; // add explicit trailing /
                        }
                    }
                    else {
                        text = this.getPathDisplayText(file, PathDisplayFormat.Full);
                    }
                    break;
            }
        }
        return text;
    }
    /**
     * Creates the UI elements to display the primary suggestion text using
     * the correct styles.
     * @param  {HTMLElement} parentEl containing element, this should be the element with
     * the "suggestion-item" style
     * @param  {string} content
     * @param  {SearchResult} match
     * @param  {number} offset?
     * @returns HTMLDivElement
     */
    renderContent(parentEl, content, match, offset) {
        const contentEl = parentEl.createDiv({
            cls: ['suggestion-content', 'qsp-content'],
        });
        const titleEl = contentEl.createDiv({
            cls: ['suggestion-title', 'qsp-title'],
        });
        obsidian.renderResults(titleEl, content, match, offset);
        return contentEl;
    }
    /** add the base suggestion styles to the suggestion container element
     * @param  {HTMLElement} parentEl container element
     * @param  {string[]} additionalStyles? optional styles to add
     */
    addClassesToSuggestionContainer(parentEl, additionalStyles) {
        const styles = ['mod-complex'];
        if (additionalStyles) {
            styles.push(...additionalStyles);
        }
        parentEl?.addClasses(styles);
    }
    /**
     * Searches through primaryString, if not match is found,
     * searches through secondaryString
     * @param  {PreparedQuery} prepQuery
     * @param  {string} primaryString
     * @param  {string} secondaryString?
     * @returns { isPrimary: boolean; match?: SearchResult }
     */
    fuzzySearchStrings(prepQuery, primaryString, secondaryString) {
        let isPrimary = false;
        let match = null;
        if (primaryString) {
            match = obsidian.fuzzySearch(prepQuery, primaryString);
            isPrimary = !!match;
        }
        if (!match && secondaryString) {
            match = obsidian.fuzzySearch(prepQuery, secondaryString);
            if (match) {
                match.score -= 1;
            }
        }
        return {
            isPrimary,
            match,
        };
    }
    /**
     * Searches through primaryText, if no match is found and file is not null, it will
     * fallback to searching 1) file.basename, 2) file parent path
     * @param  {PreparedQuery} prepQuery
     * @param  {TFile} file
     * @param  {string} primaryString?
     * @returns SearchResultWithFallback
     */
    fuzzySearchWithFallback(prepQuery, primaryString, file) {
        let matchType = MatchType.None;
        let matchText;
        let match = null;
        const search = (matchTypes, p1, p2) => {
            const res = this.fuzzySearchStrings(prepQuery, p1, p2);
            if (res.match) {
                matchType = matchTypes[1];
                matchText = p2;
                match = res.match;
                if (res.isPrimary) {
                    matchType = matchTypes[0];
                    matchText = p1;
                }
            }
            return !!res.match;
        };
        const isMatch = search([MatchType.Primary, MatchType.None], primaryString);
        if (!isMatch && file) {
            const { basename, parent: { path }, } = file;
            search([MatchType.Basename, MatchType.ParentPath], basename, path);
        }
        return { matchType, matchText, match };
    }
}

const WORKSPACE_PLUGIN_ID = 'workspaces';
class WorkspaceHandler extends Handler {
    get commandString() {
        return this.settings?.workspaceListCommand;
    }
    validateCommand(inputInfo, index, filterText, _activeSuggestion, _activeLeaf) {
        if (this.isWorkspacesPluginEnabled()) {
            inputInfo.mode = Mode.WorkspaceList;
            const workspaceCmd = inputInfo.parsedCommand(Mode.WorkspaceList);
            workspaceCmd.index = index;
            workspaceCmd.parsedInput = filterText;
            workspaceCmd.isValidated = true;
        }
    }
    getSuggestions(inputInfo) {
        const suggestions = [];
        if (inputInfo) {
            inputInfo.buildSearchQuery();
            const { hasSearchTerm, prepQuery } = inputInfo.searchQuery;
            const items = this.getItems();
            items.forEach((item) => {
                let shouldPush = true;
                let match = null;
                if (hasSearchTerm) {
                    match = obsidian.fuzzySearch(prepQuery, item.id);
                    shouldPush = !!match;
                }
                if (shouldPush) {
                    suggestions.push({ type: SuggestionType.WorkspaceList, item, match });
                }
            });
            if (hasSearchTerm) {
                obsidian.sortSearchResults(suggestions);
            }
        }
        return suggestions;
    }
    renderSuggestion(sugg, parentEl) {
        if (sugg) {
            this.addClassesToSuggestionContainer(parentEl, ['qsp-suggestion-workspace']);
            this.renderContent(parentEl, sugg.item.id, sugg.match);
        }
    }
    onChooseSuggestion(sugg, _evt) {
        if (sugg) {
            const { id } = sugg.item;
            const pluginInstance = this.getSystemWorkspacesPluginInstance();
            if (typeof pluginInstance['loadWorkspace'] === 'function') {
                pluginInstance.loadWorkspace(id);
            }
        }
    }
    getItems() {
        const items = [];
        const workspaces = this.getSystemWorkspacesPluginInstance()?.workspaces;
        if (workspaces) {
            Object.keys(workspaces).forEach((id) => items.push({ id, type: 'workspaceInfo' }));
        }
        return items;
    }
    isWorkspacesPluginEnabled() {
        const plugin = this.getSystemWorkspacesPlugin();
        return plugin?.enabled;
    }
    getSystemWorkspacesPlugin() {
        return getInternalPluginById(this.app, WORKSPACE_PLUGIN_ID);
    }
    getSystemWorkspacesPluginInstance() {
        const workspacesPlugin = this.getSystemWorkspacesPlugin();
        return workspacesPlugin?.instance;
    }
}

class HeadingsHandler extends Handler {
    get commandString() {
        return this.settings?.headingsListCommand;
    }
    validateCommand(inputInfo, index, filterText, _activeSuggestion, _activeLeaf) {
        inputInfo.mode = Mode.HeadingsList;
        const headingsCmd = inputInfo.parsedCommand(Mode.HeadingsList);
        headingsCmd.index = index;
        headingsCmd.parsedInput = filterText;
        headingsCmd.isValidated = true;
    }
    onChooseSuggestion(sugg, evt) {
        if (sugg) {
            const { start: { line, col }, end: endLoc, } = sugg.item.position;
            // state information to highlight the target heading
            const eState = {
                active: true,
                focus: true,
                startLoc: { line, col },
                endLoc,
                line,
                cursor: {
                    from: { line, ch: col },
                    to: { line, ch: col },
                },
            };
            this.navigateToLeafOrOpenFile(evt, sugg.file, 'Unable to navigate to heading for file.', { active: true, eState });
        }
    }
    renderSuggestion(sugg, parentEl) {
        if (sugg) {
            const { item } = sugg;
            this.addClassesToSuggestionContainer(parentEl, [
                'qsp-suggestion-headings',
                `qsp-headings-l${item.level}`,
            ]);
            const contentEl = this.renderContent(parentEl, item.heading, sugg.match);
            this.renderPath(contentEl, sugg.file);
            // render the flair icon
            const auxEl = parentEl.createDiv({ cls: ['suggestion-aux', 'qsp-aux'] });
            auxEl.createSpan({
                cls: ['suggestion-flair', 'qsp-headings-indicator'],
                text: HeadingIndicators[item.level],
            });
            if (sugg.downranked) {
                parentEl.addClass('mod-downranked');
            }
        }
    }
    getSuggestions(inputInfo) {
        let suggestions = [];
        if (inputInfo) {
            inputInfo.buildSearchQuery();
            const { prepQuery, hasSearchTerm } = inputInfo.searchQuery;
            if (hasSearchTerm) {
                const { limit } = this.settings;
                suggestions = this.getAllFilesSuggestions(prepQuery);
                obsidian.sortSearchResults(suggestions);
                if (suggestions.length > 0 && limit > 0) {
                    suggestions = suggestions.slice(0, limit);
                }
            }
            else {
                suggestions = this.getRecentFilesSuggestions();
            }
        }
        return suggestions;
    }
    getAllFilesSuggestions(prepQuery) {
        const suggestions = [];
        const { app: { vault }, settings: { strictHeadingsOnly, showExistingOnly, excludeFolders }, } = this;
        const isExcludedFolder = matcherFnForRegExList(excludeFolders);
        let nodes = [vault.getRoot()];
        while (nodes.length > 0) {
            const node = nodes.pop();
            if (isTFile(node)) {
                this.addSuggestionsFromFile(suggestions, node, prepQuery);
            }
            else if (!isExcludedFolder(node.path)) {
                nodes = nodes.concat(node.children);
            }
        }
        if (!strictHeadingsOnly && !showExistingOnly) {
            this.addUnresolvedSuggestions(suggestions, prepQuery);
        }
        return suggestions;
    }
    addSuggestionsFromFile(suggestions, file, prepQuery) {
        const { searchAllHeadings, strictHeadingsOnly, shouldSearchFilenames, shouldShowAlias, } = this.settings;
        if (this.shouldIncludeFile(file)) {
            const isH1Matched = this.addHeadingSuggestions(suggestions, prepQuery, file, searchAllHeadings);
            if (!strictHeadingsOnly) {
                if (shouldSearchFilenames || !isH1Matched) {
                    // if strict is disabled and filename search is enabled or there
                    // isn't an H1 match, then do a fallback search against the filename, then path
                    this.addFileSuggestions(suggestions, prepQuery, file);
                }
                if (shouldShowAlias) {
                    this.addAliasSuggestions(suggestions, prepQuery, file);
                }
            }
        }
    }
    downrankScoreIfIgnored(sugg) {
        if (this.app.metadataCache.isUserIgnored(sugg?.file?.path)) {
            sugg.downranked = true;
            if (sugg.match) {
                sugg.match.score -= 10;
            }
        }
        return sugg;
    }
    shouldIncludeFile(file) {
        let retVal = false;
        const { settings: { excludeObsidianIgnoredFiles, builtInSystemOptions: { showAttachments, showAllFileTypes }, }, app: { viewRegistry, metadataCache }, } = this;
        if (isTFile(file)) {
            const { extension } = file;
            if (!metadataCache.isUserIgnored(file.path) || !excludeObsidianIgnoredFiles) {
                retVal = viewRegistry.isExtensionRegistered(extension)
                    ? showAttachments || extension === 'md'
                    : showAllFileTypes;
            }
        }
        return retVal;
    }
    addAliasSuggestions(suggestions, prepQuery, file) {
        const { metadataCache } = this.app;
        const frontMatter = metadataCache.getFileCache(file)?.frontmatter;
        if (frontMatter) {
            const aliases = FrontMatterParser.getAliases(frontMatter);
            let i = aliases.length;
            // create suggestions where there is a match with an alias
            while (i--) {
                const alias = aliases[i];
                const { match } = this.fuzzySearchWithFallback(prepQuery, alias);
                if (match) {
                    suggestions.push(this.createAliasSuggestion(alias, file, match));
                }
            }
        }
    }
    addFileSuggestions(suggestions, prepQuery, file) {
        const { match, matchType, matchText } = this.fuzzySearchWithFallback(prepQuery, null, file);
        if (match) {
            suggestions.push(this.createFileSuggestion(file, match, matchType, matchText));
        }
    }
    addHeadingSuggestions(suggestions, prepQuery, file, allHeadings) {
        const { metadataCache } = this.app;
        const headingList = metadataCache.getFileCache(file)?.headings ?? [];
        let h1 = null;
        let isH1Matched = false;
        let i = headingList.length;
        while (i--) {
            const heading = headingList[i];
            let isMatched = false;
            if (allHeadings) {
                isMatched = this.matchAndPushHeading(suggestions, prepQuery, file, heading);
            }
            if (heading.level === 1) {
                const { line } = heading.position.start;
                if (h1 === null || line < h1.position.start.line) {
                    h1 = heading;
                    isH1Matched = isMatched;
                }
            }
        }
        if (!allHeadings && h1) {
            isH1Matched = this.matchAndPushHeading(suggestions, prepQuery, file, h1);
        }
        return isH1Matched;
    }
    matchAndPushHeading(suggestions, prepQuery, file, heading) {
        const { match } = this.fuzzySearchWithFallback(prepQuery, heading.heading);
        if (match) {
            suggestions.push(this.createHeadingSuggestion(heading, file, match));
        }
        return !!match;
    }
    addUnresolvedSuggestions(suggestions, prepQuery) {
        const { unresolvedLinks } = this.app.metadataCache;
        const unresolvedSet = new Set();
        const sources = Object.keys(unresolvedLinks);
        let i = sources.length;
        // create a distinct list of unresolved links
        while (i--) {
            // each source has an object with keys that represent the list of unresolved links
            // for that source file
            const sourcePath = sources[i];
            const links = Object.keys(unresolvedLinks[sourcePath]);
            let j = links.length;
            while (j--) {
                // unresolved links can be duplicates, use a Set to get a distinct list
                unresolvedSet.add(links[j]);
            }
        }
        const unresolvedList = Array.from(unresolvedSet);
        i = unresolvedList.length;
        // create suggestions where there is a match with an unresolved link
        while (i--) {
            const unresolved = unresolvedList[i];
            const { match } = this.fuzzySearchWithFallback(prepQuery, unresolved);
            if (match) {
                suggestions.push(this.createUnresolvedSuggestion(unresolved, match));
            }
        }
    }
    createAliasSuggestion(alias, file, match) {
        const sugg = {
            alias,
            file,
            ...this.createSearchMatch(match, MatchType.Primary, alias),
            type: SuggestionType.Alias,
        };
        return this.downrankScoreIfIgnored(sugg);
    }
    createUnresolvedSuggestion(linktext, match) {
        return {
            linktext,
            ...this.createSearchMatch(match, MatchType.Primary, linktext),
            type: SuggestionType.Unresolved,
        };
    }
    createFileSuggestion(file, match, matchType = MatchType.None, matchText = null) {
        const sugg = {
            file,
            match,
            matchType,
            matchText,
            type: SuggestionType.File,
        };
        return this.downrankScoreIfIgnored(sugg);
    }
    createHeadingSuggestion(item, file, match) {
        const sugg = {
            item,
            file,
            ...this.createSearchMatch(match, MatchType.Primary, item.heading),
            type: SuggestionType.HeadingsList,
        };
        return this.downrankScoreIfIgnored(sugg);
    }
    createSearchMatch(match, type, text) {
        let matchType = MatchType.None;
        let matchText = null;
        if (match) {
            matchType = type;
            matchText = text;
        }
        return {
            match,
            matchType,
            matchText,
        };
    }
    getRecentFilesSuggestions() {
        const suggestions = [];
        const { workspace, vault, metadataCache } = this.app;
        const recentFilePaths = workspace.getLastOpenFiles();
        recentFilePaths.forEach((path) => {
            const file = vault.getAbstractFileByPath(path);
            if (this.shouldIncludeFile(file)) {
                const f = file;
                let h1 = null;
                const h1s = metadataCache
                    .getFileCache(f)
                    ?.headings?.filter((h) => h.level === 1)
                    .sort((a, b) => a.position.start.line - b.position.start.line);
                if (h1s?.length) {
                    h1 = h1s[0];
                }
                const sugg = h1
                    ? this.createHeadingSuggestion(h1, f, null)
                    : this.createFileSuggestion(f, null);
                suggestions.push(sugg);
            }
        });
        return suggestions;
    }
}

class EditorHandler extends Handler {
    get commandString() {
        return this.settings?.editorListCommand;
    }
    validateCommand(inputInfo, index, filterText, _activeSuggestion, _activeLeaf) {
        inputInfo.mode = Mode.EditorList;
        const editorCmd = inputInfo.parsedCommand(Mode.EditorList);
        editorCmd.index = index;
        editorCmd.parsedInput = filterText;
        editorCmd.isValidated = true;
    }
    getSuggestions(inputInfo) {
        const suggestions = [];
        if (inputInfo) {
            inputInfo.buildSearchQuery();
            const { hasSearchTerm, prepQuery } = inputInfo.searchQuery;
            const { excludeViewTypes, includeSidePanelViewTypes } = this.settings;
            const items = this.getOpenLeaves(excludeViewTypes, includeSidePanelViewTypes);
            items.forEach((item) => {
                const file = item.view?.file;
                let shouldPush = true;
                let result = { matchType: MatchType.None, match: null };
                if (hasSearchTerm) {
                    result = this.fuzzySearchWithFallback(prepQuery, item.getDisplayText(), file);
                    shouldPush = result.matchType !== MatchType.None;
                }
                if (shouldPush) {
                    suggestions.push({ type: SuggestionType.EditorList, file, item, ...result });
                }
            });
            if (hasSearchTerm) {
                obsidian.sortSearchResults(suggestions);
            }
        }
        return suggestions;
    }
    renderSuggestion(sugg, parentEl) {
        if (sugg) {
            const { file, matchType, match } = sugg;
            const content = sugg.item.getDisplayText();
            let contentMatch = match;
            let pathMatch = null;
            if (matchType === MatchType.ParentPath) {
                contentMatch = null;
                pathMatch = match;
            }
            this.addClassesToSuggestionContainer(parentEl, ['qsp-suggestion-editor']);
            const contentEl = this.renderContent(parentEl, content, contentMatch);
            this.renderPath(contentEl, file, true, pathMatch, !!pathMatch);
        }
    }
    onChooseSuggestion(sugg, evt) {
        if (sugg) {
            this.navigateToLeafOrOpenFile(evt, sugg.file, 'Unable to reopen existing editor in new Leaf.', null, sugg.item, null, true);
        }
    }
}

class SymbolHandler extends Handler {
    get commandString() {
        return this.settings?.symbolListCommand;
    }
    validateCommand(inputInfo, index, filterText, activeSuggestion, activeLeaf) {
        const sourceInfo = this.getSourceInfoForSymbolOperation(activeSuggestion, activeLeaf, index === 0);
        if (sourceInfo) {
            inputInfo.mode = Mode.SymbolList;
            const symbolCmd = inputInfo.parsedCommand(Mode.SymbolList);
            symbolCmd.source = sourceInfo;
            symbolCmd.index = index;
            symbolCmd.parsedInput = filterText;
            symbolCmd.isValidated = true;
        }
    }
    getSuggestions(inputInfo) {
        const suggestions = [];
        if (inputInfo) {
            this.inputInfo = inputInfo;
            inputInfo.buildSearchQuery();
            const { hasSearchTerm, prepQuery } = inputInfo.searchQuery;
            const symbolCmd = inputInfo.parsedCommand(Mode.SymbolList);
            const items = this.getItems(symbolCmd.source, hasSearchTerm);
            items.forEach((item) => {
                let shouldPush = true;
                let match = null;
                if (hasSearchTerm) {
                    match = obsidian.fuzzySearch(prepQuery, SymbolHandler.getSuggestionTextForSymbol(item));
                    shouldPush = !!match;
                }
                if (shouldPush) {
                    const { file } = symbolCmd.source;
                    suggestions.push({ type: SuggestionType.SymbolList, file, item, match });
                }
            });
            if (hasSearchTerm) {
                obsidian.sortSearchResults(suggestions);
            }
        }
        return suggestions;
    }
    renderSuggestion(sugg, parentEl) {
        if (sugg) {
            const { item } = sugg;
            const parentElClasses = ['qsp-suggestion-symbol'];
            if (this.settings.symbolsInLineOrder &&
                !this.inputInfo?.searchQuery?.hasSearchTerm) {
                parentElClasses.push(`qsp-symbol-l${item.indentLevel}`);
            }
            this.addClassesToSuggestionContainer(parentEl, parentElClasses);
            const text = SymbolHandler.getSuggestionTextForSymbol(item);
            this.renderContent(parentEl, text, sugg.match);
            SymbolHandler.addSymbolIndicator(item, parentEl);
        }
    }
    onChooseSuggestion(sugg, evt) {
        if (sugg) {
            const symbolCmd = this.inputInfo.parsedCommand();
            const { leaf, file } = symbolCmd.source;
            const { start: { line, col }, end: endLoc, } = sugg.item.symbol.position;
            // object containing the state information for the target editor,
            // start with the range to highlight in target editor
            const eState = {
                active: true,
                focus: true,
                startLoc: { line, col },
                endLoc,
                line,
                cursor: {
                    from: { line, ch: col },
                    to: { line, ch: col },
                },
            };
            this.navigateToLeafOrOpenFile(evt, file, `Unable to navigate to symbol for file ${file.path}`, { active: true, eState }, leaf, Mode.SymbolList);
        }
    }
    reset() {
        this.inputInfo = null;
    }
    getSourceInfoForSymbolOperation(activeSuggestion, activeLeaf, isSymbolCmdPrefix) {
        const prevInputInfo = this.inputInfo;
        let prevSourceInfo = null;
        let prevMode = Mode.Standard;
        if (prevInputInfo) {
            prevSourceInfo = prevInputInfo.parsedCommand().source;
            prevMode = prevInputInfo.mode;
        }
        // figure out if the previous operation was a symbol operation
        const hasPrevSymbolSource = prevMode === Mode.SymbolList && !!prevSourceInfo;
        const activeEditorInfo = this.getEditorInfo(activeLeaf);
        const activeSuggInfo = this.getSuggestionInfo(activeSuggestion);
        // Pick the source file for a potential symbol operation, prioritizing
        // any pre-existing symbol operation that was in progress
        let sourceInfo = null;
        if (hasPrevSymbolSource) {
            sourceInfo = prevSourceInfo;
        }
        else if (activeSuggInfo.isValidSource) {
            sourceInfo = activeSuggInfo;
        }
        else if (activeEditorInfo.isValidSource && isSymbolCmdPrefix) {
            sourceInfo = activeEditorInfo;
        }
        return sourceInfo;
    }
    getItems(sourceInfo, hasSearchTerm) {
        let items = [];
        let symbolsInLineOrder = false;
        let selectNearestHeading = false;
        if (!hasSearchTerm) {
            ({ selectNearestHeading, symbolsInLineOrder } = this.settings);
        }
        items = this.getSymbolsFromSource(sourceInfo, symbolsInLineOrder);
        if (selectNearestHeading) {
            SymbolHandler.FindNearestHeadingSymbol(items, sourceInfo);
        }
        return items;
    }
    static FindNearestHeadingSymbol(items, sourceInfo) {
        const cursorLine = sourceInfo?.cursor?.line;
        // find the nearest heading to the current cursor pos, if applicable
        if (cursorLine) {
            let found = null;
            const headings = items.filter((v) => isHeadingCache(v.symbol));
            if (headings.length) {
                found = headings.reduce((acc, curr) => {
                    const { line: currLine } = curr.symbol.position.start;
                    const accLine = acc ? acc.symbol.position.start.line : -1;
                    return currLine > accLine && currLine <= cursorLine ? curr : acc;
                });
            }
            if (found) {
                found.isSelected = true;
            }
        }
    }
    getSymbolsFromSource(sourceInfo, orderByLineNumber) {
        const { app: { metadataCache }, settings, } = this;
        const ret = [];
        if (sourceInfo?.file) {
            const file = sourceInfo.file;
            const symbolData = metadataCache.getFileCache(file);
            if (symbolData) {
                const push = (symbols = [], symbolType) => {
                    if (settings.isSymbolTypeEnabled(symbolType)) {
                        symbols.forEach((symbol) => ret.push({ type: 'symbolInfo', symbol, symbolType }));
                    }
                };
                push(symbolData.headings, SymbolType.Heading);
                push(symbolData.tags, SymbolType.Tag);
                this.addLinksFromSource(symbolData.links, ret);
                push(symbolData.embeds, SymbolType.Embed);
            }
        }
        return orderByLineNumber ? SymbolHandler.orderSymbolsByLineNumber(ret) : ret;
    }
    addLinksFromSource(linkData, symbolList) {
        const { settings } = this;
        linkData = linkData ?? [];
        if (settings.isSymbolTypeEnabled(SymbolType.Link)) {
            for (const link of linkData) {
                const type = getLinkType(link);
                const isExcluded = (settings.excludeLinkSubTypes & type) === type;
                if (!isExcluded) {
                    symbolList.push({
                        type: 'symbolInfo',
                        symbol: link,
                        symbolType: SymbolType.Link,
                    });
                }
            }
        }
    }
    static orderSymbolsByLineNumber(symbols = []) {
        const sorted = symbols.sort((a, b) => {
            const { start: aStart } = a.symbol.position;
            const { start: bStart } = b.symbol.position;
            const lineDiff = aStart.line - bStart.line;
            return lineDiff === 0 ? aStart.col - bStart.col : lineDiff;
        });
        let currIndentLevel = 0;
        sorted.forEach((si) => {
            let indentLevel = 0;
            if (isHeadingCache(si.symbol)) {
                currIndentLevel = si.symbol.level;
                indentLevel = si.symbol.level - 1;
            }
            else {
                indentLevel = currIndentLevel;
            }
            si.indentLevel = indentLevel;
        });
        return sorted;
    }
    static getSuggestionTextForSymbol(symbolInfo) {
        const { symbol } = symbolInfo;
        let text;
        if (isHeadingCache(symbol)) {
            text = symbol.heading;
        }
        else if (isTagCache(symbol)) {
            text = symbol.tag.slice(1);
        }
        else {
            const refCache = symbol;
            ({ link: text } = refCache);
            const { displayText } = refCache;
            if (displayText && displayText !== text) {
                text += `|${displayText}`;
            }
        }
        return text;
    }
    static addSymbolIndicator(symbolInfo, parentEl) {
        const { symbolType, symbol } = symbolInfo;
        let indicator;
        if (isHeadingCache(symbol)) {
            indicator = HeadingIndicators[symbol.level];
        }
        else {
            indicator = SymbolIndicators[symbolType];
        }
        // render the flair icon
        const auxEl = parentEl.createDiv({ cls: ['suggestion-aux', 'qsp-aux'] });
        auxEl.createSpan({
            cls: ['suggestion-flair', 'qsp-symbol-indicator'],
            text: indicator,
        });
    }
}

const STARRED_PLUGIN_ID = 'starred';
class StarredHandler extends Handler {
    get commandString() {
        return this.settings?.starredListCommand;
    }
    validateCommand(inputInfo, index, filterText, _activeSuggestion, _activeLeaf) {
        if (this.isStarredPluginEnabled()) {
            inputInfo.mode = Mode.StarredList;
            const starredCmd = inputInfo.parsedCommand(Mode.StarredList);
            starredCmd.index = index;
            starredCmd.parsedInput = filterText;
            starredCmd.isValidated = true;
        }
    }
    getSuggestions(inputInfo) {
        const suggestions = [];
        if (inputInfo) {
            inputInfo.buildSearchQuery();
            const { hasSearchTerm, prepQuery } = inputInfo.searchQuery;
            const itemsInfo = this.getItems();
            itemsInfo.forEach(({ file, item }) => {
                let shouldPush = true;
                let result = { matchType: MatchType.None, match: null };
                if (hasSearchTerm) {
                    result = this.fuzzySearchWithFallback(prepQuery, item.title, file);
                    shouldPush = result.matchType !== MatchType.None;
                }
                if (shouldPush) {
                    suggestions.push({ type: SuggestionType.StarredList, file, item, ...result });
                }
            });
            if (hasSearchTerm) {
                obsidian.sortSearchResults(suggestions);
            }
        }
        return suggestions;
    }
    renderSuggestion(sugg, parentEl) {
        if (sugg) {
            const { file, matchType, match } = sugg;
            let contentMatch = match;
            let pathMatch = null;
            if (matchType === MatchType.ParentPath) {
                contentMatch = null;
                pathMatch = match;
            }
            this.addClassesToSuggestionContainer(parentEl, ['qsp-suggestion-starred']);
            const contentEl = this.renderContent(parentEl, sugg.item.title, contentMatch);
            this.renderPath(contentEl, file, true, pathMatch, !!pathMatch);
        }
    }
    onChooseSuggestion(sugg, evt) {
        if (sugg) {
            const { item } = sugg;
            if (isFileStarredItem(item)) {
                const { file } = sugg;
                this.navigateToLeafOrOpenFile(evt, file, `Unable to open Starred file ${file.path}`);
            }
        }
    }
    getTFileByPath(path) {
        let file = null;
        const abstractItem = this.app.vault.getAbstractFileByPath(path);
        if (isTFile(abstractItem)) {
            file = abstractItem;
        }
        return file;
    }
    getItems() {
        const itemsInfo = [];
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
                        const item = {
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
    isStarredPluginEnabled() {
        const plugin = this.getSystemStarredPlugin();
        return plugin?.enabled;
    }
    getSystemStarredPlugin() {
        return getInternalPluginById(this.app, STARRED_PLUGIN_ID);
    }
    getSystemStarredPluginInstance() {
        const starredPlugin = this.getSystemStarredPlugin();
        return starredPlugin?.instance;
    }
}

const COMMAND_PALETTE_PLUGIN_ID = 'command-palette';
class CommandHandler extends Handler {
    get commandString() {
        return this.settings?.commandListCommand;
    }
    validateCommand(inputInfo, index, filterText, _activeSuggestion, _activeLeaf) {
        inputInfo.mode = Mode.CommandList;
        const commandCmd = inputInfo.parsedCommand(Mode.CommandList);
        commandCmd.index = index;
        commandCmd.parsedInput = filterText;
        commandCmd.isValidated = true;
    }
    getSuggestions(inputInfo) {
        const suggestions = [];
        if (inputInfo) {
            inputInfo.buildSearchQuery();
            const { hasSearchTerm, prepQuery } = inputInfo.searchQuery;
            const itemsInfo = this.getItems();
            itemsInfo.forEach((item) => {
                let shouldPush = true;
                let match = null;
                if (hasSearchTerm) {
                    match = obsidian.fuzzySearch(prepQuery, item.name);
                    shouldPush = !!match;
                }
                if (shouldPush) {
                    suggestions.push({
                        type: SuggestionType.CommandList,
                        item,
                        match,
                    });
                }
            });
            if (hasSearchTerm) {
                obsidian.sortSearchResults(suggestions);
            }
        }
        return suggestions;
    }
    renderSuggestion(sugg, parentEl) {
        if (sugg) {
            this.addClassesToSuggestionContainer(parentEl, ['qsp-suggestion-command']);
            this.renderContent(parentEl, sugg.item.name, sugg.match);
        }
    }
    onChooseSuggestion(sugg) {
        if (sugg) {
            const { item } = sugg;
            this.app.commands.executeCommandById(item.id);
        }
    }
    getItems() {
        // Sort commands by their name
        const items = this.app.commands.listCommands().sort((a, b) => {
            if (a.name < b.name)
                return -1;
            if (a.name > b.name)
                return 1;
            return 0;
        });
        // Pinned commands should be at the top (if any)
        if (this.isCommandPalettePluginEnabled() &&
            this.getCommandPalettePluginInstance()?.options.pinned?.length > 0) {
            const pinnedCommandIds = this.getCommandPalettePluginInstance().options.pinned;
            // We're gonna find the pinned command in `items` and move it to the beginning
            // Therefore we need to perform "for each right"
            for (let i = pinnedCommandIds.length - 1; i >= 0; i--) {
                const commandId = pinnedCommandIds[i];
                const commandIndex = items.findIndex((c) => c.id === commandId);
                if (commandIndex > -1) {
                    const command = items[commandIndex];
                    items.splice(commandIndex, 1);
                    items.unshift(command);
                }
            }
        }
        return items;
    }
    isCommandPalettePluginEnabled() {
        const plugin = this.getCommandPalettePlugin();
        return plugin?.enabled;
    }
    getCommandPalettePlugin() {
        return getInternalPluginById(this.app, COMMAND_PALETTE_PLUGIN_ID);
    }
    getCommandPalettePluginInstance() {
        const commandPalettePlugin = this.getCommandPalettePlugin();
        return commandPalettePlugin?.instance;
    }
}

class RelatedItemsHandler extends Handler {
    get commandString() {
        return this.settings?.relatedItemsListCommand;
    }
    validateCommand(inputInfo, index, filterText, activeSuggestion, activeLeaf) {
        const sourceInfo = this.getSourceInfo(activeSuggestion, activeLeaf, index === 0);
        if (sourceInfo) {
            inputInfo.mode = Mode.RelatedItemsList;
            const cmd = inputInfo.parsedCommand(Mode.RelatedItemsList);
            cmd.source = sourceInfo;
            cmd.index = index;
            cmd.parsedInput = filterText;
            cmd.isValidated = true;
        }
    }
    getSuggestions(inputInfo) {
        const suggestions = [];
        if (inputInfo) {
            this.inputInfo = inputInfo;
            inputInfo.buildSearchQuery();
            const { hasSearchTerm, prepQuery } = inputInfo.searchQuery;
            const cmd = inputInfo.parsedCommand(Mode.RelatedItemsList);
            const items = this.getRelatedFiles(cmd.source.file);
            items.forEach((item) => {
                let shouldPush = true;
                let result = { matchType: MatchType.None, match: null };
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
                obsidian.sortSearchResults(suggestions);
            }
        }
        return suggestions;
    }
    renderSuggestion(sugg, parentEl) {
        if (sugg) {
            const { file, matchType, match } = sugg;
            const content = this.getTitleText(file);
            let contentMatch = match;
            let pathMatch = null;
            if (matchType === MatchType.ParentPath) {
                contentMatch = null;
                pathMatch = match;
            }
            this.addClassesToSuggestionContainer(parentEl, ['qsp-suggestion-related']);
            const contentEl = this.renderContent(parentEl, content, contentMatch);
            this.renderPath(contentEl, file, true, pathMatch, !!pathMatch);
        }
    }
    onChooseSuggestion(sugg, evt) {
        if (sugg) {
            const { file } = sugg;
            this.navigateToLeafOrOpenFile(evt, file, `Unable to open related file ${file.path}`);
        }
    }
    getTitleText(sourceFile) {
        return sourceFile?.basename;
    }
    getRelatedFiles(sourceFile) {
        const relatedFiles = [];
        const { excludeRelatedFolders, excludeOpenRelatedFiles } = this.settings;
        const isExcludedFolder = matcherFnForRegExList(excludeRelatedFolders);
        let nodes = [...sourceFile.parent.children];
        while (nodes.length > 0) {
            const node = nodes.pop();
            if (isTFile(node)) {
                const isSourceFile = node === sourceFile;
                const isExcluded = isSourceFile || (excludeOpenRelatedFiles && !!this.findMatchingLeaf(node).leaf);
                if (!isExcluded) {
                    relatedFiles.push(node);
                }
            }
            else if (!isExcludedFolder(node.path)) {
                nodes = nodes.concat(node.children);
            }
        }
        return relatedFiles;
    }
    reset() {
        this.inputInfo = null;
    }
    getSourceInfo(activeSuggestion, activeLeaf, isPrefixCmd) {
        const prevInputInfo = this.inputInfo;
        let prevSourceInfo = null;
        let prevMode = Mode.Standard;
        if (prevInputInfo) {
            prevSourceInfo = prevInputInfo.parsedCommand().source;
            prevMode = prevInputInfo.mode;
        }
        // figure out if the previous operation was a symbol operation
        const hasPrevSource = prevMode === Mode.RelatedItemsList && !!prevSourceInfo;
        const activeEditorInfo = this.getEditorInfo(activeLeaf);
        const activeSuggInfo = this.getSuggestionInfo(activeSuggestion);
        // Pick the source file for the operation, prioritizing
        // any pre-existing operation that was in progress
        let sourceInfo = null;
        if (hasPrevSource) {
            sourceInfo = prevSourceInfo;
        }
        else if (activeSuggInfo.isValidSource) {
            sourceInfo = activeSuggInfo;
        }
        else if (activeEditorInfo.isValidSource && isPrefixCmd) {
            sourceInfo = activeEditorInfo;
        }
        return sourceInfo;
    }
}

class StandardExHandler extends Handler {
    validateCommand(_inputInfo, _index, _filterText, _activeSuggestion, _activeLeaf) {
        throw new Error('Method not implemented.');
    }
    getSuggestions(_inputInfo) {
        throw new Error('Method not implemented.');
    }
    renderSuggestion(sugg, parentEl) {
        if (isFileSuggestion(sugg)) {
            const { file, matchType, match } = sugg;
            let contentMatch = match;
            let pathMatch = null;
            if (matchType === MatchType.ParentPath) {
                contentMatch = null;
                pathMatch = match;
            }
            this.addClassesToSuggestionContainer(parentEl, ['qsp-suggestion-file']);
            const contentEl = this.renderContent(parentEl, file.basename, contentMatch);
            this.renderPath(contentEl, file, true, pathMatch, !!pathMatch);
        }
    }
    onChooseSuggestion(sugg, evt) {
        if (sugg) {
            const { file } = sugg;
            this.navigateToLeafOrOpenFile(evt, file, `Unable to open file from SystemSuggestion ${file.path}`);
        }
    }
}

class InputInfo {
    constructor(inputText = '', mode = Mode.Standard) {
        this.inputText = inputText;
        this.mode = mode;
        const symbolListCmd = {
            ...InputInfo.defaultParsedCommand,
            source: null,
        };
        const relatedItemsListCmd = {
            ...InputInfo.defaultParsedCommand,
            source: null,
        };
        const parsedCmds = {};
        parsedCmds[Mode.SymbolList] = symbolListCmd;
        parsedCmds[Mode.Standard] = InputInfo.defaultParsedCommand;
        parsedCmds[Mode.EditorList] = InputInfo.defaultParsedCommand;
        parsedCmds[Mode.WorkspaceList] = InputInfo.defaultParsedCommand;
        parsedCmds[Mode.HeadingsList] = InputInfo.defaultParsedCommand;
        parsedCmds[Mode.StarredList] = InputInfo.defaultParsedCommand;
        parsedCmds[Mode.CommandList] = InputInfo.defaultParsedCommand;
        parsedCmds[Mode.RelatedItemsList] = relatedItemsListCmd;
        this.parsedCommands = parsedCmds;
    }
    static get defaultParsedCommand() {
        return {
            isValidated: false,
            index: -1,
            parsedInput: null,
        };
    }
    get searchQuery() {
        return this._searchQuery;
    }
    buildSearchQuery() {
        const { mode } = this;
        const input = this.parsedCommands[mode].parsedInput ?? '';
        const prepQuery = obsidian.prepareQuery(input.trim().toLowerCase());
        const hasSearchTerm = prepQuery?.query?.length > 0;
        this._searchQuery = { prepQuery, hasSearchTerm };
    }
    parsedCommand(mode) {
        mode = mode ?? this.mode;
        return this.parsedCommands[mode];
    }
}

class ModeHandler {
    constructor(app, settings, exKeymap) {
        this.app = app;
        this.settings = settings;
        this.exKeymap = exKeymap;
        // StandardExHandler one is special in that it is not a "full" handler,
        // and not attached to a mode, as a result it is not in the handlersByMode list
        const standardExHandler = new StandardExHandler(app, settings);
        const handlersByMode = new Map([
            [Mode.SymbolList, new SymbolHandler(app, settings)],
            [Mode.WorkspaceList, new WorkspaceHandler(app, settings)],
            [Mode.HeadingsList, new HeadingsHandler(app, settings)],
            [Mode.EditorList, new EditorHandler(app, settings)],
            [Mode.StarredList, new StarredHandler(app, settings)],
            [Mode.CommandList, new CommandHandler(app, settings)],
            [Mode.RelatedItemsList, new RelatedItemsHandler(app, settings)],
        ]);
        this.handlersByMode = handlersByMode;
        this.handlersByType = new Map([
            [SuggestionType.CommandList, handlersByMode.get(Mode.CommandList)],
            [SuggestionType.EditorList, handlersByMode.get(Mode.EditorList)],
            [SuggestionType.HeadingsList, handlersByMode.get(Mode.HeadingsList)],
            [SuggestionType.RelatedItemsList, handlersByMode.get(Mode.RelatedItemsList)],
            [SuggestionType.StarredList, handlersByMode.get(Mode.StarredList)],
            [SuggestionType.SymbolList, handlersByMode.get(Mode.SymbolList)],
            [SuggestionType.WorkspaceList, handlersByMode.get(Mode.WorkspaceList)],
            [SuggestionType.File, standardExHandler],
            [SuggestionType.Alias, standardExHandler],
        ]);
        this.debouncedGetSuggestions = obsidian.debounce(this.getSuggestions.bind(this), 400, true);
        this.reset();
    }
    onOpen() {
        this.exKeymap.isOpen = true;
    }
    onClose() {
        this.exKeymap.isOpen = false;
    }
    setSessionOpenMode(mode, chooser) {
        this.reset();
        chooser?.setSuggestions([]);
        if (mode !== Mode.Standard) {
            this.sessionOpenModeString = this.getHandler(mode).commandString;
        }
    }
    insertSessionOpenModeCommandString(inputEl) {
        const { sessionOpenModeString } = this;
        if (sessionOpenModeString !== null && sessionOpenModeString !== '') {
            // update UI with current command string in the case were openInMode was called
            inputEl.value = sessionOpenModeString;
            // reset to null so user input is not overridden the next time onInput is called
            this.sessionOpenModeString = null;
        }
    }
    updateSuggestions(query, chooser) {
        let handled = false;
        const { exKeymap, app: { workspace: { activeLeaf }, }, } = this;
        const activeSugg = ModeHandler.getActiveSuggestion(chooser);
        const inputInfo = this.determineRunMode(query, activeSugg, activeLeaf);
        const { mode } = inputInfo;
        exKeymap.updateKeymapForMode(mode);
        if (mode !== Mode.Standard) {
            if (mode === Mode.HeadingsList && inputInfo.parsedCommand().parsedInput?.length) {
                // if headings mode and user is typing a query, delay getting suggestions
                this.debouncedGetSuggestions(inputInfo, chooser);
            }
            else {
                this.getSuggestions(inputInfo, chooser);
            }
            handled = true;
        }
        return handled;
    }
    renderSuggestion(sugg, parentEl) {
        let handled = false;
        // in Headings mode, StandardExHandler should handle rendering for File
        // suggestions
        const useExHandler = this.inputInfo.mode === Mode.HeadingsList && isFileSuggestion(sugg);
        if (useExHandler || isExSuggestion(sugg)) {
            this.getHandler(sugg).renderSuggestion(sugg, parentEl);
            handled = true;
        }
        return handled;
    }
    onChooseSuggestion(sugg, evt) {
        let handled = false;
        // in Headings mode, StandardExHandler should handle the onChoose action for File
        // and Alias suggestion so that the preferOpenInNewPane setting can be handled properly
        const useExHandler = this.inputInfo.mode === Mode.HeadingsList && !isUnresolvedSuggestion(sugg);
        if (useExHandler || isExSuggestion(sugg)) {
            this.getHandler(sugg).onChooseSuggestion(sugg, evt);
            handled = true;
        }
        return handled;
    }
    determineRunMode(query, activeSugg, activeLeaf) {
        const input = query ?? '';
        const info = new InputInfo(input);
        if (input.length === 0) {
            this.reset();
        }
        this.validatePrefixCommands(info, activeSugg, activeLeaf);
        this.validateSourcedCommands(info, activeSugg, activeLeaf);
        return info;
    }
    getSuggestions(inputInfo, chooser) {
        this.inputInfo = inputInfo;
        const { mode } = inputInfo;
        chooser.setSuggestions([]);
        const suggestions = this.getHandler(mode).getSuggestions(inputInfo);
        chooser.setSuggestions(suggestions);
        ModeHandler.setActiveSuggestion(mode, chooser);
    }
    validatePrefixCommands(inputInfo, activeSugg, activeLeaf) {
        const { settings } = this;
        const prefixCmds = [
            settings.editorListCommand,
            settings.workspaceListCommand,
            settings.headingsListCommand,
            settings.starredListCommand,
            settings.commandListCommand,
        ]
            .map((v) => `(${escapeRegExp(v)})`)
            // account for potential overlapping command strings
            .sort((a, b) => b.length - a.length);
        // regex that matches any of the prefix commands, and extract filter text
        const match = new RegExp(`^(${prefixCmds.join('|')})(.*)$`).exec(inputInfo.inputText);
        if (match) {
            const cmdStr = match[1];
            const filterText = match[match.length - 1];
            const handler = this.getHandler(cmdStr);
            if (handler) {
                handler.validateCommand(inputInfo, match.index, filterText, activeSugg, activeLeaf);
            }
        }
    }
    validateSourcedCommands(inputInfo, activeSugg, activeLeaf) {
        const { mode, inputText } = inputInfo;
        // Standard, Headings, Starred, and EditorList mode can have an embedded command
        const supportedModes = [
            Mode.Standard,
            Mode.EditorList,
            Mode.HeadingsList,
            Mode.StarredList,
        ];
        if (supportedModes.includes(mode)) {
            const { settings } = this;
            const embeddedCmds = [settings.symbolListCommand, settings.relatedItemsListCommand]
                .map((v) => `(${escapeRegExp(v)})`)
                .sort((a, b) => b.length - a.length);
            // regex that matches any sourced command, and extract filter text
            const match = new RegExp(`(${embeddedCmds.join('|')})(.*)$`).exec(inputText);
            if (match) {
                const cmdStr = match[1];
                const filterText = match[match.length - 1];
                const handler = this.getHandler(cmdStr);
                if (handler) {
                    handler.validateCommand(inputInfo, match.index, filterText, activeSugg, activeLeaf);
                }
            }
        }
    }
    static setActiveSuggestion(mode, chooser) {
        // only symbol mode currently sets an active selection
        if (mode === Mode.SymbolList) {
            const index = chooser.values
                .filter((v) => isSymbolSuggestion(v))
                .findIndex((v) => v.item.isSelected);
            if (index !== -1) {
                chooser.setSelectedItem(index, true);
            }
        }
    }
    static getActiveSuggestion(chooser) {
        let activeSuggestion = null;
        if (chooser?.values) {
            activeSuggestion = chooser.values[chooser.selectedItem];
        }
        return activeSuggestion;
    }
    reset() {
        this.inputInfo = new InputInfo();
        this.sessionOpenModeString = null;
        this.getHandler(Mode.SymbolList).reset();
        this.getHandler(Mode.RelatedItemsList).reset();
    }
    getHandler(kind) {
        let handler;
        const { handlersByMode, handlersByType } = this;
        if (typeof kind === 'number') {
            handler = handlersByMode.get(kind);
        }
        else if (isOfType(kind, 'type')) {
            handler = handlersByType.get(kind.type);
        }
        else if (typeof kind === 'string') {
            const { settings } = this;
            const handlersByCommand = new Map([
                [settings.editorListCommand, handlersByMode.get(Mode.EditorList)],
                [settings.workspaceListCommand, handlersByMode.get(Mode.WorkspaceList)],
                [settings.headingsListCommand, handlersByMode.get(Mode.HeadingsList)],
                [settings.starredListCommand, handlersByMode.get(Mode.StarredList)],
                [settings.commandListCommand, handlersByMode.get(Mode.CommandList)],
                [settings.symbolListCommand, handlersByMode.get(Mode.SymbolList)],
                [settings.relatedItemsListCommand, handlersByMode.get(Mode.RelatedItemsList)],
            ]);
            handler = handlersByCommand.get(kind);
        }
        return handler;
    }
}

class SwitcherPlusKeymap {
    constructor(scope, chooser, modal) {
        this.scope = scope;
        this.chooser = chooser;
        this.modal = modal;
        this.standardKeysInfo = [];
        this.customKeysInfo = [];
        this.savedStandardKeysInfo = [];
        this.standardInstructionsElSelector = '.prompt-instructions';
        this.standardInstructionsElDataValue = 'standard';
        this.initKeysInfo();
        this.registerNavigationBindings(scope);
        this.addDataAttrToInstructionsEl(modal.containerEl, this.standardInstructionsElSelector, this.standardInstructionsElDataValue);
    }
    get isOpen() {
        return this._isOpen;
    }
    set isOpen(value) {
        this._isOpen = value;
    }
    initKeysInfo() {
        const customFileBasedModes = [
            Mode.EditorList,
            Mode.HeadingsList,
            Mode.RelatedItemsList,
            Mode.StarredList,
            Mode.SymbolList,
        ];
        let modKey = 'Ctrl';
        let modKeyText = 'ctrl';
        if (obsidian.Platform.isMacOS) {
            modKey = 'Meta';
            modKeyText = 'cmd';
        }
        // standard mode keys that are registered by default, and
        // should be unregistered in custom modes, then re-registered in standard mode
        const standardKeysInfo = [
            { modifiers: 'Shift', key: 'Enter' },
            { modifiers: `${modKey},Shift`, key: 'Enter' },
        ];
        // custom mode keys that should be registered, then unregistered in standard mode
        // Note: modifiers should be a comma separated string of Modifiers
        const customKeysInfo = [
            {
                modes: customFileBasedModes,
                modifiers: 'Mod',
                key: 'o',
                func: this.useSelectedItem.bind(this),
                command: `${modKeyText} o`,
                purpose: 'open in new window',
            },
            {
                isInstructionOnly: true,
                modes: customFileBasedModes,
                modifiers: null,
                key: null,
                func: null,
                command: `${modKeyText} enter`,
                purpose: 'open in new pane',
            },
            {
                isInstructionOnly: true,
                modes: [Mode.CommandList],
                modifiers: null,
                key: null,
                func: null,
                command: `↵`,
                purpose: 'execute command',
            },
            {
                isInstructionOnly: true,
                modes: [Mode.WorkspaceList],
                modifiers: null,
                key: null,
                func: null,
                command: `↵`,
                purpose: 'open workspace',
            },
        ];
        this.standardKeysInfo.push(...standardKeysInfo);
        this.customKeysInfo.push(...customKeysInfo);
    }
    registerNavigationBindings(scope) {
        const keys = [
            [['Ctrl'], 'n'],
            [['Ctrl'], 'p'],
            [['Ctrl'], 'j'],
            [['Ctrl'], 'k'],
        ];
        keys.forEach((v) => {
            scope.register(v[0], v[1], this.navigateItems.bind(this));
        });
    }
    updateKeymapForMode(mode) {
        const isStandardMode = mode === Mode.Standard;
        const { modal, scope, savedStandardKeysInfo, standardKeysInfo, customKeysInfo } = this;
        if (isStandardMode) {
            this.registerKeys(scope, savedStandardKeysInfo);
            savedStandardKeysInfo.length = 0;
            this.unregisterKeys(scope, customKeysInfo);
            this.toggleStandardInstructions(modal.containerEl, true);
        }
        else {
            const customKeymaps = customKeysInfo.filter((v) => v.modes?.includes(mode) && !v.isInstructionOnly);
            const standardKeymaps = this.unregisterKeys(scope, standardKeysInfo);
            if (standardKeymaps.length) {
                savedStandardKeysInfo.concat(standardKeymaps);
            }
            this.unregisterKeys(scope, customKeysInfo);
            this.registerKeys(scope, customKeymaps);
            this.showCustomInstructions(modal, customKeysInfo, mode);
        }
    }
    registerKeys(scope, keymaps) {
        keymaps.forEach((keymap) => {
            const modifiers = keymap.modifiers.split(',');
            scope.register(modifiers, keymap.key, keymap.func);
        });
    }
    unregisterKeys(scope, keyInfo) {
        const predicate = (keymap) => {
            return keyInfo.some((kInfo) => {
                const isMatch = kInfo.modifiers === keymap.modifiers && kInfo.key === keymap.key;
                if (isMatch) {
                    scope.unregister(keymap);
                }
                return isMatch;
            });
        };
        return scope.keys.filter(predicate);
    }
    addDataAttrToInstructionsEl(containerEl, selector, value) {
        const el = containerEl.querySelector(selector);
        el?.setAttribute('data-mode', value);
        return el;
    }
    clearCustomInstructions(containerEl) {
        const { standardInstructionsElSelector, standardInstructionsElDataValue } = this;
        const selector = `${standardInstructionsElSelector}:not([data-mode="${standardInstructionsElDataValue}"])`;
        const elements = containerEl.querySelectorAll(selector);
        elements.forEach((el) => el.remove());
    }
    toggleStandardInstructions(containerEl, shouldShow) {
        const { standardInstructionsElSelector } = this;
        let displayValue = 'none';
        if (shouldShow) {
            displayValue = '';
            this.clearCustomInstructions(containerEl);
        }
        const el = containerEl.querySelector(standardInstructionsElSelector);
        if (el) {
            el.style.display = displayValue;
        }
    }
    showCustomInstructions(modal, keymapInfo, mode) {
        const { containerEl } = modal;
        const keymaps = keymapInfo.filter((keymap) => keymap.modes?.includes(mode));
        this.toggleStandardInstructions(containerEl, false);
        this.clearCustomInstructions(containerEl);
        modal.setInstructions(keymaps);
    }
    useSelectedItem(evt, _ctx) {
        this.chooser.useSelectedItem(evt);
    }
    navigateItems(_evt, ctx) {
        const { isOpen, chooser } = this;
        if (isOpen) {
            const nextKeys = ['n', 'j'];
            let index = chooser.selectedItem;
            index = nextKeys.includes(ctx.key) ? ++index : --index;
            chooser.setSelectedItem(index, true);
        }
        return false;
    }
}

function createSwitcherPlus(app, plugin) {
    const SystemSwitcherModal = getSystemSwitcherInstance(app)
        ?.QuickSwitcherModal;
    if (!SystemSwitcherModal) {
        console.log('Switcher++: unable to extend system switcher. Plugin UI will not be loaded. Use the builtin switcher instead.');
        return null;
    }
    const SwitcherPlusModal = class extends SystemSwitcherModal {
        constructor(app, plugin) {
            super(app, plugin.options.builtInSystemOptions);
            this.plugin = plugin;
            plugin.options.shouldShowAlias = this.shouldShowAlias;
            const exKeymap = new SwitcherPlusKeymap(this.scope, this.chooser, this);
            this.exMode = new ModeHandler(app, plugin.options, exKeymap);
        }
        openInMode(mode) {
            this.exMode.setSessionOpenMode(mode, this.chooser);
            super.open();
        }
        onOpen() {
            this.exMode.onOpen();
            super.onOpen();
        }
        onClose() {
            super.onClose();
            this.exMode.onClose();
        }
        updateSuggestions() {
            const { exMode, inputEl, chooser } = this;
            exMode.insertSessionOpenModeCommandString(inputEl);
            if (!exMode.updateSuggestions(inputEl.value, chooser)) {
                super.updateSuggestions();
            }
        }
        onChooseSuggestion(item, evt) {
            if (!this.exMode.onChooseSuggestion(item, evt)) {
                super.onChooseSuggestion(item, evt);
            }
        }
        renderSuggestion(value, parentEl) {
            if (!this.exMode.renderSuggestion(value, parentEl)) {
                super.renderSuggestion(value, parentEl);
            }
        }
    };
    return new SwitcherPlusModal(app, plugin);
}

class SwitcherPlusPlugin extends obsidian.Plugin {
    async onload() {
        const options = new SwitcherPlusSettings(this);
        await options.loadSettings();
        this.options = options;
        this.addSettingTab(new SwitcherPlusSettingTab(this.app, this, options));
        this.registerCommand('switcher-plus:open', 'Open', Mode.Standard);
        this.registerCommand('switcher-plus:open-editors', 'Open in Editor Mode', Mode.EditorList);
        this.registerCommand('switcher-plus:open-symbols', 'Open in Symbol Mode', Mode.SymbolList);
        this.registerCommand('switcher-plus:open-workspaces', 'Open in Workspaces Mode', Mode.WorkspaceList);
        this.registerCommand('switcher-plus:open-headings', 'Open in Headings Mode', Mode.HeadingsList);
        this.registerCommand('switcher-plus:open-starred', 'Open in Starred Mode', Mode.StarredList);
        this.registerCommand('switcher-plus:open-commands', 'Open in Commands Mode', Mode.CommandList);
        this.registerCommand('switcher-plus:open-related-items', 'Open in Related Items Mode', Mode.RelatedItemsList);
    }
    registerCommand(id, name, mode) {
        this.addCommand({
            id,
            name,
            hotkeys: [],
            checkCallback: (checking) => {
                // modal needs to be created dynamically (same as system switcher)
                // as system options are evaluated in the modal constructor
                const modal = createSwitcherPlus(this.app, this);
                if (modal) {
                    if (!checking) {
                        modal.openInMode(mode);
                    }
                    return true;
                }
                return false;
            },
        });
    }
}

module.exports = SwitcherPlusPlugin;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWFpbi5qcyIsInNvdXJjZXMiOlsiLi4vLi4vc3JjL3R5cGVzL3NoYXJlZFR5cGVzLnRzIiwiLi4vLi4vc3JjL3V0aWxzL3V0aWxzLnRzIiwiLi4vLi4vc3JjL3V0aWxzL2Zyb250TWF0dGVyUGFyc2VyLnRzIiwiLi4vLi4vc3JjL3NldHRpbmdzL3N3aXRjaGVyUGx1c1NldHRpbmdzLnRzIiwiLi4vLi4vc3JjL3NldHRpbmdzL3NldHRpbmdzVGFiU2VjdGlvbi50cyIsIi4uLy4uL3NyYy9zZXR0aW5ncy9zdGFycmVkU2V0dGluZ3NUYWJTZWN0aW9uLnRzIiwiLi4vLi4vc3JjL3NldHRpbmdzL2NvbW1hbmRMaXN0U2V0dGluZ3NUYWJTZWN0aW9uLnRzIiwiLi4vLi4vc3JjL3NldHRpbmdzL3JlbGF0ZWRJdGVtc1NldHRpbmdzVGFiU2VjdGlvbi50cyIsIi4uLy4uL3NyYy9zZXR0aW5ncy9nZW5lcmFsU2V0dGluZ3NUYWJTZWN0aW9uLnRzIiwiLi4vLi4vc3JjL3NldHRpbmdzL3dvcmtzcGFjZVNldHRpbmdzVGFiU2VjdGlvbi50cyIsIi4uLy4uL3NyYy9zZXR0aW5ncy9lZGl0b3JTZXR0aW5nc1RhYlNlY3Rpb24udHMiLCIuLi8uLi9zcmMvc2V0dGluZ3MvaGVhZGluZ3NTZXR0aW5nc1RhYlNlY3Rpb24udHMiLCIuLi8uLi9zcmMvc2V0dGluZ3Mvc3dpdGNoZXJQbHVzU2V0dGluZ1RhYi50cyIsIi4uLy4uL3NyYy9IYW5kbGVycy9oYW5kbGVyLnRzIiwiLi4vLi4vc3JjL0hhbmRsZXJzL3dvcmtzcGFjZUhhbmRsZXIudHMiLCIuLi8uLi9zcmMvSGFuZGxlcnMvaGVhZGluZ3NIYW5kbGVyLnRzIiwiLi4vLi4vc3JjL0hhbmRsZXJzL2VkaXRvckhhbmRsZXIudHMiLCIuLi8uLi9zcmMvSGFuZGxlcnMvc3ltYm9sSGFuZGxlci50cyIsIi4uLy4uL3NyYy9IYW5kbGVycy9zdGFycmVkSGFuZGxlci50cyIsIi4uLy4uL3NyYy9IYW5kbGVycy9jb21tYW5kSGFuZGxlci50cyIsIi4uLy4uL3NyYy9IYW5kbGVycy9yZWxhdGVkSXRlbXNIYW5kbGVyLnRzIiwiLi4vLi4vc3JjL0hhbmRsZXJzL3N0YW5kYXJkRXhIYW5kbGVyLnRzIiwiLi4vLi4vc3JjL3N3aXRjaGVyUGx1cy9pbnB1dEluZm8udHMiLCIuLi8uLi9zcmMvc3dpdGNoZXJQbHVzL21vZGVIYW5kbGVyLnRzIiwiLi4vLi4vc3JjL3N3aXRjaGVyUGx1cy9zd2l0Y2hlclBsdXNLZXltYXAudHMiLCIuLi8uLi9zcmMvc3dpdGNoZXJQbHVzL3N3aXRjaGVyUGx1cy50cyIsIi4uLy4uL3NyYy9tYWluLnRzIl0sInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7XG4gIEFwcCxcbiAgQ2hvb3NlcixcbiAgRWRpdG9yUG9zaXRpb24sXG4gIEVtYmVkQ2FjaGUsXG4gIEZ1enp5TWF0Y2gsXG4gIEhlYWRpbmdDYWNoZSxcbiAgTGlua0NhY2hlLFxuICBQcmVwYXJlZFF1ZXJ5LFxuICBUYWdDYWNoZSxcbiAgVEZpbGUsXG4gIFdvcmtzcGFjZUxlYWYsXG4gIENvbW1hbmQsXG4gIFNlYXJjaFJlc3VsdCxcbn0gZnJvbSAnb2JzaWRpYW4nO1xuaW1wb3J0IHR5cGUgeyBTdWdnZXN0TW9kYWwsIFN0YXJyZWRQbHVnaW5JdGVtIH0gZnJvbSAnb2JzaWRpYW4nO1xuaW1wb3J0IHsgUGlja0tleXMsIFdyaXRhYmxlS2V5cyB9IGZyb20gJ3RzLWVzc2VudGlhbHMnO1xuXG4vLyBQaWNrIGZyb20gVCB0aGUga2V5cyB0aGF0IGFyZSB3cml0YWJsZSBhbmQgd2hvc2UgdmFsdWUgaXMgb2YgdHlwZSBLXG5leHBvcnQgdHlwZSBXcml0YWJsZUtleXNXaXRoVmFsdWVPZlR5cGU8VCwgSz4gPSBQaWNrS2V5czxQaWNrPFQsIFdyaXRhYmxlS2V5czxUPj4sIEs+O1xuXG5leHBvcnQgZW51bSBFZGl0b3JOYXZpZ2F0aW9uVHlwZSB7XG4gIFJldXNlRXhpc3RpbmdMZWFmID0gMSxcbiAgTmV3TGVhZixcbiAgUG9wb3V0TGVhZixcbn1cblxuZXhwb3J0IGVudW0gUGF0aERpc3BsYXlGb3JtYXQge1xuICBOb25lLFxuICBGdWxsLFxuICBGb2xkZXJPbmx5LFxuICBGb2xkZXJXaXRoRmlsZW5hbWUsXG4gIEZvbGRlclBhdGhGaWxlbmFtZU9wdGlvbmFsLFxufVxuXG5leHBvcnQgZW51bSBNb2RlIHtcbiAgU3RhbmRhcmQgPSAxLFxuICBFZGl0b3JMaXN0ID0gMixcbiAgU3ltYm9sTGlzdCA9IDQsXG4gIFdvcmtzcGFjZUxpc3QgPSA4LFxuICBIZWFkaW5nc0xpc3QgPSAxNixcbiAgU3RhcnJlZExpc3QgPSAzMixcbiAgQ29tbWFuZExpc3QgPSA2NCxcbiAgUmVsYXRlZEl0ZW1zTGlzdCA9IDEyOCxcbn1cblxuZXhwb3J0IGVudW0gU3ltYm9sVHlwZSB7XG4gIExpbmsgPSAxLFxuICBFbWJlZCA9IDIsXG4gIFRhZyA9IDQsXG4gIEhlYWRpbmcgPSA4LFxufVxuXG5leHBvcnQgZW51bSBMaW5rVHlwZSB7XG4gIE5vbmUgPSAwLFxuICBOb3JtYWwgPSAxLFxuICBIZWFkaW5nID0gMixcbiAgQmxvY2sgPSA0LFxufVxuXG50eXBlIEFsbFN5bWJvbHMgPSB7XG4gIFt0eXBlIGluIFN5bWJvbFR5cGVdOiBzdHJpbmc7XG59O1xuXG5leHBvcnQgY29uc3QgU3ltYm9sSW5kaWNhdG9yczogUGFydGlhbDxBbGxTeW1ib2xzPiA9IHt9O1xuU3ltYm9sSW5kaWNhdG9yc1tTeW1ib2xUeXBlLkxpbmtdID0gJ/CflJcnO1xuU3ltYm9sSW5kaWNhdG9yc1tTeW1ib2xUeXBlLkVtYmVkXSA9ICchJztcblN5bWJvbEluZGljYXRvcnNbU3ltYm9sVHlwZS5UYWddID0gJyMnO1xuU3ltYm9sSW5kaWNhdG9yc1tTeW1ib2xUeXBlLkhlYWRpbmddID0gJ0gnO1xuXG5pbnRlcmZhY2UgSGVhZGluZ0xldmVsSW5kaWNhdG9ycyB7XG4gIFtsZXZlbDogbnVtYmVyXTogc3RyaW5nO1xufVxuXG5leHBvcnQgY29uc3QgSGVhZGluZ0luZGljYXRvcnM6IFBhcnRpYWw8SGVhZGluZ0xldmVsSW5kaWNhdG9ycz4gPSB7fTtcbkhlYWRpbmdJbmRpY2F0b3JzWzFdID0gJ0jigoEnO1xuSGVhZGluZ0luZGljYXRvcnNbMl0gPSAnSOKCgic7XG5IZWFkaW5nSW5kaWNhdG9yc1szXSA9ICdI4oKDJztcbkhlYWRpbmdJbmRpY2F0b3JzWzRdID0gJ0jigoQnO1xuSGVhZGluZ0luZGljYXRvcnNbNV0gPSAnSOKChSc7XG5IZWFkaW5nSW5kaWNhdG9yc1s2XSA9ICdI4oKGJztcblxuZXhwb3J0IGRlY2xhcmUgY2xhc3MgU3lzdGVtU3dpdGNoZXIgZXh0ZW5kcyBTdWdnZXN0TW9kYWw8QW55U3VnZ2VzdGlvbj4ge1xuICBzaG91bGRTaG93QWxpYXM6IGJvb2xlYW47XG4gIHByb3RlY3RlZCBpc09wZW46IGJvb2xlYW47XG4gIHByb3RlY3RlZCBjaG9vc2VyOiBDaG9vc2VyPEFueVN1Z2dlc3Rpb24+O1xuICBjb25zdHJ1Y3RvcihhcHA6IEFwcCk7XG4gIHByb3RlY3RlZCBvbklucHV0KCk6IHZvaWQ7XG4gIHByb3RlY3RlZCB1cGRhdGVTdWdnZXN0aW9ucygpOiB2b2lkO1xuICBnZXRTdWdnZXN0aW9ucyhxdWVyeTogc3RyaW5nKTogQW55U3VnZ2VzdGlvbltdO1xuICByZW5kZXJTdWdnZXN0aW9uKHZhbHVlOiBBbnlTdWdnZXN0aW9uLCBlbDogSFRNTEVsZW1lbnQpOiB2b2lkO1xuICBvbkNob29zZVN1Z2dlc3Rpb24oaXRlbTogQW55U3VnZ2VzdGlvbiwgZXZ0OiBNb3VzZUV2ZW50IHwgS2V5Ym9hcmRFdmVudCk6IHZvaWQ7XG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgU3dpdGNoZXJQbHVzIGV4dGVuZHMgU3lzdGVtU3dpdGNoZXIge1xuICBvcGVuSW5Nb2RlKG1vZGU6IE1vZGUpOiB2b2lkO1xufVxuXG5leHBvcnQgdHlwZSBBbnlTeW1ib2xJbmZvUGF5bG9hZCA9IExpbmtDYWNoZSB8IEVtYmVkQ2FjaGUgfCBUYWdDYWNoZSB8IEhlYWRpbmdDYWNoZTtcbmV4cG9ydCBpbnRlcmZhY2UgU3ltYm9sSW5mbyB7XG4gIHR5cGU6ICdzeW1ib2xJbmZvJztcbiAgc3ltYm9sOiBBbnlTeW1ib2xJbmZvUGF5bG9hZDtcbiAgc3ltYm9sVHlwZTogU3ltYm9sVHlwZTtcbiAgaW5kZW50TGV2ZWw/OiBudW1iZXI7XG4gIGlzU2VsZWN0ZWQ/OiBib29sZWFuO1xufVxuXG5leHBvcnQgaW50ZXJmYWNlIFdvcmtzcGFjZUluZm8ge1xuICB0eXBlOiAnd29ya3NwYWNlSW5mbyc7XG4gIGlkOiBzdHJpbmc7XG59XG5cbmV4cG9ydCBlbnVtIFN1Z2dlc3Rpb25UeXBlIHtcbiAgRWRpdG9yTGlzdCA9ICdlZGl0b3JMaXN0JyxcbiAgU3ltYm9sTGlzdCA9ICdzeW1ib2xMaXN0JyxcbiAgV29ya3NwYWNlTGlzdCA9ICd3b3Jrc3BhY2VMaXN0JyxcbiAgSGVhZGluZ3NMaXN0ID0gJ2hlYWRpbmdzTGlzdCcsXG4gIFN0YXJyZWRMaXN0ID0gJ3N0YXJyZWRMaXN0JyxcbiAgQ29tbWFuZExpc3QgPSAnY29tbWFuZExpc3QnLFxuICBSZWxhdGVkSXRlbXNMaXN0ID0gJ3JlbGF0ZWRJdGVtc0xpc3QnLFxuICBGaWxlID0gJ2ZpbGUnLFxuICBBbGlhcyA9ICdhbGlhcycsXG4gIFVucmVzb2x2ZWQgPSAndW5yZXNvbHZlZCcsXG59XG5cbmV4cG9ydCBlbnVtIE1hdGNoVHlwZSB7XG4gIE5vbmUgPSAwLFxuICBQcmltYXJ5LFxuICBCYXNlbmFtZSxcbiAgUGFyZW50UGF0aCxcbn1cblxuZXhwb3J0IGludGVyZmFjZSBTdWdnZXN0aW9uPFQ+IGV4dGVuZHMgRnV6enlNYXRjaDxUPiB7XG4gIHR5cGU6IFN1Z2dlc3Rpb25UeXBlO1xuICBmaWxlOiBURmlsZTtcbiAgLy8gT2JzaWRpYW4gY3JlYXRlZCBzdWdnZXN0aW9ucyB3b24ndCBoYXZlIHRoZXNlIHByb3BzXG4gIG1hdGNoVHlwZT86IE1hdGNoVHlwZTtcbiAgbWF0Y2hUZXh0Pzogc3RyaW5nO1xufVxuXG5leHBvcnQgaW50ZXJmYWNlIFN5bWJvbFN1Z2dlc3Rpb24gZXh0ZW5kcyBTdWdnZXN0aW9uPFN5bWJvbEluZm8+IHtcbiAgdHlwZTogU3VnZ2VzdGlvblR5cGUuU3ltYm9sTGlzdDtcbn1cblxuZXhwb3J0IGludGVyZmFjZSBFZGl0b3JTdWdnZXN0aW9uIGV4dGVuZHMgU3VnZ2VzdGlvbjxXb3Jrc3BhY2VMZWFmPiB7XG4gIHR5cGU6IFN1Z2dlc3Rpb25UeXBlLkVkaXRvckxpc3Q7XG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgV29ya3NwYWNlU3VnZ2VzdGlvbiBleHRlbmRzIE9taXQ8U3VnZ2VzdGlvbjxXb3Jrc3BhY2VJbmZvPiwgJ2ZpbGUnPiB7XG4gIHR5cGU6IFN1Z2dlc3Rpb25UeXBlLldvcmtzcGFjZUxpc3Q7XG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgSGVhZGluZ1N1Z2dlc3Rpb24gZXh0ZW5kcyBTdWdnZXN0aW9uPEhlYWRpbmdDYWNoZT4ge1xuICBkb3ducmFua2VkPzogYm9vbGVhbjtcbiAgdHlwZTogU3VnZ2VzdGlvblR5cGUuSGVhZGluZ3NMaXN0O1xufVxuXG5leHBvcnQgaW50ZXJmYWNlIFN0YXJyZWRTdWdnZXN0aW9uIGV4dGVuZHMgU3VnZ2VzdGlvbjxTdGFycmVkUGx1Z2luSXRlbT4ge1xuICB0eXBlOiBTdWdnZXN0aW9uVHlwZS5TdGFycmVkTGlzdDtcbn1cblxuZXhwb3J0IGludGVyZmFjZSBSZWxhdGVkSXRlbXNTdWdnZXN0aW9uIGV4dGVuZHMgT21pdDxTdWdnZXN0aW9uPFRGaWxlPiwgJ2l0ZW0nPiB7XG4gIHR5cGU6IFN1Z2dlc3Rpb25UeXBlLlJlbGF0ZWRJdGVtc0xpc3Q7XG4gIHJlbGF0aW9uVHlwZTogJ2Rpc2tMb2NhdGlvbic7XG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgRmlsZVN1Z2dlc3Rpb24gZXh0ZW5kcyBPbWl0PFN1Z2dlc3Rpb248VEZpbGU+LCAnaXRlbSc+IHtcbiAgZG93bnJhbmtlZD86IGJvb2xlYW47XG4gIHR5cGU6IFN1Z2dlc3Rpb25UeXBlLkZpbGU7XG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgQWxpYXNTdWdnZXN0aW9uIGV4dGVuZHMgT21pdDxTdWdnZXN0aW9uPFRGaWxlPiwgJ2l0ZW0nPiB7XG4gIGFsaWFzOiBzdHJpbmc7XG4gIHR5cGU6IFN1Z2dlc3Rpb25UeXBlLkFsaWFzO1xuICBkb3ducmFua2VkPzogYm9vbGVhbjtcbn1cblxuZXhwb3J0IGludGVyZmFjZSBVbnJlc29sdmVkU3VnZ2VzdGlvbiBleHRlbmRzIE9taXQ8U3VnZ2VzdGlvbjxzdHJpbmc+LCAnaXRlbScgfCAnZmlsZSc+IHtcbiAgbGlua3RleHQ6IHN0cmluZztcbiAgdHlwZTogU3VnZ2VzdGlvblR5cGUuVW5yZXNvbHZlZDtcbn1cblxuZXhwb3J0IGludGVyZmFjZSBDb21tYW5kU3VnZ2VzdGlvbiBleHRlbmRzIE9taXQ8U3VnZ2VzdGlvbjxDb21tYW5kPiwgJ2ZpbGUnPiB7XG4gIHR5cGU6IFN1Z2dlc3Rpb25UeXBlLkNvbW1hbmRMaXN0O1xufVxuXG5leHBvcnQgdHlwZSBBbnlFeFN1Z2dlc3Rpb25QYXlsb2FkID0gV29ya3NwYWNlTGVhZiB8IFN5bWJvbEluZm8gfCBXb3Jrc3BhY2VJbmZvO1xuXG5leHBvcnQgdHlwZSBBbnlFeFN1Z2dlc3Rpb24gPVxuICB8IFN5bWJvbFN1Z2dlc3Rpb25cbiAgfCBFZGl0b3JTdWdnZXN0aW9uXG4gIHwgV29ya3NwYWNlU3VnZ2VzdGlvblxuICB8IEhlYWRpbmdTdWdnZXN0aW9uXG4gIHwgU3RhcnJlZFN1Z2dlc3Rpb25cbiAgfCBDb21tYW5kU3VnZ2VzdGlvblxuICB8IFJlbGF0ZWRJdGVtc1N1Z2dlc3Rpb247XG5cbmV4cG9ydCB0eXBlIEFueVN5c3RlbVN1Z2dlc3Rpb24gPSBGaWxlU3VnZ2VzdGlvbiB8IEFsaWFzU3VnZ2VzdGlvbiB8IFVucmVzb2x2ZWRTdWdnZXN0aW9uO1xuXG5leHBvcnQgdHlwZSBBbnlTdWdnZXN0aW9uID0gQW55RXhTdWdnZXN0aW9uIHwgQW55U3lzdGVtU3VnZ2VzdGlvbjtcblxuZXhwb3J0IGludGVyZmFjZSBTb3VyY2VJbmZvIHtcbiAgZmlsZTogVEZpbGU7XG4gIGxlYWY6IFdvcmtzcGFjZUxlYWY7XG4gIHN1Z2dlc3Rpb246IEFueVN1Z2dlc3Rpb247XG4gIGlzVmFsaWRTb3VyY2U6IGJvb2xlYW47XG4gIGN1cnNvcj86IEVkaXRvclBvc2l0aW9uO1xufVxuXG5leHBvcnQgaW50ZXJmYWNlIFNldHRpbmdzRGF0YSB7XG4gIG9uT3BlblByZWZlck5ld1BhbmU6IGJvb2xlYW47XG4gIGFsd2F5c05ld1BhbmVGb3JTeW1ib2xzOiBib29sZWFuO1xuICB1c2VBY3RpdmVQYW5lRm9yU3ltYm9sc09uTW9iaWxlOiBib29sZWFuO1xuICBzeW1ib2xzSW5MaW5lT3JkZXI6IGJvb2xlYW47XG4gIGVkaXRvckxpc3RDb21tYW5kOiBzdHJpbmc7XG4gIHN5bWJvbExpc3RDb21tYW5kOiBzdHJpbmc7XG4gIHdvcmtzcGFjZUxpc3RDb21tYW5kOiBzdHJpbmc7XG4gIGhlYWRpbmdzTGlzdENvbW1hbmQ6IHN0cmluZztcbiAgc3RhcnJlZExpc3RDb21tYW5kOiBzdHJpbmc7XG4gIGNvbW1hbmRMaXN0Q29tbWFuZDogc3RyaW5nO1xuICByZWxhdGVkSXRlbXNMaXN0Q29tbWFuZDogc3RyaW5nO1xuICBzdHJpY3RIZWFkaW5nc09ubHk6IGJvb2xlYW47XG4gIHNlYXJjaEFsbEhlYWRpbmdzOiBib29sZWFuO1xuICBleGNsdWRlVmlld1R5cGVzOiBBcnJheTxzdHJpbmc+O1xuICByZWZlcmVuY2VWaWV3czogQXJyYXk8c3RyaW5nPjtcbiAgbGltaXQ6IG51bWJlcjtcbiAgaW5jbHVkZVNpZGVQYW5lbFZpZXdUeXBlczogQXJyYXk8c3RyaW5nPjtcbiAgZW5hYmxlZFN5bWJvbFR5cGVzOiBSZWNvcmQ8U3ltYm9sVHlwZSwgYm9vbGVhbj47XG4gIHNlbGVjdE5lYXJlc3RIZWFkaW5nOiBib29sZWFuO1xuICBleGNsdWRlRm9sZGVyczogQXJyYXk8c3RyaW5nPjtcbiAgZXhjbHVkZUxpbmtTdWJUeXBlczogbnVtYmVyO1xuICBleGNsdWRlUmVsYXRlZEZvbGRlcnM6IEFycmF5PHN0cmluZz47XG4gIGV4Y2x1ZGVPcGVuUmVsYXRlZEZpbGVzOiBib29sZWFuO1xuICBleGNsdWRlT2JzaWRpYW5JZ25vcmVkRmlsZXM6IGJvb2xlYW47XG4gIHNob3VsZFNlYXJjaEZpbGVuYW1lczogYm9vbGVhbjtcbiAgcGF0aERpc3BsYXlGb3JtYXQ6IFBhdGhEaXNwbGF5Rm9ybWF0O1xuICBoaWRlUGF0aElmUm9vdDogYm9vbGVhbjtcbn1cblxuZXhwb3J0IGludGVyZmFjZSBTZWFyY2hRdWVyeSB7XG4gIGhhc1NlYXJjaFRlcm06IGJvb2xlYW47XG4gIHByZXBRdWVyeTogUHJlcGFyZWRRdWVyeTtcbn1cblxuZXhwb3J0IGludGVyZmFjZSBTZWFyY2hSZXN1bHRXaXRoRmFsbGJhY2sge1xuICBtYXRjaFR5cGU6IE1hdGNoVHlwZTtcbiAgbWF0Y2g6IFNlYXJjaFJlc3VsdDtcbiAgbWF0Y2hUZXh0Pzogc3RyaW5nO1xufVxuIiwiaW1wb3J0IHtcbiAgQXBwLFxuICBIZWFkaW5nQ2FjaGUsXG4gIEluc3RhbGxlZFBsdWdpbixcbiAgTGlua0NhY2hlLFxuICBRdWlja1N3aXRjaGVyUGx1Z2luSW5zdGFuY2UsXG4gIEZpbGVTdGFycmVkSXRlbSxcbiAgVGFnQ2FjaGUsXG4gIFRGaWxlLFxufSBmcm9tICdvYnNpZGlhbic7XG5pbXBvcnQge1xuICBTeW1ib2xTdWdnZXN0aW9uLFxuICBFZGl0b3JTdWdnZXN0aW9uLFxuICBGaWxlU3VnZ2VzdGlvbixcbiAgQWxpYXNTdWdnZXN0aW9uLFxuICBVbnJlc29sdmVkU3VnZ2VzdGlvbixcbiAgQW55U3lzdGVtU3VnZ2VzdGlvbixcbiAgV29ya3NwYWNlU3VnZ2VzdGlvbixcbiAgSGVhZGluZ1N1Z2dlc3Rpb24sXG4gIEFueVN1Z2dlc3Rpb24sXG4gIEFueUV4U3VnZ2VzdGlvbixcbiAgTGlua1R5cGUsXG4gIENvbW1hbmRTdWdnZXN0aW9uLFxuICBTdWdnZXN0aW9uVHlwZSxcbn0gZnJvbSAnc3JjL3R5cGVzJztcblxuZXhwb3J0IGZ1bmN0aW9uIGlzT2ZUeXBlPFQ+KFxuICBvYmo6IHVua25vd24sXG4gIGRpc2NyaW1pbmF0b3I6IGtleW9mIFQsXG4gIHZhbD86IHVua25vd24sXG4pOiBvYmogaXMgVCB7XG4gIGxldCByZXQgPSBmYWxzZTtcblxuICBpZiAob2JqICYmIChvYmogYXMgVClbZGlzY3JpbWluYXRvcl0gIT09IHVuZGVmaW5lZCkge1xuICAgIHJldCA9IHRydWU7XG4gICAgaWYgKHZhbCAhPT0gdW5kZWZpbmVkICYmIHZhbCAhPT0gb2JqW2Rpc2NyaW1pbmF0b3JdKSB7XG4gICAgICByZXQgPSBmYWxzZTtcbiAgICB9XG4gIH1cblxuICByZXR1cm4gcmV0O1xufVxuXG5leHBvcnQgZnVuY3Rpb24gaXNTeW1ib2xTdWdnZXN0aW9uKG9iajogdW5rbm93bik6IG9iaiBpcyBTeW1ib2xTdWdnZXN0aW9uIHtcbiAgcmV0dXJuIGlzT2ZUeXBlPFN5bWJvbFN1Z2dlc3Rpb24+KG9iaiwgJ3R5cGUnLCBTdWdnZXN0aW9uVHlwZS5TeW1ib2xMaXN0KTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGlzRWRpdG9yU3VnZ2VzdGlvbihvYmo6IHVua25vd24pOiBvYmogaXMgRWRpdG9yU3VnZ2VzdGlvbiB7XG4gIHJldHVybiBpc09mVHlwZTxFZGl0b3JTdWdnZXN0aW9uPihvYmosICd0eXBlJywgU3VnZ2VzdGlvblR5cGUuRWRpdG9yTGlzdCk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBpc1dvcmtzcGFjZVN1Z2dlc3Rpb24ob2JqOiB1bmtub3duKTogb2JqIGlzIFdvcmtzcGFjZVN1Z2dlc3Rpb24ge1xuICByZXR1cm4gaXNPZlR5cGU8V29ya3NwYWNlU3VnZ2VzdGlvbj4ob2JqLCAndHlwZScsIFN1Z2dlc3Rpb25UeXBlLldvcmtzcGFjZUxpc3QpO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gaXNIZWFkaW5nU3VnZ2VzdGlvbihvYmo6IHVua25vd24pOiBvYmogaXMgSGVhZGluZ1N1Z2dlc3Rpb24ge1xuICByZXR1cm4gaXNPZlR5cGU8SGVhZGluZ1N1Z2dlc3Rpb24+KG9iaiwgJ3R5cGUnLCBTdWdnZXN0aW9uVHlwZS5IZWFkaW5nc0xpc3QpO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gaXNDb21tYW5kU3VnZ2VzdGlvbihvYmo6IHVua25vd24pOiBvYmogaXMgQ29tbWFuZFN1Z2dlc3Rpb24ge1xuICByZXR1cm4gaXNPZlR5cGU8Q29tbWFuZFN1Z2dlc3Rpb24+KG9iaiwgJ3R5cGUnLCBTdWdnZXN0aW9uVHlwZS5Db21tYW5kTGlzdCk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBpc0ZpbGVTdWdnZXN0aW9uKG9iajogdW5rbm93bik6IG9iaiBpcyBGaWxlU3VnZ2VzdGlvbiB7XG4gIHJldHVybiBpc09mVHlwZTxGaWxlU3VnZ2VzdGlvbj4ob2JqLCAndHlwZScsIFN1Z2dlc3Rpb25UeXBlLkZpbGUpO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gaXNBbGlhc1N1Z2dlc3Rpb24ob2JqOiB1bmtub3duKTogb2JqIGlzIEFsaWFzU3VnZ2VzdGlvbiB7XG4gIHJldHVybiBpc09mVHlwZTxBbGlhc1N1Z2dlc3Rpb24+KG9iaiwgJ3R5cGUnLCBTdWdnZXN0aW9uVHlwZS5BbGlhcyk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBpc1VucmVzb2x2ZWRTdWdnZXN0aW9uKG9iajogdW5rbm93bik6IG9iaiBpcyBVbnJlc29sdmVkU3VnZ2VzdGlvbiB7XG4gIHJldHVybiBpc09mVHlwZTxVbnJlc29sdmVkU3VnZ2VzdGlvbj4ob2JqLCAndHlwZScsIFN1Z2dlc3Rpb25UeXBlLlVucmVzb2x2ZWQpO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gaXNTeXN0ZW1TdWdnZXN0aW9uKG9iajogdW5rbm93bik6IG9iaiBpcyBBbnlTeXN0ZW1TdWdnZXN0aW9uIHtcbiAgcmV0dXJuIGlzRmlsZVN1Z2dlc3Rpb24ob2JqKSB8fCBpc1VucmVzb2x2ZWRTdWdnZXN0aW9uKG9iaikgfHwgaXNBbGlhc1N1Z2dlc3Rpb24ob2JqKTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGlzRXhTdWdnZXN0aW9uKHN1Z2c6IEFueVN1Z2dlc3Rpb24pOiBzdWdnIGlzIEFueUV4U3VnZ2VzdGlvbiB7XG4gIHJldHVybiBzdWdnICYmICFpc1N5c3RlbVN1Z2dlc3Rpb24oc3VnZyk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBpc0hlYWRpbmdDYWNoZShvYmo6IHVua25vd24pOiBvYmogaXMgSGVhZGluZ0NhY2hlIHtcbiAgcmV0dXJuIGlzT2ZUeXBlPEhlYWRpbmdDYWNoZT4ob2JqLCAnbGV2ZWwnKTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGlzVGFnQ2FjaGUob2JqOiB1bmtub3duKTogb2JqIGlzIFRhZ0NhY2hlIHtcbiAgcmV0dXJuIGlzT2ZUeXBlPFRhZ0NhY2hlPihvYmosICd0YWcnKTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGlzVEZpbGUob2JqOiB1bmtub3duKTogb2JqIGlzIFRGaWxlIHtcbiAgcmV0dXJuIGlzT2ZUeXBlPFRGaWxlPihvYmosICdleHRlbnNpb24nKTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGlzRmlsZVN0YXJyZWRJdGVtKG9iajogdW5rbm93bik6IG9iaiBpcyBGaWxlU3RhcnJlZEl0ZW0ge1xuICByZXR1cm4gaXNPZlR5cGU8RmlsZVN0YXJyZWRJdGVtPihvYmosICd0eXBlJywgJ2ZpbGUnKTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGVzY2FwZVJlZ0V4cChzdHI6IHN0cmluZyk6IHN0cmluZyB7XG4gIHJldHVybiBzdHIucmVwbGFjZSgvWy4qKz9eJHt9KCl8W1xcXVxcXFxdL2csICdcXFxcJCYnKTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGdldEludGVybmFsUGx1Z2luQnlJZChhcHA6IEFwcCwgaWQ6IHN0cmluZyk6IEluc3RhbGxlZFBsdWdpbiB7XG4gIHJldHVybiBhcHA/LmludGVybmFsUGx1Z2lucz8uZ2V0UGx1Z2luQnlJZChpZCk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBnZXRTeXN0ZW1Td2l0Y2hlckluc3RhbmNlKGFwcDogQXBwKTogUXVpY2tTd2l0Y2hlclBsdWdpbkluc3RhbmNlIHtcbiAgY29uc3QgcGx1Z2luID0gZ2V0SW50ZXJuYWxQbHVnaW5CeUlkKGFwcCwgJ3N3aXRjaGVyJyk7XG4gIHJldHVybiBwbHVnaW4/Lmluc3RhbmNlIGFzIFF1aWNrU3dpdGNoZXJQbHVnaW5JbnN0YW5jZTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHN0cmlwTURFeHRlbnNpb25Gcm9tUGF0aChmaWxlOiBURmlsZSk6IHN0cmluZyB7XG4gIGxldCByZXRWYWw6IHN0cmluZyA9IG51bGw7XG5cbiAgaWYgKGZpbGUpIHtcbiAgICBjb25zdCB7IHBhdGggfSA9IGZpbGU7XG4gICAgcmV0VmFsID0gcGF0aDtcblxuICAgIGlmIChmaWxlLmV4dGVuc2lvbiA9PT0gJ21kJykge1xuICAgICAgY29uc3QgaW5kZXggPSBwYXRoLmxhc3RJbmRleE9mKCcuJyk7XG5cbiAgICAgIGlmIChpbmRleCAhPT0gLTEgJiYgaW5kZXggIT09IHBhdGgubGVuZ3RoIC0gMSAmJiBpbmRleCAhPT0gMCkge1xuICAgICAgICByZXRWYWwgPSBwYXRoLnNsaWNlKDAsIGluZGV4KTtcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICByZXR1cm4gcmV0VmFsO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gZmlsZW5hbWVGcm9tUGF0aChwYXRoOiBzdHJpbmcpOiBzdHJpbmcge1xuICBsZXQgcmV0VmFsID0gbnVsbDtcblxuICBpZiAocGF0aCkge1xuICAgIGNvbnN0IGluZGV4ID0gcGF0aC5sYXN0SW5kZXhPZignLycpO1xuICAgIHJldFZhbCA9IGluZGV4ID09PSAtMSA/IHBhdGggOiBwYXRoLnNsaWNlKGluZGV4ICsgMSk7XG4gIH1cblxuICByZXR1cm4gcmV0VmFsO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gbWF0Y2hlckZuRm9yUmVnRXhMaXN0KFxuICByZWdFeFN0cmluZ3M6IHN0cmluZ1tdLFxuKTogKGlucHV0OiBzdHJpbmcpID0+IGJvb2xlYW4ge1xuICByZWdFeFN0cmluZ3MgPSByZWdFeFN0cmluZ3MgPz8gW107XG4gIGNvbnN0IHJlZ0V4TGlzdDogUmVnRXhwW10gPSBbXTtcblxuICBmb3IgKGNvbnN0IHN0ciBvZiByZWdFeFN0cmluZ3MpIHtcbiAgICB0cnkge1xuICAgICAgY29uc3QgcnggPSBuZXcgUmVnRXhwKHN0cik7XG4gICAgICByZWdFeExpc3QucHVzaChyeCk7XG4gICAgfSBjYXRjaCAoZXJyKSB7XG4gICAgICBjb25zb2xlLmxvZyhgU3dpdGNoZXIrKzogZXJyb3IgY3JlYXRpbmcgUmVnRXhwIGZyb20gc3RyaW5nOiAke3N0cn1gLCBlcnIpO1xuICAgIH1cbiAgfVxuXG4gIGNvbnN0IGlzTWF0Y2hGbjogKGlucHV0OiBzdHJpbmcpID0+IGJvb2xlYW4gPSAoaW5wdXQpID0+IHtcbiAgICBmb3IgKGNvbnN0IHJ4IG9mIHJlZ0V4TGlzdCkge1xuICAgICAgaWYgKHJ4LnRlc3QoaW5wdXQpKSB7XG4gICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgfVxuICAgIH1cblxuICAgIHJldHVybiBmYWxzZTtcbiAgfTtcblxuICByZXR1cm4gaXNNYXRjaEZuO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gZ2V0TGlua1R5cGUobGlua0NhY2hlOiBMaW5rQ2FjaGUpOiBMaW5rVHlwZSB7XG4gIGxldCB0eXBlID0gTGlua1R5cGUuTm9uZTtcblxuICBpZiAobGlua0NhY2hlKSB7XG4gICAgLy8gcmVtb3ZlIHRoZSBkaXNwbGF5IHRleHQgYmVmb3JlIHRyeWluZyB0byBwYXJzZSB0aGUgbGluayB0YXJnZXRcbiAgICBjb25zdCBsaW5rU3RyID0gbGlua0NhY2hlLmxpbmsuc3BsaXQoJ3wnKVswXTtcblxuICAgIGlmIChsaW5rU3RyLmluY2x1ZGVzKCcjXicpKSB7XG4gICAgICB0eXBlID0gTGlua1R5cGUuQmxvY2s7XG4gICAgfSBlbHNlIGlmIChsaW5rU3RyLmluY2x1ZGVzKCcjJykpIHtcbiAgICAgIHR5cGUgPSBMaW5rVHlwZS5IZWFkaW5nO1xuICAgIH0gZWxzZSB7XG4gICAgICB0eXBlID0gTGlua1R5cGUuTm9ybWFsO1xuICAgIH1cbiAgfVxuXG4gIHJldHVybiB0eXBlO1xufVxuIiwiaW1wb3J0IHsgRnJvbnRNYXR0ZXJDYWNoZSB9IGZyb20gJ29ic2lkaWFuJztcblxuZXhwb3J0IGNsYXNzIEZyb250TWF0dGVyUGFyc2VyIHtcbiAgc3RhdGljIGdldEFsaWFzZXMoZnJvbnRNYXR0ZXI6IEZyb250TWF0dGVyQ2FjaGUpOiBzdHJpbmdbXSB7XG4gICAgbGV0IGFsaWFzZXM6IHN0cmluZ1tdID0gW107XG5cbiAgICBpZiAoZnJvbnRNYXR0ZXIpIHtcbiAgICAgIGFsaWFzZXMgPSBGcm9udE1hdHRlclBhcnNlci5nZXRWYWx1ZUZvcktleShmcm9udE1hdHRlciwgL15hbGlhcyhlcyk/JC9pKTtcbiAgICB9XG5cbiAgICByZXR1cm4gYWxpYXNlcztcbiAgfVxuXG4gIHByaXZhdGUgc3RhdGljIGdldFZhbHVlRm9yS2V5KFxuICAgIGZyb250TWF0dGVyOiBGcm9udE1hdHRlckNhY2hlLFxuICAgIGtleVBhdHRlcm46IFJlZ0V4cCxcbiAgKTogc3RyaW5nW10ge1xuICAgIGNvbnN0IHJldFZhbDogc3RyaW5nW10gPSBbXTtcbiAgICBjb25zdCBmbUtleXMgPSBPYmplY3Qua2V5cyhmcm9udE1hdHRlcik7XG4gICAgY29uc3Qga2V5ID0gZm1LZXlzLmZpbmQoKHZhbCkgPT4ga2V5UGF0dGVybi50ZXN0KHZhbCkpO1xuXG4gICAgaWYgKGtleSkge1xuICAgICAgLy8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIEB0eXBlc2NyaXB0LWVzbGludC9uby11bnNhZmUtYXNzaWdubWVudFxuICAgICAgbGV0IHZhbHVlID0gZnJvbnRNYXR0ZXJba2V5XTtcblxuICAgICAgaWYgKHR5cGVvZiB2YWx1ZSA9PT0gJ3N0cmluZycpIHtcbiAgICAgICAgdmFsdWUgPSB2YWx1ZS5zcGxpdCgnLCcpO1xuICAgICAgfVxuXG4gICAgICBpZiAoQXJyYXkuaXNBcnJheSh2YWx1ZSkpIHtcbiAgICAgICAgdmFsdWUuZm9yRWFjaCgodmFsKSA9PiB7XG4gICAgICAgICAgaWYgKHR5cGVvZiB2YWwgPT09ICdzdHJpbmcnKSB7XG4gICAgICAgICAgICByZXRWYWwucHVzaCh2YWwudHJpbSgpKTtcbiAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgICAgfVxuICAgIH1cblxuICAgIHJldHVybiByZXRWYWw7XG4gIH1cbn1cbiIsImltcG9ydCB7IFBhdGhEaXNwbGF5Rm9ybWF0LCBTZXR0aW5nc0RhdGEsIFN5bWJvbFR5cGUgfSBmcm9tICdzcmMvdHlwZXMnO1xuaW1wb3J0IHsgZ2V0U3lzdGVtU3dpdGNoZXJJbnN0YW5jZSB9IGZyb20gJ3NyYy91dGlscyc7XG5pbXBvcnQgdHlwZSBTd2l0Y2hlclBsdXNQbHVnaW4gZnJvbSAnc3JjL21haW4nO1xuaW1wb3J0IHsgUXVpY2tTd2l0Y2hlck9wdGlvbnMgfSBmcm9tICdvYnNpZGlhbic7XG5cbmV4cG9ydCBjbGFzcyBTd2l0Y2hlclBsdXNTZXR0aW5ncyB7XG4gIHByaXZhdGUgcmVhZG9ubHkgZGF0YTogU2V0dGluZ3NEYXRhO1xuXG4gIHByaXZhdGUgc3RhdGljIGdldCBkZWZhdWx0cygpOiBTZXR0aW5nc0RhdGEge1xuICAgIGNvbnN0IGVuYWJsZWRTeW1ib2xUeXBlcyA9IHt9IGFzIFJlY29yZDxTeW1ib2xUeXBlLCBib29sZWFuPjtcbiAgICBlbmFibGVkU3ltYm9sVHlwZXNbU3ltYm9sVHlwZS5MaW5rXSA9IHRydWU7XG4gICAgZW5hYmxlZFN5bWJvbFR5cGVzW1N5bWJvbFR5cGUuRW1iZWRdID0gdHJ1ZTtcbiAgICBlbmFibGVkU3ltYm9sVHlwZXNbU3ltYm9sVHlwZS5UYWddID0gdHJ1ZTtcbiAgICBlbmFibGVkU3ltYm9sVHlwZXNbU3ltYm9sVHlwZS5IZWFkaW5nXSA9IHRydWU7XG5cbiAgICByZXR1cm4ge1xuICAgICAgb25PcGVuUHJlZmVyTmV3UGFuZTogdHJ1ZSxcbiAgICAgIGFsd2F5c05ld1BhbmVGb3JTeW1ib2xzOiBmYWxzZSxcbiAgICAgIHVzZUFjdGl2ZVBhbmVGb3JTeW1ib2xzT25Nb2JpbGU6IGZhbHNlLFxuICAgICAgc3ltYm9sc0luTGluZU9yZGVyOiB0cnVlLFxuICAgICAgZWRpdG9yTGlzdENvbW1hbmQ6ICdlZHQgJyxcbiAgICAgIHN5bWJvbExpc3RDb21tYW5kOiAnQCcsXG4gICAgICB3b3Jrc3BhY2VMaXN0Q29tbWFuZDogJysnLFxuICAgICAgaGVhZGluZ3NMaXN0Q29tbWFuZDogJyMnLFxuICAgICAgc3RhcnJlZExpc3RDb21tYW5kOiBcIidcIixcbiAgICAgIGNvbW1hbmRMaXN0Q29tbWFuZDogJz4nLFxuICAgICAgcmVsYXRlZEl0ZW1zTGlzdENvbW1hbmQ6ICd+JyxcbiAgICAgIHN0cmljdEhlYWRpbmdzT25seTogZmFsc2UsXG4gICAgICBzZWFyY2hBbGxIZWFkaW5nczogdHJ1ZSxcbiAgICAgIGV4Y2x1ZGVWaWV3VHlwZXM6IFsnZW1wdHknXSxcbiAgICAgIHJlZmVyZW5jZVZpZXdzOiBbJ2JhY2tsaW5rJywgJ2xvY2FsZ3JhcGgnLCAnb3V0Z29pbmctbGluaycsICdvdXRsaW5lJ10sXG4gICAgICBsaW1pdDogNTAsXG4gICAgICBpbmNsdWRlU2lkZVBhbmVsVmlld1R5cGVzOiBbJ2JhY2tsaW5rJywgJ2ltYWdlJywgJ21hcmtkb3duJywgJ3BkZiddLFxuICAgICAgZW5hYmxlZFN5bWJvbFR5cGVzLFxuICAgICAgc2VsZWN0TmVhcmVzdEhlYWRpbmc6IHRydWUsXG4gICAgICBleGNsdWRlRm9sZGVyczogW10sXG4gICAgICBleGNsdWRlTGlua1N1YlR5cGVzOiAwLFxuICAgICAgZXhjbHVkZVJlbGF0ZWRGb2xkZXJzOiBbJyddLFxuICAgICAgZXhjbHVkZU9wZW5SZWxhdGVkRmlsZXM6IGZhbHNlLFxuICAgICAgZXhjbHVkZU9ic2lkaWFuSWdub3JlZEZpbGVzOiBmYWxzZSxcbiAgICAgIHNob3VsZFNlYXJjaEZpbGVuYW1lczogZmFsc2UsXG4gICAgICBwYXRoRGlzcGxheUZvcm1hdDogUGF0aERpc3BsYXlGb3JtYXQuRm9sZGVyV2l0aEZpbGVuYW1lLFxuICAgICAgaGlkZVBhdGhJZlJvb3Q6IHRydWUsXG4gICAgfTtcbiAgfVxuXG4gIC8vIHRoaXMgaXMgYSBidWlsdGluIHN5c3RlbSBzZXR0aW5nIGFzIHdlbGwsIGJ1dCBpdCdzIGRpZmZlcmVudCBmcm9tIHRoZSBvdGhlcnNcbiAgLy8gaW4gdGhhdCBpdCdzIG5vdCBhIHVzZXIgb3B0aW9uLiBJdCBkb2Vzbid0IGxpdmUgb24gdGhlIHBsdWdpbiBpbnN0YW5jZSwgaW5zdGVhZFxuICAvLyBpdCBzb3VyY2VkIGZyb20gdGhlIHN3aXRjaGVyIG1vZGFsIGluc3RhbmNlXG4gIHNob3VsZFNob3dBbGlhczogYm9vbGVhbjtcblxuICBnZXQgYnVpbHRJblN5c3RlbU9wdGlvbnMoKTogUXVpY2tTd2l0Y2hlck9wdGlvbnMge1xuICAgIHJldHVybiBnZXRTeXN0ZW1Td2l0Y2hlckluc3RhbmNlKHRoaXMucGx1Z2luLmFwcCk/Lm9wdGlvbnM7XG4gIH1cblxuICBnZXQgc2hvd0FsbEZpbGVUeXBlcygpOiBib29sZWFuIHtcbiAgICAvLyBmb3J3YXJkIHRvIGNvcmUgc3dpdGNoZXIgc2V0dGluZ3NcbiAgICByZXR1cm4gdGhpcy5idWlsdEluU3lzdGVtT3B0aW9ucz8uc2hvd0FsbEZpbGVUeXBlcztcbiAgfVxuXG4gIGdldCBzaG93QXR0YWNobWVudHMoKTogYm9vbGVhbiB7XG4gICAgLy8gZm9yd2FyZCB0byBjb3JlIHN3aXRjaGVyIHNldHRpbmdzXG4gICAgcmV0dXJuIHRoaXMuYnVpbHRJblN5c3RlbU9wdGlvbnM/LnNob3dBdHRhY2htZW50cztcbiAgfVxuXG4gIGdldCBzaG93RXhpc3RpbmdPbmx5KCk6IGJvb2xlYW4ge1xuICAgIC8vIGZvcndhcmQgdG8gY29yZSBzd2l0Y2hlciBzZXR0aW5nc1xuICAgIHJldHVybiB0aGlzLmJ1aWx0SW5TeXN0ZW1PcHRpb25zPy5zaG93RXhpc3RpbmdPbmx5O1xuICB9XG5cbiAgZ2V0IG9uT3BlblByZWZlck5ld1BhbmUoKTogYm9vbGVhbiB7XG4gICAgcmV0dXJuIHRoaXMuZGF0YS5vbk9wZW5QcmVmZXJOZXdQYW5lO1xuICB9XG5cbiAgc2V0IG9uT3BlblByZWZlck5ld1BhbmUodmFsdWU6IGJvb2xlYW4pIHtcbiAgICB0aGlzLmRhdGEub25PcGVuUHJlZmVyTmV3UGFuZSA9IHZhbHVlO1xuICB9XG5cbiAgZ2V0IGFsd2F5c05ld1BhbmVGb3JTeW1ib2xzKCk6IGJvb2xlYW4ge1xuICAgIHJldHVybiB0aGlzLmRhdGEuYWx3YXlzTmV3UGFuZUZvclN5bWJvbHM7XG4gIH1cblxuICBzZXQgYWx3YXlzTmV3UGFuZUZvclN5bWJvbHModmFsdWU6IGJvb2xlYW4pIHtcbiAgICB0aGlzLmRhdGEuYWx3YXlzTmV3UGFuZUZvclN5bWJvbHMgPSB2YWx1ZTtcbiAgfVxuXG4gIGdldCB1c2VBY3RpdmVQYW5lRm9yU3ltYm9sc09uTW9iaWxlKCk6IGJvb2xlYW4ge1xuICAgIHJldHVybiB0aGlzLmRhdGEudXNlQWN0aXZlUGFuZUZvclN5bWJvbHNPbk1vYmlsZTtcbiAgfVxuXG4gIHNldCB1c2VBY3RpdmVQYW5lRm9yU3ltYm9sc09uTW9iaWxlKHZhbHVlOiBib29sZWFuKSB7XG4gICAgdGhpcy5kYXRhLnVzZUFjdGl2ZVBhbmVGb3JTeW1ib2xzT25Nb2JpbGUgPSB2YWx1ZTtcbiAgfVxuXG4gIGdldCBzeW1ib2xzSW5MaW5lT3JkZXIoKTogYm9vbGVhbiB7XG4gICAgcmV0dXJuIHRoaXMuZGF0YS5zeW1ib2xzSW5MaW5lT3JkZXI7XG4gIH1cblxuICBzZXQgc3ltYm9sc0luTGluZU9yZGVyKHZhbHVlOiBib29sZWFuKSB7XG4gICAgdGhpcy5kYXRhLnN5bWJvbHNJbkxpbmVPcmRlciA9IHZhbHVlO1xuICB9XG5cbiAgZ2V0IGVkaXRvckxpc3RQbGFjZWhvbGRlclRleHQoKTogc3RyaW5nIHtcbiAgICByZXR1cm4gU3dpdGNoZXJQbHVzU2V0dGluZ3MuZGVmYXVsdHMuZWRpdG9yTGlzdENvbW1hbmQ7XG4gIH1cblxuICBnZXQgZWRpdG9yTGlzdENvbW1hbmQoKTogc3RyaW5nIHtcbiAgICByZXR1cm4gdGhpcy5kYXRhLmVkaXRvckxpc3RDb21tYW5kO1xuICB9XG5cbiAgc2V0IGVkaXRvckxpc3RDb21tYW5kKHZhbHVlOiBzdHJpbmcpIHtcbiAgICB0aGlzLmRhdGEuZWRpdG9yTGlzdENvbW1hbmQgPSB2YWx1ZTtcbiAgfVxuXG4gIGdldCBzeW1ib2xMaXN0UGxhY2Vob2xkZXJUZXh0KCk6IHN0cmluZyB7XG4gICAgcmV0dXJuIFN3aXRjaGVyUGx1c1NldHRpbmdzLmRlZmF1bHRzLnN5bWJvbExpc3RDb21tYW5kO1xuICB9XG5cbiAgZ2V0IHN5bWJvbExpc3RDb21tYW5kKCk6IHN0cmluZyB7XG4gICAgcmV0dXJuIHRoaXMuZGF0YS5zeW1ib2xMaXN0Q29tbWFuZDtcbiAgfVxuXG4gIHNldCBzeW1ib2xMaXN0Q29tbWFuZCh2YWx1ZTogc3RyaW5nKSB7XG4gICAgdGhpcy5kYXRhLnN5bWJvbExpc3RDb21tYW5kID0gdmFsdWU7XG4gIH1cblxuICBnZXQgd29ya3NwYWNlTGlzdENvbW1hbmQoKTogc3RyaW5nIHtcbiAgICByZXR1cm4gdGhpcy5kYXRhLndvcmtzcGFjZUxpc3RDb21tYW5kO1xuICB9XG5cbiAgc2V0IHdvcmtzcGFjZUxpc3RDb21tYW5kKHZhbHVlOiBzdHJpbmcpIHtcbiAgICB0aGlzLmRhdGEud29ya3NwYWNlTGlzdENvbW1hbmQgPSB2YWx1ZTtcbiAgfVxuXG4gIGdldCB3b3Jrc3BhY2VMaXN0UGxhY2Vob2xkZXJUZXh0KCk6IHN0cmluZyB7XG4gICAgcmV0dXJuIFN3aXRjaGVyUGx1c1NldHRpbmdzLmRlZmF1bHRzLndvcmtzcGFjZUxpc3RDb21tYW5kO1xuICB9XG5cbiAgZ2V0IGhlYWRpbmdzTGlzdENvbW1hbmQoKTogc3RyaW5nIHtcbiAgICByZXR1cm4gdGhpcy5kYXRhLmhlYWRpbmdzTGlzdENvbW1hbmQ7XG4gIH1cblxuICBzZXQgaGVhZGluZ3NMaXN0Q29tbWFuZCh2YWx1ZTogc3RyaW5nKSB7XG4gICAgdGhpcy5kYXRhLmhlYWRpbmdzTGlzdENvbW1hbmQgPSB2YWx1ZTtcbiAgfVxuXG4gIGdldCBoZWFkaW5nc0xpc3RQbGFjZWhvbGRlclRleHQoKTogc3RyaW5nIHtcbiAgICByZXR1cm4gU3dpdGNoZXJQbHVzU2V0dGluZ3MuZGVmYXVsdHMuaGVhZGluZ3NMaXN0Q29tbWFuZDtcbiAgfVxuXG4gIGdldCBzdGFycmVkTGlzdENvbW1hbmQoKTogc3RyaW5nIHtcbiAgICByZXR1cm4gdGhpcy5kYXRhLnN0YXJyZWRMaXN0Q29tbWFuZDtcbiAgfVxuXG4gIHNldCBzdGFycmVkTGlzdENvbW1hbmQodmFsdWU6IHN0cmluZykge1xuICAgIHRoaXMuZGF0YS5zdGFycmVkTGlzdENvbW1hbmQgPSB2YWx1ZTtcbiAgfVxuXG4gIGdldCBzdGFycmVkTGlzdFBsYWNlaG9sZGVyVGV4dCgpOiBzdHJpbmcge1xuICAgIHJldHVybiBTd2l0Y2hlclBsdXNTZXR0aW5ncy5kZWZhdWx0cy5zdGFycmVkTGlzdENvbW1hbmQ7XG4gIH1cblxuICBnZXQgY29tbWFuZExpc3RDb21tYW5kKCk6IHN0cmluZyB7XG4gICAgcmV0dXJuIHRoaXMuZGF0YS5jb21tYW5kTGlzdENvbW1hbmQ7XG4gIH1cblxuICBzZXQgY29tbWFuZExpc3RDb21tYW5kKHZhbHVlOiBzdHJpbmcpIHtcbiAgICB0aGlzLmRhdGEuY29tbWFuZExpc3RDb21tYW5kID0gdmFsdWU7XG4gIH1cblxuICBnZXQgY29tbWFuZExpc3RQbGFjZWhvbGRlclRleHQoKTogc3RyaW5nIHtcbiAgICByZXR1cm4gU3dpdGNoZXJQbHVzU2V0dGluZ3MuZGVmYXVsdHMuY29tbWFuZExpc3RDb21tYW5kO1xuICB9XG5cbiAgZ2V0IHJlbGF0ZWRJdGVtc0xpc3RDb21tYW5kKCk6IHN0cmluZyB7XG4gICAgcmV0dXJuIHRoaXMuZGF0YS5yZWxhdGVkSXRlbXNMaXN0Q29tbWFuZDtcbiAgfVxuXG4gIHNldCByZWxhdGVkSXRlbXNMaXN0Q29tbWFuZCh2YWx1ZTogc3RyaW5nKSB7XG4gICAgdGhpcy5kYXRhLnJlbGF0ZWRJdGVtc0xpc3RDb21tYW5kID0gdmFsdWU7XG4gIH1cblxuICBnZXQgcmVsYXRlZEl0ZW1zTGlzdFBsYWNlaG9sZGVyVGV4dCgpOiBzdHJpbmcge1xuICAgIHJldHVybiBTd2l0Y2hlclBsdXNTZXR0aW5ncy5kZWZhdWx0cy5yZWxhdGVkSXRlbXNMaXN0Q29tbWFuZDtcbiAgfVxuXG4gIGdldCBzdHJpY3RIZWFkaW5nc09ubHkoKTogYm9vbGVhbiB7XG4gICAgcmV0dXJuIHRoaXMuZGF0YS5zdHJpY3RIZWFkaW5nc09ubHk7XG4gIH1cblxuICBzZXQgc3RyaWN0SGVhZGluZ3NPbmx5KHZhbHVlOiBib29sZWFuKSB7XG4gICAgdGhpcy5kYXRhLnN0cmljdEhlYWRpbmdzT25seSA9IHZhbHVlO1xuICB9XG5cbiAgZ2V0IHNlYXJjaEFsbEhlYWRpbmdzKCk6IGJvb2xlYW4ge1xuICAgIHJldHVybiB0aGlzLmRhdGEuc2VhcmNoQWxsSGVhZGluZ3M7XG4gIH1cblxuICBzZXQgc2VhcmNoQWxsSGVhZGluZ3ModmFsdWU6IGJvb2xlYW4pIHtcbiAgICB0aGlzLmRhdGEuc2VhcmNoQWxsSGVhZGluZ3MgPSB2YWx1ZTtcbiAgfVxuXG4gIGdldCBleGNsdWRlVmlld1R5cGVzKCk6IEFycmF5PHN0cmluZz4ge1xuICAgIHJldHVybiB0aGlzLmRhdGEuZXhjbHVkZVZpZXdUeXBlcztcbiAgfVxuXG4gIGdldCByZWZlcmVuY2VWaWV3cygpOiBBcnJheTxzdHJpbmc+IHtcbiAgICByZXR1cm4gdGhpcy5kYXRhLnJlZmVyZW5jZVZpZXdzO1xuICB9XG5cbiAgZ2V0IGxpbWl0KCk6IG51bWJlciB7XG4gICAgcmV0dXJuIHRoaXMuZGF0YS5saW1pdDtcbiAgfVxuXG4gIHNldCBsaW1pdCh2YWx1ZTogbnVtYmVyKSB7XG4gICAgdGhpcy5kYXRhLmxpbWl0ID0gdmFsdWU7XG4gIH1cblxuICBnZXQgaW5jbHVkZVNpZGVQYW5lbFZpZXdUeXBlcygpOiBBcnJheTxzdHJpbmc+IHtcbiAgICByZXR1cm4gdGhpcy5kYXRhLmluY2x1ZGVTaWRlUGFuZWxWaWV3VHlwZXM7XG4gIH1cblxuICBzZXQgaW5jbHVkZVNpZGVQYW5lbFZpZXdUeXBlcyh2YWx1ZTogQXJyYXk8c3RyaW5nPikge1xuICAgIC8vIHJlbW92ZSBhbnkgZHVwbGljYXRlcyBiZWZvcmUgc3RvcmluZ1xuICAgIHRoaXMuZGF0YS5pbmNsdWRlU2lkZVBhbmVsVmlld1R5cGVzID0gWy4uLm5ldyBTZXQodmFsdWUpXTtcbiAgfVxuXG4gIGdldCBpbmNsdWRlU2lkZVBhbmVsVmlld1R5cGVzUGxhY2Vob2xkZXIoKTogc3RyaW5nIHtcbiAgICByZXR1cm4gU3dpdGNoZXJQbHVzU2V0dGluZ3MuZGVmYXVsdHMuaW5jbHVkZVNpZGVQYW5lbFZpZXdUeXBlcy5qb2luKCdcXG4nKTtcbiAgfVxuXG4gIGdldCBzZWxlY3ROZWFyZXN0SGVhZGluZygpOiBib29sZWFuIHtcbiAgICByZXR1cm4gdGhpcy5kYXRhLnNlbGVjdE5lYXJlc3RIZWFkaW5nO1xuICB9XG5cbiAgc2V0IHNlbGVjdE5lYXJlc3RIZWFkaW5nKHZhbHVlOiBib29sZWFuKSB7XG4gICAgdGhpcy5kYXRhLnNlbGVjdE5lYXJlc3RIZWFkaW5nID0gdmFsdWU7XG4gIH1cblxuICBnZXQgZXhjbHVkZUZvbGRlcnMoKTogQXJyYXk8c3RyaW5nPiB7XG4gICAgcmV0dXJuIHRoaXMuZGF0YS5leGNsdWRlRm9sZGVycztcbiAgfVxuXG4gIHNldCBleGNsdWRlRm9sZGVycyh2YWx1ZTogQXJyYXk8c3RyaW5nPikge1xuICAgIC8vIHJlbW92ZSBhbnkgZHVwbGljYXRlcyBiZWZvcmUgc3RvcmluZ1xuICAgIHRoaXMuZGF0YS5leGNsdWRlRm9sZGVycyA9IFsuLi5uZXcgU2V0KHZhbHVlKV07XG4gIH1cblxuICBnZXQgZXhjbHVkZUxpbmtTdWJUeXBlcygpOiBudW1iZXIge1xuICAgIHJldHVybiB0aGlzLmRhdGEuZXhjbHVkZUxpbmtTdWJUeXBlcztcbiAgfVxuXG4gIHNldCBleGNsdWRlTGlua1N1YlR5cGVzKHZhbHVlOiBudW1iZXIpIHtcbiAgICB0aGlzLmRhdGEuZXhjbHVkZUxpbmtTdWJUeXBlcyA9IHZhbHVlO1xuICB9XG5cbiAgZ2V0IGV4Y2x1ZGVSZWxhdGVkRm9sZGVycygpOiBBcnJheTxzdHJpbmc+IHtcbiAgICByZXR1cm4gdGhpcy5kYXRhLmV4Y2x1ZGVSZWxhdGVkRm9sZGVycztcbiAgfVxuXG4gIHNldCBleGNsdWRlUmVsYXRlZEZvbGRlcnModmFsdWU6IEFycmF5PHN0cmluZz4pIHtcbiAgICB0aGlzLmRhdGEuZXhjbHVkZVJlbGF0ZWRGb2xkZXJzID0gWy4uLm5ldyBTZXQodmFsdWUpXTtcbiAgfVxuXG4gIGdldCBleGNsdWRlT3BlblJlbGF0ZWRGaWxlcygpOiBib29sZWFuIHtcbiAgICByZXR1cm4gdGhpcy5kYXRhLmV4Y2x1ZGVPcGVuUmVsYXRlZEZpbGVzO1xuICB9XG5cbiAgc2V0IGV4Y2x1ZGVPcGVuUmVsYXRlZEZpbGVzKHZhbHVlOiBib29sZWFuKSB7XG4gICAgdGhpcy5kYXRhLmV4Y2x1ZGVPcGVuUmVsYXRlZEZpbGVzID0gdmFsdWU7XG4gIH1cblxuICBnZXQgZXhjbHVkZU9ic2lkaWFuSWdub3JlZEZpbGVzKCk6IGJvb2xlYW4ge1xuICAgIHJldHVybiB0aGlzLmRhdGEuZXhjbHVkZU9ic2lkaWFuSWdub3JlZEZpbGVzO1xuICB9XG5cbiAgc2V0IGV4Y2x1ZGVPYnNpZGlhbklnbm9yZWRGaWxlcyh2YWx1ZTogYm9vbGVhbikge1xuICAgIHRoaXMuZGF0YS5leGNsdWRlT2JzaWRpYW5JZ25vcmVkRmlsZXMgPSB2YWx1ZTtcbiAgfVxuXG4gIGdldCBzaG91bGRTZWFyY2hGaWxlbmFtZXMoKTogYm9vbGVhbiB7XG4gICAgcmV0dXJuIHRoaXMuZGF0YS5zaG91bGRTZWFyY2hGaWxlbmFtZXM7XG4gIH1cblxuICBzZXQgc2hvdWxkU2VhcmNoRmlsZW5hbWVzKHZhbHVlOiBib29sZWFuKSB7XG4gICAgdGhpcy5kYXRhLnNob3VsZFNlYXJjaEZpbGVuYW1lcyA9IHZhbHVlO1xuICB9XG5cbiAgZ2V0IHBhdGhEaXNwbGF5Rm9ybWF0KCk6IFBhdGhEaXNwbGF5Rm9ybWF0IHtcbiAgICByZXR1cm4gdGhpcy5kYXRhLnBhdGhEaXNwbGF5Rm9ybWF0O1xuICB9XG5cbiAgc2V0IHBhdGhEaXNwbGF5Rm9ybWF0KHZhbHVlOiBQYXRoRGlzcGxheUZvcm1hdCkge1xuICAgIHRoaXMuZGF0YS5wYXRoRGlzcGxheUZvcm1hdCA9IHZhbHVlO1xuICB9XG5cbiAgZ2V0IGhpZGVQYXRoSWZSb290KCk6IGJvb2xlYW4ge1xuICAgIHJldHVybiB0aGlzLmRhdGEuaGlkZVBhdGhJZlJvb3Q7XG4gIH1cblxuICBzZXQgaGlkZVBhdGhJZlJvb3QodmFsdWU6IGJvb2xlYW4pIHtcbiAgICB0aGlzLmRhdGEuaGlkZVBhdGhJZlJvb3QgPSB2YWx1ZTtcbiAgfVxuXG4gIGNvbnN0cnVjdG9yKHByaXZhdGUgcGx1Z2luOiBTd2l0Y2hlclBsdXNQbHVnaW4pIHtcbiAgICB0aGlzLmRhdGEgPSBTd2l0Y2hlclBsdXNTZXR0aW5ncy5kZWZhdWx0cztcbiAgfVxuXG4gIGFzeW5jIGxvYWRTZXR0aW5ncygpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBjb25zdCBjb3B5ID0gPFQ+KHNvdXJjZTogVCwgdGFyZ2V0OiBULCBrZXlzOiBBcnJheTxrZXlvZiBUPik6IHZvaWQgPT4ge1xuICAgICAgZm9yIChjb25zdCBrZXkgb2Yga2V5cykge1xuICAgICAgICBpZiAoa2V5IGluIHNvdXJjZSkge1xuICAgICAgICAgIHRhcmdldFtrZXldID0gc291cmNlW2tleV07XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9O1xuXG4gICAgdHJ5IHtcbiAgICAgIGNvbnN0IHNhdmVkRGF0YSA9IChhd2FpdCB0aGlzLnBsdWdpbj8ubG9hZERhdGEoKSkgYXMgU2V0dGluZ3NEYXRhO1xuICAgICAgaWYgKHNhdmVkRGF0YSkge1xuICAgICAgICBjb25zdCBrZXlzID0gT2JqZWN0LmtleXMoU3dpdGNoZXJQbHVzU2V0dGluZ3MuZGVmYXVsdHMpIGFzIEFycmF5PFxuICAgICAgICAgIGtleW9mIFNldHRpbmdzRGF0YVxuICAgICAgICA+O1xuICAgICAgICBjb3B5KHNhdmVkRGF0YSwgdGhpcy5kYXRhLCBrZXlzKTtcbiAgICAgIH1cbiAgICB9IGNhdGNoIChlcnIpIHtcbiAgICAgIGNvbnNvbGUubG9nKCdTd2l0Y2hlcisrOiBlcnJvciBsb2FkaW5nIHNldHRpbmdzLCB1c2luZyBkZWZhdWx0cy4gJywgZXJyKTtcbiAgICB9XG4gIH1cblxuICBhc3luYyBzYXZlU2V0dGluZ3MoKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgY29uc3QgeyBwbHVnaW4sIGRhdGEgfSA9IHRoaXM7XG4gICAgYXdhaXQgcGx1Z2luPy5zYXZlRGF0YShkYXRhKTtcbiAgfVxuXG4gIHNhdmUoKTogdm9pZCB7XG4gICAgdGhpcy5zYXZlU2V0dGluZ3MoKS5jYXRjaCgoZSkgPT4ge1xuICAgICAgY29uc29sZS5sb2coJ1N3aXRjaGVyKys6IGVycm9yIHNhdmluZyBjaGFuZ2VzIHRvIHNldHRpbmdzJywgZSk7XG4gICAgfSk7XG4gIH1cblxuICBpc1N5bWJvbFR5cGVFbmFibGVkKHN5bWJvbDogU3ltYm9sVHlwZSk6IGJvb2xlYW4ge1xuICAgIHJldHVybiB0aGlzLmRhdGEuZW5hYmxlZFN5bWJvbFR5cGVzW3N5bWJvbF07XG4gIH1cblxuICBzZXRTeW1ib2xUeXBlRW5hYmxlZChzeW1ib2w6IFN5bWJvbFR5cGUsIGlzRW5hYmxlZDogYm9vbGVhbik6IHZvaWQge1xuICAgIHRoaXMuZGF0YS5lbmFibGVkU3ltYm9sVHlwZXNbc3ltYm9sXSA9IGlzRW5hYmxlZDtcbiAgfVxufVxuIiwiaW1wb3J0IHsgU3dpdGNoZXJQbHVzU2V0dGluZ3MgfSBmcm9tICcuL3N3aXRjaGVyUGx1c1NldHRpbmdzJztcbmltcG9ydCB7IEFwcCwgUGx1Z2luU2V0dGluZ1RhYiwgU2V0dGluZyB9IGZyb20gJ29ic2lkaWFuJztcbmltcG9ydCB7IFdyaXRhYmxlS2V5c1dpdGhWYWx1ZU9mVHlwZSB9IGZyb20gJ3NyYy90eXBlcyc7XG5pbXBvcnQgeyBXcml0YWJsZUtleXMgfSBmcm9tICd0cy1lc3NlbnRpYWxzJztcblxudHlwZSBTdHJpbmdUeXBlZENvbmZpZ0tleSA9IFdyaXRhYmxlS2V5c1dpdGhWYWx1ZU9mVHlwZTxTd2l0Y2hlclBsdXNTZXR0aW5ncywgc3RyaW5nPjtcbnR5cGUgQm9vbGVhblR5cGVkQ29uZmlnS2V5ID0gV3JpdGFibGVLZXlzV2l0aFZhbHVlT2ZUeXBlPFN3aXRjaGVyUGx1c1NldHRpbmdzLCBib29sZWFuPjtcbnR5cGUgTGlzdFR5cGVkQ29uZmlnS2V5ID0gV3JpdGFibGVLZXlzV2l0aFZhbHVlT2ZUeXBlPFxuICBTd2l0Y2hlclBsdXNTZXR0aW5ncyxcbiAgQXJyYXk8c3RyaW5nPlxuPjtcblxuZXhwb3J0IGFic3RyYWN0IGNsYXNzIFNldHRpbmdzVGFiU2VjdGlvbiB7XG4gIGNvbnN0cnVjdG9yKFxuICAgIHByb3RlY3RlZCBhcHA6IEFwcCxcbiAgICBwcm90ZWN0ZWQgbWFpblNldHRpbmdzVGFiOiBQbHVnaW5TZXR0aW5nVGFiLFxuICAgIHByb3RlY3RlZCBjb25maWc6IFN3aXRjaGVyUGx1c1NldHRpbmdzLFxuICApIHt9XG5cbiAgYWJzdHJhY3QgZGlzcGxheShjb250YWluZXJFbDogSFRNTEVsZW1lbnQpOiB2b2lkO1xuXG4gIC8qKlxuICAgKiBDcmVhdGVzIGEgbmV3IFNldHRpbmcgd2l0aCB0aGUgZ2l2ZW4gbmFtZSBhbmQgZGVzY3JpcHRpb24uXG4gICAqIEBwYXJhbSAge0hUTUxFbGVtZW50fSBjb250YWluZXJFbFxuICAgKiBAcGFyYW0gIHtzdHJpbmd9IG5hbWVcbiAgICogQHBhcmFtICB7c3RyaW5nfSBkZXNjXG4gICAqIEByZXR1cm5zIFNldHRpbmdcbiAgICovXG4gIGNyZWF0ZVNldHRpbmcoY29udGFpbmVyRWw6IEhUTUxFbGVtZW50LCBuYW1lPzogc3RyaW5nLCBkZXNjPzogc3RyaW5nKTogU2V0dGluZyB7XG4gICAgY29uc3Qgc2V0dGluZyA9IG5ldyBTZXR0aW5nKGNvbnRhaW5lckVsKTtcbiAgICBzZXR0aW5nLnNldE5hbWUobmFtZSk7XG4gICAgc2V0dGluZy5zZXREZXNjKGRlc2MpO1xuXG4gICAgcmV0dXJuIHNldHRpbmc7XG4gIH1cbiAgLyoqXG4gICAqIENyZWF0ZSBzZWN0aW9uIHRpdGxlIGVsZW1lbnRzIGFuZCBkaXZpZGVyLlxuICAgKiBAcGFyYW0gIHtIVE1MRWxlbWVudH0gY29udGFpbmVyRWxcbiAgICogQHBhcmFtICB7c3RyaW5nfSB0aXRsZVxuICAgKiBAcGFyYW0gIHtzdHJpbmd9IGRlc2M/XG4gICAqIEByZXR1cm5zIFNldHRpbmdcbiAgICovXG4gIGFkZFNlY3Rpb25UaXRsZShjb250YWluZXJFbDogSFRNTEVsZW1lbnQsIHRpdGxlOiBzdHJpbmcsIGRlc2MgPSAnJyk6IFNldHRpbmcge1xuICAgIGNvbnN0IHNldHRpbmcgPSB0aGlzLmNyZWF0ZVNldHRpbmcoY29udGFpbmVyRWwsIHRpdGxlLCBkZXNjKTtcbiAgICBzZXR0aW5nLnNldEhlYWRpbmcoKTtcblxuICAgIHJldHVybiBzZXR0aW5nO1xuICB9XG5cbiAgLyoqXG4gICAqIENyZWF0ZXMgYSBIVE1MSW5wdXQgZWxlbWVudCBzZXR0aW5nLlxuICAgKiBAcGFyYW0gIHtIVE1MRWxlbWVudH0gY29udGFpbmVyRWwgVGhlIGVsZW1lbnQgdG8gYXR0YWNoIHRoZSBzZXR0aW5nIHRvLlxuICAgKiBAcGFyYW0gIHtzdHJpbmd9IG5hbWVcbiAgICogQHBhcmFtICB7c3RyaW5nfSBkZXNjXG4gICAqIEBwYXJhbSAge3N0cmluZ30gaW5pdGlhbFZhbHVlXG4gICAqIEBwYXJhbSAge1N0cmluZ1R5cGVkQ29uZmlnS2V5fSBjb25maWdTdG9yYWdlS2V5IFRoZSBTd2l0Y2hlclBsdXNTZXR0aW5ncyBrZXkgd2hlcmUgdGhlIHZhbHVlIGZvciB0aGlzIHNldHRpbmcgc2hvdWxkIGJlIHN0b3JlZC5cbiAgICogQHBhcmFtICB7c3RyaW5nfSBwbGFjZWhvbGRlclRleHQ/XG4gICAqIEByZXR1cm5zIFNldHRpbmdcbiAgICovXG4gIGFkZFRleHRTZXR0aW5nKFxuICAgIGNvbnRhaW5lckVsOiBIVE1MRWxlbWVudCxcbiAgICBuYW1lOiBzdHJpbmcsXG4gICAgZGVzYzogc3RyaW5nLFxuICAgIGluaXRpYWxWYWx1ZTogc3RyaW5nLFxuICAgIGNvbmZpZ1N0b3JhZ2VLZXk6IFN0cmluZ1R5cGVkQ29uZmlnS2V5LFxuICAgIHBsYWNlaG9sZGVyVGV4dD86IHN0cmluZyxcbiAgKTogU2V0dGluZyB7XG4gICAgY29uc3Qgc2V0dGluZyA9IHRoaXMuY3JlYXRlU2V0dGluZyhjb250YWluZXJFbCwgbmFtZSwgZGVzYyk7XG5cbiAgICBzZXR0aW5nLmFkZFRleHQoKGNvbXApID0+IHtcbiAgICAgIGNvbXAuc2V0UGxhY2Vob2xkZXIocGxhY2Vob2xkZXJUZXh0KTtcbiAgICAgIGNvbXAuc2V0VmFsdWUoaW5pdGlhbFZhbHVlKTtcblxuICAgICAgY29tcC5vbkNoYW5nZSgocmF3VmFsdWUpID0+IHtcbiAgICAgICAgY29uc3QgdmFsdWUgPSByYXdWYWx1ZS5sZW5ndGggPyByYXdWYWx1ZSA6IGluaXRpYWxWYWx1ZTtcbiAgICAgICAgdGhpcy5zYXZlQ2hhbmdlc1RvQ29uZmlnKGNvbmZpZ1N0b3JhZ2VLZXksIHZhbHVlKTtcbiAgICAgIH0pO1xuICAgIH0pO1xuXG4gICAgcmV0dXJuIHNldHRpbmc7XG4gIH1cblxuICAvKipcbiAgICogQ3JlYXRlIGEgQ2hlY2tib3ggZWxlbWVudCBzZXR0aW5nLlxuICAgKiBAcGFyYW0gIHtIVE1MRWxlbWVudH0gY29udGFpbmVyRWwgVGhlIGVsZW1lbnQgdG8gYXR0YWNoIHRoZSBzZXR0aW5nIHRvLlxuICAgKiBAcGFyYW0gIHtzdHJpbmd9IG5hbWVcbiAgICogQHBhcmFtICB7c3RyaW5nfSBkZXNjXG4gICAqIEBwYXJhbSAge2Jvb2xlYW59IGluaXRpYWxWYWx1ZVxuICAgKiBAcGFyYW0gIHtCb29sZWFuVHlwZWRDb25maWdLZXl9IGNvbmZpZ1N0b3JhZ2VLZXkgVGhlIFN3aXRjaGVyUGx1c1NldHRpbmdzIGtleSB3aGVyZSB0aGUgdmFsdWUgZm9yIHRoaXMgc2V0dGluZyBzaG91bGQgYmUgc3RvcmVkLlxuICAgKiBAcmV0dXJucyBTZXR0aW5nXG4gICAqL1xuICBhZGRUb2dnbGVTZXR0aW5nKFxuICAgIGNvbnRhaW5lckVsOiBIVE1MRWxlbWVudCxcbiAgICBuYW1lOiBzdHJpbmcsXG4gICAgZGVzYzogc3RyaW5nLFxuICAgIGluaXRpYWxWYWx1ZTogYm9vbGVhbixcbiAgICBjb25maWdTdG9yYWdlS2V5OiBCb29sZWFuVHlwZWRDb25maWdLZXksXG4gICk6IFNldHRpbmcge1xuICAgIGNvbnN0IHNldHRpbmcgPSB0aGlzLmNyZWF0ZVNldHRpbmcoY29udGFpbmVyRWwsIG5hbWUsIGRlc2MpO1xuXG4gICAgc2V0dGluZy5hZGRUb2dnbGUoKGNvbXApID0+IHtcbiAgICAgIGNvbXAuc2V0VmFsdWUoaW5pdGlhbFZhbHVlKTtcbiAgICAgIGNvbXAub25DaGFuZ2UoKHZhbHVlKSA9PiB0aGlzLnNhdmVDaGFuZ2VzVG9Db25maWcoY29uZmlnU3RvcmFnZUtleSwgdmFsdWUpKTtcbiAgICB9KTtcblxuICAgIHJldHVybiBzZXR0aW5nO1xuICB9XG5cbiAgLyoqXG4gICAqIENyZWF0ZSBhIFRleHRBcmVhIGVsZW1lbnQgc2V0dGluZy5cbiAgICogQHBhcmFtICB7SFRNTEVsZW1lbnR9IGNvbnRhaW5lckVsIFRoZSBlbGVtZW50IHRvIGF0dGFjaCB0aGUgc2V0dGluZyB0by5cbiAgICogQHBhcmFtICB7c3RyaW5nfSBuYW1lXG4gICAqIEBwYXJhbSAge3N0cmluZ30gZGVzY1xuICAgKiBAcGFyYW0gIHtzdHJpbmd9IGluaXRpYWxWYWx1ZVxuICAgKiBAcGFyYW0gIHtMaXN0VHlwZWRDb25maWdLZXl8U3RyaW5nVHlwZWRDb25maWdLZXl9IGNvbmZpZ1N0b3JhZ2VLZXkgVGhlIFN3aXRjaGVyUGx1c1NldHRpbmdzIGtleSB3aGVyZSB0aGUgdmFsdWUgZm9yIHRoaXMgc2V0dGluZyBzaG91bGQgYmUgc3RvcmVkLlxuICAgKiBAcGFyYW0gIHtzdHJpbmd9IHBsYWNlaG9sZGVyVGV4dD9cbiAgICogQHJldHVybnMgU2V0dGluZ1xuICAgKi9cbiAgYWRkVGV4dEFyZWFTZXR0aW5nKFxuICAgIGNvbnRhaW5lckVsOiBIVE1MRWxlbWVudCxcbiAgICBuYW1lOiBzdHJpbmcsXG4gICAgZGVzYzogc3RyaW5nLFxuICAgIGluaXRpYWxWYWx1ZTogc3RyaW5nLFxuICAgIGNvbmZpZ1N0b3JhZ2VLZXk6IExpc3RUeXBlZENvbmZpZ0tleSB8IFN0cmluZ1R5cGVkQ29uZmlnS2V5LFxuICAgIHBsYWNlaG9sZGVyVGV4dD86IHN0cmluZyxcbiAgKTogU2V0dGluZyB7XG4gICAgY29uc3Qgc2V0dGluZyA9IHRoaXMuY3JlYXRlU2V0dGluZyhjb250YWluZXJFbCwgbmFtZSwgZGVzYyk7XG5cbiAgICBzZXR0aW5nLmFkZFRleHRBcmVhKChjb21wKSA9PiB7XG4gICAgICBjb21wLnNldFBsYWNlaG9sZGVyKHBsYWNlaG9sZGVyVGV4dCk7XG4gICAgICBjb21wLnNldFZhbHVlKGluaXRpYWxWYWx1ZSk7XG5cbiAgICAgIGNvbXAub25DaGFuZ2UoKHJhd1ZhbHVlKSA9PiB7XG4gICAgICAgIGNvbnN0IHZhbHVlID0gcmF3VmFsdWUubGVuZ3RoID8gcmF3VmFsdWUgOiBpbml0aWFsVmFsdWU7XG4gICAgICAgIGNvbnN0IGlzQXJyYXkgPSBBcnJheS5pc0FycmF5KHRoaXMuY29uZmlnW2NvbmZpZ1N0b3JhZ2VLZXldKTtcbiAgICAgICAgdGhpcy5zYXZlQ2hhbmdlc1RvQ29uZmlnKGNvbmZpZ1N0b3JhZ2VLZXksIGlzQXJyYXkgPyB2YWx1ZS5zcGxpdCgnXFxuJykgOiB2YWx1ZSk7XG4gICAgICB9KTtcbiAgICB9KTtcblxuICAgIHJldHVybiBzZXR0aW5nO1xuICB9XG5cbiAgYWRkRHJvcGRvd25TZXR0aW5nKFxuICAgIGNvbnRhaW5lckVsOiBIVE1MRWxlbWVudCxcbiAgICBuYW1lOiBzdHJpbmcsXG4gICAgZGVzYzogc3RyaW5nLFxuICAgIGluaXRpYWxWYWx1ZTogc3RyaW5nLFxuICAgIG9wdGlvbnM6IFJlY29yZDxzdHJpbmcsIHN0cmluZz4sXG4gICAgY29uZmlnU3RvcmFnZUtleTogU3RyaW5nVHlwZWRDb25maWdLZXksXG4gICAgb25DaGFuZ2U/OiAocmF3VmFsdWU6IHN0cmluZywgY29uZmlnOiBTd2l0Y2hlclBsdXNTZXR0aW5ncykgPT4gdm9pZCxcbiAgKTogU2V0dGluZyB7XG4gICAgY29uc3Qgc2V0dGluZyA9IHRoaXMuY3JlYXRlU2V0dGluZyhjb250YWluZXJFbCwgbmFtZSwgZGVzYyk7XG5cbiAgICBzZXR0aW5nLmFkZERyb3Bkb3duKChjb21wKSA9PiB7XG4gICAgICBjb21wLmFkZE9wdGlvbnMob3B0aW9ucyk7XG4gICAgICBjb21wLnNldFZhbHVlKGluaXRpYWxWYWx1ZSk7XG5cbiAgICAgIGNvbXAub25DaGFuZ2UoKHJhd1ZhbHVlKSA9PiB7XG4gICAgICAgIGlmIChvbkNoYW5nZSkge1xuICAgICAgICAgIG9uQ2hhbmdlKHJhd1ZhbHVlLCB0aGlzLmNvbmZpZyk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgdGhpcy5zYXZlQ2hhbmdlc1RvQ29uZmlnKGNvbmZpZ1N0b3JhZ2VLZXksIHJhd1ZhbHVlKTtcbiAgICAgICAgfVxuICAgICAgfSk7XG4gICAgfSk7XG5cbiAgICByZXR1cm4gc2V0dGluZztcbiAgfVxuXG4gIC8qKlxuICAgKiBVcGRhdGVzIHRoZSBpbnRlcm5hbCBTd2l0Y2hlclBsdXNTZXR0aW5ncyBjb25maWdTdG9yYWdlS2V5IHdpdGggdmFsdWUsIGFuZCB3cml0ZXMgaXQgdG8gZGlzay5cbiAgICogQHBhcmFtICB7S30gY29uZmlnU3RvcmFnZUtleSBUaGUgU3dpdGNoZXJQbHVzU2V0dGluZ3Mga2V5IHdoZXJlIHRoZSB2YWx1ZSBmb3IgdGhpcyBzZXR0aW5nIHNob3VsZCBiZSBzdG9yZWQuXG4gICAqIEBwYXJhbSAge1N3aXRjaGVyUGx1c1NldHRpbmdzW0tdfSB2YWx1ZVxuICAgKiBAcmV0dXJucyB2b2lkXG4gICAqL1xuICBzYXZlQ2hhbmdlc1RvQ29uZmlnPEsgZXh0ZW5kcyBXcml0YWJsZUtleXM8U3dpdGNoZXJQbHVzU2V0dGluZ3M+PihcbiAgICBjb25maWdTdG9yYWdlS2V5OiBLLFxuICAgIHZhbHVlOiBTd2l0Y2hlclBsdXNTZXR0aW5nc1tLXSxcbiAgKTogdm9pZCB7XG4gICAgaWYgKGNvbmZpZ1N0b3JhZ2VLZXkpIHtcbiAgICAgIGNvbnN0IHsgY29uZmlnIH0gPSB0aGlzO1xuICAgICAgY29uZmlnW2NvbmZpZ1N0b3JhZ2VLZXldID0gdmFsdWU7XG4gICAgICBjb25maWcuc2F2ZSgpO1xuICAgIH1cbiAgfVxufVxuIiwiaW1wb3J0IHsgU2V0dGluZ3NUYWJTZWN0aW9uIH0gZnJvbSAnLi9zZXR0aW5nc1RhYlNlY3Rpb24nO1xuXG5leHBvcnQgY2xhc3MgU3RhcnJlZFNldHRpbmdzVGFiU2VjdGlvbiBleHRlbmRzIFNldHRpbmdzVGFiU2VjdGlvbiB7XG4gIGRpc3BsYXkoY29udGFpbmVyRWw6IEhUTUxFbGVtZW50KTogdm9pZCB7XG4gICAgY29uc3QgeyBjb25maWcgfSA9IHRoaXM7XG5cbiAgICB0aGlzLmFkZFNlY3Rpb25UaXRsZShjb250YWluZXJFbCwgJ1N0YXJyZWQgTGlzdCBNb2RlIFNldHRpbmdzJyk7XG5cbiAgICB0aGlzLmFkZFRleHRTZXR0aW5nKFxuICAgICAgY29udGFpbmVyRWwsXG4gICAgICAnU3RhcnJlZCBsaXN0IG1vZGUgdHJpZ2dlcicsXG4gICAgICAnQ2hhcmFjdGVyIHRoYXQgd2lsbCB0cmlnZ2VyIHN0YXJyZWQgbGlzdCBtb2RlIGluIHRoZSBzd2l0Y2hlcicsXG4gICAgICBjb25maWcuc3RhcnJlZExpc3RDb21tYW5kLFxuICAgICAgJ3N0YXJyZWRMaXN0Q29tbWFuZCcsXG4gICAgICBjb25maWcuc3RhcnJlZExpc3RQbGFjZWhvbGRlclRleHQsXG4gICAgKTtcbiAgfVxufVxuIiwiaW1wb3J0IHsgU2V0dGluZ3NUYWJTZWN0aW9uIH0gZnJvbSAnLi9zZXR0aW5nc1RhYlNlY3Rpb24nO1xuXG5leHBvcnQgY2xhc3MgQ29tbWFuZExpc3RTZXR0aW5nc1RhYlNlY3Rpb24gZXh0ZW5kcyBTZXR0aW5nc1RhYlNlY3Rpb24ge1xuICBkaXNwbGF5KGNvbnRhaW5lckVsOiBIVE1MRWxlbWVudCk6IHZvaWQge1xuICAgIGNvbnN0IHsgY29uZmlnIH0gPSB0aGlzO1xuXG4gICAgdGhpcy5hZGRTZWN0aW9uVGl0bGUoY29udGFpbmVyRWwsICdDb21tYW5kIExpc3QgTW9kZSBTZXR0aW5ncycpO1xuXG4gICAgdGhpcy5hZGRUZXh0U2V0dGluZyhcbiAgICAgIGNvbnRhaW5lckVsLFxuICAgICAgJ0NvbW1hbmQgbGlzdCBtb2RlIHRyaWdnZXInLFxuICAgICAgJ0NoYXJhY3RlciB0aGF0IHdpbGwgdHJpZ2dlciBjb21tYW5kIGxpc3QgbW9kZSBpbiB0aGUgc3dpdGNoZXInLFxuICAgICAgY29uZmlnLmNvbW1hbmRMaXN0Q29tbWFuZCxcbiAgICAgICdjb21tYW5kTGlzdENvbW1hbmQnLFxuICAgICAgY29uZmlnLmNvbW1hbmRMaXN0UGxhY2Vob2xkZXJUZXh0LFxuICAgICk7XG4gIH1cbn1cbiIsImltcG9ydCB7IFNldHRpbmdzVGFiU2VjdGlvbiB9IGZyb20gJy4vc2V0dGluZ3NUYWJTZWN0aW9uJztcblxuZXhwb3J0IGNsYXNzIFJlbGF0ZWRJdGVtc1NldHRpbmdzVGFiU2VjdGlvbiBleHRlbmRzIFNldHRpbmdzVGFiU2VjdGlvbiB7XG4gIGRpc3BsYXkoY29udGFpbmVyRWw6IEhUTUxFbGVtZW50KTogdm9pZCB7XG4gICAgY29uc3QgeyBjb25maWcgfSA9IHRoaXM7XG5cbiAgICB0aGlzLmFkZFNlY3Rpb25UaXRsZShjb250YWluZXJFbCwgJ1JlbGF0ZWQgSXRlbXMgTGlzdCBNb2RlIFNldHRpbmdzJyk7XG5cbiAgICB0aGlzLmFkZFRleHRTZXR0aW5nKFxuICAgICAgY29udGFpbmVyRWwsXG4gICAgICAnUmVsYXRlZCBJdGVtcyBsaXN0IG1vZGUgdHJpZ2dlcicsXG4gICAgICAnQ2hhcmFjdGVyIHRoYXQgd2lsbCB0cmlnZ2VyIHJlbGF0ZWQgaXRlbXMgbGlzdCBtb2RlIGluIHRoZSBzd2l0Y2hlcicsXG4gICAgICBjb25maWcucmVsYXRlZEl0ZW1zTGlzdENvbW1hbmQsXG4gICAgICAncmVsYXRlZEl0ZW1zTGlzdENvbW1hbmQnLFxuICAgICAgY29uZmlnLnJlbGF0ZWRJdGVtc0xpc3RQbGFjZWhvbGRlclRleHQsXG4gICAgKTtcblxuICAgIHRoaXMuYWRkVG9nZ2xlU2V0dGluZyhcbiAgICAgIGNvbnRhaW5lckVsLFxuICAgICAgJ0V4Y2x1ZGUgb3BlbiBmaWxlcycsXG4gICAgICAnRW5hYmxlLCByZWxhdGVkIGZpbGVzIHdoaWNoIGFyZSBhbHJlYWR5IG9wZW4gd2lsbCBub3QgYmUgZGlzcGxheWVkIGluIHRoZSBsaXN0LiBEaXNhYmxlZCwgQWxsIHJlbGF0ZWQgZmlsZXMgd2lsbCBiZSBkaXNwbGF5ZWQgaW4gdGhlIGxpc3QuJyxcbiAgICAgIGNvbmZpZy5leGNsdWRlT3BlblJlbGF0ZWRGaWxlcyxcbiAgICAgICdleGNsdWRlT3BlblJlbGF0ZWRGaWxlcycsXG4gICAgKTtcbiAgfVxufVxuIiwiaW1wb3J0IHsgU3dpdGNoZXJQbHVzU2V0dGluZ3MgfSBmcm9tICdzcmMvc2V0dGluZ3MnO1xuaW1wb3J0IHsgUGF0aERpc3BsYXlGb3JtYXQgfSBmcm9tICdzcmMvdHlwZXMnO1xuaW1wb3J0IHsgU2V0dGluZ3NUYWJTZWN0aW9uIH0gZnJvbSAnLi9zZXR0aW5nc1RhYlNlY3Rpb24nO1xuXG5leHBvcnQgY2xhc3MgR2VuZXJhbFNldHRpbmdzVGFiU2VjdGlvbiBleHRlbmRzIFNldHRpbmdzVGFiU2VjdGlvbiB7XG4gIGRpc3BsYXkoY29udGFpbmVyRWw6IEhUTUxFbGVtZW50KTogdm9pZCB7XG4gICAgdGhpcy5hZGRTZWN0aW9uVGl0bGUoY29udGFpbmVyRWwsICdHZW5lcmFsIFNldHRpbmdzJyk7XG5cbiAgICB0aGlzLmFkZFRvZ2dsZVNldHRpbmcoXG4gICAgICBjb250YWluZXJFbCxcbiAgICAgICdEZWZhdWx0IHRvIG9wZW4gaW4gbmV3IHBhbmUnLFxuICAgICAgJ1doZW4gZW5hYmxlZCwgbmF2aWdhdGluZyB0byB1bi1vcGVuZWQgZmlsZXMgd2lsbCBvcGVuIGEgbmV3IGVkaXRvciBwYW5lIHdoZW5ldmVyIHBvc3NpYmxlIChhcyBpZiBjbWQvY3RybCB3ZXJlIGhlbGQpLiBXaGVuIHRoZSBmaWxlIGlzIGFscmVhZHkgb3BlbiwgdGhlIGV4aXN0aW5nIHBhbmUgd2lsbCBiZSBhY3RpdmF0ZWQuIFRoaXMgb3ZlcnJpZGVzIGFsbCBvdGhlciBwYW5lIHNldHRpbmdzLicsXG4gICAgICB0aGlzLmNvbmZpZy5vbk9wZW5QcmVmZXJOZXdQYW5lLFxuICAgICAgJ29uT3BlblByZWZlck5ld1BhbmUnLFxuICAgICk7XG5cbiAgICB0aGlzLnNldFBhdGhEaXNwbGF5Rm9ybWF0KGNvbnRhaW5lckVsLCB0aGlzLmNvbmZpZyk7XG4gIH1cblxuICBzZXRQYXRoRGlzcGxheUZvcm1hdChjb250YWluZXJFbDogSFRNTEVsZW1lbnQsIGNvbmZpZzogU3dpdGNoZXJQbHVzU2V0dGluZ3MpOiB2b2lkIHtcbiAgICBjb25zdCBvcHRpb25zOiBSZWNvcmQ8c3RyaW5nLCBzdHJpbmc+ID0ge307XG4gICAgb3B0aW9uc1tQYXRoRGlzcGxheUZvcm1hdC5Ob25lLnRvU3RyaW5nKCldID0gJ0hpZGUgcGF0aCc7XG4gICAgb3B0aW9uc1tQYXRoRGlzcGxheUZvcm1hdC5GdWxsLnRvU3RyaW5nKCldID0gJ0Z1bGwgcGF0aCc7XG4gICAgb3B0aW9uc1tQYXRoRGlzcGxheUZvcm1hdC5Gb2xkZXJPbmx5LnRvU3RyaW5nKCldID0gJ09ubHkgcGFyZW50IGZvbGRlcic7XG4gICAgb3B0aW9uc1tQYXRoRGlzcGxheUZvcm1hdC5Gb2xkZXJXaXRoRmlsZW5hbWUudG9TdHJpbmcoKV0gPSAnUGFyZW50IGZvbGRlciAmIGZpbGVuYW1lJztcbiAgICBvcHRpb25zW1BhdGhEaXNwbGF5Rm9ybWF0LkZvbGRlclBhdGhGaWxlbmFtZU9wdGlvbmFsLnRvU3RyaW5nKCldID1cbiAgICAgICdQYXJlbnQgZm9sZGVyIHBhdGggKGZpbGVuYW1lIG9wdGlvbmFsKSc7XG5cbiAgICB0aGlzLmFkZERyb3Bkb3duU2V0dGluZyhcbiAgICAgIGNvbnRhaW5lckVsLFxuICAgICAgJ1ByZWZlcnJlZCBmaWxlIHBhdGggZGlzcGxheSBmb3JtYXQnLFxuICAgICAgJ1RoZSBwcmVmZXJyZWQgd2F5IHRvIGRpc3BsYXkgZmlsZSBwYXRocyBpbiBzdWdnZXN0aW9ucycsXG4gICAgICBjb25maWcucGF0aERpc3BsYXlGb3JtYXQudG9TdHJpbmcoKSxcbiAgICAgIG9wdGlvbnMsXG4gICAgICBudWxsLFxuICAgICAgKHJhd1ZhbHVlLCBjb25maWcpID0+IHtcbiAgICAgICAgY29uZmlnLnBhdGhEaXNwbGF5Rm9ybWF0ID0gTnVtYmVyKHJhd1ZhbHVlKTtcbiAgICAgICAgY29uZmlnLnNhdmUoKTtcbiAgICAgIH0sXG4gICAgKTtcbiAgfVxufVxuIiwiaW1wb3J0IHsgU2V0dGluZ3NUYWJTZWN0aW9uIH0gZnJvbSAnLi9zZXR0aW5nc1RhYlNlY3Rpb24nO1xuXG5leHBvcnQgY2xhc3MgV29ya3NwYWNlU2V0dGluZ3NUYWJTZWN0aW9uIGV4dGVuZHMgU2V0dGluZ3NUYWJTZWN0aW9uIHtcbiAgZGlzcGxheShjb250YWluZXJFbDogSFRNTEVsZW1lbnQpOiB2b2lkIHtcbiAgICBjb25zdCB7IGNvbmZpZyB9ID0gdGhpcztcblxuICAgIHRoaXMuYWRkU2VjdGlvblRpdGxlKGNvbnRhaW5lckVsLCAnV29ya3NwYWNlIExpc3QgTW9kZSBTZXR0aW5ncycpO1xuXG4gICAgdGhpcy5hZGRUZXh0U2V0dGluZyhcbiAgICAgIGNvbnRhaW5lckVsLFxuICAgICAgJ1dvcmtzcGFjZSBsaXN0IG1vZGUgdHJpZ2dlcicsXG4gICAgICAnQ2hhcmFjdGVyIHRoYXQgd2lsbCB0cmlnZ2VyIHdvcmtzcGFjZSBsaXN0IG1vZGUgaW4gdGhlIHN3aXRjaGVyJyxcbiAgICAgIGNvbmZpZy53b3Jrc3BhY2VMaXN0Q29tbWFuZCxcbiAgICAgICd3b3Jrc3BhY2VMaXN0Q29tbWFuZCcsXG4gICAgICBjb25maWcud29ya3NwYWNlTGlzdFBsYWNlaG9sZGVyVGV4dCxcbiAgICApO1xuICB9XG59XG4iLCJpbXBvcnQgeyBTd2l0Y2hlclBsdXNTZXR0aW5ncyB9IGZyb20gJy4vc3dpdGNoZXJQbHVzU2V0dGluZ3MnO1xuaW1wb3J0IHsgU2V0dGluZ3NUYWJTZWN0aW9uIH0gZnJvbSAnLi9zZXR0aW5nc1RhYlNlY3Rpb24nO1xuXG5leHBvcnQgY2xhc3MgRWRpdG9yU2V0dGluZ3NUYWJTZWN0aW9uIGV4dGVuZHMgU2V0dGluZ3NUYWJTZWN0aW9uIHtcbiAgZGlzcGxheShjb250YWluZXJFbDogSFRNTEVsZW1lbnQpOiB2b2lkIHtcbiAgICBjb25zdCB7IGNvbmZpZyB9ID0gdGhpcztcblxuICAgIHRoaXMuYWRkU2VjdGlvblRpdGxlKGNvbnRhaW5lckVsLCAnRWRpdG9yIExpc3QgTW9kZSBTZXR0aW5ncycpO1xuXG4gICAgdGhpcy5hZGRUZXh0U2V0dGluZyhcbiAgICAgIGNvbnRhaW5lckVsLFxuICAgICAgJ0VkaXRvciBsaXN0IG1vZGUgdHJpZ2dlcicsXG4gICAgICAnQ2hhcmFjdGVyIHRoYXQgd2lsbCB0cmlnZ2VyIGVkaXRvciBsaXN0IG1vZGUgaW4gdGhlIHN3aXRjaGVyJyxcbiAgICAgIGNvbmZpZy5lZGl0b3JMaXN0Q29tbWFuZCxcbiAgICAgICdlZGl0b3JMaXN0Q29tbWFuZCcsXG4gICAgICBjb25maWcuZWRpdG9yTGlzdFBsYWNlaG9sZGVyVGV4dCxcbiAgICApO1xuXG4gICAgdGhpcy5zZXRJbmNsdWRlU2lkZVBhbmVsVmlld3MoY29udGFpbmVyRWwsIGNvbmZpZyk7XG4gIH1cblxuICBzZXRJbmNsdWRlU2lkZVBhbmVsVmlld3MoY29udGFpbmVyRWw6IEhUTUxFbGVtZW50LCBjb25maWc6IFN3aXRjaGVyUGx1c1NldHRpbmdzKSB7XG4gICAgY29uc3Qgdmlld3NMaXN0aW5nID0gT2JqZWN0LmtleXModGhpcy5hcHAudmlld1JlZ2lzdHJ5LnZpZXdCeVR5cGUpLnNvcnQoKS5qb2luKCcgJyk7XG4gICAgY29uc3QgZGVzYyA9IGBXaGVuIGluIEVkaXRvciBsaXN0IG1vZGUsIHNob3cgdGhlIGZvbGxvd2luZyB2aWV3IHR5cGVzIGZyb20gdGhlIHNpZGUgcGFuZWxzLiBBZGQgb25lIHZpZXcgdHlwZSBwZXIgbGluZS4gQXZhaWxhYmxlIHZpZXcgdHlwZXM6ICR7dmlld3NMaXN0aW5nfWA7XG5cbiAgICB0aGlzLmFkZFRleHRBcmVhU2V0dGluZyhcbiAgICAgIGNvbnRhaW5lckVsLFxuICAgICAgJ0luY2x1ZGUgc2lkZSBwYW5lbCB2aWV3cycsXG4gICAgICBkZXNjLFxuICAgICAgY29uZmlnLmluY2x1ZGVTaWRlUGFuZWxWaWV3VHlwZXMuam9pbignXFxuJyksXG4gICAgICAnaW5jbHVkZVNpZGVQYW5lbFZpZXdUeXBlcycsXG4gICAgICBjb25maWcuaW5jbHVkZVNpZGVQYW5lbFZpZXdUeXBlc1BsYWNlaG9sZGVyLFxuICAgICk7XG4gIH1cbn1cbiIsImltcG9ydCB7IFN3aXRjaGVyUGx1c1NldHRpbmdzIH0gZnJvbSAnLi9zd2l0Y2hlclBsdXNTZXR0aW5ncyc7XG5pbXBvcnQgeyBTZXR0aW5nc1RhYlNlY3Rpb24gfSBmcm9tICcuL3NldHRpbmdzVGFiU2VjdGlvbic7XG5pbXBvcnQgeyBNb2RhbCB9IGZyb20gJ29ic2lkaWFuJztcblxuZXhwb3J0IGNsYXNzIEhlYWRpbmdzU2V0dGluZ3NUYWJTZWN0aW9uIGV4dGVuZHMgU2V0dGluZ3NUYWJTZWN0aW9uIHtcbiAgZGlzcGxheShjb250YWluZXJFbDogSFRNTEVsZW1lbnQpOiB2b2lkIHtcbiAgICBjb25zdCB7IGNvbmZpZyB9ID0gdGhpcztcblxuICAgIHRoaXMuYWRkU2VjdGlvblRpdGxlKGNvbnRhaW5lckVsLCAnSGVhZGluZ3MgTGlzdCBNb2RlIFNldHRpbmdzJyk7XG5cbiAgICB0aGlzLmFkZFRleHRTZXR0aW5nKFxuICAgICAgY29udGFpbmVyRWwsXG4gICAgICAnSGVhZGluZ3MgbGlzdCBtb2RlIHRyaWdnZXInLFxuICAgICAgJ0NoYXJhY3RlciB0aGF0IHdpbGwgdHJpZ2dlciBoZWFkaW5ncyBsaXN0IG1vZGUgaW4gdGhlIHN3aXRjaGVyJyxcbiAgICAgIGNvbmZpZy5oZWFkaW5nc0xpc3RDb21tYW5kLFxuICAgICAgJ2hlYWRpbmdzTGlzdENvbW1hbmQnLFxuICAgICAgY29uZmlnLmhlYWRpbmdzTGlzdFBsYWNlaG9sZGVyVGV4dCxcbiAgICApO1xuXG4gICAgdGhpcy5hZGRUb2dnbGVTZXR0aW5nKFxuICAgICAgY29udGFpbmVyRWwsXG4gICAgICAnU2hvdyBoZWFkaW5ncyBvbmx5JyxcbiAgICAgICdFbmFibGVkLCBzdHJpY3RseSBzZWFyY2ggdGhyb3VnaCBvbmx5IHRoZSBoZWFkaW5ncyBjb250YWluZWQgaW4gdGhlIGZpbGUuIE5vdGU6IHRoaXMgc2V0dGluZyBvdmVycmlkZXMgdGhlIFwiU2hvdyBleGlzdGluZyBvbmx5XCIsIGFuZCBcIlNlYXJjaCBmaWxlbmFtZXNcIiBzZXR0aW5ncy4gRGlzYWJsZWQsIGZhbGxiYWNrIHRvIHNlYXJjaGluZyBhZ2FpbnN0IHRoZSBmaWxlbmFtZSB3aGVuIHRoZXJlIGlzIG5vdCBhIG1hdGNoIGluIHRoZSBmaXJzdCBIMSBjb250YWluZWQgaW4gdGhlIGZpbGUuIFRoaXMgd2lsbCBhbHNvIGFsbG93IHNlYXJjaGluZyB0aHJvdWdoIGZpbGVuYW1lcywgQWxpYXNlcywgYW5kIFVucmVzb2x2ZWQgbGlua3MgdG8gYmUgZW5hYmxlZC4nLFxuICAgICAgY29uZmlnLnN0cmljdEhlYWRpbmdzT25seSxcbiAgICAgICdzdHJpY3RIZWFkaW5nc09ubHknLFxuICAgICk7XG5cbiAgICB0aGlzLmFkZFRvZ2dsZVNldHRpbmcoXG4gICAgICBjb250YWluZXJFbCxcbiAgICAgICdTZWFyY2ggYWxsIGhlYWRpbmdzJyxcbiAgICAgICdFbmFibGVkLCBzZWFyY2ggdGhyb3VnaCBhbGwgaGVhZGluZ3MgY29udGFpbmVkIGluIGVhY2ggZmlsZS4gRGlzYWJsZWQsIG9ubHkgc2VhcmNoIHRocm91Z2ggdGhlIGZpcnN0IEgxIGluIGVhY2ggZmlsZS4nLFxuICAgICAgY29uZmlnLnNlYXJjaEFsbEhlYWRpbmdzLFxuICAgICAgJ3NlYXJjaEFsbEhlYWRpbmdzJyxcbiAgICApO1xuXG4gICAgdGhpcy5hZGRUb2dnbGVTZXR0aW5nKFxuICAgICAgY29udGFpbmVyRWwsXG4gICAgICAnU2VhcmNoIGZpbGVuYW1lcycsXG4gICAgICBcIkVuYWJsZWQsIHNlYXJjaCBhbmQgc2hvdyBzdWdnZXN0aW9ucyBmb3IgZmlsZW5hbWVzLiBEaXNhYmxlZCwgRG9uJ3Qgc2VhcmNoIHRocm91Z2ggZmlsZW5hbWVzIChleGNlcHQgZm9yIGZhbGxiYWNrIHNlYXJjaGVzKVwiLFxuICAgICAgY29uZmlnLnNob3VsZFNlYXJjaEZpbGVuYW1lcyxcbiAgICAgICdzaG91bGRTZWFyY2hGaWxlbmFtZXMnLFxuICAgICk7XG5cbiAgICB0aGlzLnNldEV4Y2x1ZGVGb2xkZXJzKGNvbnRhaW5lckVsLCBjb25maWcpO1xuXG4gICAgdGhpcy5hZGRUb2dnbGVTZXR0aW5nKFxuICAgICAgY29udGFpbmVyRWwsXG4gICAgICAnSGlkZSBPYnNpZGlhbiBcIkV4Y2x1ZGVkIGZpbGVzXCInLFxuICAgICAgJ0VuYWJsZWQsIGRvIG5vdCBkaXNwbGF5IHN1Z2dlc3Rpb25zIGZvciBmaWxlcyB0aGF0IGFyZSBpbiBPYnNpZGlhblxcJ3MgXCJPcHRpb25zID4gRmlsZXMgJiBMaW5rcyA+IEV4Y2x1ZGVkIGZpbGVzXCIgbGlzdC4gRGlzYWJsZWQsIHN1Z2dlc3Rpb25zIGZvciB0aG9zZSBmaWxlcyB3aWxsIGJlIGRpc3BsYXllZCBidXQgZG93bnJhbmtlZC4nLFxuICAgICAgY29uZmlnLmV4Y2x1ZGVPYnNpZGlhbklnbm9yZWRGaWxlcyxcbiAgICAgICdleGNsdWRlT2JzaWRpYW5JZ25vcmVkRmlsZXMnLFxuICAgICk7XG4gIH1cblxuICBzZXRFeGNsdWRlRm9sZGVycyhjb250YWluZXJFbDogSFRNTEVsZW1lbnQsIGNvbmZpZzogU3dpdGNoZXJQbHVzU2V0dGluZ3MpOiB2b2lkIHtcbiAgICBjb25zdCBzZXR0aW5nTmFtZSA9ICdFeGNsdWRlIGZvbGRlcnMnO1xuXG4gICAgdGhpcy5jcmVhdGVTZXR0aW5nKFxuICAgICAgY29udGFpbmVyRWwsXG4gICAgICBzZXR0aW5nTmFtZSxcbiAgICAgICdXaGVuIGluIEhlYWRpbmdzIGxpc3QgbW9kZSwgZm9sZGVyIHBhdGggdGhhdCBtYXRjaCBhbnkgcmVnZXggbGlzdGVkIGhlcmUgd2lsbCBub3QgYmUgc2VhcmNoZWQgZm9yIHN1Z2dlc3Rpb25zLiBQYXRoIHNob3VsZCBzdGFydCBmcm9tIHRoZSBWYXVsdCBSb290LiBBZGQgb25lIHBhdGggcGVyIGxpbmUuJyxcbiAgICApLmFkZFRleHRBcmVhKCh0ZXh0QXJlYSkgPT4ge1xuICAgICAgdGV4dEFyZWEuc2V0VmFsdWUoY29uZmlnLmV4Y2x1ZGVGb2xkZXJzLmpvaW4oJ1xcbicpKTtcbiAgICAgIHRleHRBcmVhLmlucHV0RWwuYWRkRXZlbnRMaXN0ZW5lcignYmx1cicsICgpID0+IHtcbiAgICAgICAgY29uc3QgZXhjbHVkZXMgPSB0ZXh0QXJlYVxuICAgICAgICAgIC5nZXRWYWx1ZSgpXG4gICAgICAgICAgLnNwbGl0KCdcXG4nKVxuICAgICAgICAgIC5maWx0ZXIoKHYpID0+IHYubGVuZ3RoID4gMCk7XG5cbiAgICAgICAgaWYgKHRoaXMudmFsaWRhdGVFeGNsdWRlRm9sZGVyTGlzdChzZXR0aW5nTmFtZSwgZXhjbHVkZXMpKSB7XG4gICAgICAgICAgY29uZmlnLmV4Y2x1ZGVGb2xkZXJzID0gZXhjbHVkZXM7XG4gICAgICAgICAgY29uZmlnLnNhdmUoKTtcbiAgICAgICAgfVxuICAgICAgfSk7XG4gICAgfSk7XG4gIH1cblxuICB2YWxpZGF0ZUV4Y2x1ZGVGb2xkZXJMaXN0KHNldHRpbmdOYW1lOiBzdHJpbmcsIGV4Y2x1ZGVzOiBzdHJpbmdbXSkge1xuICAgIGxldCBpc1ZhbGlkID0gdHJ1ZTtcbiAgICBsZXQgZmFpbGVkTXNnID0gJyc7XG5cbiAgICBmb3IgKGNvbnN0IHN0ciBvZiBleGNsdWRlcykge1xuICAgICAgdHJ5IHtcbiAgICAgICAgbmV3IFJlZ0V4cChzdHIpO1xuICAgICAgfSBjYXRjaCAoZXJyKSB7XG4gICAgICAgIC8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSBAdHlwZXNjcmlwdC1lc2xpbnQvcmVzdHJpY3QtdGVtcGxhdGUtZXhwcmVzc2lvbnNcbiAgICAgICAgZmFpbGVkTXNnICs9IGA8c3BhbiBjbGFzcz1cInFzcC13YXJuaW5nXCI+JHtzdHJ9PC9zcGFuPjxici8+JHtlcnJ9PGJyLz48YnIvPmA7XG4gICAgICAgIGlzVmFsaWQgPSBmYWxzZTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICBpZiAoIWlzVmFsaWQpIHtcbiAgICAgIGNvbnN0IHBvcHVwID0gbmV3IE1vZGFsKHRoaXMuYXBwKTtcbiAgICAgIHBvcHVwLnRpdGxlRWwuc2V0VGV4dChzZXR0aW5nTmFtZSk7XG4gICAgICBwb3B1cC5jb250ZW50RWwuaW5uZXJIVE1MID0gYENoYW5nZXMgbm90IHNhdmVkLiBUaGUgZm9sbG93aW5nIHJlZ2V4IGNvbnRhaW4gZXJyb3JzOjxici8+PGJyLz4ke2ZhaWxlZE1zZ31gO1xuICAgICAgcG9wdXAub3BlbigpO1xuICAgIH1cblxuICAgIHJldHVybiBpc1ZhbGlkO1xuICB9XG59XG4iLCJpbXBvcnQgeyBTdGFycmVkU2V0dGluZ3NUYWJTZWN0aW9uIH0gZnJvbSAnLi9zdGFycmVkU2V0dGluZ3NUYWJTZWN0aW9uJztcbmltcG9ydCB7IENvbW1hbmRMaXN0U2V0dGluZ3NUYWJTZWN0aW9uIH0gZnJvbSAnLi9jb21tYW5kTGlzdFNldHRpbmdzVGFiU2VjdGlvbic7XG5pbXBvcnQgeyBSZWxhdGVkSXRlbXNTZXR0aW5nc1RhYlNlY3Rpb24gfSBmcm9tICcuL3JlbGF0ZWRJdGVtc1NldHRpbmdzVGFiU2VjdGlvbic7XG5pbXBvcnQgeyBHZW5lcmFsU2V0dGluZ3NUYWJTZWN0aW9uIH0gZnJvbSAnLi9nZW5lcmFsU2V0dGluZ3NUYWJTZWN0aW9uJztcbmltcG9ydCB7IFdvcmtzcGFjZVNldHRpbmdzVGFiU2VjdGlvbiB9IGZyb20gJy4vd29ya3NwYWNlU2V0dGluZ3NUYWJTZWN0aW9uJztcbmltcG9ydCB7IEVkaXRvclNldHRpbmdzVGFiU2VjdGlvbiB9IGZyb20gJy4vZWRpdG9yU2V0dGluZ3NUYWJTZWN0aW9uJztcbmltcG9ydCB7IEhlYWRpbmdzU2V0dGluZ3NUYWJTZWN0aW9uIH0gZnJvbSAnLi9oZWFkaW5nc1NldHRpbmdzVGFiU2VjdGlvbic7XG5pbXBvcnQgeyBTd2l0Y2hlclBsdXNTZXR0aW5ncyB9IGZyb20gJy4vc3dpdGNoZXJQbHVzU2V0dGluZ3MnO1xuaW1wb3J0IHsgQXBwLCBQbHVnaW5TZXR0aW5nVGFiLCBTZXR0aW5nIH0gZnJvbSAnb2JzaWRpYW4nO1xuaW1wb3J0IHsgTGlua1R5cGUsIFN5bWJvbFR5cGUgfSBmcm9tICdzcmMvdHlwZXMnO1xuaW1wb3J0IHR5cGUgU3dpdGNoZXJQbHVzUGx1Z2luIGZyb20gJy4uL21haW4nO1xuXG5leHBvcnQgY2xhc3MgU3dpdGNoZXJQbHVzU2V0dGluZ1RhYiBleHRlbmRzIFBsdWdpblNldHRpbmdUYWIge1xuICBjb25zdHJ1Y3RvcihcbiAgICBhcHA6IEFwcCxcbiAgICBwbHVnaW46IFN3aXRjaGVyUGx1c1BsdWdpbixcbiAgICBwcml2YXRlIGNvbmZpZzogU3dpdGNoZXJQbHVzU2V0dGluZ3MsXG4gICkge1xuICAgIHN1cGVyKGFwcCwgcGx1Z2luKTtcbiAgfVxuXG4gIGRpc3BsYXkoKTogdm9pZCB7XG4gICAgY29uc3QgeyBhcHAsIGNvbnRhaW5lckVsLCBjb25maWcgfSA9IHRoaXM7XG4gICAgY29uc3QgZ2VuZXJhbFNlY3Rpb24gPSBuZXcgR2VuZXJhbFNldHRpbmdzVGFiU2VjdGlvbihhcHAsIHRoaXMsIGNvbmZpZyk7XG4gICAgY29uc3QgdGFiU2VjdGlvbnMgPSBbXG4gICAgICBIZWFkaW5nc1NldHRpbmdzVGFiU2VjdGlvbixcbiAgICAgIEVkaXRvclNldHRpbmdzVGFiU2VjdGlvbixcbiAgICAgIFJlbGF0ZWRJdGVtc1NldHRpbmdzVGFiU2VjdGlvbixcbiAgICAgIFN0YXJyZWRTZXR0aW5nc1RhYlNlY3Rpb24sXG4gICAgICBDb21tYW5kTGlzdFNldHRpbmdzVGFiU2VjdGlvbixcbiAgICAgIFdvcmtzcGFjZVNldHRpbmdzVGFiU2VjdGlvbixcbiAgICBdO1xuXG4gICAgY29udGFpbmVyRWwuZW1wdHkoKTtcbiAgICBjb250YWluZXJFbC5jcmVhdGVFbCgnaDInLCB7IHRleHQ6ICdRdWljayBTd2l0Y2hlcisrIFNldHRpbmdzJyB9KTtcblxuICAgIGdlbmVyYWxTZWN0aW9uLmRpc3BsYXkoY29udGFpbmVyRWwpO1xuXG4gICAgdGhpcy5zZXRTeW1ib2xNb2RlU2V0dGluZ3NHcm91cChjb250YWluZXJFbCwgY29uZmlnKTtcblxuICAgIHRhYlNlY3Rpb25zLmZvckVhY2goKHRhYlNlY3Rpb25DbGFzcykgPT4ge1xuICAgICAgY29uc3QgdGFiU2VjdGlvbiA9IG5ldyB0YWJTZWN0aW9uQ2xhc3MoYXBwLCB0aGlzLCBjb25maWcpO1xuICAgICAgdGFiU2VjdGlvbi5kaXNwbGF5KGNvbnRhaW5lckVsKTtcbiAgICB9KTtcbiAgfVxuXG4gIHByaXZhdGUgc2V0U3ltYm9sTW9kZVNldHRpbmdzR3JvdXAoXG4gICAgY29udGFpbmVyRWw6IEhUTUxFbGVtZW50LFxuICAgIGNvbmZpZzogU3dpdGNoZXJQbHVzU2V0dGluZ3MsXG4gICk6IHZvaWQge1xuICAgIG5ldyBTZXR0aW5nKGNvbnRhaW5lckVsKS5zZXRIZWFkaW5nKCkuc2V0TmFtZSgnU3ltYm9sIExpc3QgTW9kZSBTZXR0aW5ncycpO1xuXG4gICAgU3dpdGNoZXJQbHVzU2V0dGluZ1RhYi5zZXRTeW1ib2xMaXN0Q29tbWFuZChjb250YWluZXJFbCwgY29uZmlnKTtcbiAgICBTd2l0Y2hlclBsdXNTZXR0aW5nVGFiLnNldFN5bWJvbHNJbkxpbmVPcmRlcihjb250YWluZXJFbCwgY29uZmlnKTtcbiAgICBTd2l0Y2hlclBsdXNTZXR0aW5nVGFiLnNldEFsd2F5c05ld1BhbmVGb3JTeW1ib2xzKGNvbnRhaW5lckVsLCBjb25maWcpO1xuICAgIFN3aXRjaGVyUGx1c1NldHRpbmdUYWIuc2V0VXNlQWN0aXZlUGFuZUZvclN5bWJvbHNPbk1vYmlsZShjb250YWluZXJFbCwgY29uZmlnKTtcbiAgICBTd2l0Y2hlclBsdXNTZXR0aW5nVGFiLnNldFNlbGVjdE5lYXJlc3RIZWFkaW5nKGNvbnRhaW5lckVsLCBjb25maWcpO1xuICAgIHRoaXMuc2V0RW5hYmxlZFN5bWJvbFR5cGVzKGNvbnRhaW5lckVsLCBjb25maWcpO1xuICB9XG5cbiAgcHJpdmF0ZSBzdGF0aWMgc2V0QWx3YXlzTmV3UGFuZUZvclN5bWJvbHMoXG4gICAgY29udGFpbmVyRWw6IEhUTUxFbGVtZW50LFxuICAgIGNvbmZpZzogU3dpdGNoZXJQbHVzU2V0dGluZ3MsXG4gICk6IHZvaWQge1xuICAgIG5ldyBTZXR0aW5nKGNvbnRhaW5lckVsKVxuICAgICAgLnNldE5hbWUoJ09wZW4gU3ltYm9scyBpbiBuZXcgcGFuZScpXG4gICAgICAuc2V0RGVzYyhcbiAgICAgICAgJ0VuYWJsZWQsIGFsd2F5cyBvcGVuIGEgbmV3IHBhbmUgd2hlbiBuYXZpZ2F0aW5nIHRvIFN5bWJvbHMuIERpc2FibGVkLCBuYXZpZ2F0ZSBpbiBhbiBhbHJlYWR5IG9wZW4gcGFuZSAoaWYgb25lIGV4aXN0cyknLFxuICAgICAgKVxuICAgICAgLmFkZFRvZ2dsZSgodG9nZ2xlKSA9PlxuICAgICAgICB0b2dnbGUuc2V0VmFsdWUoY29uZmlnLmFsd2F5c05ld1BhbmVGb3JTeW1ib2xzKS5vbkNoYW5nZSgodmFsdWUpID0+IHtcbiAgICAgICAgICBjb25maWcuYWx3YXlzTmV3UGFuZUZvclN5bWJvbHMgPSB2YWx1ZTtcbiAgICAgICAgICBjb25maWcuc2F2ZSgpO1xuICAgICAgICB9KSxcbiAgICAgICk7XG4gIH1cblxuICBwcml2YXRlIHN0YXRpYyBzZXRVc2VBY3RpdmVQYW5lRm9yU3ltYm9sc09uTW9iaWxlKFxuICAgIGNvbnRhaW5lckVsOiBIVE1MRWxlbWVudCxcbiAgICBjb25maWc6IFN3aXRjaGVyUGx1c1NldHRpbmdzLFxuICApOiB2b2lkIHtcbiAgICBuZXcgU2V0dGluZyhjb250YWluZXJFbClcbiAgICAgIC5zZXROYW1lKCdPcGVuIFN5bWJvbHMgaW4gYWN0aXZlIHBhbmUgb24gbW9iaWxlIGRldmljZXMnKVxuICAgICAgLnNldERlc2MoXG4gICAgICAgICdFbmFibGVkLCBuYXZpZ2F0ZSB0byB0aGUgdGFyZ2V0IGZpbGUgYW5kIHN5bWJvbCBpbiB0aGUgYWN0aXZlIGVkaXRvciBwYW5lLiBEaXNhYmxlZCwgb3BlbiBhIG5ldyBwYW5lIHdoZW4gbmF2aWdhdGluZyB0byBTeW1ib2xzLCBldmVuIG9uIG1vYmlsZSBkZXZpY2VzLicsXG4gICAgICApXG4gICAgICAuYWRkVG9nZ2xlKCh0b2dnbGUpID0+XG4gICAgICAgIHRvZ2dsZS5zZXRWYWx1ZShjb25maWcudXNlQWN0aXZlUGFuZUZvclN5bWJvbHNPbk1vYmlsZSkub25DaGFuZ2UoKHZhbHVlKSA9PiB7XG4gICAgICAgICAgY29uZmlnLnVzZUFjdGl2ZVBhbmVGb3JTeW1ib2xzT25Nb2JpbGUgPSB2YWx1ZTtcbiAgICAgICAgICBjb25maWcuc2F2ZSgpO1xuICAgICAgICB9KSxcbiAgICAgICk7XG4gIH1cblxuICBwcml2YXRlIHN0YXRpYyBzZXRTZWxlY3ROZWFyZXN0SGVhZGluZyhcbiAgICBjb250YWluZXJFbDogSFRNTEVsZW1lbnQsXG4gICAgY29uZmlnOiBTd2l0Y2hlclBsdXNTZXR0aW5ncyxcbiAgKTogdm9pZCB7XG4gICAgbmV3IFNldHRpbmcoY29udGFpbmVyRWwpXG4gICAgICAuc2V0TmFtZSgnQXV0by1zZWxlY3QgbmVhcmVzdCBoZWFkaW5nJylcbiAgICAgIC5zZXREZXNjKFxuICAgICAgICAnRW5hYmxlZCwgaW4gYW4gdW5maWx0ZXJlZCBzeW1ib2wgbGlzdCwgc2VsZWN0IHRoZSBjbG9zZXN0IHByZWNlZGluZyBIZWFkaW5nIHRvIHRoZSBjdXJyZW50IGN1cnNvciBwb3NpdGlvbi4gRGlzYWJsZWQsIHRoZSBmaXJzdCBzeW1ib2wgaW4gdGhlIGxpc3QgaXMgc2VsZWN0ZWQuJyxcbiAgICAgIClcbiAgICAgIC5hZGRUb2dnbGUoKHRvZ2dsZSkgPT5cbiAgICAgICAgdG9nZ2xlLnNldFZhbHVlKGNvbmZpZy5zZWxlY3ROZWFyZXN0SGVhZGluZykub25DaGFuZ2UoKHZhbHVlKSA9PiB7XG4gICAgICAgICAgY29uZmlnLnNlbGVjdE5lYXJlc3RIZWFkaW5nID0gdmFsdWU7XG4gICAgICAgICAgY29uZmlnLnNhdmUoKTtcbiAgICAgICAgfSksXG4gICAgICApO1xuICB9XG5cbiAgcHJpdmF0ZSBzdGF0aWMgc2V0U3ltYm9sc0luTGluZU9yZGVyKFxuICAgIGNvbnRhaW5lckVsOiBIVE1MRWxlbWVudCxcbiAgICBjb25maWc6IFN3aXRjaGVyUGx1c1NldHRpbmdzLFxuICApOiB2b2lkIHtcbiAgICBuZXcgU2V0dGluZyhjb250YWluZXJFbClcbiAgICAgIC5zZXROYW1lKCdMaXN0IHN5bWJvbHMgYXMgaW5kZW50ZWQgb3V0bGluZScpXG4gICAgICAuc2V0RGVzYyhcbiAgICAgICAgJ0VuYWJsZWQsIHN5bWJvbHMgd2lsbCBiZSBkaXNwbGF5ZWQgaW4gdGhlIChsaW5lKSBvcmRlciB0aGV5IGFwcGVhciBpbiB0aGUgc291cmNlIHRleHQsIGluZGVudGVkIHVuZGVyIGFueSBwcmVjZWRpbmcgaGVhZGluZy4gRGlzYWJsZWQsIHN5bWJvbHMgd2lsbCBiZSBncm91cGVkIGJ5IHR5cGU6IEhlYWRpbmdzLCBUYWdzLCBMaW5rcywgRW1iZWRzLicsXG4gICAgICApXG4gICAgICAuYWRkVG9nZ2xlKCh0b2dnbGUpID0+XG4gICAgICAgIHRvZ2dsZS5zZXRWYWx1ZShjb25maWcuc3ltYm9sc0luTGluZU9yZGVyKS5vbkNoYW5nZSgodmFsdWUpID0+IHtcbiAgICAgICAgICBjb25maWcuc3ltYm9sc0luTGluZU9yZGVyID0gdmFsdWU7XG4gICAgICAgICAgY29uZmlnLnNhdmUoKTtcbiAgICAgICAgfSksXG4gICAgICApO1xuICB9XG5cbiAgcHJpdmF0ZSBzZXRFbmFibGVkU3ltYm9sVHlwZXMoXG4gICAgY29udGFpbmVyRWw6IEhUTUxFbGVtZW50LFxuICAgIGNvbmZpZzogU3dpdGNoZXJQbHVzU2V0dGluZ3MsXG4gICk6IHZvaWQge1xuICAgIG5ldyBTZXR0aW5nKGNvbnRhaW5lckVsKS5zZXROYW1lKCdTaG93IEhlYWRpbmdzJykuYWRkVG9nZ2xlKCh0b2dnbGUpID0+XG4gICAgICB0b2dnbGVcbiAgICAgICAgLnNldFZhbHVlKGNvbmZpZy5pc1N5bWJvbFR5cGVFbmFibGVkKFN5bWJvbFR5cGUuSGVhZGluZykpXG4gICAgICAgIC5vbkNoYW5nZSgodmFsdWUpID0+IHtcbiAgICAgICAgICBjb25maWcuc2V0U3ltYm9sVHlwZUVuYWJsZWQoU3ltYm9sVHlwZS5IZWFkaW5nLCB2YWx1ZSk7XG4gICAgICAgICAgY29uZmlnLnNhdmUoKTtcbiAgICAgICAgfSksXG4gICAgKTtcblxuICAgIG5ldyBTZXR0aW5nKGNvbnRhaW5lckVsKS5zZXROYW1lKCdTaG93IFRhZ3MnKS5hZGRUb2dnbGUoKHRvZ2dsZSkgPT5cbiAgICAgIHRvZ2dsZS5zZXRWYWx1ZShjb25maWcuaXNTeW1ib2xUeXBlRW5hYmxlZChTeW1ib2xUeXBlLlRhZykpLm9uQ2hhbmdlKCh2YWx1ZSkgPT4ge1xuICAgICAgICBjb25maWcuc2V0U3ltYm9sVHlwZUVuYWJsZWQoU3ltYm9sVHlwZS5UYWcsIHZhbHVlKTtcbiAgICAgICAgY29uZmlnLnNhdmUoKTtcbiAgICAgIH0pLFxuICAgICk7XG5cbiAgICBuZXcgU2V0dGluZyhjb250YWluZXJFbCkuc2V0TmFtZSgnU2hvdyBFbWJlZHMnKS5hZGRUb2dnbGUoKHRvZ2dsZSkgPT5cbiAgICAgIHRvZ2dsZS5zZXRWYWx1ZShjb25maWcuaXNTeW1ib2xUeXBlRW5hYmxlZChTeW1ib2xUeXBlLkVtYmVkKSkub25DaGFuZ2UoKHZhbHVlKSA9PiB7XG4gICAgICAgIGNvbmZpZy5zZXRTeW1ib2xUeXBlRW5hYmxlZChTeW1ib2xUeXBlLkVtYmVkLCB2YWx1ZSk7XG4gICAgICAgIGNvbmZpZy5zYXZlKCk7XG4gICAgICB9KSxcbiAgICApO1xuXG4gICAgdGhpcy5zZXRFbmFibGVMaW5rcyhjb250YWluZXJFbCwgY29uZmlnKTtcbiAgfVxuXG4gIHByaXZhdGUgc2V0RW5hYmxlTGlua3MoY29udGFpbmVyRWw6IEhUTUxFbGVtZW50LCBjb25maWc6IFN3aXRjaGVyUGx1c1NldHRpbmdzKTogdm9pZCB7XG4gICAgY29uc3QgaXNMaW5rc0VuYWJsZWQgPSBjb25maWcuaXNTeW1ib2xUeXBlRW5hYmxlZChTeW1ib2xUeXBlLkxpbmspO1xuXG4gICAgbmV3IFNldHRpbmcoY29udGFpbmVyRWwpLnNldE5hbWUoJ1Nob3cgTGlua3MnKS5hZGRUb2dnbGUoKHRvZ2dsZSkgPT4ge1xuICAgICAgdG9nZ2xlLnNldFZhbHVlKGlzTGlua3NFbmFibGVkKS5vbkNoYW5nZShhc3luYyAodmFsdWUpID0+IHtcbiAgICAgICAgY29uZmlnLnNldFN5bWJvbFR5cGVFbmFibGVkKFN5bWJvbFR5cGUuTGluaywgdmFsdWUpO1xuXG4gICAgICAgIC8vIGhhdmUgdG8gYXdhaXQgdGhlIHNhdmUgaGVyZSBiZWNhdXNlIHRoZSBjYWxsIHRvIGRpc3BsYXkoKSB3aWxsIHRyaWdnZXIgYSByZWFkXG4gICAgICAgIC8vIG9mIHRoZSB1cGRhdGVkIGRhdGFcbiAgICAgICAgYXdhaXQgY29uZmlnLnNhdmVTZXR0aW5ncygpO1xuXG4gICAgICAgIC8vIHJlbG9hZCB0aGUgc2V0dGluZ3MgcGFuZWwuIFRoaXMgd2lsbCBjYXVzZSB0aGUgc3VibGluayB0eXBlcyB0b2dnbGVcbiAgICAgICAgLy8gY29udHJvbHMgdG8gYmUgc2hvd24vaGlkZGVuIGJhc2VkIG9uIGlzTGlua3NFbmFibGVkIHN0YXR1c1xuICAgICAgICB0aGlzLmRpc3BsYXkoKTtcbiAgICAgIH0pO1xuICAgIH0pO1xuXG4gICAgaWYgKGlzTGlua3NFbmFibGVkKSB7XG4gICAgICBTd2l0Y2hlclBsdXNTZXR0aW5nVGFiLmFkZFN1YkxpbmtUeXBlVG9nZ2xlKFxuICAgICAgICBjb250YWluZXJFbCxcbiAgICAgICAgY29uZmlnLFxuICAgICAgICBMaW5rVHlwZS5IZWFkaW5nLFxuICAgICAgICAnTGlua3MgdG8gaGVhZGluZ3MnLFxuICAgICAgKTtcblxuICAgICAgU3dpdGNoZXJQbHVzU2V0dGluZ1RhYi5hZGRTdWJMaW5rVHlwZVRvZ2dsZShcbiAgICAgICAgY29udGFpbmVyRWwsXG4gICAgICAgIGNvbmZpZyxcbiAgICAgICAgTGlua1R5cGUuQmxvY2ssXG4gICAgICAgICdMaW5rcyB0byBibG9ja3MnLFxuICAgICAgKTtcbiAgICB9XG4gIH1cblxuICBwcml2YXRlIHN0YXRpYyBhZGRTdWJMaW5rVHlwZVRvZ2dsZShcbiAgICBjb250YWluZXJFbDogSFRNTEVsZW1lbnQsXG4gICAgY29uZmlnOiBTd2l0Y2hlclBsdXNTZXR0aW5ncyxcbiAgICBsaW5rVHlwZTogTGlua1R5cGUsXG4gICAgbmFtZTogc3RyaW5nLFxuICApOiB2b2lkIHtcbiAgICBuZXcgU2V0dGluZyhjb250YWluZXJFbClcbiAgICAgIC5zZXRDbGFzcygncXNwLXNldHRpbmctaXRlbS1pbmRlbnQnKVxuICAgICAgLnNldE5hbWUobmFtZSlcbiAgICAgIC5hZGRUb2dnbGUoKHRvZ2dsZSkgPT4ge1xuICAgICAgICBjb25zdCBpc0V4Y2x1ZGVkID0gKGNvbmZpZy5leGNsdWRlTGlua1N1YlR5cGVzICYgbGlua1R5cGUpID09PSBsaW5rVHlwZTtcblxuICAgICAgICB0b2dnbGUuc2V0VmFsdWUoIWlzRXhjbHVkZWQpLm9uQ2hhbmdlKChpc0VuYWJsZWQpID0+IHtcbiAgICAgICAgICBsZXQgZXhjbHVzaW9ucyA9IGNvbmZpZy5leGNsdWRlTGlua1N1YlR5cGVzO1xuXG4gICAgICAgICAgaWYgKGlzRW5hYmxlZCkge1xuICAgICAgICAgICAgLy8gcmVtb3ZlIGZyb20gZXhjbHVzaW9uIGxpc3RcbiAgICAgICAgICAgIGV4Y2x1c2lvbnMgJj0gfmxpbmtUeXBlO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAvLyBhZGQgdG8gZXhjbHVzaW9uIGxpc3RcbiAgICAgICAgICAgIGV4Y2x1c2lvbnMgfD0gbGlua1R5cGU7XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgY29uZmlnLmV4Y2x1ZGVMaW5rU3ViVHlwZXMgPSBleGNsdXNpb25zO1xuICAgICAgICAgIGNvbmZpZy5zYXZlKCk7XG4gICAgICAgIH0pO1xuICAgICAgfSk7XG4gIH1cblxuICBwcml2YXRlIHN0YXRpYyBzZXRTeW1ib2xMaXN0Q29tbWFuZChcbiAgICBjb250YWluZXJFbDogSFRNTEVsZW1lbnQsXG4gICAgY29uZmlnOiBTd2l0Y2hlclBsdXNTZXR0aW5ncyxcbiAgKTogdm9pZCB7XG4gICAgbmV3IFNldHRpbmcoY29udGFpbmVyRWwpXG4gICAgICAuc2V0TmFtZSgnU3ltYm9sIGxpc3QgbW9kZSB0cmlnZ2VyJylcbiAgICAgIC5zZXREZXNjKCdDaGFyYWN0ZXIgdGhhdCB3aWxsIHRyaWdnZXIgc3ltYm9sIGxpc3QgbW9kZSBpbiB0aGUgc3dpdGNoZXInKVxuICAgICAgLmFkZFRleHQoKHRleHQpID0+XG4gICAgICAgIHRleHRcbiAgICAgICAgICAuc2V0UGxhY2Vob2xkZXIoY29uZmlnLnN5bWJvbExpc3RQbGFjZWhvbGRlclRleHQpXG4gICAgICAgICAgLnNldFZhbHVlKGNvbmZpZy5zeW1ib2xMaXN0Q29tbWFuZClcbiAgICAgICAgICAub25DaGFuZ2UoKHZhbHVlKSA9PiB7XG4gICAgICAgICAgICBjb25zdCB2YWwgPSB2YWx1ZS5sZW5ndGggPyB2YWx1ZSA6IGNvbmZpZy5zeW1ib2xMaXN0UGxhY2Vob2xkZXJUZXh0O1xuICAgICAgICAgICAgY29uZmlnLnN5bWJvbExpc3RDb21tYW5kID0gdmFsO1xuICAgICAgICAgICAgY29uZmlnLnNhdmUoKTtcbiAgICAgICAgICB9KSxcbiAgICAgICk7XG4gIH1cbn1cbiIsImltcG9ydCB7XG4gIEFwcCxcbiAgRWRpdG9yUG9zaXRpb24sXG4gIGZ1enp5U2VhcmNoLFxuICBIZWFkaW5nQ2FjaGUsXG4gIEtleW1hcCxcbiAgTWFya2Rvd25WaWV3LFxuICBub3JtYWxpemVQYXRoLFxuICBPcGVuVmlld1N0YXRlLFxuICBQbGF0Zm9ybSxcbiAgUHJlcGFyZWRRdWVyeSxcbiAgcmVuZGVyUmVzdWx0cyxcbiAgU2VhcmNoUmVzdWx0LFxuICBzZXRJY29uLFxuICBURmlsZSxcbiAgVmlldyxcbiAgV29ya3NwYWNlTGVhZixcbn0gZnJvbSAnb2JzaWRpYW4nO1xuaW1wb3J0IHtcbiAgQW55U3VnZ2VzdGlvbixcbiAgRWRpdG9yTmF2aWdhdGlvblR5cGUsXG4gIE1hdGNoVHlwZSxcbiAgTW9kZSxcbiAgUGF0aERpc3BsYXlGb3JtYXQsXG4gIFNlYXJjaFJlc3VsdFdpdGhGYWxsYmFjayxcbiAgU291cmNlSW5mbyxcbn0gZnJvbSAnc3JjL3R5cGVzJztcbmltcG9ydCB7IElucHV0SW5mbyB9IGZyb20gJ3NyYy9zd2l0Y2hlclBsdXMnO1xuaW1wb3J0IHsgU3dpdGNoZXJQbHVzU2V0dGluZ3MgfSBmcm9tICdzcmMvc2V0dGluZ3MnO1xuaW1wb3J0IHtcbiAgaXNDb21tYW5kU3VnZ2VzdGlvbixcbiAgaXNFZGl0b3JTdWdnZXN0aW9uLFxuICBpc1N5bWJvbFN1Z2dlc3Rpb24sXG4gIGlzVW5yZXNvbHZlZFN1Z2dlc3Rpb24sXG4gIGlzV29ya3NwYWNlU3VnZ2VzdGlvbixcbiAgc3RyaXBNREV4dGVuc2lvbkZyb21QYXRoLFxufSBmcm9tICdzcmMvdXRpbHMnO1xuXG5leHBvcnQgYWJzdHJhY3QgY2xhc3MgSGFuZGxlcjxUPiB7XG4gIGdldCBjb21tYW5kU3RyaW5nKCk6IHN0cmluZyB7XG4gICAgcmV0dXJuIG51bGw7XG4gIH1cblxuICBjb25zdHJ1Y3Rvcihwcm90ZWN0ZWQgYXBwOiBBcHAsIHByb3RlY3RlZCBzZXR0aW5nczogU3dpdGNoZXJQbHVzU2V0dGluZ3MpIHt9XG5cbiAgYWJzdHJhY3QgdmFsaWRhdGVDb21tYW5kKFxuICAgIGlucHV0SW5mbzogSW5wdXRJbmZvLFxuICAgIGluZGV4OiBudW1iZXIsXG4gICAgZmlsdGVyVGV4dDogc3RyaW5nLFxuICAgIGFjdGl2ZVN1Z2dlc3Rpb246IEFueVN1Z2dlc3Rpb24sXG4gICAgYWN0aXZlTGVhZjogV29ya3NwYWNlTGVhZixcbiAgKTogdm9pZDtcbiAgYWJzdHJhY3QgcmVuZGVyU3VnZ2VzdGlvbihzdWdnOiBULCBwYXJlbnRFbDogSFRNTEVsZW1lbnQpOiB2b2lkO1xuICBhYnN0cmFjdCBvbkNob29zZVN1Z2dlc3Rpb24oc3VnZzogVCwgZXZ0OiBNb3VzZUV2ZW50IHwgS2V5Ym9hcmRFdmVudCk6IHZvaWQ7XG4gIGFic3RyYWN0IGdldFN1Z2dlc3Rpb25zKGlucHV0SW5mbzogSW5wdXRJbmZvKTogVFtdO1xuXG4gIGdldEVkaXRvckluZm8obGVhZjogV29ya3NwYWNlTGVhZik6IFNvdXJjZUluZm8ge1xuICAgIGNvbnN0IHsgZXhjbHVkZVZpZXdUeXBlcyB9ID0gdGhpcy5zZXR0aW5ncztcbiAgICBsZXQgZmlsZTogVEZpbGUgPSBudWxsO1xuICAgIGxldCBpc1ZhbGlkU291cmNlID0gZmFsc2U7XG4gICAgbGV0IGN1cnNvcjogRWRpdG9yUG9zaXRpb24gPSBudWxsO1xuXG4gICAgaWYgKGxlYWYpIHtcbiAgICAgIGNvbnN0IHsgdmlldyB9ID0gbGVhZjtcblxuICAgICAgY29uc3Qgdmlld1R5cGUgPSB2aWV3LmdldFZpZXdUeXBlKCk7XG4gICAgICBmaWxlID0gdmlldy5maWxlO1xuICAgICAgY3Vyc29yID0gdGhpcy5nZXRDdXJzb3JQb3NpdGlvbih2aWV3KTtcblxuICAgICAgLy8gZGV0ZXJtaW5lIGlmIHRoZSBjdXJyZW50IGFjdGl2ZSBlZGl0b3IgcGFuZSBpcyB2YWxpZFxuICAgICAgY29uc3QgaXNDdXJyZW50RWRpdG9yVmFsaWQgPSAhZXhjbHVkZVZpZXdUeXBlcy5pbmNsdWRlcyh2aWV3VHlwZSk7XG5cbiAgICAgIC8vIHdoZXRoZXIgb3Igbm90IHRoZSBjdXJyZW50IGFjdGl2ZSBlZGl0b3IgY2FuIGJlIHVzZWQgYXMgdGhlIHRhcmdldCBmb3JcbiAgICAgIC8vIHN5bWJvbCBzZWFyY2hcbiAgICAgIGlzVmFsaWRTb3VyY2UgPSBpc0N1cnJlbnRFZGl0b3JWYWxpZCAmJiAhIWZpbGU7XG4gICAgfVxuXG4gICAgcmV0dXJuIHsgaXNWYWxpZFNvdXJjZSwgbGVhZiwgZmlsZSwgc3VnZ2VzdGlvbjogbnVsbCwgY3Vyc29yIH07XG4gIH1cblxuICBnZXRTdWdnZXN0aW9uSW5mbyhzdWdnZXN0aW9uOiBBbnlTdWdnZXN0aW9uKTogU291cmNlSW5mbyB7XG4gICAgY29uc3QgaW5mbyA9IHRoaXMuZ2V0U291cmNlSW5mb0Zyb21TdWdnZXN0aW9uKHN1Z2dlc3Rpb24pO1xuICAgIGxldCBsZWFmID0gaW5mby5sZWFmO1xuXG4gICAgaWYgKGluZm8uaXNWYWxpZFNvdXJjZSkge1xuICAgICAgLy8gdHJ5IHRvIGZpbmQgYSBtYXRjaGluZyBsZWFmIGZvciBzdWdnZXN0aW9uIHR5cGVzIHRoYXQgZG9uJ3QgZXhwbGljaXRseVxuICAgICAgLy8gcHJvdmlkZSBvbmUuIFRoaXMgaXMgcHJpbWFyaWx5IG5lZWRlZCB0byBiZSBhYmxlIHRvIGZvY3VzIGFuXG4gICAgICAvLyBleGlzdGluZyBwYW5lIGlmIHRoZXJlIGlzIG9uZVxuICAgICAgKHsgbGVhZiB9ID0gdGhpcy5maW5kTWF0Y2hpbmdMZWFmKGluZm8uZmlsZSwgaW5mby5sZWFmKSk7XG4gICAgfVxuXG4gICAgLy8gR2V0IHRoZSBjdXJzb3IgaW5mb3JtYXRpb24gdG8gc3VwcG9ydCBgc2VsZWN0TmVhcmVzdEhlYWRpbmdgXG4gICAgY29uc3QgY3Vyc29yID0gdGhpcy5nZXRDdXJzb3JQb3NpdGlvbihsZWFmPy52aWV3KTtcblxuICAgIHJldHVybiB7IC4uLmluZm8sIGxlYWYsIGN1cnNvciB9O1xuICB9XG5cbiAgcHJvdGVjdGVkIGdldFNvdXJjZUluZm9Gcm9tU3VnZ2VzdGlvbihzdWdnZXN0aW9uOiBBbnlTdWdnZXN0aW9uKTogU291cmNlSW5mbyB7XG4gICAgbGV0IGZpbGU6IFRGaWxlID0gbnVsbDtcbiAgICBsZXQgbGVhZjogV29ya3NwYWNlTGVhZiA9IG51bGw7XG5cbiAgICAvLyBDYW4ndCB1c2UgYSBzeW1ib2wsIHdvcmtzcGFjZSwgdW5yZXNvbHZlZCAobm9uLWV4aXN0ZW50IGZpbGUpIHN1Z2dlc3Rpb25zIGFzXG4gICAgLy8gdGhlIHRhcmdldCBmb3IgYW5vdGhlciBzeW1ib2wgY29tbWFuZCwgYmVjYXVzZSB0aGV5IGRvbid0IHBvaW50IHRvIGEgZmlsZVxuICAgIGNvbnN0IGlzRmlsZUJhc2VkU3VnZ2VzdGlvbiA9XG4gICAgICBzdWdnZXN0aW9uICYmXG4gICAgICAhaXNTeW1ib2xTdWdnZXN0aW9uKHN1Z2dlc3Rpb24pICYmXG4gICAgICAhaXNVbnJlc29sdmVkU3VnZ2VzdGlvbihzdWdnZXN0aW9uKSAmJlxuICAgICAgIWlzV29ya3NwYWNlU3VnZ2VzdGlvbihzdWdnZXN0aW9uKSAmJlxuICAgICAgIWlzQ29tbWFuZFN1Z2dlc3Rpb24oc3VnZ2VzdGlvbik7XG5cbiAgICBpZiAoaXNGaWxlQmFzZWRTdWdnZXN0aW9uKSB7XG4gICAgICBmaWxlID0gc3VnZ2VzdGlvbi5maWxlO1xuICAgIH1cblxuICAgIGlmIChpc0VkaXRvclN1Z2dlc3Rpb24oc3VnZ2VzdGlvbikpIHtcbiAgICAgIGxlYWYgPSBzdWdnZXN0aW9uLml0ZW07XG4gICAgfVxuXG4gICAgY29uc3QgaXNWYWxpZFNvdXJjZSA9ICEhZmlsZTtcblxuICAgIHJldHVybiB7IGlzVmFsaWRTb3VyY2UsIGxlYWYsIGZpbGUsIHN1Z2dlc3Rpb24gfTtcbiAgfVxuXG4gIC8qKlxuICAgKiBSZXRyaWV2ZXMgdGhlIHBvc2l0aW9uIG9mIHRoZSBjdXJzb3IsIGdpdmVuIHRoYXQgdmlldyBpcyBpbiBhIE1vZGUgdGhhdCBzdXBwb3J0cyBjdXJzb3JzLlxuICAgKiBAcGFyYW0gIHtWaWV3fSB2aWV3XG4gICAqIEByZXR1cm5zIEVkaXRvclBvc2l0aW9uXG4gICAqL1xuICBnZXRDdXJzb3JQb3NpdGlvbih2aWV3OiBWaWV3KTogRWRpdG9yUG9zaXRpb24ge1xuICAgIGxldCBjdXJzb3I6IEVkaXRvclBvc2l0aW9uID0gbnVsbDtcblxuICAgIGlmICh2aWV3Py5nZXRWaWV3VHlwZSgpID09PSAnbWFya2Rvd24nKSB7XG4gICAgICBjb25zdCBtZCA9IHZpZXcgYXMgTWFya2Rvd25WaWV3O1xuXG4gICAgICBpZiAobWQuZ2V0TW9kZSgpICE9PSAncHJldmlldycpIHtcbiAgICAgICAgY29uc3QgeyBlZGl0b3IgfSA9IG1kO1xuICAgICAgICBjdXJzb3IgPSBlZGl0b3IuZ2V0Q3Vyc29yKCdoZWFkJyk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuIGN1cnNvcjtcbiAgfVxuXG4gIC8qKlxuICAgKiBSZXR1cm5zIHRoZSB0ZXh0IG9mIHRoZSBmaXJzdCBIMSBjb250YWluZWQgaW4gc291cmNlRmlsZSwgb3Igc291cmNlRmlsZVxuICAgKiBwYXRoIGlmIGFuIEgxIGRvZXMgbm90IGV4aXN0XG4gICAqIEBwYXJhbSAge1RGaWxlfSBzb3VyY2VGaWxlXG4gICAqIEByZXR1cm5zIHN0cmluZ1xuICAgKi9cbiAgZ2V0VGl0bGVUZXh0KHNvdXJjZUZpbGU6IFRGaWxlKTogc3RyaW5nIHtcbiAgICBjb25zdCBwYXRoID0gc3RyaXBNREV4dGVuc2lvbkZyb21QYXRoKHNvdXJjZUZpbGUpO1xuICAgIGNvbnN0IGgxID0gdGhpcy5nZXRGaXJzdEgxKHNvdXJjZUZpbGUpO1xuXG4gICAgcmV0dXJuIGgxPy5oZWFkaW5nID8/IHBhdGg7XG4gIH1cblxuICAvKipcbiAgICogRmluZHMgYW5kIHJldHVybnMgdGhlIGZpcnN0IEgxIGZyb20gc291cmNlRmlsZVxuICAgKiBAcGFyYW0gIHtURmlsZX0gc291cmNlRmlsZVxuICAgKiBAcmV0dXJucyBIZWFkaW5nQ2FjaGVcbiAgICovXG4gIGdldEZpcnN0SDEoc291cmNlRmlsZTogVEZpbGUpOiBIZWFkaW5nQ2FjaGUgfCBudWxsIHtcbiAgICBsZXQgaDE6IEhlYWRpbmdDYWNoZSA9IG51bGw7XG4gICAgY29uc3QgeyBtZXRhZGF0YUNhY2hlIH0gPSB0aGlzLmFwcDtcbiAgICBjb25zdCBoZWFkaW5nTGlzdDogSGVhZGluZ0NhY2hlW10gPVxuICAgICAgbWV0YWRhdGFDYWNoZS5nZXRGaWxlQ2FjaGUoc291cmNlRmlsZSk/LmhlYWRpbmdzPy5maWx0ZXIoKHYpID0+IHYubGV2ZWwgPT09IDEpID8/XG4gICAgICBbXTtcblxuICAgIGlmIChoZWFkaW5nTGlzdC5sZW5ndGgpIHtcbiAgICAgIGgxID0gaGVhZGluZ0xpc3QucmVkdWNlKChhY2MsIGN1cnIpID0+IHtcbiAgICAgICAgY29uc3QgeyBsaW5lOiBjdXJyTGluZSB9ID0gY3Vyci5wb3NpdGlvbi5zdGFydDtcbiAgICAgICAgY29uc3QgYWNjTGluZSA9IGFjYy5wb3NpdGlvbi5zdGFydC5saW5lO1xuXG4gICAgICAgIHJldHVybiBjdXJyTGluZSA8IGFjY0xpbmUgPyBjdXJyIDogYWNjO1xuICAgICAgfSk7XG4gICAgfVxuXG4gICAgcmV0dXJuIGgxO1xuICB9XG5cbiAgLyoqXG4gICAqIEZpbmRzIHRoZSBmaXJzdCBvcGVuIFdvcmtzcGFjZUxlYWYgdGhhdCBpcyBzaG93aW5nIHNvdXJjZSBmaWxlLlxuICAgKiBAcGFyYW0gIHtURmlsZX0gZmlsZSBUaGUgc291cmNlIGZpbGUgdGhhdCBpcyBiZWluZyBzaG93biB0byBmaW5kXG4gICAqIEBwYXJhbSAge1dvcmtzcGFjZUxlYWZ9IGxlYWYgQW4gYWxyZWFkeSBvcGVuIGVkaXRvciwgb3IsIGEgJ3JlZmVyZW5jZScgV29ya3NwYWNlTGVhZiAoZXhhbXBsZTogYmFja2xpbmtzLCBvdXRsaW5lLCBldGMuLiB2aWV3cykgdGhhdCBpcyB1c2VkIHRvIGZpbmQgdGhlIGFzc29jaWF0ZWQgZWRpdG9yIGlmIG9uZSBleGlzdHMuXG4gICAqIEBwYXJhbSAge30gc2hvdWxkSW5jbHVkZVJlZlZpZXdzPWZhbHNlIHNldCB0byB0cnVlIHRvIG1ha2UgcmVmZXJlbmNlIHZpZXcgdHlwZXMgdmFsaWQgcmV0dXJuIGNhbmRpZGF0ZXMuXG4gICAqIEByZXR1cm5zIFRhcmdldEluZm9cbiAgICovXG4gIGZpbmRNYXRjaGluZ0xlYWYoXG4gICAgZmlsZTogVEZpbGUsXG4gICAgbGVhZj86IFdvcmtzcGFjZUxlYWYsXG4gICAgc2hvdWxkSW5jbHVkZVJlZlZpZXdzID0gZmFsc2UsXG4gICk6IFNvdXJjZUluZm8ge1xuICAgIGxldCBtYXRjaGluZ0xlYWYgPSBudWxsO1xuICAgIGNvbnN0IGhhc1NvdXJjZUxlYWYgPSAhIWxlYWY7XG4gICAgY29uc3Qge1xuICAgICAgc2V0dGluZ3M6IHsgcmVmZXJlbmNlVmlld3MsIGV4Y2x1ZGVWaWV3VHlwZXMsIGluY2x1ZGVTaWRlUGFuZWxWaWV3VHlwZXMgfSxcbiAgICAgIGFwcDogeyB3b3Jrc3BhY2UgfSxcbiAgICB9ID0gdGhpcztcblxuICAgIGNvbnN0IGlzTWF0Y2ggPSAoY2FuZGlkYXRlTGVhZjogV29ya3NwYWNlTGVhZikgPT4ge1xuICAgICAgbGV0IHZhbCA9IGZhbHNlO1xuXG4gICAgICBpZiAoY2FuZGlkYXRlTGVhZj8udmlldykge1xuICAgICAgICBjb25zdCBpc0NhbmRpZGF0ZVJlZlZpZXcgPSByZWZlcmVuY2VWaWV3cy5pbmNsdWRlcyhcbiAgICAgICAgICBjYW5kaWRhdGVMZWFmLnZpZXcuZ2V0Vmlld1R5cGUoKSxcbiAgICAgICAgKTtcbiAgICAgICAgY29uc3QgaXNWYWxpZENhbmRpZGF0ZSA9IHNob3VsZEluY2x1ZGVSZWZWaWV3cyB8fCAhaXNDYW5kaWRhdGVSZWZWaWV3O1xuICAgICAgICBjb25zdCBpc1NvdXJjZVJlZlZpZXcgPVxuICAgICAgICAgIGhhc1NvdXJjZUxlYWYgJiYgcmVmZXJlbmNlVmlld3MuaW5jbHVkZXMobGVhZi52aWV3LmdldFZpZXdUeXBlKCkpO1xuXG4gICAgICAgIGlmIChpc1ZhbGlkQ2FuZGlkYXRlKSB7XG4gICAgICAgICAgaWYgKGhhc1NvdXJjZUxlYWYgJiYgKHNob3VsZEluY2x1ZGVSZWZWaWV3cyB8fCAhaXNTb3VyY2VSZWZWaWV3KSkge1xuICAgICAgICAgICAgdmFsID0gY2FuZGlkYXRlTGVhZiA9PT0gbGVhZjtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdmFsID0gY2FuZGlkYXRlTGVhZi52aWV3LmZpbGUgPT09IGZpbGU7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIHJldHVybiB2YWw7XG4gICAgfTtcblxuICAgIC8vIFByaW9yaXRpemUgdGhlIGFjdGl2ZSBsZWFmIG1hdGNoZXMgZmlyc3QsIG90aGVyd2lzZSBmaW5kIHRoZSBmaXJzdCBtYXRjaGluZyBsZWFmXG4gICAgaWYgKGlzTWF0Y2god29ya3NwYWNlLmFjdGl2ZUxlYWYpKSB7XG4gICAgICBtYXRjaGluZ0xlYWYgPSB3b3Jrc3BhY2UuYWN0aXZlTGVhZjtcbiAgICB9IGVsc2Uge1xuICAgICAgY29uc3QgbGVhdmVzID0gdGhpcy5nZXRPcGVuTGVhdmVzKGV4Y2x1ZGVWaWV3VHlwZXMsIGluY2x1ZGVTaWRlUGFuZWxWaWV3VHlwZXMpO1xuXG4gICAgICAvLyBwdXQgbGVhZiBhdCB0aGUgZmlyc3QgaW5kZXggc28gaXQgZ2V0cyBjaGVja2VkIGZpcnN0XG4gICAgICBtYXRjaGluZ0xlYWYgPSBbbGVhZiwgLi4ubGVhdmVzXS5maW5kKGlzTWF0Y2gpO1xuICAgIH1cblxuICAgIHJldHVybiB7XG4gICAgICBsZWFmOiBtYXRjaGluZ0xlYWYgPz8gbnVsbCxcbiAgICAgIGZpbGUsXG4gICAgICBzdWdnZXN0aW9uOiBudWxsLFxuICAgICAgaXNWYWxpZFNvdXJjZTogZmFsc2UsXG4gICAgfTtcbiAgfVxuXG4gIC8qKlxuICAgKiBEZXRlcm1pbmVzIHdoZXRoZXIgb3Igbm90IGEgbmV3IGxlYWYgc2hvdWxkIGJlIGNyZWF0ZWQgdGFraW5nIHVzZXJcbiAgICogc2V0dGluZ3MgaW50byBhY2NvdW50XG4gICAqIEBwYXJhbSAge2Jvb2xlYW59IGlzTmV3UGFuZVJlcXVlc3RlZCBTZXQgdG8gdHJ1ZSBpZiB0aGUgdXNlciBob2xkaW5nIGNtZC9jdHJsXG4gICAqIEBwYXJhbSAge30gaXNBbHJlYWR5T3Blbj1mYWxzZSBTZXQgdG8gdHJ1ZSBpZiB0aGVyZSBpcyBhIHBhbmUgc2hvd2luZyB0aGUgZmlsZSBhbHJlYWR5XG4gICAqIEBwYXJhbSAge01vZGV9IG1vZGU/IE9ubHkgU3ltYm9sIG1vZGUgaGFzIHNwZWNpYWwgaGFuZGxpbmcuXG4gICAqIEByZXR1cm5zIGJvb2xlYW5cbiAgICovXG4gIHNob3VsZENyZWF0ZU5ld0xlYWYoXG4gICAgaXNOZXdQYW5lUmVxdWVzdGVkOiBib29sZWFuLFxuICAgIGlzQWxyZWFkeU9wZW4gPSBmYWxzZSxcbiAgICBtb2RlPzogTW9kZSxcbiAgKTogYm9vbGVhbiB7XG4gICAgY29uc3Qge1xuICAgICAgb25PcGVuUHJlZmVyTmV3UGFuZSxcbiAgICAgIGFsd2F5c05ld1BhbmVGb3JTeW1ib2xzLFxuICAgICAgdXNlQWN0aXZlUGFuZUZvclN5bWJvbHNPbk1vYmlsZSxcbiAgICB9ID0gdGhpcy5zZXR0aW5ncztcblxuICAgIGNvbnN0IGlzTmV3UGFuZVByZWZlcnJlZCA9ICFpc0FscmVhZHlPcGVuICYmIG9uT3BlblByZWZlck5ld1BhbmU7XG4gICAgbGV0IHNob3VsZENyZWF0ZU5ldyA9IGlzTmV3UGFuZVJlcXVlc3RlZCB8fCBpc05ld1BhbmVQcmVmZXJyZWQ7XG5cbiAgICBpZiAobW9kZSA9PT0gTW9kZS5TeW1ib2xMaXN0ICYmICFvbk9wZW5QcmVmZXJOZXdQYW5lKSB7XG4gICAgICBjb25zdCB7IGlzTW9iaWxlIH0gPSBQbGF0Zm9ybTtcbiAgICAgIHNob3VsZENyZWF0ZU5ldyA9IGFsd2F5c05ld1BhbmVGb3JTeW1ib2xzIHx8IGlzTmV3UGFuZVJlcXVlc3RlZDtcblxuICAgICAgaWYgKGlzTW9iaWxlKSB7XG4gICAgICAgIHNob3VsZENyZWF0ZU5ldyA9IGlzTmV3UGFuZVJlcXVlc3RlZCB8fCAhdXNlQWN0aXZlUGFuZUZvclN5bWJvbHNPbk1vYmlsZTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICByZXR1cm4gc2hvdWxkQ3JlYXRlTmV3O1xuICB9XG5cbiAgLyoqXG4gICAqIERldGVybWluZXMgaWYgYSBsZWFmIGJlbG9uZ3MgdG8gdGhlIG1haW4gZWRpdG9yIHBhbmVsICh3b3Jrc3BhY2Uucm9vdFNwbGl0KVxuICAgKiBhcyBvcHBvc2VkIHRvIHRoZSBzaWRlIHBhbmVsc1xuICAgKiBAcGFyYW0gIHtXb3Jrc3BhY2VMZWFmfSBsZWFmXG4gICAqIEByZXR1cm5zIGJvb2xlYW5cbiAgICovXG4gIGlzTWFpblBhbmVsTGVhZihsZWFmOiBXb3Jrc3BhY2VMZWFmKTogYm9vbGVhbiB7XG4gICAgcmV0dXJuIGxlYWY/LmdldFJvb3QoKSA9PT0gdGhpcy5hcHAud29ya3NwYWNlLnJvb3RTcGxpdDtcbiAgfVxuXG4gIC8qKlxuICAgKiBSZXZlYWxzIGFuZCBvcHRpb25hbGx5IGJyaW5nIGludG8gZm9jdXMgYSBXb3Jrc3BhY2VMZWFmLCBpbmNsdWRpbmcgbGVhdmVzXG4gICAqIGZyb20gdGhlIHNpZGUgcGFuZWxzLlxuICAgKiBAcGFyYW0gIHtXb3Jrc3BhY2VMZWFmfSBsZWFmXG4gICAqIEBwYXJhbSAge2Jvb2xlYW59IHB1c2hIaXN0b3J5P1xuICAgKiBAcGFyYW0gIHtSZWNvcmQ8c3RyaW5nfSBlU3RhdGU/XG4gICAqIEBwYXJhbSAge30gdW5rbm93bj5cbiAgICogQHJldHVybnMgdm9pZFxuICAgKi9cbiAgYWN0aXZhdGVMZWFmKFxuICAgIGxlYWY6IFdvcmtzcGFjZUxlYWYsXG4gICAgcHVzaEhpc3Rvcnk/OiBib29sZWFuLFxuICAgIGVTdGF0ZT86IFJlY29yZDxzdHJpbmcsIHVua25vd24+LFxuICApOiB2b2lkIHtcbiAgICBjb25zdCB7IHdvcmtzcGFjZSB9ID0gdGhpcy5hcHA7XG4gICAgY29uc3QgaXNJblNpZGVQYW5lbCA9ICF0aGlzLmlzTWFpblBhbmVsTGVhZihsZWFmKTtcbiAgICBjb25zdCBzdGF0ZSA9IHsgZm9jdXM6IHRydWUsIC4uLmVTdGF0ZSB9O1xuXG4gICAgaWYgKGlzSW5TaWRlUGFuZWwpIHtcbiAgICAgIHdvcmtzcGFjZS5yZXZlYWxMZWFmKGxlYWYpO1xuICAgIH1cblxuICAgIHdvcmtzcGFjZS5zZXRBY3RpdmVMZWFmKGxlYWYsIHB1c2hIaXN0b3J5KTtcbiAgICBsZWFmLnZpZXcuc2V0RXBoZW1lcmFsU3RhdGUoc3RhdGUpO1xuICB9XG5cbiAgLyoqXG4gICAqIFJldHVybnMgYSBhcnJheSBvZiBhbGwgb3BlbiBXb3Jrc3BhY2VMZWFmIHRha2luZyBpbnRvIGFjY291bnRcbiAgICogZXhjbHVkZU1haW5QYW5lbFZpZXdUeXBlcyBhbmQgaW5jbHVkZVNpZGVQYW5lbFZpZXdUeXBlcy5cbiAgICogQHBhcmFtICB7c3RyaW5nW119IGV4Y2x1ZGVNYWluUGFuZWxWaWV3VHlwZXM/XG4gICAqIEBwYXJhbSAge3N0cmluZ1tdfSBpbmNsdWRlU2lkZVBhbmVsVmlld1R5cGVzP1xuICAgKiBAcmV0dXJucyBXb3Jrc3BhY2VMZWFmW11cbiAgICovXG4gIGdldE9wZW5MZWF2ZXMoXG4gICAgZXhjbHVkZU1haW5QYW5lbFZpZXdUeXBlcz86IHN0cmluZ1tdLFxuICAgIGluY2x1ZGVTaWRlUGFuZWxWaWV3VHlwZXM/OiBzdHJpbmdbXSxcbiAgKTogV29ya3NwYWNlTGVhZltdIHtcbiAgICBjb25zdCBsZWF2ZXM6IFdvcmtzcGFjZUxlYWZbXSA9IFtdO1xuXG4gICAgY29uc3Qgc2F2ZUxlYWYgPSAobDogV29ya3NwYWNlTGVhZikgPT4ge1xuICAgICAgY29uc3Qgdmlld1R5cGUgPSBsLnZpZXc/LmdldFZpZXdUeXBlKCk7XG5cbiAgICAgIGlmICh0aGlzLmlzTWFpblBhbmVsTGVhZihsKSkge1xuICAgICAgICBpZiAoIWV4Y2x1ZGVNYWluUGFuZWxWaWV3VHlwZXM/LmluY2x1ZGVzKHZpZXdUeXBlKSkge1xuICAgICAgICAgIGxlYXZlcy5wdXNoKGwpO1xuICAgICAgICB9XG4gICAgICB9IGVsc2UgaWYgKGluY2x1ZGVTaWRlUGFuZWxWaWV3VHlwZXM/LmluY2x1ZGVzKHZpZXdUeXBlKSkge1xuICAgICAgICBsZWF2ZXMucHVzaChsKTtcbiAgICAgIH1cbiAgICB9O1xuXG4gICAgdGhpcy5hcHAud29ya3NwYWNlLml0ZXJhdGVBbGxMZWF2ZXMoc2F2ZUxlYWYpO1xuICAgIHJldHVybiBsZWF2ZXM7XG4gIH1cblxuICAvKipcbiAgICogTG9hZHMgYSBmaWxlIGludG8gYSBXb3Jrc3BhY2VMZWFmIGJhc2VkIG9uIHtAbGluayBFZGl0b3JOYXZpZ2F0aW9uVHlwZX1cbiAgICogQHBhcmFtICB7VEZpbGV9IGZpbGVcbiAgICogQHBhcmFtICB7RWRpdG9yTmF2aWdhdGlvblR5cGV9IG5hdlR5cGVcbiAgICogQHBhcmFtICB7T3BlblZpZXdTdGF0ZX0gb3BlblN0YXRlP1xuICAgKiBAcGFyYW0gIHt9IGVycm9yQ29udGV4dD0nJ1xuICAgKiBAcmV0dXJucyB2b2lkXG4gICAqL1xuICBvcGVuRmlsZUluTGVhZihcbiAgICBmaWxlOiBURmlsZSxcbiAgICBuYXZUeXBlOiBFZGl0b3JOYXZpZ2F0aW9uVHlwZSxcbiAgICBvcGVuU3RhdGU/OiBPcGVuVmlld1N0YXRlLFxuICAgIGVycm9yQ29udGV4dD86IHN0cmluZyxcbiAgKTogdm9pZCB7XG4gICAgY29uc3QgeyB3b3Jrc3BhY2UgfSA9IHRoaXMuYXBwO1xuICAgIGVycm9yQ29udGV4dCA9IGVycm9yQ29udGV4dCA/PyAnJztcbiAgICBjb25zdCBtZXNzYWdlID0gYFN3aXRjaGVyKys6IGVycm9yIG9wZW5pbmcgZmlsZS4gJHtlcnJvckNvbnRleHR9YDtcblxuICAgIGNvbnN0IGdldExlYWYgPSAoKSA9PiB7XG4gICAgICBsZXQgbGVhZjogV29ya3NwYWNlTGVhZiA9IG51bGw7XG5cbiAgICAgIGlmIChuYXZUeXBlID09PSBFZGl0b3JOYXZpZ2F0aW9uVHlwZS5Qb3BvdXRMZWFmKSB7XG4gICAgICAgIGxlYWYgPSB3b3Jrc3BhY2Uub3BlblBvcG91dExlYWYoKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGNvbnN0IHNob3VsZENyZWF0ZU5ldyA9IG5hdlR5cGUgPT09IEVkaXRvck5hdmlnYXRpb25UeXBlLk5ld0xlYWY7XG4gICAgICAgIGxlYWYgPSB3b3Jrc3BhY2UuZ2V0TGVhZihzaG91bGRDcmVhdGVOZXcpO1xuICAgICAgfVxuXG4gICAgICByZXR1cm4gbGVhZjtcbiAgICB9O1xuXG4gICAgdHJ5IHtcbiAgICAgIGdldExlYWYoKVxuICAgICAgICAub3BlbkZpbGUoZmlsZSwgb3BlblN0YXRlKVxuICAgICAgICAuY2F0Y2goKHJlYXNvbikgPT4ge1xuICAgICAgICAgIC8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSBAdHlwZXNjcmlwdC1lc2xpbnQvcmVzdHJpY3QtdGVtcGxhdGUtZXhwcmVzc2lvbnNcbiAgICAgICAgICBjb25zb2xlLmxvZyhgJHttZXNzYWdlfSAke3JlYXNvbn1gKTtcbiAgICAgICAgfSk7XG4gICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgIC8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSBAdHlwZXNjcmlwdC1lc2xpbnQvcmVzdHJpY3QtdGVtcGxhdGUtZXhwcmVzc2lvbnNcbiAgICAgIGNvbnNvbGUubG9nKGAke21lc3NhZ2V9ICR7ZXJyb3J9YCk7XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIERldGVybWluZXMgd2hldGhlciB0byBhY3RpdmF0ZSAobWFrZSBhY3RpdmUgYW5kIGZvY3VzZWQpIGFuIGV4aXN0aW5nIFdvcmtzcGFjZUxlYWZcbiAgICogKHNlYXJjaGVzIHRocm91Z2ggYWxsIGxlYXZlcyksIG9yIGNyZWF0ZSBhIG5ldyBXb3Jrc3BhY2VMZWFmLCBvciByZXVzZSBhbiB1bnBpbm5lZFxuICAgKiBXb3Jrc3BhY2VMZWFmLCBvciBjcmVhdGUgYSBuZXcgd2luZG93IGluIG9yZGVyIHRvIGRpc3BsYXkgZmlsZS4gVGhpcyB0YWtlcyB1c2VyXG4gICAqIHNldHRpbmdzIGFuZCBldmVudCBzdGF0dXMgaW50byBhY2NvdW50LlxuICAgKiBAcGFyYW0gIHtNb3VzZUV2ZW50fEtleWJvYXJkRXZlbnR9IGV2dCBuYXZpZ2F0aW9uIHRyaWdnZXIgZXZlbnRcbiAgICogQHBhcmFtICB7VEZpbGV9IGZpbGUgVGhlIGZpbGUgdG8gZGlzcGxheVxuICAgKiBAcGFyYW0gIHtzdHJpbmd9IGVycm9yQ29udGV4dCBDdXN0b20gdGV4dCB0byBzYXZlIGluIGVycm9yIG1lc3NhZ2VzXG4gICAqIEBwYXJhbSAge09wZW5WaWV3U3RhdGV9IG9wZW5TdGF0ZT8gU3RhdGUgdG8gcGFzcyB0byB0aGUgbmV3LCBvciBhY3RpdmF0ZWQgdmlldy4gSWZcbiAgICogZmFsc3ksIGRlZmF1bHQgdmFsdWVzIHdpbGwgYmUgdXNlZFxuICAgKiBAcGFyYW0gIHtXb3Jrc3BhY2VMZWFmfSBsZWFmPyBXb3Jrc3BhY2VMZWFmLCBvciByZWZlcmVuY2UgV29ya3NwYWNlTGVhZlxuICAgKiAoYmFja2xpbmssIG91dGxpbmUsIGV0Yy4uKSB0byBhY3RpdmF0ZSBpZiBpdCdzIGFscmVhZHkga25vd25cbiAgICogQHBhcmFtICB7TW9kZX0gbW9kZT8gT25seSBTeW1ib2wgbW9kZSBoYXMgY3VzdG9tIGhhbmRsaW5nXG4gICAqIEBwYXJhbSAge30gc2hvdWxkSW5jbHVkZVJlZlZpZXdzPWZhbHNlIHdoZXRoZXIgcmVmZXJlbmNlIFdvcmtzcGFjZUxlYXZlcyBhcmUgdmFsaWRcbiAgICogdGFyZ2V0cyBmb3IgYWN0aXZhdGlvblxuICAgKiBAcmV0dXJucyB2b2lkXG4gICAqL1xuICBuYXZpZ2F0ZVRvTGVhZk9yT3BlbkZpbGUoXG4gICAgZXZ0OiBNb3VzZUV2ZW50IHwgS2V5Ym9hcmRFdmVudCxcbiAgICBmaWxlOiBURmlsZSxcbiAgICBlcnJvckNvbnRleHQ6IHN0cmluZyxcbiAgICBvcGVuU3RhdGU/OiBPcGVuVmlld1N0YXRlLFxuICAgIGxlYWY/OiBXb3Jrc3BhY2VMZWFmLFxuICAgIG1vZGU/OiBNb2RlLFxuICAgIHNob3VsZEluY2x1ZGVSZWZWaWV3cyA9IGZhbHNlLFxuICApOiB2b2lkIHtcbiAgICBjb25zdCB7IGxlYWY6IHRhcmdldExlYWYgfSA9IHRoaXMuZmluZE1hdGNoaW5nTGVhZihmaWxlLCBsZWFmLCBzaG91bGRJbmNsdWRlUmVmVmlld3MpO1xuICAgIGNvbnN0IGlzQWxyZWFkeU9wZW4gPSAhIXRhcmdldExlYWY7XG5cbiAgICBjb25zdCBpc01vZERvd24gPSBLZXltYXAuaXNNb2RFdmVudChldnQpO1xuICAgIGNvbnN0IGtleSA9IChldnQgYXMgS2V5Ym9hcmRFdmVudCkua2V5O1xuICAgIGNvbnN0IGlzUG9wb3V0UmVxdWVzdGVkID0gaXNNb2REb3duICYmIGtleSA9PT0gJ28nO1xuICAgIGxldCBuYXZUeXBlID0gRWRpdG9yTmF2aWdhdGlvblR5cGUuUmV1c2VFeGlzdGluZ0xlYWY7XG5cbiAgICBpZiAoaXNQb3BvdXRSZXF1ZXN0ZWQpIHtcbiAgICAgIG5hdlR5cGUgPSBFZGl0b3JOYXZpZ2F0aW9uVHlwZS5Qb3BvdXRMZWFmO1xuICAgIH0gZWxzZSBpZiAodGhpcy5zaG91bGRDcmVhdGVOZXdMZWFmKGlzTW9kRG93biwgaXNBbHJlYWR5T3BlbiwgbW9kZSkpIHtcbiAgICAgIG5hdlR5cGUgPSBFZGl0b3JOYXZpZ2F0aW9uVHlwZS5OZXdMZWFmO1xuICAgIH1cblxuICAgIHRoaXMuYWN0aXZhdGVMZWFmT3JPcGVuRmlsZShuYXZUeXBlLCBmaWxlLCBlcnJvckNvbnRleHQsIHRhcmdldExlYWYsIG9wZW5TdGF0ZSk7XG4gIH1cblxuICAvKipcbiAgICogQWN0aXZhdGVzIGxlYWYgKGlmIHByb3ZpZGVkKSwgb3IgbG9hZCBmaWxlIGludG8gYW5vdGhlciBsZWFmIGJhc2VkIG9uIG5hdlR5cGVcbiAgICogQHBhcmFtICB7RWRpdG9yTmF2aWdhdGlvblR5cGV9IG5hdlR5cGVcbiAgICogQHBhcmFtICB7VEZpbGV9IGZpbGVcbiAgICogQHBhcmFtICB7c3RyaW5nfSBlcnJvckNvbnRleHRcbiAgICogQHBhcmFtICB7V29ya3NwYWNlTGVhZn0gbGVhZj8gb3B0aW9uYWwgaWYgc3VwcGxpZWQgYW5kIG5hdlR5cGUgaXNcbiAgICoge0BsaW5rIEVkaXRvck5hdmlnYXRpb25UeXBlLlJldXNlRXhpc3RpbmdMZWFmfSB0aGVuIGxlYWYgd2lsbCBiZSBhY3RpdmF0ZWRcbiAgICogQHBhcmFtICB7T3BlblZpZXdTdGF0ZX0gb3BlblN0YXRlP1xuICAgKiBAcmV0dXJucyB2b2lkXG4gICAqL1xuICBhY3RpdmF0ZUxlYWZPck9wZW5GaWxlKFxuICAgIG5hdlR5cGU6IEVkaXRvck5hdmlnYXRpb25UeXBlLFxuICAgIGZpbGU6IFRGaWxlLFxuICAgIGVycm9yQ29udGV4dDogc3RyaW5nLFxuICAgIGxlYWY/OiBXb3Jrc3BhY2VMZWFmLFxuICAgIG9wZW5TdGF0ZT86IE9wZW5WaWV3U3RhdGUsXG4gICk6IHZvaWQge1xuICAgIC8vIGRlZmF1bHQgdG8gaGF2aW5nIHRoZSBwYW5lIGFjdGl2ZSBhbmQgZm9jdXNlZFxuICAgIG9wZW5TdGF0ZSA9IG9wZW5TdGF0ZSA/PyB7IGFjdGl2ZTogdHJ1ZSwgZVN0YXRlOiB7IGFjdGl2ZTogdHJ1ZSwgZm9jdXM6IHRydWUgfSB9O1xuXG4gICAgaWYgKGxlYWYgJiYgbmF2VHlwZSA9PT0gRWRpdG9yTmF2aWdhdGlvblR5cGUuUmV1c2VFeGlzdGluZ0xlYWYpIHtcbiAgICAgIGNvbnN0IGVTdGF0ZSA9IG9wZW5TdGF0ZT8uZVN0YXRlIGFzIFJlY29yZDxzdHJpbmcsIHVua25vd24+O1xuICAgICAgdGhpcy5hY3RpdmF0ZUxlYWYobGVhZiwgdHJ1ZSwgZVN0YXRlKTtcbiAgICB9IGVsc2Uge1xuICAgICAgdGhpcy5vcGVuRmlsZUluTGVhZihmaWxlLCBuYXZUeXBlLCBvcGVuU3RhdGUsIGVycm9yQ29udGV4dCk7XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIFJlbmRlcnMgdGhlIFVJIGVsZW1lbnRzIHRvIGRpc3BsYXkgcGF0aCBpbmZvcm1hdGlvbiBmb3IgZmlsZSB1c2luZyB0aGVcbiAgICogc3RvcmVkIGNvbmZpZ3VyYXRpb24gc2V0dGluZ3NcbiAgICogQHBhcmFtICB7SFRNTEVsZW1lbnR9IHBhcmVudEVsIGNvbnRhaW5pbmcgZWxlbWVudCwgdGhpcyBzaG91bGQgYmUgdGhlIGVsZW1lbnQgd2l0aFxuICAgKiB0aGUgXCJzdWdnZXN0aW9uLWNvbnRlbnRcIiBzdHlsZVxuICAgKiBAcGFyYW0gIHtURmlsZX0gZmlsZVxuICAgKiBAcGFyYW0gIHtib29sZWFufSBleGNsdWRlT3B0aW9uYWxGaWxlbmFtZT8gc2V0IHRvIHRydWUgdG8gaGlkZSB0aGUgZmlsZW5hbWUgaW4gY2FzZXNcbiAgICogd2hlcmUgd2hlbiB7UGF0aERpc3BsYXlGb3JtYXR9IGlzIHNldCB0byBGb2xkZXJQYXRoRmlsZW5hbWVPcHRpb25hbFxuICAgKiBAcGFyYW0gIHtTZWFyY2hSZXN1bHR9IG1hdGNoP1xuICAgKiBAcGFyYW0gIHtib29sZWFufSBvdmVycmlkZVBhdGhGb3JtYXQ/IHNldCB0byB0cnVlIGZvcmNlIGRpc3BsYXkgdGhlIHBhdGggYW5kIHNldFxuICAgKiB7UGF0aERpc3BsYXlGb3JtYXR9IHRvIEZvbGRlclBhdGhGaWxlbmFtZU9wdGlvbmFsXG4gICAqIEByZXR1cm5zIHZvaWRcbiAgICovXG4gIHJlbmRlclBhdGgoXG4gICAgcGFyZW50RWw6IEhUTUxFbGVtZW50LFxuICAgIGZpbGU6IFRGaWxlLFxuICAgIGV4Y2x1ZGVPcHRpb25hbEZpbGVuYW1lPzogYm9vbGVhbixcbiAgICBtYXRjaD86IFNlYXJjaFJlc3VsdCxcbiAgICBvdmVycmlkZVBhdGhGb3JtYXQ/OiBib29sZWFuLFxuICApOiB2b2lkIHtcbiAgICBpZiAocGFyZW50RWwgJiYgZmlsZSkge1xuICAgICAgY29uc3QgaXNSb290ID0gZmlsZS5wYXJlbnQuaXNSb290KCk7XG4gICAgICBsZXQgZm9ybWF0ID0gdGhpcy5zZXR0aW5ncy5wYXRoRGlzcGxheUZvcm1hdDtcbiAgICAgIGxldCBoaWRlUGF0aCA9XG4gICAgICAgIGZvcm1hdCA9PT0gUGF0aERpc3BsYXlGb3JtYXQuTm9uZSB8fCAoaXNSb290ICYmIHRoaXMuc2V0dGluZ3MuaGlkZVBhdGhJZlJvb3QpO1xuXG4gICAgICBpZiAob3ZlcnJpZGVQYXRoRm9ybWF0KSB7XG4gICAgICAgIGZvcm1hdCA9IFBhdGhEaXNwbGF5Rm9ybWF0LkZvbGRlclBhdGhGaWxlbmFtZU9wdGlvbmFsO1xuICAgICAgICBoaWRlUGF0aCA9IGZhbHNlO1xuICAgICAgfVxuXG4gICAgICBpZiAoIWhpZGVQYXRoKSB7XG4gICAgICAgIGNvbnN0IHdyYXBwZXJFbCA9IHBhcmVudEVsLmNyZWF0ZURpdih7IGNsczogWydzdWdnZXN0aW9uLW5vdGUnLCAncXNwLW5vdGUnXSB9KTtcbiAgICAgICAgY29uc3QgcGF0aCA9IHRoaXMuZ2V0UGF0aERpc3BsYXlUZXh0KGZpbGUsIGZvcm1hdCwgZXhjbHVkZU9wdGlvbmFsRmlsZW5hbWUpO1xuXG4gICAgICAgIGNvbnN0IGljb25FbCA9IHdyYXBwZXJFbC5jcmVhdGVTcGFuKHsgY2xzOiBbJ3FzcC1wYXRoLWluZGljYXRvciddIH0pO1xuICAgICAgICBzZXRJY29uKGljb25FbCwgJ2ZvbGRlcicsIDEzKTtcblxuICAgICAgICBjb25zdCBwYXRoRWwgPSB3cmFwcGVyRWwuY3JlYXRlU3Bhbih7IGNsczogJ3FzcC1wYXRoJyB9KTtcbiAgICAgICAgcmVuZGVyUmVzdWx0cyhwYXRoRWwsIHBhdGgsIG1hdGNoKTtcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogRm9ybWF0cyB0aGUgcGF0aCBvZiBmaWxlIGJhc2VkIG9uIGRpc3BsYXlGb3JtYXRcbiAgICogQHBhcmFtICB7VEZpbGV9IGZpbGVcbiAgICogQHBhcmFtICB7UGF0aERpc3BsYXlGb3JtYXR9IGRpc3BsYXlGb3JtYXRcbiAgICogQHBhcmFtICB7Ym9vbGVhbn0gZXhjbHVkZU9wdGlvbmFsRmlsZW5hbWU/IE9ubHkgYXBwbGljYWJsZSB0b1xuICAgKiB7UGF0aERpc3BsYXlGb3JtYXQuRm9sZGVyUGF0aEZpbGVuYW1lT3B0aW9uYWx9LiBXaGVuIHRydWUgd2lsbCBleGNsdWRlIHRoZSBmaWxlbmFtZSBmcm9tIHRoZSByZXR1cm5lZCBzdHJpbmdcbiAgICogQHJldHVybnMgc3RyaW5nXG4gICAqL1xuICBnZXRQYXRoRGlzcGxheVRleHQoXG4gICAgZmlsZTogVEZpbGUsXG4gICAgZGlzcGxheUZvcm1hdDogUGF0aERpc3BsYXlGb3JtYXQsXG4gICAgZXhjbHVkZU9wdGlvbmFsRmlsZW5hbWU/OiBib29sZWFuLFxuICApOiBzdHJpbmcge1xuICAgIGxldCB0ZXh0ID0gJyc7XG5cbiAgICBpZiAoZmlsZSkge1xuICAgICAgY29uc3QgeyBwYXJlbnQgfSA9IGZpbGU7XG4gICAgICBjb25zdCBkaXJuYW1lID0gcGFyZW50Lm5hbWU7XG4gICAgICBjb25zdCBpc1Jvb3QgPSBwYXJlbnQuaXNSb290KCk7XG5cbiAgICAgIC8vIHJvb3QgcGF0aCBpcyBleHBlY3RlZCB0byBhbHdheXMgYmUgXCIvXCJcbiAgICAgIGNvbnN0IHJvb3RQYXRoID0gdGhpcy5hcHAudmF1bHQuZ2V0Um9vdCgpLnBhdGg7XG5cbiAgICAgIHN3aXRjaCAoZGlzcGxheUZvcm1hdCkge1xuICAgICAgICBjYXNlIFBhdGhEaXNwbGF5Rm9ybWF0LkZvbGRlcldpdGhGaWxlbmFtZTpcbiAgICAgICAgICB0ZXh0ID0gaXNSb290ID8gYCR7ZmlsZS5uYW1lfWAgOiBub3JtYWxpemVQYXRoKGAke2Rpcm5hbWV9LyR7ZmlsZS5uYW1lfWApO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICBjYXNlIFBhdGhEaXNwbGF5Rm9ybWF0LkZvbGRlck9ubHk6XG4gICAgICAgICAgdGV4dCA9IGlzUm9vdCA/IHJvb3RQYXRoIDogZGlybmFtZTtcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgY2FzZSBQYXRoRGlzcGxheUZvcm1hdC5GdWxsOlxuICAgICAgICAgIHRleHQgPSBmaWxlLnBhdGg7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIGNhc2UgUGF0aERpc3BsYXlGb3JtYXQuRm9sZGVyUGF0aEZpbGVuYW1lT3B0aW9uYWw6XG4gICAgICAgICAgaWYgKGV4Y2x1ZGVPcHRpb25hbEZpbGVuYW1lKSB7XG4gICAgICAgICAgICB0ZXh0ID0gcGFyZW50LnBhdGg7XG5cbiAgICAgICAgICAgIGlmICghaXNSb290KSB7XG4gICAgICAgICAgICAgIHRleHQgKz0gcm9vdFBhdGg7IC8vIGFkZCBleHBsaWNpdCB0cmFpbGluZyAvXG4gICAgICAgICAgICB9XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHRleHQgPSB0aGlzLmdldFBhdGhEaXNwbGF5VGV4dChmaWxlLCBQYXRoRGlzcGxheUZvcm1hdC5GdWxsKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgYnJlYWs7XG4gICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuIHRleHQ7XG4gIH1cblxuICAvKipcbiAgICogQ3JlYXRlcyB0aGUgVUkgZWxlbWVudHMgdG8gZGlzcGxheSB0aGUgcHJpbWFyeSBzdWdnZXN0aW9uIHRleHQgdXNpbmdcbiAgICogdGhlIGNvcnJlY3Qgc3R5bGVzLlxuICAgKiBAcGFyYW0gIHtIVE1MRWxlbWVudH0gcGFyZW50RWwgY29udGFpbmluZyBlbGVtZW50LCB0aGlzIHNob3VsZCBiZSB0aGUgZWxlbWVudCB3aXRoXG4gICAqIHRoZSBcInN1Z2dlc3Rpb24taXRlbVwiIHN0eWxlXG4gICAqIEBwYXJhbSAge3N0cmluZ30gY29udGVudFxuICAgKiBAcGFyYW0gIHtTZWFyY2hSZXN1bHR9IG1hdGNoXG4gICAqIEBwYXJhbSAge251bWJlcn0gb2Zmc2V0P1xuICAgKiBAcmV0dXJucyBIVE1MRGl2RWxlbWVudFxuICAgKi9cbiAgcmVuZGVyQ29udGVudChcbiAgICBwYXJlbnRFbDogSFRNTEVsZW1lbnQsXG4gICAgY29udGVudDogc3RyaW5nLFxuICAgIG1hdGNoOiBTZWFyY2hSZXN1bHQsXG4gICAgb2Zmc2V0PzogbnVtYmVyLFxuICApOiBIVE1MRGl2RWxlbWVudCB7XG4gICAgY29uc3QgY29udGVudEVsID0gcGFyZW50RWwuY3JlYXRlRGl2KHtcbiAgICAgIGNsczogWydzdWdnZXN0aW9uLWNvbnRlbnQnLCAncXNwLWNvbnRlbnQnXSxcbiAgICB9KTtcblxuICAgIGNvbnN0IHRpdGxlRWwgPSBjb250ZW50RWwuY3JlYXRlRGl2KHtcbiAgICAgIGNsczogWydzdWdnZXN0aW9uLXRpdGxlJywgJ3FzcC10aXRsZSddLFxuICAgIH0pO1xuXG4gICAgcmVuZGVyUmVzdWx0cyh0aXRsZUVsLCBjb250ZW50LCBtYXRjaCwgb2Zmc2V0KTtcblxuICAgIHJldHVybiBjb250ZW50RWw7XG4gIH1cblxuICAvKiogYWRkIHRoZSBiYXNlIHN1Z2dlc3Rpb24gc3R5bGVzIHRvIHRoZSBzdWdnZXN0aW9uIGNvbnRhaW5lciBlbGVtZW50XG4gICAqIEBwYXJhbSAge0hUTUxFbGVtZW50fSBwYXJlbnRFbCBjb250YWluZXIgZWxlbWVudFxuICAgKiBAcGFyYW0gIHtzdHJpbmdbXX0gYWRkaXRpb25hbFN0eWxlcz8gb3B0aW9uYWwgc3R5bGVzIHRvIGFkZFxuICAgKi9cbiAgYWRkQ2xhc3Nlc1RvU3VnZ2VzdGlvbkNvbnRhaW5lcihwYXJlbnRFbDogSFRNTEVsZW1lbnQsIGFkZGl0aW9uYWxTdHlsZXM/OiBzdHJpbmdbXSkge1xuICAgIGNvbnN0IHN0eWxlcyA9IFsnbW9kLWNvbXBsZXgnXTtcblxuICAgIGlmIChhZGRpdGlvbmFsU3R5bGVzKSB7XG4gICAgICBzdHlsZXMucHVzaCguLi5hZGRpdGlvbmFsU3R5bGVzKTtcbiAgICB9XG5cbiAgICBwYXJlbnRFbD8uYWRkQ2xhc3NlcyhzdHlsZXMpO1xuICB9XG5cbiAgLyoqXG4gICAqIFNlYXJjaGVzIHRocm91Z2ggcHJpbWFyeVN0cmluZywgaWYgbm90IG1hdGNoIGlzIGZvdW5kLFxuICAgKiBzZWFyY2hlcyB0aHJvdWdoIHNlY29uZGFyeVN0cmluZ1xuICAgKiBAcGFyYW0gIHtQcmVwYXJlZFF1ZXJ5fSBwcmVwUXVlcnlcbiAgICogQHBhcmFtICB7c3RyaW5nfSBwcmltYXJ5U3RyaW5nXG4gICAqIEBwYXJhbSAge3N0cmluZ30gc2Vjb25kYXJ5U3RyaW5nP1xuICAgKiBAcmV0dXJucyB7IGlzUHJpbWFyeTogYm9vbGVhbjsgbWF0Y2g/OiBTZWFyY2hSZXN1bHQgfVxuICAgKi9cbiAgZnV6enlTZWFyY2hTdHJpbmdzKFxuICAgIHByZXBRdWVyeTogUHJlcGFyZWRRdWVyeSxcbiAgICBwcmltYXJ5U3RyaW5nOiBzdHJpbmcsXG4gICAgc2Vjb25kYXJ5U3RyaW5nPzogc3RyaW5nLFxuICApOiB7IGlzUHJpbWFyeTogYm9vbGVhbjsgbWF0Y2g/OiBTZWFyY2hSZXN1bHQgfSB7XG4gICAgbGV0IGlzUHJpbWFyeSA9IGZhbHNlO1xuICAgIGxldCBtYXRjaDogU2VhcmNoUmVzdWx0ID0gbnVsbDtcblxuICAgIGlmIChwcmltYXJ5U3RyaW5nKSB7XG4gICAgICBtYXRjaCA9IGZ1enp5U2VhcmNoKHByZXBRdWVyeSwgcHJpbWFyeVN0cmluZyk7XG4gICAgICBpc1ByaW1hcnkgPSAhIW1hdGNoO1xuICAgIH1cblxuICAgIGlmICghbWF0Y2ggJiYgc2Vjb25kYXJ5U3RyaW5nKSB7XG4gICAgICBtYXRjaCA9IGZ1enp5U2VhcmNoKHByZXBRdWVyeSwgc2Vjb25kYXJ5U3RyaW5nKTtcblxuICAgICAgaWYgKG1hdGNoKSB7XG4gICAgICAgIG1hdGNoLnNjb3JlIC09IDE7XG4gICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuIHtcbiAgICAgIGlzUHJpbWFyeSxcbiAgICAgIG1hdGNoLFxuICAgIH07XG4gIH1cblxuICAvKipcbiAgICogU2VhcmNoZXMgdGhyb3VnaCBwcmltYXJ5VGV4dCwgaWYgbm8gbWF0Y2ggaXMgZm91bmQgYW5kIGZpbGUgaXMgbm90IG51bGwsIGl0IHdpbGxcbiAgICogZmFsbGJhY2sgdG8gc2VhcmNoaW5nIDEpIGZpbGUuYmFzZW5hbWUsIDIpIGZpbGUgcGFyZW50IHBhdGhcbiAgICogQHBhcmFtICB7UHJlcGFyZWRRdWVyeX0gcHJlcFF1ZXJ5XG4gICAqIEBwYXJhbSAge1RGaWxlfSBmaWxlXG4gICAqIEBwYXJhbSAge3N0cmluZ30gcHJpbWFyeVN0cmluZz9cbiAgICogQHJldHVybnMgU2VhcmNoUmVzdWx0V2l0aEZhbGxiYWNrXG4gICAqL1xuICBmdXp6eVNlYXJjaFdpdGhGYWxsYmFjayhcbiAgICBwcmVwUXVlcnk6IFByZXBhcmVkUXVlcnksXG4gICAgcHJpbWFyeVN0cmluZzogc3RyaW5nLFxuICAgIGZpbGU/OiBURmlsZSxcbiAgKTogU2VhcmNoUmVzdWx0V2l0aEZhbGxiYWNrIHtcbiAgICBsZXQgbWF0Y2hUeXBlID0gTWF0Y2hUeXBlLk5vbmU7XG4gICAgbGV0IG1hdGNoVGV4dDogc3RyaW5nO1xuICAgIGxldCBtYXRjaDogU2VhcmNoUmVzdWx0ID0gbnVsbDtcblxuICAgIGNvbnN0IHNlYXJjaCA9IChtYXRjaFR5cGVzOiBbTWF0Y2hUeXBlLCBNYXRjaFR5cGVdLCBwMTogc3RyaW5nLCBwMj86IHN0cmluZykgPT4ge1xuICAgICAgY29uc3QgcmVzID0gdGhpcy5mdXp6eVNlYXJjaFN0cmluZ3MocHJlcFF1ZXJ5LCBwMSwgcDIpO1xuXG4gICAgICBpZiAocmVzLm1hdGNoKSB7XG4gICAgICAgIG1hdGNoVHlwZSA9IG1hdGNoVHlwZXNbMV07XG4gICAgICAgIG1hdGNoVGV4dCA9IHAyO1xuICAgICAgICBtYXRjaCA9IHJlcy5tYXRjaDtcblxuICAgICAgICBpZiAocmVzLmlzUHJpbWFyeSkge1xuICAgICAgICAgIG1hdGNoVHlwZSA9IG1hdGNoVHlwZXNbMF07XG4gICAgICAgICAgbWF0Y2hUZXh0ID0gcDE7XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgcmV0dXJuICEhcmVzLm1hdGNoO1xuICAgIH07XG5cbiAgICBjb25zdCBpc01hdGNoID0gc2VhcmNoKFtNYXRjaFR5cGUuUHJpbWFyeSwgTWF0Y2hUeXBlLk5vbmVdLCBwcmltYXJ5U3RyaW5nKTtcbiAgICBpZiAoIWlzTWF0Y2ggJiYgZmlsZSkge1xuICAgICAgY29uc3Qge1xuICAgICAgICBiYXNlbmFtZSxcbiAgICAgICAgcGFyZW50OiB7IHBhdGggfSxcbiAgICAgIH0gPSBmaWxlO1xuXG4gICAgICBzZWFyY2goW01hdGNoVHlwZS5CYXNlbmFtZSwgTWF0Y2hUeXBlLlBhcmVudFBhdGhdLCBiYXNlbmFtZSwgcGF0aCk7XG4gICAgfVxuXG4gICAgcmV0dXJuIHsgbWF0Y2hUeXBlLCBtYXRjaFRleHQsIG1hdGNoIH07XG4gIH1cbn1cbiIsImltcG9ydCB7IGdldEludGVybmFsUGx1Z2luQnlJZCB9IGZyb20gJ3NyYy91dGlscyc7XG5pbXBvcnQge1xuICBBbnlTdWdnZXN0aW9uLFxuICBNb2RlLFxuICBTdWdnZXN0aW9uVHlwZSxcbiAgV29ya3NwYWNlSW5mbyxcbiAgV29ya3NwYWNlU3VnZ2VzdGlvbixcbn0gZnJvbSAnc3JjL3R5cGVzJztcbmltcG9ydCB7IElucHV0SW5mbyB9IGZyb20gJ3NyYy9zd2l0Y2hlclBsdXMvaW5wdXRJbmZvJztcbmltcG9ydCB7XG4gIGZ1enp5U2VhcmNoLFxuICBJbnN0YWxsZWRQbHVnaW4sXG4gIFNlYXJjaFJlc3VsdCxcbiAgc29ydFNlYXJjaFJlc3VsdHMsXG4gIFdvcmtzcGFjZUxlYWYsXG4gIFdvcmtzcGFjZXNQbHVnaW5JbnN0YW5jZSxcbn0gZnJvbSAnb2JzaWRpYW4nO1xuaW1wb3J0IHsgSGFuZGxlciB9IGZyb20gJy4vaGFuZGxlcic7XG5cbmV4cG9ydCBjb25zdCBXT1JLU1BBQ0VfUExVR0lOX0lEID0gJ3dvcmtzcGFjZXMnO1xuXG5leHBvcnQgY2xhc3MgV29ya3NwYWNlSGFuZGxlciBleHRlbmRzIEhhbmRsZXI8V29ya3NwYWNlU3VnZ2VzdGlvbj4ge1xuICBvdmVycmlkZSBnZXQgY29tbWFuZFN0cmluZygpOiBzdHJpbmcge1xuICAgIHJldHVybiB0aGlzLnNldHRpbmdzPy53b3Jrc3BhY2VMaXN0Q29tbWFuZDtcbiAgfVxuXG4gIHZhbGlkYXRlQ29tbWFuZChcbiAgICBpbnB1dEluZm86IElucHV0SW5mbyxcbiAgICBpbmRleDogbnVtYmVyLFxuICAgIGZpbHRlclRleHQ6IHN0cmluZyxcbiAgICBfYWN0aXZlU3VnZ2VzdGlvbjogQW55U3VnZ2VzdGlvbixcbiAgICBfYWN0aXZlTGVhZjogV29ya3NwYWNlTGVhZixcbiAgKTogdm9pZCB7XG4gICAgaWYgKHRoaXMuaXNXb3Jrc3BhY2VzUGx1Z2luRW5hYmxlZCgpKSB7XG4gICAgICBpbnB1dEluZm8ubW9kZSA9IE1vZGUuV29ya3NwYWNlTGlzdDtcblxuICAgICAgY29uc3Qgd29ya3NwYWNlQ21kID0gaW5wdXRJbmZvLnBhcnNlZENvbW1hbmQoTW9kZS5Xb3Jrc3BhY2VMaXN0KTtcbiAgICAgIHdvcmtzcGFjZUNtZC5pbmRleCA9IGluZGV4O1xuICAgICAgd29ya3NwYWNlQ21kLnBhcnNlZElucHV0ID0gZmlsdGVyVGV4dDtcbiAgICAgIHdvcmtzcGFjZUNtZC5pc1ZhbGlkYXRlZCA9IHRydWU7XG4gICAgfVxuICB9XG5cbiAgZ2V0U3VnZ2VzdGlvbnMoaW5wdXRJbmZvOiBJbnB1dEluZm8pOiBXb3Jrc3BhY2VTdWdnZXN0aW9uW10ge1xuICAgIGNvbnN0IHN1Z2dlc3Rpb25zOiBXb3Jrc3BhY2VTdWdnZXN0aW9uW10gPSBbXTtcblxuICAgIGlmIChpbnB1dEluZm8pIHtcbiAgICAgIGlucHV0SW5mby5idWlsZFNlYXJjaFF1ZXJ5KCk7XG4gICAgICBjb25zdCB7IGhhc1NlYXJjaFRlcm0sIHByZXBRdWVyeSB9ID0gaW5wdXRJbmZvLnNlYXJjaFF1ZXJ5O1xuICAgICAgY29uc3QgaXRlbXMgPSB0aGlzLmdldEl0ZW1zKCk7XG5cbiAgICAgIGl0ZW1zLmZvckVhY2goKGl0ZW0pID0+IHtcbiAgICAgICAgbGV0IHNob3VsZFB1c2ggPSB0cnVlO1xuICAgICAgICBsZXQgbWF0Y2g6IFNlYXJjaFJlc3VsdCA9IG51bGw7XG5cbiAgICAgICAgaWYgKGhhc1NlYXJjaFRlcm0pIHtcbiAgICAgICAgICBtYXRjaCA9IGZ1enp5U2VhcmNoKHByZXBRdWVyeSwgaXRlbS5pZCk7XG4gICAgICAgICAgc2hvdWxkUHVzaCA9ICEhbWF0Y2g7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoc2hvdWxkUHVzaCkge1xuICAgICAgICAgIHN1Z2dlc3Rpb25zLnB1c2goeyB0eXBlOiBTdWdnZXN0aW9uVHlwZS5Xb3Jrc3BhY2VMaXN0LCBpdGVtLCBtYXRjaCB9KTtcbiAgICAgICAgfVxuICAgICAgfSk7XG5cbiAgICAgIGlmIChoYXNTZWFyY2hUZXJtKSB7XG4gICAgICAgIHNvcnRTZWFyY2hSZXN1bHRzKHN1Z2dlc3Rpb25zKTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICByZXR1cm4gc3VnZ2VzdGlvbnM7XG4gIH1cblxuICByZW5kZXJTdWdnZXN0aW9uKHN1Z2c6IFdvcmtzcGFjZVN1Z2dlc3Rpb24sIHBhcmVudEVsOiBIVE1MRWxlbWVudCk6IHZvaWQge1xuICAgIGlmIChzdWdnKSB7XG4gICAgICB0aGlzLmFkZENsYXNzZXNUb1N1Z2dlc3Rpb25Db250YWluZXIocGFyZW50RWwsIFsncXNwLXN1Z2dlc3Rpb24td29ya3NwYWNlJ10pO1xuICAgICAgdGhpcy5yZW5kZXJDb250ZW50KHBhcmVudEVsLCBzdWdnLml0ZW0uaWQsIHN1Z2cubWF0Y2gpO1xuICAgIH1cbiAgfVxuXG4gIG9uQ2hvb3NlU3VnZ2VzdGlvbihzdWdnOiBXb3Jrc3BhY2VTdWdnZXN0aW9uLCBfZXZ0OiBNb3VzZUV2ZW50IHwgS2V5Ym9hcmRFdmVudCk6IHZvaWQge1xuICAgIGlmIChzdWdnKSB7XG4gICAgICBjb25zdCB7IGlkIH0gPSBzdWdnLml0ZW07XG4gICAgICBjb25zdCBwbHVnaW5JbnN0YW5jZSA9IHRoaXMuZ2V0U3lzdGVtV29ya3NwYWNlc1BsdWdpbkluc3RhbmNlKCk7XG5cbiAgICAgIGlmICh0eXBlb2YgcGx1Z2luSW5zdGFuY2VbJ2xvYWRXb3Jrc3BhY2UnXSA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICBwbHVnaW5JbnN0YW5jZS5sb2FkV29ya3NwYWNlKGlkKTtcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICBwcml2YXRlIGdldEl0ZW1zKCk6IFdvcmtzcGFjZUluZm9bXSB7XG4gICAgY29uc3QgaXRlbXM6IFdvcmtzcGFjZUluZm9bXSA9IFtdO1xuICAgIGNvbnN0IHdvcmtzcGFjZXMgPSB0aGlzLmdldFN5c3RlbVdvcmtzcGFjZXNQbHVnaW5JbnN0YW5jZSgpPy53b3Jrc3BhY2VzO1xuXG4gICAgaWYgKHdvcmtzcGFjZXMpIHtcbiAgICAgIE9iamVjdC5rZXlzKHdvcmtzcGFjZXMpLmZvckVhY2goKGlkKSA9PiBpdGVtcy5wdXNoKHsgaWQsIHR5cGU6ICd3b3Jrc3BhY2VJbmZvJyB9KSk7XG4gICAgfVxuXG4gICAgcmV0dXJuIGl0ZW1zO1xuICB9XG5cbiAgcHJpdmF0ZSBpc1dvcmtzcGFjZXNQbHVnaW5FbmFibGVkKCk6IGJvb2xlYW4ge1xuICAgIGNvbnN0IHBsdWdpbiA9IHRoaXMuZ2V0U3lzdGVtV29ya3NwYWNlc1BsdWdpbigpO1xuICAgIHJldHVybiBwbHVnaW4/LmVuYWJsZWQ7XG4gIH1cblxuICBwcml2YXRlIGdldFN5c3RlbVdvcmtzcGFjZXNQbHVnaW4oKTogSW5zdGFsbGVkUGx1Z2luIHtcbiAgICByZXR1cm4gZ2V0SW50ZXJuYWxQbHVnaW5CeUlkKHRoaXMuYXBwLCBXT1JLU1BBQ0VfUExVR0lOX0lEKTtcbiAgfVxuXG4gIHByaXZhdGUgZ2V0U3lzdGVtV29ya3NwYWNlc1BsdWdpbkluc3RhbmNlKCk6IFdvcmtzcGFjZXNQbHVnaW5JbnN0YW5jZSB7XG4gICAgY29uc3Qgd29ya3NwYWNlc1BsdWdpbiA9IHRoaXMuZ2V0U3lzdGVtV29ya3NwYWNlc1BsdWdpbigpO1xuICAgIHJldHVybiB3b3Jrc3BhY2VzUGx1Z2luPy5pbnN0YW5jZSBhcyBXb3Jrc3BhY2VzUGx1Z2luSW5zdGFuY2U7XG4gIH1cbn1cbiIsImltcG9ydCB7XG4gIEhlYWRpbmdDYWNoZSxcbiAgUHJlcGFyZWRRdWVyeSxcbiAgU2VhcmNoUmVzdWx0LFxuICBURmlsZSxcbiAgVEFic3RyYWN0RmlsZSxcbiAgc29ydFNlYXJjaFJlc3VsdHMsXG4gIFdvcmtzcGFjZUxlYWYsXG4gIFRGb2xkZXIsXG59IGZyb20gJ29ic2lkaWFuJztcbmltcG9ydCB7IElucHV0SW5mbyB9IGZyb20gJ3NyYy9zd2l0Y2hlclBsdXMnO1xuaW1wb3J0IHtcbiAgTW9kZSxcbiAgSGVhZGluZ1N1Z2dlc3Rpb24sXG4gIEZpbGVTdWdnZXN0aW9uLFxuICBBbGlhc1N1Z2dlc3Rpb24sXG4gIFVucmVzb2x2ZWRTdWdnZXN0aW9uLFxuICBIZWFkaW5nSW5kaWNhdG9ycyxcbiAgQW55U3VnZ2VzdGlvbixcbiAgU3VnZ2VzdGlvblR5cGUsXG4gIE1hdGNoVHlwZSxcbiAgU2VhcmNoUmVzdWx0V2l0aEZhbGxiYWNrLFxufSBmcm9tICdzcmMvdHlwZXMnO1xuaW1wb3J0IHsgaXNURmlsZSwgRnJvbnRNYXR0ZXJQYXJzZXIsIG1hdGNoZXJGbkZvclJlZ0V4TGlzdCB9IGZyb20gJ3NyYy91dGlscyc7XG5pbXBvcnQgeyBIYW5kbGVyIH0gZnJvbSAnLi9oYW5kbGVyJztcblxudHlwZSBTdXBwb3J0ZWRTdWdnZXN0aW9uVHlwZXMgPVxuICB8IEhlYWRpbmdTdWdnZXN0aW9uXG4gIHwgRmlsZVN1Z2dlc3Rpb25cbiAgfCBBbGlhc1N1Z2dlc3Rpb25cbiAgfCBVbnJlc29sdmVkU3VnZ2VzdGlvbjtcblxuZXhwb3J0IGNsYXNzIEhlYWRpbmdzSGFuZGxlciBleHRlbmRzIEhhbmRsZXI8U3VwcG9ydGVkU3VnZ2VzdGlvblR5cGVzPiB7XG4gIG92ZXJyaWRlIGdldCBjb21tYW5kU3RyaW5nKCk6IHN0cmluZyB7XG4gICAgcmV0dXJuIHRoaXMuc2V0dGluZ3M/LmhlYWRpbmdzTGlzdENvbW1hbmQ7XG4gIH1cblxuICB2YWxpZGF0ZUNvbW1hbmQoXG4gICAgaW5wdXRJbmZvOiBJbnB1dEluZm8sXG4gICAgaW5kZXg6IG51bWJlcixcbiAgICBmaWx0ZXJUZXh0OiBzdHJpbmcsXG4gICAgX2FjdGl2ZVN1Z2dlc3Rpb246IEFueVN1Z2dlc3Rpb24sXG4gICAgX2FjdGl2ZUxlYWY6IFdvcmtzcGFjZUxlYWYsXG4gICk6IHZvaWQge1xuICAgIGlucHV0SW5mby5tb2RlID0gTW9kZS5IZWFkaW5nc0xpc3Q7XG5cbiAgICBjb25zdCBoZWFkaW5nc0NtZCA9IGlucHV0SW5mby5wYXJzZWRDb21tYW5kKE1vZGUuSGVhZGluZ3NMaXN0KTtcbiAgICBoZWFkaW5nc0NtZC5pbmRleCA9IGluZGV4O1xuICAgIGhlYWRpbmdzQ21kLnBhcnNlZElucHV0ID0gZmlsdGVyVGV4dDtcbiAgICBoZWFkaW5nc0NtZC5pc1ZhbGlkYXRlZCA9IHRydWU7XG4gIH1cblxuICBvbkNob29zZVN1Z2dlc3Rpb24oc3VnZzogSGVhZGluZ1N1Z2dlc3Rpb24sIGV2dDogTW91c2VFdmVudCB8IEtleWJvYXJkRXZlbnQpOiB2b2lkIHtcbiAgICBpZiAoc3VnZykge1xuICAgICAgY29uc3Qge1xuICAgICAgICBzdGFydDogeyBsaW5lLCBjb2wgfSxcbiAgICAgICAgZW5kOiBlbmRMb2MsXG4gICAgICB9ID0gc3VnZy5pdGVtLnBvc2l0aW9uO1xuXG4gICAgICAvLyBzdGF0ZSBpbmZvcm1hdGlvbiB0byBoaWdobGlnaHQgdGhlIHRhcmdldCBoZWFkaW5nXG4gICAgICBjb25zdCBlU3RhdGUgPSB7XG4gICAgICAgIGFjdGl2ZTogdHJ1ZSxcbiAgICAgICAgZm9jdXM6IHRydWUsXG4gICAgICAgIHN0YXJ0TG9jOiB7IGxpbmUsIGNvbCB9LFxuICAgICAgICBlbmRMb2MsXG4gICAgICAgIGxpbmUsXG4gICAgICAgIGN1cnNvcjoge1xuICAgICAgICAgIGZyb206IHsgbGluZSwgY2g6IGNvbCB9LFxuICAgICAgICAgIHRvOiB7IGxpbmUsIGNoOiBjb2wgfSxcbiAgICAgICAgfSxcbiAgICAgIH07XG5cbiAgICAgIHRoaXMubmF2aWdhdGVUb0xlYWZPck9wZW5GaWxlKFxuICAgICAgICBldnQsXG4gICAgICAgIHN1Z2cuZmlsZSxcbiAgICAgICAgJ1VuYWJsZSB0byBuYXZpZ2F0ZSB0byBoZWFkaW5nIGZvciBmaWxlLicsXG4gICAgICAgIHsgYWN0aXZlOiB0cnVlLCBlU3RhdGUgfSxcbiAgICAgICk7XG4gICAgfVxuICB9XG5cbiAgcmVuZGVyU3VnZ2VzdGlvbihzdWdnOiBIZWFkaW5nU3VnZ2VzdGlvbiwgcGFyZW50RWw6IEhUTUxFbGVtZW50KTogdm9pZCB7XG4gICAgaWYgKHN1Z2cpIHtcbiAgICAgIGNvbnN0IHsgaXRlbSB9ID0gc3VnZztcblxuICAgICAgdGhpcy5hZGRDbGFzc2VzVG9TdWdnZXN0aW9uQ29udGFpbmVyKHBhcmVudEVsLCBbXG4gICAgICAgICdxc3Atc3VnZ2VzdGlvbi1oZWFkaW5ncycsXG4gICAgICAgIGBxc3AtaGVhZGluZ3MtbCR7aXRlbS5sZXZlbH1gLFxuICAgICAgXSk7XG5cbiAgICAgIGNvbnN0IGNvbnRlbnRFbCA9IHRoaXMucmVuZGVyQ29udGVudChwYXJlbnRFbCwgaXRlbS5oZWFkaW5nLCBzdWdnLm1hdGNoKTtcbiAgICAgIHRoaXMucmVuZGVyUGF0aChjb250ZW50RWwsIHN1Z2cuZmlsZSk7XG5cbiAgICAgIC8vIHJlbmRlciB0aGUgZmxhaXIgaWNvblxuICAgICAgY29uc3QgYXV4RWwgPSBwYXJlbnRFbC5jcmVhdGVEaXYoeyBjbHM6IFsnc3VnZ2VzdGlvbi1hdXgnLCAncXNwLWF1eCddIH0pO1xuICAgICAgYXV4RWwuY3JlYXRlU3Bhbih7XG4gICAgICAgIGNsczogWydzdWdnZXN0aW9uLWZsYWlyJywgJ3FzcC1oZWFkaW5ncy1pbmRpY2F0b3InXSxcbiAgICAgICAgdGV4dDogSGVhZGluZ0luZGljYXRvcnNbaXRlbS5sZXZlbF0sXG4gICAgICB9KTtcblxuICAgICAgaWYgKHN1Z2cuZG93bnJhbmtlZCkge1xuICAgICAgICBwYXJlbnRFbC5hZGRDbGFzcygnbW9kLWRvd25yYW5rZWQnKTtcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICBnZXRTdWdnZXN0aW9ucyhpbnB1dEluZm86IElucHV0SW5mbyk6IFN1cHBvcnRlZFN1Z2dlc3Rpb25UeXBlc1tdIHtcbiAgICBsZXQgc3VnZ2VzdGlvbnM6IFN1cHBvcnRlZFN1Z2dlc3Rpb25UeXBlc1tdID0gW107XG5cbiAgICBpZiAoaW5wdXRJbmZvKSB7XG4gICAgICBpbnB1dEluZm8uYnVpbGRTZWFyY2hRdWVyeSgpO1xuICAgICAgY29uc3QgeyBwcmVwUXVlcnksIGhhc1NlYXJjaFRlcm0gfSA9IGlucHV0SW5mby5zZWFyY2hRdWVyeTtcblxuICAgICAgaWYgKGhhc1NlYXJjaFRlcm0pIHtcbiAgICAgICAgY29uc3QgeyBsaW1pdCB9ID0gdGhpcy5zZXR0aW5ncztcbiAgICAgICAgc3VnZ2VzdGlvbnMgPSB0aGlzLmdldEFsbEZpbGVzU3VnZ2VzdGlvbnMocHJlcFF1ZXJ5KTtcbiAgICAgICAgc29ydFNlYXJjaFJlc3VsdHMoc3VnZ2VzdGlvbnMpO1xuXG4gICAgICAgIGlmIChzdWdnZXN0aW9ucy5sZW5ndGggPiAwICYmIGxpbWl0ID4gMCkge1xuICAgICAgICAgIHN1Z2dlc3Rpb25zID0gc3VnZ2VzdGlvbnMuc2xpY2UoMCwgbGltaXQpO1xuICAgICAgICB9XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBzdWdnZXN0aW9ucyA9IHRoaXMuZ2V0UmVjZW50RmlsZXNTdWdnZXN0aW9ucygpO1xuICAgICAgfVxuICAgIH1cblxuICAgIHJldHVybiBzdWdnZXN0aW9ucztcbiAgfVxuXG4gIGdldEFsbEZpbGVzU3VnZ2VzdGlvbnMocHJlcFF1ZXJ5OiBQcmVwYXJlZFF1ZXJ5KTogU3VwcG9ydGVkU3VnZ2VzdGlvblR5cGVzW10ge1xuICAgIGNvbnN0IHN1Z2dlc3Rpb25zOiBTdXBwb3J0ZWRTdWdnZXN0aW9uVHlwZXNbXSA9IFtdO1xuICAgIGNvbnN0IHtcbiAgICAgIGFwcDogeyB2YXVsdCB9LFxuICAgICAgc2V0dGluZ3M6IHsgc3RyaWN0SGVhZGluZ3NPbmx5LCBzaG93RXhpc3RpbmdPbmx5LCBleGNsdWRlRm9sZGVycyB9LFxuICAgIH0gPSB0aGlzO1xuXG4gICAgY29uc3QgaXNFeGNsdWRlZEZvbGRlciA9IG1hdGNoZXJGbkZvclJlZ0V4TGlzdChleGNsdWRlRm9sZGVycyk7XG4gICAgbGV0IG5vZGVzOiBUQWJzdHJhY3RGaWxlW10gPSBbdmF1bHQuZ2V0Um9vdCgpXTtcblxuICAgIHdoaWxlIChub2Rlcy5sZW5ndGggPiAwKSB7XG4gICAgICBjb25zdCBub2RlID0gbm9kZXMucG9wKCk7XG5cbiAgICAgIGlmIChpc1RGaWxlKG5vZGUpKSB7XG4gICAgICAgIHRoaXMuYWRkU3VnZ2VzdGlvbnNGcm9tRmlsZShzdWdnZXN0aW9ucywgbm9kZSwgcHJlcFF1ZXJ5KTtcbiAgICAgIH0gZWxzZSBpZiAoIWlzRXhjbHVkZWRGb2xkZXIobm9kZS5wYXRoKSkge1xuICAgICAgICBub2RlcyA9IG5vZGVzLmNvbmNhdCgobm9kZSBhcyBURm9sZGVyKS5jaGlsZHJlbik7XG4gICAgICB9XG4gICAgfVxuXG4gICAgaWYgKCFzdHJpY3RIZWFkaW5nc09ubHkgJiYgIXNob3dFeGlzdGluZ09ubHkpIHtcbiAgICAgIHRoaXMuYWRkVW5yZXNvbHZlZFN1Z2dlc3Rpb25zKHN1Z2dlc3Rpb25zIGFzIFVucmVzb2x2ZWRTdWdnZXN0aW9uW10sIHByZXBRdWVyeSk7XG4gICAgfVxuXG4gICAgcmV0dXJuIHN1Z2dlc3Rpb25zO1xuICB9XG5cbiAgYWRkU3VnZ2VzdGlvbnNGcm9tRmlsZShcbiAgICBzdWdnZXN0aW9uczogU3VwcG9ydGVkU3VnZ2VzdGlvblR5cGVzW10sXG4gICAgZmlsZTogVEZpbGUsXG4gICAgcHJlcFF1ZXJ5OiBQcmVwYXJlZFF1ZXJ5LFxuICApOiB2b2lkIHtcbiAgICBjb25zdCB7XG4gICAgICBzZWFyY2hBbGxIZWFkaW5ncyxcbiAgICAgIHN0cmljdEhlYWRpbmdzT25seSxcbiAgICAgIHNob3VsZFNlYXJjaEZpbGVuYW1lcyxcbiAgICAgIHNob3VsZFNob3dBbGlhcyxcbiAgICB9ID0gdGhpcy5zZXR0aW5ncztcblxuICAgIGlmICh0aGlzLnNob3VsZEluY2x1ZGVGaWxlKGZpbGUpKSB7XG4gICAgICBjb25zdCBpc0gxTWF0Y2hlZCA9IHRoaXMuYWRkSGVhZGluZ1N1Z2dlc3Rpb25zKFxuICAgICAgICBzdWdnZXN0aW9ucyBhcyBIZWFkaW5nU3VnZ2VzdGlvbltdLFxuICAgICAgICBwcmVwUXVlcnksXG4gICAgICAgIGZpbGUsXG4gICAgICAgIHNlYXJjaEFsbEhlYWRpbmdzLFxuICAgICAgKTtcblxuICAgICAgaWYgKCFzdHJpY3RIZWFkaW5nc09ubHkpIHtcbiAgICAgICAgaWYgKHNob3VsZFNlYXJjaEZpbGVuYW1lcyB8fCAhaXNIMU1hdGNoZWQpIHtcbiAgICAgICAgICAvLyBpZiBzdHJpY3QgaXMgZGlzYWJsZWQgYW5kIGZpbGVuYW1lIHNlYXJjaCBpcyBlbmFibGVkIG9yIHRoZXJlXG4gICAgICAgICAgLy8gaXNuJ3QgYW4gSDEgbWF0Y2gsIHRoZW4gZG8gYSBmYWxsYmFjayBzZWFyY2ggYWdhaW5zdCB0aGUgZmlsZW5hbWUsIHRoZW4gcGF0aFxuICAgICAgICAgIHRoaXMuYWRkRmlsZVN1Z2dlc3Rpb25zKHN1Z2dlc3Rpb25zIGFzIEZpbGVTdWdnZXN0aW9uW10sIHByZXBRdWVyeSwgZmlsZSk7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoc2hvdWxkU2hvd0FsaWFzKSB7XG4gICAgICAgICAgdGhpcy5hZGRBbGlhc1N1Z2dlc3Rpb25zKHN1Z2dlc3Rpb25zIGFzIEFsaWFzU3VnZ2VzdGlvbltdLCBwcmVwUXVlcnksIGZpbGUpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgZG93bnJhbmtTY29yZUlmSWdub3JlZDxcbiAgICBUIGV4dGVuZHMgRXhjbHVkZTxTdXBwb3J0ZWRTdWdnZXN0aW9uVHlwZXMsIFVucmVzb2x2ZWRTdWdnZXN0aW9uPixcbiAgPihzdWdnOiBUKTogVCB7XG4gICAgaWYgKHRoaXMuYXBwLm1ldGFkYXRhQ2FjaGUuaXNVc2VySWdub3JlZChzdWdnPy5maWxlPy5wYXRoKSkge1xuICAgICAgc3VnZy5kb3ducmFua2VkID0gdHJ1ZTtcblxuICAgICAgaWYgKHN1Z2cubWF0Y2gpIHtcbiAgICAgICAgc3VnZy5tYXRjaC5zY29yZSAtPSAxMDtcbiAgICAgIH1cbiAgICB9XG5cbiAgICByZXR1cm4gc3VnZztcbiAgfVxuXG4gIHNob3VsZEluY2x1ZGVGaWxlKGZpbGU6IFRBYnN0cmFjdEZpbGUpOiBib29sZWFuIHtcbiAgICBsZXQgcmV0VmFsID0gZmFsc2U7XG4gICAgY29uc3Qge1xuICAgICAgc2V0dGluZ3M6IHtcbiAgICAgICAgZXhjbHVkZU9ic2lkaWFuSWdub3JlZEZpbGVzLFxuICAgICAgICBidWlsdEluU3lzdGVtT3B0aW9uczogeyBzaG93QXR0YWNobWVudHMsIHNob3dBbGxGaWxlVHlwZXMgfSxcbiAgICAgIH0sXG4gICAgICBhcHA6IHsgdmlld1JlZ2lzdHJ5LCBtZXRhZGF0YUNhY2hlIH0sXG4gICAgfSA9IHRoaXM7XG5cbiAgICBpZiAoaXNURmlsZShmaWxlKSkge1xuICAgICAgY29uc3QgeyBleHRlbnNpb24gfSA9IGZpbGU7XG5cbiAgICAgIGlmICghbWV0YWRhdGFDYWNoZS5pc1VzZXJJZ25vcmVkKGZpbGUucGF0aCkgfHwgIWV4Y2x1ZGVPYnNpZGlhbklnbm9yZWRGaWxlcykge1xuICAgICAgICByZXRWYWwgPSB2aWV3UmVnaXN0cnkuaXNFeHRlbnNpb25SZWdpc3RlcmVkKGV4dGVuc2lvbilcbiAgICAgICAgICA/IHNob3dBdHRhY2htZW50cyB8fCBleHRlbnNpb24gPT09ICdtZCdcbiAgICAgICAgICA6IHNob3dBbGxGaWxlVHlwZXM7XG4gICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuIHJldFZhbDtcbiAgfVxuXG4gIHByaXZhdGUgYWRkQWxpYXNTdWdnZXN0aW9ucyhcbiAgICBzdWdnZXN0aW9uczogQWxpYXNTdWdnZXN0aW9uW10sXG4gICAgcHJlcFF1ZXJ5OiBQcmVwYXJlZFF1ZXJ5LFxuICAgIGZpbGU6IFRGaWxlLFxuICApOiB2b2lkIHtcbiAgICBjb25zdCB7IG1ldGFkYXRhQ2FjaGUgfSA9IHRoaXMuYXBwO1xuICAgIGNvbnN0IGZyb250TWF0dGVyID0gbWV0YWRhdGFDYWNoZS5nZXRGaWxlQ2FjaGUoZmlsZSk/LmZyb250bWF0dGVyO1xuXG4gICAgaWYgKGZyb250TWF0dGVyKSB7XG4gICAgICBjb25zdCBhbGlhc2VzID0gRnJvbnRNYXR0ZXJQYXJzZXIuZ2V0QWxpYXNlcyhmcm9udE1hdHRlcik7XG4gICAgICBsZXQgaSA9IGFsaWFzZXMubGVuZ3RoO1xuXG4gICAgICAvLyBjcmVhdGUgc3VnZ2VzdGlvbnMgd2hlcmUgdGhlcmUgaXMgYSBtYXRjaCB3aXRoIGFuIGFsaWFzXG4gICAgICB3aGlsZSAoaS0tKSB7XG4gICAgICAgIGNvbnN0IGFsaWFzID0gYWxpYXNlc1tpXTtcbiAgICAgICAgY29uc3QgeyBtYXRjaCB9ID0gdGhpcy5mdXp6eVNlYXJjaFdpdGhGYWxsYmFjayhwcmVwUXVlcnksIGFsaWFzKTtcblxuICAgICAgICBpZiAobWF0Y2gpIHtcbiAgICAgICAgICBzdWdnZXN0aW9ucy5wdXNoKHRoaXMuY3JlYXRlQWxpYXNTdWdnZXN0aW9uKGFsaWFzLCBmaWxlLCBtYXRjaCkpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgcHJpdmF0ZSBhZGRGaWxlU3VnZ2VzdGlvbnMoXG4gICAgc3VnZ2VzdGlvbnM6IEZpbGVTdWdnZXN0aW9uW10sXG4gICAgcHJlcFF1ZXJ5OiBQcmVwYXJlZFF1ZXJ5LFxuICAgIGZpbGU6IFRGaWxlLFxuICApOiB2b2lkIHtcbiAgICBjb25zdCB7IG1hdGNoLCBtYXRjaFR5cGUsIG1hdGNoVGV4dCB9ID0gdGhpcy5mdXp6eVNlYXJjaFdpdGhGYWxsYmFjayhcbiAgICAgIHByZXBRdWVyeSxcbiAgICAgIG51bGwsXG4gICAgICBmaWxlLFxuICAgICk7XG5cbiAgICBpZiAobWF0Y2gpIHtcbiAgICAgIHN1Z2dlc3Rpb25zLnB1c2godGhpcy5jcmVhdGVGaWxlU3VnZ2VzdGlvbihmaWxlLCBtYXRjaCwgbWF0Y2hUeXBlLCBtYXRjaFRleHQpKTtcbiAgICB9XG4gIH1cblxuICBwcml2YXRlIGFkZEhlYWRpbmdTdWdnZXN0aW9ucyhcbiAgICBzdWdnZXN0aW9uczogSGVhZGluZ1N1Z2dlc3Rpb25bXSxcbiAgICBwcmVwUXVlcnk6IFByZXBhcmVkUXVlcnksXG4gICAgZmlsZTogVEZpbGUsXG4gICAgYWxsSGVhZGluZ3M6IGJvb2xlYW4sXG4gICk6IGJvb2xlYW4ge1xuICAgIGNvbnN0IHsgbWV0YWRhdGFDYWNoZSB9ID0gdGhpcy5hcHA7XG4gICAgY29uc3QgaGVhZGluZ0xpc3QgPSBtZXRhZGF0YUNhY2hlLmdldEZpbGVDYWNoZShmaWxlKT8uaGVhZGluZ3MgPz8gW107XG4gICAgbGV0IGgxOiBIZWFkaW5nQ2FjaGUgPSBudWxsO1xuICAgIGxldCBpc0gxTWF0Y2hlZCA9IGZhbHNlO1xuICAgIGxldCBpID0gaGVhZGluZ0xpc3QubGVuZ3RoO1xuXG4gICAgd2hpbGUgKGktLSkge1xuICAgICAgY29uc3QgaGVhZGluZyA9IGhlYWRpbmdMaXN0W2ldO1xuICAgICAgbGV0IGlzTWF0Y2hlZCA9IGZhbHNlO1xuXG4gICAgICBpZiAoYWxsSGVhZGluZ3MpIHtcbiAgICAgICAgaXNNYXRjaGVkID0gdGhpcy5tYXRjaEFuZFB1c2hIZWFkaW5nKHN1Z2dlc3Rpb25zLCBwcmVwUXVlcnksIGZpbGUsIGhlYWRpbmcpO1xuICAgICAgfVxuXG4gICAgICBpZiAoaGVhZGluZy5sZXZlbCA9PT0gMSkge1xuICAgICAgICBjb25zdCB7IGxpbmUgfSA9IGhlYWRpbmcucG9zaXRpb24uc3RhcnQ7XG5cbiAgICAgICAgaWYgKGgxID09PSBudWxsIHx8IGxpbmUgPCBoMS5wb3NpdGlvbi5zdGFydC5saW5lKSB7XG4gICAgICAgICAgaDEgPSBoZWFkaW5nO1xuICAgICAgICAgIGlzSDFNYXRjaGVkID0gaXNNYXRjaGVkO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuXG4gICAgaWYgKCFhbGxIZWFkaW5ncyAmJiBoMSkge1xuICAgICAgaXNIMU1hdGNoZWQgPSB0aGlzLm1hdGNoQW5kUHVzaEhlYWRpbmcoc3VnZ2VzdGlvbnMsIHByZXBRdWVyeSwgZmlsZSwgaDEpO1xuICAgIH1cblxuICAgIHJldHVybiBpc0gxTWF0Y2hlZDtcbiAgfVxuXG4gIHByaXZhdGUgbWF0Y2hBbmRQdXNoSGVhZGluZyhcbiAgICBzdWdnZXN0aW9uczogSGVhZGluZ1N1Z2dlc3Rpb25bXSxcbiAgICBwcmVwUXVlcnk6IFByZXBhcmVkUXVlcnksXG4gICAgZmlsZTogVEZpbGUsXG4gICAgaGVhZGluZzogSGVhZGluZ0NhY2hlLFxuICApOiBib29sZWFuIHtcbiAgICBjb25zdCB7IG1hdGNoIH0gPSB0aGlzLmZ1enp5U2VhcmNoV2l0aEZhbGxiYWNrKHByZXBRdWVyeSwgaGVhZGluZy5oZWFkaW5nKTtcblxuICAgIGlmIChtYXRjaCkge1xuICAgICAgc3VnZ2VzdGlvbnMucHVzaCh0aGlzLmNyZWF0ZUhlYWRpbmdTdWdnZXN0aW9uKGhlYWRpbmcsIGZpbGUsIG1hdGNoKSk7XG4gICAgfVxuXG4gICAgcmV0dXJuICEhbWF0Y2g7XG4gIH1cblxuICBwcml2YXRlIGFkZFVucmVzb2x2ZWRTdWdnZXN0aW9ucyhcbiAgICBzdWdnZXN0aW9uczogVW5yZXNvbHZlZFN1Z2dlc3Rpb25bXSxcbiAgICBwcmVwUXVlcnk6IFByZXBhcmVkUXVlcnksXG4gICk6IHZvaWQge1xuICAgIGNvbnN0IHsgdW5yZXNvbHZlZExpbmtzIH0gPSB0aGlzLmFwcC5tZXRhZGF0YUNhY2hlO1xuXG4gICAgY29uc3QgdW5yZXNvbHZlZFNldCA9IG5ldyBTZXQ8c3RyaW5nPigpO1xuICAgIGNvbnN0IHNvdXJjZXMgPSBPYmplY3Qua2V5cyh1bnJlc29sdmVkTGlua3MpO1xuICAgIGxldCBpID0gc291cmNlcy5sZW5ndGg7XG5cbiAgICAvLyBjcmVhdGUgYSBkaXN0aW5jdCBsaXN0IG9mIHVucmVzb2x2ZWQgbGlua3NcbiAgICB3aGlsZSAoaS0tKSB7XG4gICAgICAvLyBlYWNoIHNvdXJjZSBoYXMgYW4gb2JqZWN0IHdpdGgga2V5cyB0aGF0IHJlcHJlc2VudCB0aGUgbGlzdCBvZiB1bnJlc29sdmVkIGxpbmtzXG4gICAgICAvLyBmb3IgdGhhdCBzb3VyY2UgZmlsZVxuICAgICAgY29uc3Qgc291cmNlUGF0aCA9IHNvdXJjZXNbaV07XG4gICAgICBjb25zdCBsaW5rcyA9IE9iamVjdC5rZXlzKHVucmVzb2x2ZWRMaW5rc1tzb3VyY2VQYXRoXSk7XG4gICAgICBsZXQgaiA9IGxpbmtzLmxlbmd0aDtcblxuICAgICAgd2hpbGUgKGotLSkge1xuICAgICAgICAvLyB1bnJlc29sdmVkIGxpbmtzIGNhbiBiZSBkdXBsaWNhdGVzLCB1c2UgYSBTZXQgdG8gZ2V0IGEgZGlzdGluY3QgbGlzdFxuICAgICAgICB1bnJlc29sdmVkU2V0LmFkZChsaW5rc1tqXSk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgY29uc3QgdW5yZXNvbHZlZExpc3QgPSBBcnJheS5mcm9tKHVucmVzb2x2ZWRTZXQpO1xuICAgIGkgPSB1bnJlc29sdmVkTGlzdC5sZW5ndGg7XG5cbiAgICAvLyBjcmVhdGUgc3VnZ2VzdGlvbnMgd2hlcmUgdGhlcmUgaXMgYSBtYXRjaCB3aXRoIGFuIHVucmVzb2x2ZWQgbGlua1xuICAgIHdoaWxlIChpLS0pIHtcbiAgICAgIGNvbnN0IHVucmVzb2x2ZWQgPSB1bnJlc29sdmVkTGlzdFtpXTtcbiAgICAgIGNvbnN0IHsgbWF0Y2ggfSA9IHRoaXMuZnV6enlTZWFyY2hXaXRoRmFsbGJhY2socHJlcFF1ZXJ5LCB1bnJlc29sdmVkKTtcblxuICAgICAgaWYgKG1hdGNoKSB7XG4gICAgICAgIHN1Z2dlc3Rpb25zLnB1c2godGhpcy5jcmVhdGVVbnJlc29sdmVkU3VnZ2VzdGlvbih1bnJlc29sdmVkLCBtYXRjaCkpO1xuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIHByaXZhdGUgY3JlYXRlQWxpYXNTdWdnZXN0aW9uKFxuICAgIGFsaWFzOiBzdHJpbmcsXG4gICAgZmlsZTogVEZpbGUsXG4gICAgbWF0Y2g6IFNlYXJjaFJlc3VsdCxcbiAgKTogQWxpYXNTdWdnZXN0aW9uIHtcbiAgICBjb25zdCBzdWdnOiBBbGlhc1N1Z2dlc3Rpb24gPSB7XG4gICAgICBhbGlhcyxcbiAgICAgIGZpbGUsXG4gICAgICAuLi50aGlzLmNyZWF0ZVNlYXJjaE1hdGNoKG1hdGNoLCBNYXRjaFR5cGUuUHJpbWFyeSwgYWxpYXMpLFxuICAgICAgdHlwZTogU3VnZ2VzdGlvblR5cGUuQWxpYXMsXG4gICAgfTtcblxuICAgIHJldHVybiB0aGlzLmRvd25yYW5rU2NvcmVJZklnbm9yZWQoc3VnZyk7XG4gIH1cblxuICBwcml2YXRlIGNyZWF0ZVVucmVzb2x2ZWRTdWdnZXN0aW9uKFxuICAgIGxpbmt0ZXh0OiBzdHJpbmcsXG4gICAgbWF0Y2g6IFNlYXJjaFJlc3VsdCxcbiAgKTogVW5yZXNvbHZlZFN1Z2dlc3Rpb24ge1xuICAgIHJldHVybiB7XG4gICAgICBsaW5rdGV4dCxcbiAgICAgIC4uLnRoaXMuY3JlYXRlU2VhcmNoTWF0Y2gobWF0Y2gsIE1hdGNoVHlwZS5QcmltYXJ5LCBsaW5rdGV4dCksXG4gICAgICB0eXBlOiBTdWdnZXN0aW9uVHlwZS5VbnJlc29sdmVkLFxuICAgIH07XG4gIH1cblxuICBwcml2YXRlIGNyZWF0ZUZpbGVTdWdnZXN0aW9uKFxuICAgIGZpbGU6IFRGaWxlLFxuICAgIG1hdGNoOiBTZWFyY2hSZXN1bHQsXG4gICAgbWF0Y2hUeXBlID0gTWF0Y2hUeXBlLk5vbmUsXG4gICAgbWF0Y2hUZXh0OiBzdHJpbmcgPSBudWxsLFxuICApOiBGaWxlU3VnZ2VzdGlvbiB7XG4gICAgY29uc3Qgc3VnZzogRmlsZVN1Z2dlc3Rpb24gPSB7XG4gICAgICBmaWxlLFxuICAgICAgbWF0Y2gsXG4gICAgICBtYXRjaFR5cGUsXG4gICAgICBtYXRjaFRleHQsXG4gICAgICB0eXBlOiBTdWdnZXN0aW9uVHlwZS5GaWxlLFxuICAgIH07XG5cbiAgICByZXR1cm4gdGhpcy5kb3ducmFua1Njb3JlSWZJZ25vcmVkKHN1Z2cpO1xuICB9XG5cbiAgcHJpdmF0ZSBjcmVhdGVIZWFkaW5nU3VnZ2VzdGlvbihcbiAgICBpdGVtOiBIZWFkaW5nQ2FjaGUsXG4gICAgZmlsZTogVEZpbGUsXG4gICAgbWF0Y2g6IFNlYXJjaFJlc3VsdCxcbiAgKTogSGVhZGluZ1N1Z2dlc3Rpb24ge1xuICAgIGNvbnN0IHN1Z2c6IEhlYWRpbmdTdWdnZXN0aW9uID0ge1xuICAgICAgaXRlbSxcbiAgICAgIGZpbGUsXG4gICAgICAuLi50aGlzLmNyZWF0ZVNlYXJjaE1hdGNoKG1hdGNoLCBNYXRjaFR5cGUuUHJpbWFyeSwgaXRlbS5oZWFkaW5nKSxcbiAgICAgIHR5cGU6IFN1Z2dlc3Rpb25UeXBlLkhlYWRpbmdzTGlzdCxcbiAgICB9O1xuXG4gICAgcmV0dXJuIHRoaXMuZG93bnJhbmtTY29yZUlmSWdub3JlZChzdWdnKTtcbiAgfVxuXG4gIHByaXZhdGUgY3JlYXRlU2VhcmNoTWF0Y2goXG4gICAgbWF0Y2g6IFNlYXJjaFJlc3VsdCxcbiAgICB0eXBlOiBNYXRjaFR5cGUsXG4gICAgdGV4dDogc3RyaW5nLFxuICApOiBTZWFyY2hSZXN1bHRXaXRoRmFsbGJhY2sge1xuICAgIGxldCBtYXRjaFR5cGUgPSBNYXRjaFR5cGUuTm9uZTtcbiAgICBsZXQgbWF0Y2hUZXh0ID0gbnVsbDtcblxuICAgIGlmIChtYXRjaCkge1xuICAgICAgbWF0Y2hUeXBlID0gdHlwZTtcbiAgICAgIG1hdGNoVGV4dCA9IHRleHQ7XG4gICAgfVxuXG4gICAgcmV0dXJuIHtcbiAgICAgIG1hdGNoLFxuICAgICAgbWF0Y2hUeXBlLFxuICAgICAgbWF0Y2hUZXh0LFxuICAgIH07XG4gIH1cblxuICBwcml2YXRlIGdldFJlY2VudEZpbGVzU3VnZ2VzdGlvbnMoKTogKEhlYWRpbmdTdWdnZXN0aW9uIHwgRmlsZVN1Z2dlc3Rpb24pW10ge1xuICAgIGNvbnN0IHN1Z2dlc3Rpb25zOiAoSGVhZGluZ1N1Z2dlc3Rpb24gfCBGaWxlU3VnZ2VzdGlvbilbXSA9IFtdO1xuICAgIGNvbnN0IHsgd29ya3NwYWNlLCB2YXVsdCwgbWV0YWRhdGFDYWNoZSB9ID0gdGhpcy5hcHA7XG4gICAgY29uc3QgcmVjZW50RmlsZVBhdGhzID0gd29ya3NwYWNlLmdldExhc3RPcGVuRmlsZXMoKTtcblxuICAgIHJlY2VudEZpbGVQYXRocy5mb3JFYWNoKChwYXRoKSA9PiB7XG4gICAgICBjb25zdCBmaWxlID0gdmF1bHQuZ2V0QWJzdHJhY3RGaWxlQnlQYXRoKHBhdGgpO1xuXG4gICAgICBpZiAodGhpcy5zaG91bGRJbmNsdWRlRmlsZShmaWxlKSkge1xuICAgICAgICBjb25zdCBmID0gZmlsZSBhcyBURmlsZTtcbiAgICAgICAgbGV0IGgxOiBIZWFkaW5nQ2FjaGUgPSBudWxsO1xuXG4gICAgICAgIGNvbnN0IGgxcyA9IG1ldGFkYXRhQ2FjaGVcbiAgICAgICAgICAuZ2V0RmlsZUNhY2hlKGYpXG4gICAgICAgICAgPy5oZWFkaW5ncz8uZmlsdGVyKChoKSA9PiBoLmxldmVsID09PSAxKVxuICAgICAgICAgIC5zb3J0KChhLCBiKSA9PiBhLnBvc2l0aW9uLnN0YXJ0LmxpbmUgLSBiLnBvc2l0aW9uLnN0YXJ0LmxpbmUpO1xuXG4gICAgICAgIGlmIChoMXM/Lmxlbmd0aCkge1xuICAgICAgICAgIGgxID0gaDFzWzBdO1xuICAgICAgICB9XG5cbiAgICAgICAgY29uc3Qgc3VnZyA9IGgxXG4gICAgICAgICAgPyB0aGlzLmNyZWF0ZUhlYWRpbmdTdWdnZXN0aW9uKGgxLCBmLCBudWxsKVxuICAgICAgICAgIDogdGhpcy5jcmVhdGVGaWxlU3VnZ2VzdGlvbihmLCBudWxsKTtcblxuICAgICAgICBzdWdnZXN0aW9ucy5wdXNoKHN1Z2cpO1xuICAgICAgfVxuICAgIH0pO1xuXG4gICAgcmV0dXJuIHN1Z2dlc3Rpb25zO1xuICB9XG59XG4iLCJpbXBvcnQge1xuICBBbnlTdWdnZXN0aW9uLFxuICBFZGl0b3JTdWdnZXN0aW9uLFxuICBNYXRjaFR5cGUsXG4gIE1vZGUsXG4gIFNlYXJjaFJlc3VsdFdpdGhGYWxsYmFjayxcbiAgU3VnZ2VzdGlvblR5cGUsXG59IGZyb20gJ3NyYy90eXBlcyc7XG5pbXBvcnQgeyBJbnB1dEluZm8gfSBmcm9tICdzcmMvc3dpdGNoZXJQbHVzJztcbmltcG9ydCB7IFNlYXJjaFJlc3VsdCwgc29ydFNlYXJjaFJlc3VsdHMsIFdvcmtzcGFjZUxlYWYgfSBmcm9tICdvYnNpZGlhbic7XG5pbXBvcnQgeyBIYW5kbGVyIH0gZnJvbSAnLi9oYW5kbGVyJztcblxuZXhwb3J0IGNsYXNzIEVkaXRvckhhbmRsZXIgZXh0ZW5kcyBIYW5kbGVyPEVkaXRvclN1Z2dlc3Rpb24+IHtcbiAgb3ZlcnJpZGUgZ2V0IGNvbW1hbmRTdHJpbmcoKTogc3RyaW5nIHtcbiAgICByZXR1cm4gdGhpcy5zZXR0aW5ncz8uZWRpdG9yTGlzdENvbW1hbmQ7XG4gIH1cblxuICB2YWxpZGF0ZUNvbW1hbmQoXG4gICAgaW5wdXRJbmZvOiBJbnB1dEluZm8sXG4gICAgaW5kZXg6IG51bWJlcixcbiAgICBmaWx0ZXJUZXh0OiBzdHJpbmcsXG4gICAgX2FjdGl2ZVN1Z2dlc3Rpb246IEFueVN1Z2dlc3Rpb24sXG4gICAgX2FjdGl2ZUxlYWY6IFdvcmtzcGFjZUxlYWYsXG4gICk6IHZvaWQge1xuICAgIGlucHV0SW5mby5tb2RlID0gTW9kZS5FZGl0b3JMaXN0O1xuXG4gICAgY29uc3QgZWRpdG9yQ21kID0gaW5wdXRJbmZvLnBhcnNlZENvbW1hbmQoTW9kZS5FZGl0b3JMaXN0KTtcbiAgICBlZGl0b3JDbWQuaW5kZXggPSBpbmRleDtcbiAgICBlZGl0b3JDbWQucGFyc2VkSW5wdXQgPSBmaWx0ZXJUZXh0O1xuICAgIGVkaXRvckNtZC5pc1ZhbGlkYXRlZCA9IHRydWU7XG4gIH1cblxuICBnZXRTdWdnZXN0aW9ucyhpbnB1dEluZm86IElucHV0SW5mbyk6IEVkaXRvclN1Z2dlc3Rpb25bXSB7XG4gICAgY29uc3Qgc3VnZ2VzdGlvbnM6IEVkaXRvclN1Z2dlc3Rpb25bXSA9IFtdO1xuXG4gICAgaWYgKGlucHV0SW5mbykge1xuICAgICAgaW5wdXRJbmZvLmJ1aWxkU2VhcmNoUXVlcnkoKTtcbiAgICAgIGNvbnN0IHsgaGFzU2VhcmNoVGVybSwgcHJlcFF1ZXJ5IH0gPSBpbnB1dEluZm8uc2VhcmNoUXVlcnk7XG4gICAgICBjb25zdCB7IGV4Y2x1ZGVWaWV3VHlwZXMsIGluY2x1ZGVTaWRlUGFuZWxWaWV3VHlwZXMgfSA9IHRoaXMuc2V0dGluZ3M7XG5cbiAgICAgIGNvbnN0IGl0ZW1zID0gdGhpcy5nZXRPcGVuTGVhdmVzKGV4Y2x1ZGVWaWV3VHlwZXMsIGluY2x1ZGVTaWRlUGFuZWxWaWV3VHlwZXMpO1xuXG4gICAgICBpdGVtcy5mb3JFYWNoKChpdGVtKSA9PiB7XG4gICAgICAgIGNvbnN0IGZpbGUgPSBpdGVtLnZpZXc/LmZpbGU7XG4gICAgICAgIGxldCBzaG91bGRQdXNoID0gdHJ1ZTtcbiAgICAgICAgbGV0IHJlc3VsdDogU2VhcmNoUmVzdWx0V2l0aEZhbGxiYWNrID0geyBtYXRjaFR5cGU6IE1hdGNoVHlwZS5Ob25lLCBtYXRjaDogbnVsbCB9O1xuXG4gICAgICAgIGlmIChoYXNTZWFyY2hUZXJtKSB7XG4gICAgICAgICAgcmVzdWx0ID0gdGhpcy5mdXp6eVNlYXJjaFdpdGhGYWxsYmFjayhwcmVwUXVlcnksIGl0ZW0uZ2V0RGlzcGxheVRleHQoKSwgZmlsZSk7XG4gICAgICAgICAgc2hvdWxkUHVzaCA9IHJlc3VsdC5tYXRjaFR5cGUgIT09IE1hdGNoVHlwZS5Ob25lO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKHNob3VsZFB1c2gpIHtcbiAgICAgICAgICBzdWdnZXN0aW9ucy5wdXNoKHsgdHlwZTogU3VnZ2VzdGlvblR5cGUuRWRpdG9yTGlzdCwgZmlsZSwgaXRlbSwgLi4ucmVzdWx0IH0pO1xuICAgICAgICB9XG4gICAgICB9KTtcblxuICAgICAgaWYgKGhhc1NlYXJjaFRlcm0pIHtcbiAgICAgICAgc29ydFNlYXJjaFJlc3VsdHMoc3VnZ2VzdGlvbnMpO1xuICAgICAgfVxuICAgIH1cblxuICAgIHJldHVybiBzdWdnZXN0aW9ucztcbiAgfVxuXG4gIHJlbmRlclN1Z2dlc3Rpb24oc3VnZzogRWRpdG9yU3VnZ2VzdGlvbiwgcGFyZW50RWw6IEhUTUxFbGVtZW50KTogdm9pZCB7XG4gICAgaWYgKHN1Z2cpIHtcbiAgICAgIGNvbnN0IHsgZmlsZSwgbWF0Y2hUeXBlLCBtYXRjaCB9ID0gc3VnZztcbiAgICAgIGNvbnN0IGNvbnRlbnQgPSBzdWdnLml0ZW0uZ2V0RGlzcGxheVRleHQoKTtcbiAgICAgIGxldCBjb250ZW50TWF0Y2g6IFNlYXJjaFJlc3VsdCA9IG1hdGNoO1xuICAgICAgbGV0IHBhdGhNYXRjaDogU2VhcmNoUmVzdWx0ID0gbnVsbDtcblxuICAgICAgaWYgKG1hdGNoVHlwZSA9PT0gTWF0Y2hUeXBlLlBhcmVudFBhdGgpIHtcbiAgICAgICAgY29udGVudE1hdGNoID0gbnVsbDtcbiAgICAgICAgcGF0aE1hdGNoID0gbWF0Y2g7XG4gICAgICB9XG5cbiAgICAgIHRoaXMuYWRkQ2xhc3Nlc1RvU3VnZ2VzdGlvbkNvbnRhaW5lcihwYXJlbnRFbCwgWydxc3Atc3VnZ2VzdGlvbi1lZGl0b3InXSk7XG5cbiAgICAgIGNvbnN0IGNvbnRlbnRFbCA9IHRoaXMucmVuZGVyQ29udGVudChwYXJlbnRFbCwgY29udGVudCwgY29udGVudE1hdGNoKTtcbiAgICAgIHRoaXMucmVuZGVyUGF0aChjb250ZW50RWwsIGZpbGUsIHRydWUsIHBhdGhNYXRjaCwgISFwYXRoTWF0Y2gpO1xuICAgIH1cbiAgfVxuXG4gIG9uQ2hvb3NlU3VnZ2VzdGlvbihzdWdnOiBFZGl0b3JTdWdnZXN0aW9uLCBldnQ6IE1vdXNlRXZlbnQgfCBLZXlib2FyZEV2ZW50KTogdm9pZCB7XG4gICAgaWYgKHN1Z2cpIHtcbiAgICAgIHRoaXMubmF2aWdhdGVUb0xlYWZPck9wZW5GaWxlKFxuICAgICAgICBldnQsXG4gICAgICAgIHN1Z2cuZmlsZSxcbiAgICAgICAgJ1VuYWJsZSB0byByZW9wZW4gZXhpc3RpbmcgZWRpdG9yIGluIG5ldyBMZWFmLicsXG4gICAgICAgIG51bGwsXG4gICAgICAgIHN1Z2cuaXRlbSxcbiAgICAgICAgbnVsbCxcbiAgICAgICAgdHJ1ZSxcbiAgICAgICk7XG4gICAgfVxuICB9XG59XG4iLCJpbXBvcnQge1xuICBmdXp6eVNlYXJjaCxcbiAgTGlua0NhY2hlLFxuICBSZWZlcmVuY2VDYWNoZSxcbiAgU2VhcmNoUmVzdWx0LFxuICBzb3J0U2VhcmNoUmVzdWx0cyxcbiAgV29ya3NwYWNlTGVhZixcbn0gZnJvbSAnb2JzaWRpYW4nO1xuaW1wb3J0IHtcbiAgTW9kZSxcbiAgU3ltYm9sU3VnZ2VzdGlvbixcbiAgQW55U3VnZ2VzdGlvbixcbiAgU291cmNlSW5mbyxcbiAgU3ltYm9sSW5mbyxcbiAgQW55U3ltYm9sSW5mb1BheWxvYWQsXG4gIFN5bWJvbFR5cGUsXG4gIEhlYWRpbmdJbmRpY2F0b3JzLFxuICBTeW1ib2xJbmRpY2F0b3JzLFxuICBTdWdnZXN0aW9uVHlwZSxcbn0gZnJvbSAnc3JjL3R5cGVzJztcbmltcG9ydCB7IGdldExpbmtUeXBlLCBpc0hlYWRpbmdDYWNoZSwgaXNUYWdDYWNoZSB9IGZyb20gJ3NyYy91dGlscyc7XG5pbXBvcnQgeyBJbnB1dEluZm8sIFNvdXJjZWRQYXJzZWRDb21tYW5kIH0gZnJvbSAnc3JjL3N3aXRjaGVyUGx1cyc7XG5pbXBvcnQgeyBIYW5kbGVyIH0gZnJvbSAnLi9oYW5kbGVyJztcblxuZXhwb3J0IGNsYXNzIFN5bWJvbEhhbmRsZXIgZXh0ZW5kcyBIYW5kbGVyPFN5bWJvbFN1Z2dlc3Rpb24+IHtcbiAgcHJpdmF0ZSBpbnB1dEluZm86IElucHV0SW5mbztcblxuICBvdmVycmlkZSBnZXQgY29tbWFuZFN0cmluZygpOiBzdHJpbmcge1xuICAgIHJldHVybiB0aGlzLnNldHRpbmdzPy5zeW1ib2xMaXN0Q29tbWFuZDtcbiAgfVxuXG4gIHZhbGlkYXRlQ29tbWFuZChcbiAgICBpbnB1dEluZm86IElucHV0SW5mbyxcbiAgICBpbmRleDogbnVtYmVyLFxuICAgIGZpbHRlclRleHQ6IHN0cmluZyxcbiAgICBhY3RpdmVTdWdnZXN0aW9uOiBBbnlTdWdnZXN0aW9uLFxuICAgIGFjdGl2ZUxlYWY6IFdvcmtzcGFjZUxlYWYsXG4gICk6IHZvaWQge1xuICAgIGNvbnN0IHNvdXJjZUluZm8gPSB0aGlzLmdldFNvdXJjZUluZm9Gb3JTeW1ib2xPcGVyYXRpb24oXG4gICAgICBhY3RpdmVTdWdnZXN0aW9uLFxuICAgICAgYWN0aXZlTGVhZixcbiAgICAgIGluZGV4ID09PSAwLFxuICAgICk7XG5cbiAgICBpZiAoc291cmNlSW5mbykge1xuICAgICAgaW5wdXRJbmZvLm1vZGUgPSBNb2RlLlN5bWJvbExpc3Q7XG5cbiAgICAgIGNvbnN0IHN5bWJvbENtZCA9IGlucHV0SW5mby5wYXJzZWRDb21tYW5kKE1vZGUuU3ltYm9sTGlzdCkgYXMgU291cmNlZFBhcnNlZENvbW1hbmQ7XG5cbiAgICAgIHN5bWJvbENtZC5zb3VyY2UgPSBzb3VyY2VJbmZvO1xuICAgICAgc3ltYm9sQ21kLmluZGV4ID0gaW5kZXg7XG4gICAgICBzeW1ib2xDbWQucGFyc2VkSW5wdXQgPSBmaWx0ZXJUZXh0O1xuICAgICAgc3ltYm9sQ21kLmlzVmFsaWRhdGVkID0gdHJ1ZTtcbiAgICB9XG4gIH1cblxuICBnZXRTdWdnZXN0aW9ucyhpbnB1dEluZm86IElucHV0SW5mbyk6IFN5bWJvbFN1Z2dlc3Rpb25bXSB7XG4gICAgY29uc3Qgc3VnZ2VzdGlvbnM6IFN5bWJvbFN1Z2dlc3Rpb25bXSA9IFtdO1xuXG4gICAgaWYgKGlucHV0SW5mbykge1xuICAgICAgdGhpcy5pbnB1dEluZm8gPSBpbnB1dEluZm87XG5cbiAgICAgIGlucHV0SW5mby5idWlsZFNlYXJjaFF1ZXJ5KCk7XG4gICAgICBjb25zdCB7IGhhc1NlYXJjaFRlcm0sIHByZXBRdWVyeSB9ID0gaW5wdXRJbmZvLnNlYXJjaFF1ZXJ5O1xuICAgICAgY29uc3Qgc3ltYm9sQ21kID0gaW5wdXRJbmZvLnBhcnNlZENvbW1hbmQoTW9kZS5TeW1ib2xMaXN0KSBhcyBTb3VyY2VkUGFyc2VkQ29tbWFuZDtcbiAgICAgIGNvbnN0IGl0ZW1zID0gdGhpcy5nZXRJdGVtcyhzeW1ib2xDbWQuc291cmNlLCBoYXNTZWFyY2hUZXJtKTtcblxuICAgICAgaXRlbXMuZm9yRWFjaCgoaXRlbSkgPT4ge1xuICAgICAgICBsZXQgc2hvdWxkUHVzaCA9IHRydWU7XG4gICAgICAgIGxldCBtYXRjaDogU2VhcmNoUmVzdWx0ID0gbnVsbDtcblxuICAgICAgICBpZiAoaGFzU2VhcmNoVGVybSkge1xuICAgICAgICAgIG1hdGNoID0gZnV6enlTZWFyY2gocHJlcFF1ZXJ5LCBTeW1ib2xIYW5kbGVyLmdldFN1Z2dlc3Rpb25UZXh0Rm9yU3ltYm9sKGl0ZW0pKTtcbiAgICAgICAgICBzaG91bGRQdXNoID0gISFtYXRjaDtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChzaG91bGRQdXNoKSB7XG4gICAgICAgICAgY29uc3QgeyBmaWxlIH0gPSBzeW1ib2xDbWQuc291cmNlO1xuICAgICAgICAgIHN1Z2dlc3Rpb25zLnB1c2goeyB0eXBlOiBTdWdnZXN0aW9uVHlwZS5TeW1ib2xMaXN0LCBmaWxlLCBpdGVtLCBtYXRjaCB9KTtcbiAgICAgICAgfVxuICAgICAgfSk7XG5cbiAgICAgIGlmIChoYXNTZWFyY2hUZXJtKSB7XG4gICAgICAgIHNvcnRTZWFyY2hSZXN1bHRzKHN1Z2dlc3Rpb25zKTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICByZXR1cm4gc3VnZ2VzdGlvbnM7XG4gIH1cblxuICByZW5kZXJTdWdnZXN0aW9uKHN1Z2c6IFN5bWJvbFN1Z2dlc3Rpb24sIHBhcmVudEVsOiBIVE1MRWxlbWVudCk6IHZvaWQge1xuICAgIGlmIChzdWdnKSB7XG4gICAgICBjb25zdCB7IGl0ZW0gfSA9IHN1Z2c7XG4gICAgICBjb25zdCBwYXJlbnRFbENsYXNzZXMgPSBbJ3FzcC1zdWdnZXN0aW9uLXN5bWJvbCddO1xuXG4gICAgICBpZiAoXG4gICAgICAgIHRoaXMuc2V0dGluZ3Muc3ltYm9sc0luTGluZU9yZGVyICYmXG4gICAgICAgICF0aGlzLmlucHV0SW5mbz8uc2VhcmNoUXVlcnk/Lmhhc1NlYXJjaFRlcm1cbiAgICAgICkge1xuICAgICAgICBwYXJlbnRFbENsYXNzZXMucHVzaChgcXNwLXN5bWJvbC1sJHtpdGVtLmluZGVudExldmVsfWApO1xuICAgICAgfVxuXG4gICAgICB0aGlzLmFkZENsYXNzZXNUb1N1Z2dlc3Rpb25Db250YWluZXIocGFyZW50RWwsIHBhcmVudEVsQ2xhc3Nlcyk7XG5cbiAgICAgIGNvbnN0IHRleHQgPSBTeW1ib2xIYW5kbGVyLmdldFN1Z2dlc3Rpb25UZXh0Rm9yU3ltYm9sKGl0ZW0pO1xuICAgICAgdGhpcy5yZW5kZXJDb250ZW50KHBhcmVudEVsLCB0ZXh0LCBzdWdnLm1hdGNoKTtcbiAgICAgIFN5bWJvbEhhbmRsZXIuYWRkU3ltYm9sSW5kaWNhdG9yKGl0ZW0sIHBhcmVudEVsKTtcbiAgICB9XG4gIH1cblxuICBvbkNob29zZVN1Z2dlc3Rpb24oc3VnZzogU3ltYm9sU3VnZ2VzdGlvbiwgZXZ0OiBNb3VzZUV2ZW50IHwgS2V5Ym9hcmRFdmVudCk6IHZvaWQge1xuICAgIGlmIChzdWdnKSB7XG4gICAgICBjb25zdCBzeW1ib2xDbWQgPSB0aGlzLmlucHV0SW5mby5wYXJzZWRDb21tYW5kKCkgYXMgU291cmNlZFBhcnNlZENvbW1hbmQ7XG4gICAgICBjb25zdCB7IGxlYWYsIGZpbGUgfSA9IHN5bWJvbENtZC5zb3VyY2U7XG5cbiAgICAgIGNvbnN0IHtcbiAgICAgICAgc3RhcnQ6IHsgbGluZSwgY29sIH0sXG4gICAgICAgIGVuZDogZW5kTG9jLFxuICAgICAgfSA9IHN1Z2cuaXRlbS5zeW1ib2wucG9zaXRpb247XG5cbiAgICAgIC8vIG9iamVjdCBjb250YWluaW5nIHRoZSBzdGF0ZSBpbmZvcm1hdGlvbiBmb3IgdGhlIHRhcmdldCBlZGl0b3IsXG4gICAgICAvLyBzdGFydCB3aXRoIHRoZSByYW5nZSB0byBoaWdobGlnaHQgaW4gdGFyZ2V0IGVkaXRvclxuICAgICAgY29uc3QgZVN0YXRlID0ge1xuICAgICAgICBhY3RpdmU6IHRydWUsXG4gICAgICAgIGZvY3VzOiB0cnVlLFxuICAgICAgICBzdGFydExvYzogeyBsaW5lLCBjb2wgfSxcbiAgICAgICAgZW5kTG9jLFxuICAgICAgICBsaW5lLFxuICAgICAgICBjdXJzb3I6IHtcbiAgICAgICAgICBmcm9tOiB7IGxpbmUsIGNoOiBjb2wgfSxcbiAgICAgICAgICB0bzogeyBsaW5lLCBjaDogY29sIH0sXG4gICAgICAgIH0sXG4gICAgICB9O1xuXG4gICAgICB0aGlzLm5hdmlnYXRlVG9MZWFmT3JPcGVuRmlsZShcbiAgICAgICAgZXZ0LFxuICAgICAgICBmaWxlLFxuICAgICAgICBgVW5hYmxlIHRvIG5hdmlnYXRlIHRvIHN5bWJvbCBmb3IgZmlsZSAke2ZpbGUucGF0aH1gLFxuICAgICAgICB7IGFjdGl2ZTogdHJ1ZSwgZVN0YXRlIH0sXG4gICAgICAgIGxlYWYsXG4gICAgICAgIE1vZGUuU3ltYm9sTGlzdCxcbiAgICAgICk7XG4gICAgfVxuICB9XG5cbiAgcmVzZXQoKTogdm9pZCB7XG4gICAgdGhpcy5pbnB1dEluZm8gPSBudWxsO1xuICB9XG5cbiAgcHJpdmF0ZSBnZXRTb3VyY2VJbmZvRm9yU3ltYm9sT3BlcmF0aW9uKFxuICAgIGFjdGl2ZVN1Z2dlc3Rpb246IEFueVN1Z2dlc3Rpb24sXG4gICAgYWN0aXZlTGVhZjogV29ya3NwYWNlTGVhZixcbiAgICBpc1N5bWJvbENtZFByZWZpeDogYm9vbGVhbixcbiAgKTogU291cmNlSW5mbyB7XG4gICAgY29uc3QgcHJldklucHV0SW5mbyA9IHRoaXMuaW5wdXRJbmZvO1xuICAgIGxldCBwcmV2U291cmNlSW5mbzogU291cmNlSW5mbyA9IG51bGw7XG4gICAgbGV0IHByZXZNb2RlOiBNb2RlID0gTW9kZS5TdGFuZGFyZDtcblxuICAgIGlmIChwcmV2SW5wdXRJbmZvKSB7XG4gICAgICBwcmV2U291cmNlSW5mbyA9IChwcmV2SW5wdXRJbmZvLnBhcnNlZENvbW1hbmQoKSBhcyBTb3VyY2VkUGFyc2VkQ29tbWFuZCkuc291cmNlO1xuICAgICAgcHJldk1vZGUgPSBwcmV2SW5wdXRJbmZvLm1vZGU7XG4gICAgfVxuXG4gICAgLy8gZmlndXJlIG91dCBpZiB0aGUgcHJldmlvdXMgb3BlcmF0aW9uIHdhcyBhIHN5bWJvbCBvcGVyYXRpb25cbiAgICBjb25zdCBoYXNQcmV2U3ltYm9sU291cmNlID0gcHJldk1vZGUgPT09IE1vZGUuU3ltYm9sTGlzdCAmJiAhIXByZXZTb3VyY2VJbmZvO1xuXG4gICAgY29uc3QgYWN0aXZlRWRpdG9ySW5mbyA9IHRoaXMuZ2V0RWRpdG9ySW5mbyhhY3RpdmVMZWFmKTtcbiAgICBjb25zdCBhY3RpdmVTdWdnSW5mbyA9IHRoaXMuZ2V0U3VnZ2VzdGlvbkluZm8oYWN0aXZlU3VnZ2VzdGlvbik7XG5cbiAgICAvLyBQaWNrIHRoZSBzb3VyY2UgZmlsZSBmb3IgYSBwb3RlbnRpYWwgc3ltYm9sIG9wZXJhdGlvbiwgcHJpb3JpdGl6aW5nXG4gICAgLy8gYW55IHByZS1leGlzdGluZyBzeW1ib2wgb3BlcmF0aW9uIHRoYXQgd2FzIGluIHByb2dyZXNzXG4gICAgbGV0IHNvdXJjZUluZm86IFNvdXJjZUluZm8gPSBudWxsO1xuICAgIGlmIChoYXNQcmV2U3ltYm9sU291cmNlKSB7XG4gICAgICBzb3VyY2VJbmZvID0gcHJldlNvdXJjZUluZm87XG4gICAgfSBlbHNlIGlmIChhY3RpdmVTdWdnSW5mby5pc1ZhbGlkU291cmNlKSB7XG4gICAgICBzb3VyY2VJbmZvID0gYWN0aXZlU3VnZ0luZm87XG4gICAgfSBlbHNlIGlmIChhY3RpdmVFZGl0b3JJbmZvLmlzVmFsaWRTb3VyY2UgJiYgaXNTeW1ib2xDbWRQcmVmaXgpIHtcbiAgICAgIHNvdXJjZUluZm8gPSBhY3RpdmVFZGl0b3JJbmZvO1xuICAgIH1cblxuICAgIHJldHVybiBzb3VyY2VJbmZvO1xuICB9XG5cbiAgcHJpdmF0ZSBnZXRJdGVtcyhzb3VyY2VJbmZvOiBTb3VyY2VJbmZvLCBoYXNTZWFyY2hUZXJtOiBib29sZWFuKTogU3ltYm9sSW5mb1tdIHtcbiAgICBsZXQgaXRlbXM6IFN5bWJvbEluZm9bXSA9IFtdO1xuXG4gICAgbGV0IHN5bWJvbHNJbkxpbmVPcmRlciA9IGZhbHNlO1xuICAgIGxldCBzZWxlY3ROZWFyZXN0SGVhZGluZyA9IGZhbHNlO1xuXG4gICAgaWYgKCFoYXNTZWFyY2hUZXJtKSB7XG4gICAgICAoeyBzZWxlY3ROZWFyZXN0SGVhZGluZywgc3ltYm9sc0luTGluZU9yZGVyIH0gPSB0aGlzLnNldHRpbmdzKTtcbiAgICB9XG5cbiAgICBpdGVtcyA9IHRoaXMuZ2V0U3ltYm9sc0Zyb21Tb3VyY2Uoc291cmNlSW5mbywgc3ltYm9sc0luTGluZU9yZGVyKTtcblxuICAgIGlmIChzZWxlY3ROZWFyZXN0SGVhZGluZykge1xuICAgICAgU3ltYm9sSGFuZGxlci5GaW5kTmVhcmVzdEhlYWRpbmdTeW1ib2woaXRlbXMsIHNvdXJjZUluZm8pO1xuICAgIH1cblxuICAgIHJldHVybiBpdGVtcztcbiAgfVxuXG4gIHByaXZhdGUgc3RhdGljIEZpbmROZWFyZXN0SGVhZGluZ1N5bWJvbChcbiAgICBpdGVtczogU3ltYm9sSW5mb1tdLFxuICAgIHNvdXJjZUluZm86IFNvdXJjZUluZm8sXG4gICk6IHZvaWQge1xuICAgIGNvbnN0IGN1cnNvckxpbmUgPSBzb3VyY2VJbmZvPy5jdXJzb3I/LmxpbmU7XG5cbiAgICAvLyBmaW5kIHRoZSBuZWFyZXN0IGhlYWRpbmcgdG8gdGhlIGN1cnJlbnQgY3Vyc29yIHBvcywgaWYgYXBwbGljYWJsZVxuICAgIGlmIChjdXJzb3JMaW5lKSB7XG4gICAgICBsZXQgZm91bmQ6IFN5bWJvbEluZm8gPSBudWxsO1xuICAgICAgY29uc3QgaGVhZGluZ3MgPSBpdGVtcy5maWx0ZXIoKHYpOiB2IGlzIFN5bWJvbEluZm8gPT4gaXNIZWFkaW5nQ2FjaGUodi5zeW1ib2wpKTtcblxuICAgICAgaWYgKGhlYWRpbmdzLmxlbmd0aCkge1xuICAgICAgICBmb3VuZCA9IGhlYWRpbmdzLnJlZHVjZSgoYWNjLCBjdXJyKSA9PiB7XG4gICAgICAgICAgY29uc3QgeyBsaW5lOiBjdXJyTGluZSB9ID0gY3Vyci5zeW1ib2wucG9zaXRpb24uc3RhcnQ7XG4gICAgICAgICAgY29uc3QgYWNjTGluZSA9IGFjYyA/IGFjYy5zeW1ib2wucG9zaXRpb24uc3RhcnQubGluZSA6IC0xO1xuXG4gICAgICAgICAgcmV0dXJuIGN1cnJMaW5lID4gYWNjTGluZSAmJiBjdXJyTGluZSA8PSBjdXJzb3JMaW5lID8gY3VyciA6IGFjYztcbiAgICAgICAgfSk7XG4gICAgICB9XG5cbiAgICAgIGlmIChmb3VuZCkge1xuICAgICAgICBmb3VuZC5pc1NlbGVjdGVkID0gdHJ1ZTtcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICBwcml2YXRlIGdldFN5bWJvbHNGcm9tU291cmNlKFxuICAgIHNvdXJjZUluZm86IFNvdXJjZUluZm8sXG4gICAgb3JkZXJCeUxpbmVOdW1iZXI6IGJvb2xlYW4sXG4gICk6IFN5bWJvbEluZm9bXSB7XG4gICAgY29uc3Qge1xuICAgICAgYXBwOiB7IG1ldGFkYXRhQ2FjaGUgfSxcbiAgICAgIHNldHRpbmdzLFxuICAgIH0gPSB0aGlzO1xuICAgIGNvbnN0IHJldDogU3ltYm9sSW5mb1tdID0gW107XG5cbiAgICBpZiAoc291cmNlSW5mbz8uZmlsZSkge1xuICAgICAgY29uc3QgZmlsZSA9IHNvdXJjZUluZm8uZmlsZTtcbiAgICAgIGNvbnN0IHN5bWJvbERhdGEgPSBtZXRhZGF0YUNhY2hlLmdldEZpbGVDYWNoZShmaWxlKTtcblxuICAgICAgaWYgKHN5bWJvbERhdGEpIHtcbiAgICAgICAgY29uc3QgcHVzaCA9IChzeW1ib2xzOiBBbnlTeW1ib2xJbmZvUGF5bG9hZFtdID0gW10sIHN5bWJvbFR5cGU6IFN5bWJvbFR5cGUpID0+IHtcbiAgICAgICAgICBpZiAoc2V0dGluZ3MuaXNTeW1ib2xUeXBlRW5hYmxlZChzeW1ib2xUeXBlKSkge1xuICAgICAgICAgICAgc3ltYm9scy5mb3JFYWNoKChzeW1ib2wpID0+XG4gICAgICAgICAgICAgIHJldC5wdXNoKHsgdHlwZTogJ3N5bWJvbEluZm8nLCBzeW1ib2wsIHN5bWJvbFR5cGUgfSksXG4gICAgICAgICAgICApO1xuICAgICAgICAgIH1cbiAgICAgICAgfTtcblxuICAgICAgICBwdXNoKHN5bWJvbERhdGEuaGVhZGluZ3MsIFN5bWJvbFR5cGUuSGVhZGluZyk7XG4gICAgICAgIHB1c2goc3ltYm9sRGF0YS50YWdzLCBTeW1ib2xUeXBlLlRhZyk7XG4gICAgICAgIHRoaXMuYWRkTGlua3NGcm9tU291cmNlKHN5bWJvbERhdGEubGlua3MsIHJldCk7XG4gICAgICAgIHB1c2goc3ltYm9sRGF0YS5lbWJlZHMsIFN5bWJvbFR5cGUuRW1iZWQpO1xuICAgICAgfVxuICAgIH1cblxuICAgIHJldHVybiBvcmRlckJ5TGluZU51bWJlciA/IFN5bWJvbEhhbmRsZXIub3JkZXJTeW1ib2xzQnlMaW5lTnVtYmVyKHJldCkgOiByZXQ7XG4gIH1cblxuICBwcml2YXRlIGFkZExpbmtzRnJvbVNvdXJjZShsaW5rRGF0YTogTGlua0NhY2hlW10sIHN5bWJvbExpc3Q6IFN5bWJvbEluZm9bXSk6IHZvaWQge1xuICAgIGNvbnN0IHsgc2V0dGluZ3MgfSA9IHRoaXM7XG4gICAgbGlua0RhdGEgPSBsaW5rRGF0YSA/PyBbXTtcblxuICAgIGlmIChzZXR0aW5ncy5pc1N5bWJvbFR5cGVFbmFibGVkKFN5bWJvbFR5cGUuTGluaykpIHtcbiAgICAgIGZvciAoY29uc3QgbGluayBvZiBsaW5rRGF0YSkge1xuICAgICAgICBjb25zdCB0eXBlID0gZ2V0TGlua1R5cGUobGluayk7XG4gICAgICAgIGNvbnN0IGlzRXhjbHVkZWQgPSAoc2V0dGluZ3MuZXhjbHVkZUxpbmtTdWJUeXBlcyAmIHR5cGUpID09PSB0eXBlO1xuXG4gICAgICAgIGlmICghaXNFeGNsdWRlZCkge1xuICAgICAgICAgIHN5bWJvbExpc3QucHVzaCh7XG4gICAgICAgICAgICB0eXBlOiAnc3ltYm9sSW5mbycsXG4gICAgICAgICAgICBzeW1ib2w6IGxpbmssXG4gICAgICAgICAgICBzeW1ib2xUeXBlOiBTeW1ib2xUeXBlLkxpbmssXG4gICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICBwcml2YXRlIHN0YXRpYyBvcmRlclN5bWJvbHNCeUxpbmVOdW1iZXIoc3ltYm9sczogU3ltYm9sSW5mb1tdID0gW10pOiBTeW1ib2xJbmZvW10ge1xuICAgIGNvbnN0IHNvcnRlZCA9IHN5bWJvbHMuc29ydCgoYTogU3ltYm9sSW5mbywgYjogU3ltYm9sSW5mbykgPT4ge1xuICAgICAgY29uc3QgeyBzdGFydDogYVN0YXJ0IH0gPSBhLnN5bWJvbC5wb3NpdGlvbjtcbiAgICAgIGNvbnN0IHsgc3RhcnQ6IGJTdGFydCB9ID0gYi5zeW1ib2wucG9zaXRpb247XG4gICAgICBjb25zdCBsaW5lRGlmZiA9IGFTdGFydC5saW5lIC0gYlN0YXJ0LmxpbmU7XG4gICAgICByZXR1cm4gbGluZURpZmYgPT09IDAgPyBhU3RhcnQuY29sIC0gYlN0YXJ0LmNvbCA6IGxpbmVEaWZmO1xuICAgIH0pO1xuXG4gICAgbGV0IGN1cnJJbmRlbnRMZXZlbCA9IDA7XG5cbiAgICBzb3J0ZWQuZm9yRWFjaCgoc2kpID0+IHtcbiAgICAgIGxldCBpbmRlbnRMZXZlbCA9IDA7XG4gICAgICBpZiAoaXNIZWFkaW5nQ2FjaGUoc2kuc3ltYm9sKSkge1xuICAgICAgICBjdXJySW5kZW50TGV2ZWwgPSBzaS5zeW1ib2wubGV2ZWw7XG4gICAgICAgIGluZGVudExldmVsID0gc2kuc3ltYm9sLmxldmVsIC0gMTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGluZGVudExldmVsID0gY3VyckluZGVudExldmVsO1xuICAgICAgfVxuXG4gICAgICBzaS5pbmRlbnRMZXZlbCA9IGluZGVudExldmVsO1xuICAgIH0pO1xuXG4gICAgcmV0dXJuIHNvcnRlZDtcbiAgfVxuXG4gIHByaXZhdGUgc3RhdGljIGdldFN1Z2dlc3Rpb25UZXh0Rm9yU3ltYm9sKHN5bWJvbEluZm86IFN5bWJvbEluZm8pOiBzdHJpbmcge1xuICAgIGNvbnN0IHsgc3ltYm9sIH0gPSBzeW1ib2xJbmZvO1xuICAgIGxldCB0ZXh0O1xuXG4gICAgaWYgKGlzSGVhZGluZ0NhY2hlKHN5bWJvbCkpIHtcbiAgICAgIHRleHQgPSBzeW1ib2wuaGVhZGluZztcbiAgICB9IGVsc2UgaWYgKGlzVGFnQ2FjaGUoc3ltYm9sKSkge1xuICAgICAgdGV4dCA9IHN5bWJvbC50YWcuc2xpY2UoMSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIGNvbnN0IHJlZkNhY2hlID0gc3ltYm9sIGFzIFJlZmVyZW5jZUNhY2hlO1xuICAgICAgKHsgbGluazogdGV4dCB9ID0gcmVmQ2FjaGUpO1xuICAgICAgY29uc3QgeyBkaXNwbGF5VGV4dCB9ID0gcmVmQ2FjaGU7XG5cbiAgICAgIGlmIChkaXNwbGF5VGV4dCAmJiBkaXNwbGF5VGV4dCAhPT0gdGV4dCkge1xuICAgICAgICB0ZXh0ICs9IGB8JHtkaXNwbGF5VGV4dH1gO1xuICAgICAgfVxuICAgIH1cblxuICAgIHJldHVybiB0ZXh0O1xuICB9XG5cbiAgcHJpdmF0ZSBzdGF0aWMgYWRkU3ltYm9sSW5kaWNhdG9yKHN5bWJvbEluZm86IFN5bWJvbEluZm8sIHBhcmVudEVsOiBIVE1MRWxlbWVudCk6IHZvaWQge1xuICAgIGNvbnN0IHsgc3ltYm9sVHlwZSwgc3ltYm9sIH0gPSBzeW1ib2xJbmZvO1xuICAgIGxldCBpbmRpY2F0b3I6IHN0cmluZztcblxuICAgIGlmIChpc0hlYWRpbmdDYWNoZShzeW1ib2wpKSB7XG4gICAgICBpbmRpY2F0b3IgPSBIZWFkaW5nSW5kaWNhdG9yc1tzeW1ib2wubGV2ZWxdO1xuICAgIH0gZWxzZSB7XG4gICAgICBpbmRpY2F0b3IgPSBTeW1ib2xJbmRpY2F0b3JzW3N5bWJvbFR5cGVdO1xuICAgIH1cblxuICAgIC8vIHJlbmRlciB0aGUgZmxhaXIgaWNvblxuICAgIGNvbnN0IGF1eEVsID0gcGFyZW50RWwuY3JlYXRlRGl2KHsgY2xzOiBbJ3N1Z2dlc3Rpb24tYXV4JywgJ3FzcC1hdXgnXSB9KTtcbiAgICBhdXhFbC5jcmVhdGVTcGFuKHtcbiAgICAgIGNsczogWydzdWdnZXN0aW9uLWZsYWlyJywgJ3FzcC1zeW1ib2wtaW5kaWNhdG9yJ10sXG4gICAgICB0ZXh0OiBpbmRpY2F0b3IsXG4gICAgfSk7XG4gIH1cbn1cbiIsImltcG9ydCB7IGdldEludGVybmFsUGx1Z2luQnlJZCwgaXNGaWxlU3RhcnJlZEl0ZW0sIGlzVEZpbGUgfSBmcm9tICdzcmMvdXRpbHMnO1xuaW1wb3J0IHsgSW5wdXRJbmZvIH0gZnJvbSAnc3JjL3N3aXRjaGVyUGx1cyc7XG5pbXBvcnQge1xuICBBbnlTdWdnZXN0aW9uLFxuICBNYXRjaFR5cGUsXG4gIE1vZGUsXG4gIFNlYXJjaFJlc3VsdFdpdGhGYWxsYmFjayxcbiAgU3RhcnJlZFN1Z2dlc3Rpb24sXG4gIFN1Z2dlc3Rpb25UeXBlLFxufSBmcm9tICdzcmMvdHlwZXMnO1xuaW1wb3J0IHtcbiAgSW5zdGFsbGVkUGx1Z2luLFxuICBTZWFyY2hSZXN1bHQsXG4gIHNvcnRTZWFyY2hSZXN1bHRzLFxuICBXb3Jrc3BhY2VMZWFmLFxuICBTdGFycmVkUGx1Z2luSXRlbSxcbiAgU3RhcnJlZFBsdWdpbkluc3RhbmNlLFxuICBURmlsZSxcbiAgRmlsZVN0YXJyZWRJdGVtLFxufSBmcm9tICdvYnNpZGlhbic7XG5pbXBvcnQgeyBIYW5kbGVyIH0gZnJvbSAnLi9oYW5kbGVyJztcblxuZXhwb3J0IGNvbnN0IFNUQVJSRURfUExVR0lOX0lEID0gJ3N0YXJyZWQnO1xuXG5pbnRlcmZhY2UgU3RhcnJlZEl0ZW1JbmZvIHtcbiAgZmlsZTogVEZpbGU7XG4gIGl0ZW06IFN0YXJyZWRQbHVnaW5JdGVtO1xufVxuXG5leHBvcnQgY2xhc3MgU3RhcnJlZEhhbmRsZXIgZXh0ZW5kcyBIYW5kbGVyPFN0YXJyZWRTdWdnZXN0aW9uPiB7XG4gIG92ZXJyaWRlIGdldCBjb21tYW5kU3RyaW5nKCk6IHN0cmluZyB7XG4gICAgcmV0dXJuIHRoaXMuc2V0dGluZ3M/LnN0YXJyZWRMaXN0Q29tbWFuZDtcbiAgfVxuXG4gIHZhbGlkYXRlQ29tbWFuZChcbiAgICBpbnB1dEluZm86IElucHV0SW5mbyxcbiAgICBpbmRleDogbnVtYmVyLFxuICAgIGZpbHRlclRleHQ6IHN0cmluZyxcbiAgICBfYWN0aXZlU3VnZ2VzdGlvbjogQW55U3VnZ2VzdGlvbixcbiAgICBfYWN0aXZlTGVhZjogV29ya3NwYWNlTGVhZixcbiAgKTogdm9pZCB7XG4gICAgaWYgKHRoaXMuaXNTdGFycmVkUGx1Z2luRW5hYmxlZCgpKSB7XG4gICAgICBpbnB1dEluZm8ubW9kZSA9IE1vZGUuU3RhcnJlZExpc3Q7XG5cbiAgICAgIGNvbnN0IHN0YXJyZWRDbWQgPSBpbnB1dEluZm8ucGFyc2VkQ29tbWFuZChNb2RlLlN0YXJyZWRMaXN0KTtcbiAgICAgIHN0YXJyZWRDbWQuaW5kZXggPSBpbmRleDtcbiAgICAgIHN0YXJyZWRDbWQucGFyc2VkSW5wdXQgPSBmaWx0ZXJUZXh0O1xuICAgICAgc3RhcnJlZENtZC5pc1ZhbGlkYXRlZCA9IHRydWU7XG4gICAgfVxuICB9XG5cbiAgZ2V0U3VnZ2VzdGlvbnMoaW5wdXRJbmZvOiBJbnB1dEluZm8pOiBTdGFycmVkU3VnZ2VzdGlvbltdIHtcbiAgICBjb25zdCBzdWdnZXN0aW9uczogU3RhcnJlZFN1Z2dlc3Rpb25bXSA9IFtdO1xuXG4gICAgaWYgKGlucHV0SW5mbykge1xuICAgICAgaW5wdXRJbmZvLmJ1aWxkU2VhcmNoUXVlcnkoKTtcbiAgICAgIGNvbnN0IHsgaGFzU2VhcmNoVGVybSwgcHJlcFF1ZXJ5IH0gPSBpbnB1dEluZm8uc2VhcmNoUXVlcnk7XG4gICAgICBjb25zdCBpdGVtc0luZm8gPSB0aGlzLmdldEl0ZW1zKCk7XG5cbiAgICAgIGl0ZW1zSW5mby5mb3JFYWNoKCh7IGZpbGUsIGl0ZW0gfSkgPT4ge1xuICAgICAgICBsZXQgc2hvdWxkUHVzaCA9IHRydWU7XG4gICAgICAgIGxldCByZXN1bHQ6IFNlYXJjaFJlc3VsdFdpdGhGYWxsYmFjayA9IHsgbWF0Y2hUeXBlOiBNYXRjaFR5cGUuTm9uZSwgbWF0Y2g6IG51bGwgfTtcblxuICAgICAgICBpZiAoaGFzU2VhcmNoVGVybSkge1xuICAgICAgICAgIHJlc3VsdCA9IHRoaXMuZnV6enlTZWFyY2hXaXRoRmFsbGJhY2socHJlcFF1ZXJ5LCBpdGVtLnRpdGxlLCBmaWxlKTtcbiAgICAgICAgICBzaG91bGRQdXNoID0gcmVzdWx0Lm1hdGNoVHlwZSAhPT0gTWF0Y2hUeXBlLk5vbmU7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoc2hvdWxkUHVzaCkge1xuICAgICAgICAgIHN1Z2dlc3Rpb25zLnB1c2goeyB0eXBlOiBTdWdnZXN0aW9uVHlwZS5TdGFycmVkTGlzdCwgZmlsZSwgaXRlbSwgLi4ucmVzdWx0IH0pO1xuICAgICAgICB9XG4gICAgICB9KTtcblxuICAgICAgaWYgKGhhc1NlYXJjaFRlcm0pIHtcbiAgICAgICAgc29ydFNlYXJjaFJlc3VsdHMoc3VnZ2VzdGlvbnMpO1xuICAgICAgfVxuICAgIH1cblxuICAgIHJldHVybiBzdWdnZXN0aW9ucztcbiAgfVxuXG4gIHJlbmRlclN1Z2dlc3Rpb24oc3VnZzogU3RhcnJlZFN1Z2dlc3Rpb24sIHBhcmVudEVsOiBIVE1MRWxlbWVudCk6IHZvaWQge1xuICAgIGlmIChzdWdnKSB7XG4gICAgICBjb25zdCB7IGZpbGUsIG1hdGNoVHlwZSwgbWF0Y2ggfSA9IHN1Z2c7XG4gICAgICBsZXQgY29udGVudE1hdGNoOiBTZWFyY2hSZXN1bHQgPSBtYXRjaDtcbiAgICAgIGxldCBwYXRoTWF0Y2g6IFNlYXJjaFJlc3VsdCA9IG51bGw7XG5cbiAgICAgIGlmIChtYXRjaFR5cGUgPT09IE1hdGNoVHlwZS5QYXJlbnRQYXRoKSB7XG4gICAgICAgIGNvbnRlbnRNYXRjaCA9IG51bGw7XG4gICAgICAgIHBhdGhNYXRjaCA9IG1hdGNoO1xuICAgICAgfVxuXG4gICAgICB0aGlzLmFkZENsYXNzZXNUb1N1Z2dlc3Rpb25Db250YWluZXIocGFyZW50RWwsIFsncXNwLXN1Z2dlc3Rpb24tc3RhcnJlZCddKTtcblxuICAgICAgY29uc3QgY29udGVudEVsID0gdGhpcy5yZW5kZXJDb250ZW50KHBhcmVudEVsLCBzdWdnLml0ZW0udGl0bGUsIGNvbnRlbnRNYXRjaCk7XG4gICAgICB0aGlzLnJlbmRlclBhdGgoY29udGVudEVsLCBmaWxlLCB0cnVlLCBwYXRoTWF0Y2gsICEhcGF0aE1hdGNoKTtcbiAgICB9XG4gIH1cblxuICBvbkNob29zZVN1Z2dlc3Rpb24oc3VnZzogU3RhcnJlZFN1Z2dlc3Rpb24sIGV2dDogTW91c2VFdmVudCB8IEtleWJvYXJkRXZlbnQpOiB2b2lkIHtcbiAgICBpZiAoc3VnZykge1xuICAgICAgY29uc3QgeyBpdGVtIH0gPSBzdWdnO1xuXG4gICAgICBpZiAoaXNGaWxlU3RhcnJlZEl0ZW0oaXRlbSkpIHtcbiAgICAgICAgY29uc3QgeyBmaWxlIH0gPSBzdWdnO1xuXG4gICAgICAgIHRoaXMubmF2aWdhdGVUb0xlYWZPck9wZW5GaWxlKFxuICAgICAgICAgIGV2dCxcbiAgICAgICAgICBmaWxlLFxuICAgICAgICAgIGBVbmFibGUgdG8gb3BlbiBTdGFycmVkIGZpbGUgJHtmaWxlLnBhdGh9YCxcbiAgICAgICAgKTtcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICBnZXRURmlsZUJ5UGF0aChwYXRoOiBzdHJpbmcpOiBURmlsZSB8IG51bGwge1xuICAgIGxldCBmaWxlOiBURmlsZSA9IG51bGw7XG4gICAgY29uc3QgYWJzdHJhY3RJdGVtID0gdGhpcy5hcHAudmF1bHQuZ2V0QWJzdHJhY3RGaWxlQnlQYXRoKHBhdGgpO1xuXG4gICAgaWYgKGlzVEZpbGUoYWJzdHJhY3RJdGVtKSkge1xuICAgICAgZmlsZSA9IGFic3RyYWN0SXRlbTtcbiAgICB9XG5cbiAgICByZXR1cm4gZmlsZTtcbiAgfVxuXG4gIGdldEl0ZW1zKCk6IFN0YXJyZWRJdGVtSW5mb1tdIHtcbiAgICBjb25zdCBpdGVtc0luZm86IFN0YXJyZWRJdGVtSW5mb1tdID0gW107XG4gICAgY29uc3Qgc3RhcnJlZEl0ZW1zID0gdGhpcy5nZXRTeXN0ZW1TdGFycmVkUGx1Z2luSW5zdGFuY2UoKT8uaXRlbXM7XG5cbiAgICBpZiAoc3RhcnJlZEl0ZW1zKSB7XG4gICAgICBzdGFycmVkSXRlbXMuZm9yRWFjaCgoc3RhcnJlZEl0ZW0pID0+IHtcbiAgICAgICAgLy8gT25seSBzdXBwb3J0IGRpc3BsYXlpbmcgb2Ygc3RhcnJlZCBmaWxlcyBmb3Igbm93XG4gICAgICAgIGlmIChpc0ZpbGVTdGFycmVkSXRlbShzdGFycmVkSXRlbSkpIHtcbiAgICAgICAgICBjb25zdCBmaWxlID0gdGhpcy5nZXRURmlsZUJ5UGF0aChzdGFycmVkSXRlbS5wYXRoKTtcblxuICAgICAgICAgIC8vIDIwMjItYXByIHdoZW4gYSBzdGFycmVkIGZpbGUgaXMgZGVsZXRlZCwgdGhlIHVuZGVybHlpbmcgZGF0YSBzdG9yZWQgaW4gdGhlXG4gICAgICAgICAgLy8gU3RhcnJlZCBwbHVnaW4gZGF0YSBmaWxlIChzdGFycmVkLmpzb24pIGZvciB0aGF0IGZpbGUgcmVtYWluIGluIHRoZXJlLCBidXRcbiAgICAgICAgICAvLyBhdCBydW50aW1lIHRoZSBkZWxldGVkIGZpbGUgaW5mbyBpcyBub3QgZGlzcGxheWVkLiBEbyB0aGUgc2FtZSBoZXJlLlxuICAgICAgICAgIGlmIChmaWxlKSB7XG4gICAgICAgICAgICAvLyAyMDIyLWFwciB3aGVuIGEgc3RhcnJlZCBmaWxlIGlzIHJlbmFtZWQsIHRoZSAndGl0bGUnIHByb3BlcnR5IHN0b3JlZCBpblxuICAgICAgICAgICAgLy8gdGhlIHVuZGVybHlpbmcgU3RhcnJlZCBwbHVnaW4gZGF0YSBmaWxlIChzdGFycmVkLmpzb24pIGlzIG5vdCB1cGRhdGVkLCBidXRcbiAgICAgICAgICAgIC8vIGF0IHJ1bnRpbWUsIHRoZSB0aXRsZSB0aGF0IGlzIGRpc3BsYXllZCBpbiB0aGUgVUkgZG9lcyByZWZsZWN0IHRoZSB1cGRhdGVkXG4gICAgICAgICAgICAvLyBmaWxlbmFtZS4gU28gZG8gdGhlIHNhbWUgdGhpbmcgaGVyZSBpbiBvcmRlciB0byBkaXNwbGF5IHRoZSBjdXJyZW50XG4gICAgICAgICAgICAvLyBmaWxlbmFtZSBhcyB0aGUgc3RhcnJlZCBmaWxlIHRpdGxlXG4gICAgICAgICAgICBjb25zdCB0aXRsZSA9IGZpbGUuYmFzZW5hbWU7XG5cbiAgICAgICAgICAgIGNvbnN0IGl0ZW06IEZpbGVTdGFycmVkSXRlbSA9IHtcbiAgICAgICAgICAgICAgdHlwZTogJ2ZpbGUnLFxuICAgICAgICAgICAgICB0aXRsZSxcbiAgICAgICAgICAgICAgcGF0aDogc3RhcnJlZEl0ZW0ucGF0aCxcbiAgICAgICAgICAgIH07XG5cbiAgICAgICAgICAgIGl0ZW1zSW5mby5wdXNoKHsgZmlsZSwgaXRlbSB9KTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH0pO1xuICAgIH1cblxuICAgIHJldHVybiBpdGVtc0luZm87XG4gIH1cblxuICBwcml2YXRlIGlzU3RhcnJlZFBsdWdpbkVuYWJsZWQoKTogYm9vbGVhbiB7XG4gICAgY29uc3QgcGx1Z2luID0gdGhpcy5nZXRTeXN0ZW1TdGFycmVkUGx1Z2luKCk7XG4gICAgcmV0dXJuIHBsdWdpbj8uZW5hYmxlZDtcbiAgfVxuXG4gIHByaXZhdGUgZ2V0U3lzdGVtU3RhcnJlZFBsdWdpbigpOiBJbnN0YWxsZWRQbHVnaW4ge1xuICAgIHJldHVybiBnZXRJbnRlcm5hbFBsdWdpbkJ5SWQodGhpcy5hcHAsIFNUQVJSRURfUExVR0lOX0lEKTtcbiAgfVxuXG4gIHByaXZhdGUgZ2V0U3lzdGVtU3RhcnJlZFBsdWdpbkluc3RhbmNlKCk6IFN0YXJyZWRQbHVnaW5JbnN0YW5jZSB7XG4gICAgY29uc3Qgc3RhcnJlZFBsdWdpbiA9IHRoaXMuZ2V0U3lzdGVtU3RhcnJlZFBsdWdpbigpO1xuICAgIHJldHVybiBzdGFycmVkUGx1Z2luPy5pbnN0YW5jZSBhcyBTdGFycmVkUGx1Z2luSW5zdGFuY2U7XG4gIH1cbn1cbiIsImltcG9ydCB7IGdldEludGVybmFsUGx1Z2luQnlJZCB9IGZyb20gJ3NyYy91dGlscyc7XG5pbXBvcnQgeyBJbnB1dEluZm8gfSBmcm9tICdzcmMvc3dpdGNoZXJQbHVzJztcbmltcG9ydCB7IEFueVN1Z2dlc3Rpb24sIE1vZGUsIENvbW1hbmRTdWdnZXN0aW9uLCBTdWdnZXN0aW9uVHlwZSB9IGZyb20gJ3NyYy90eXBlcyc7XG5pbXBvcnQgeyBIYW5kbGVyIH0gZnJvbSAnLi9oYW5kbGVyJztcbmltcG9ydCB7XG4gIEluc3RhbGxlZFBsdWdpbixcbiAgU2VhcmNoUmVzdWx0LFxuICBzb3J0U2VhcmNoUmVzdWx0cyxcbiAgV29ya3NwYWNlTGVhZixcbiAgZnV6enlTZWFyY2gsXG4gIENvbW1hbmRQYWxldHRlUGx1Z2luSW5zdGFuY2UsXG4gIENvbW1hbmQsXG59IGZyb20gJ29ic2lkaWFuJztcblxuZXhwb3J0IGNvbnN0IENPTU1BTkRfUEFMRVRURV9QTFVHSU5fSUQgPSAnY29tbWFuZC1wYWxldHRlJztcblxuZXhwb3J0IGNsYXNzIENvbW1hbmRIYW5kbGVyIGV4dGVuZHMgSGFuZGxlcjxDb21tYW5kU3VnZ2VzdGlvbj4ge1xuICBnZXQgY29tbWFuZFN0cmluZygpOiBzdHJpbmcge1xuICAgIHJldHVybiB0aGlzLnNldHRpbmdzPy5jb21tYW5kTGlzdENvbW1hbmQ7XG4gIH1cblxuICB2YWxpZGF0ZUNvbW1hbmQoXG4gICAgaW5wdXRJbmZvOiBJbnB1dEluZm8sXG4gICAgaW5kZXg6IG51bWJlcixcbiAgICBmaWx0ZXJUZXh0OiBzdHJpbmcsXG4gICAgX2FjdGl2ZVN1Z2dlc3Rpb246IEFueVN1Z2dlc3Rpb24sXG4gICAgX2FjdGl2ZUxlYWY6IFdvcmtzcGFjZUxlYWYsXG4gICk6IHZvaWQge1xuICAgIGlucHV0SW5mby5tb2RlID0gTW9kZS5Db21tYW5kTGlzdDtcblxuICAgIGNvbnN0IGNvbW1hbmRDbWQgPSBpbnB1dEluZm8ucGFyc2VkQ29tbWFuZChNb2RlLkNvbW1hbmRMaXN0KTtcbiAgICBjb21tYW5kQ21kLmluZGV4ID0gaW5kZXg7XG4gICAgY29tbWFuZENtZC5wYXJzZWRJbnB1dCA9IGZpbHRlclRleHQ7XG4gICAgY29tbWFuZENtZC5pc1ZhbGlkYXRlZCA9IHRydWU7XG4gIH1cblxuICBnZXRTdWdnZXN0aW9ucyhpbnB1dEluZm86IElucHV0SW5mbyk6IENvbW1hbmRTdWdnZXN0aW9uW10ge1xuICAgIGNvbnN0IHN1Z2dlc3Rpb25zOiBDb21tYW5kU3VnZ2VzdGlvbltdID0gW107XG5cbiAgICBpZiAoaW5wdXRJbmZvKSB7XG4gICAgICBpbnB1dEluZm8uYnVpbGRTZWFyY2hRdWVyeSgpO1xuICAgICAgY29uc3QgeyBoYXNTZWFyY2hUZXJtLCBwcmVwUXVlcnkgfSA9IGlucHV0SW5mby5zZWFyY2hRdWVyeTtcbiAgICAgIGNvbnN0IGl0ZW1zSW5mbyA9IHRoaXMuZ2V0SXRlbXMoKTtcblxuICAgICAgaXRlbXNJbmZvLmZvckVhY2goKGl0ZW0pID0+IHtcbiAgICAgICAgbGV0IHNob3VsZFB1c2ggPSB0cnVlO1xuICAgICAgICBsZXQgbWF0Y2g6IFNlYXJjaFJlc3VsdCA9IG51bGw7XG5cbiAgICAgICAgaWYgKGhhc1NlYXJjaFRlcm0pIHtcbiAgICAgICAgICBtYXRjaCA9IGZ1enp5U2VhcmNoKHByZXBRdWVyeSwgaXRlbS5uYW1lKTtcbiAgICAgICAgICBzaG91bGRQdXNoID0gISFtYXRjaDtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChzaG91bGRQdXNoKSB7XG4gICAgICAgICAgc3VnZ2VzdGlvbnMucHVzaCh7XG4gICAgICAgICAgICB0eXBlOiBTdWdnZXN0aW9uVHlwZS5Db21tYW5kTGlzdCxcbiAgICAgICAgICAgIGl0ZW0sXG4gICAgICAgICAgICBtYXRjaCxcbiAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgICAgfSk7XG5cbiAgICAgIGlmIChoYXNTZWFyY2hUZXJtKSB7XG4gICAgICAgIHNvcnRTZWFyY2hSZXN1bHRzKHN1Z2dlc3Rpb25zKTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICByZXR1cm4gc3VnZ2VzdGlvbnM7XG4gIH1cblxuICByZW5kZXJTdWdnZXN0aW9uKHN1Z2c6IENvbW1hbmRTdWdnZXN0aW9uLCBwYXJlbnRFbDogSFRNTEVsZW1lbnQpOiB2b2lkIHtcbiAgICBpZiAoc3VnZykge1xuICAgICAgdGhpcy5hZGRDbGFzc2VzVG9TdWdnZXN0aW9uQ29udGFpbmVyKHBhcmVudEVsLCBbJ3FzcC1zdWdnZXN0aW9uLWNvbW1hbmQnXSk7XG4gICAgICB0aGlzLnJlbmRlckNvbnRlbnQocGFyZW50RWwsIHN1Z2cuaXRlbS5uYW1lLCBzdWdnLm1hdGNoKTtcbiAgICB9XG4gIH1cblxuICBvbkNob29zZVN1Z2dlc3Rpb24oc3VnZzogQ29tbWFuZFN1Z2dlc3Rpb24pOiB2b2lkIHtcbiAgICBpZiAoc3VnZykge1xuICAgICAgY29uc3QgeyBpdGVtIH0gPSBzdWdnO1xuICAgICAgdGhpcy5hcHAuY29tbWFuZHMuZXhlY3V0ZUNvbW1hbmRCeUlkKGl0ZW0uaWQpO1xuICAgIH1cbiAgfVxuXG4gIGdldEl0ZW1zKCk6IENvbW1hbmRbXSB7XG4gICAgLy8gU29ydCBjb21tYW5kcyBieSB0aGVpciBuYW1lXG4gICAgY29uc3QgaXRlbXM6IENvbW1hbmRbXSA9IHRoaXMuYXBwLmNvbW1hbmRzLmxpc3RDb21tYW5kcygpLnNvcnQoKGEsIGIpID0+IHtcbiAgICAgIGlmIChhLm5hbWUgPCBiLm5hbWUpIHJldHVybiAtMTtcbiAgICAgIGlmIChhLm5hbWUgPiBiLm5hbWUpIHJldHVybiAxO1xuICAgICAgcmV0dXJuIDA7XG4gICAgfSk7XG5cbiAgICAvLyBQaW5uZWQgY29tbWFuZHMgc2hvdWxkIGJlIGF0IHRoZSB0b3AgKGlmIGFueSlcbiAgICBpZiAoXG4gICAgICB0aGlzLmlzQ29tbWFuZFBhbGV0dGVQbHVnaW5FbmFibGVkKCkgJiZcbiAgICAgIHRoaXMuZ2V0Q29tbWFuZFBhbGV0dGVQbHVnaW5JbnN0YW5jZSgpPy5vcHRpb25zLnBpbm5lZD8ubGVuZ3RoID4gMFxuICAgICkge1xuICAgICAgY29uc3QgcGlubmVkQ29tbWFuZElkcyA9IHRoaXMuZ2V0Q29tbWFuZFBhbGV0dGVQbHVnaW5JbnN0YW5jZSgpLm9wdGlvbnMucGlubmVkO1xuXG4gICAgICAvLyBXZSdyZSBnb25uYSBmaW5kIHRoZSBwaW5uZWQgY29tbWFuZCBpbiBgaXRlbXNgIGFuZCBtb3ZlIGl0IHRvIHRoZSBiZWdpbm5pbmdcbiAgICAgIC8vIFRoZXJlZm9yZSB3ZSBuZWVkIHRvIHBlcmZvcm0gXCJmb3IgZWFjaCByaWdodFwiXG4gICAgICBmb3IgKGxldCBpID0gcGlubmVkQ29tbWFuZElkcy5sZW5ndGggLSAxOyBpID49IDA7IGktLSkge1xuICAgICAgICBjb25zdCBjb21tYW5kSWQgPSBwaW5uZWRDb21tYW5kSWRzW2ldO1xuICAgICAgICBjb25zdCBjb21tYW5kSW5kZXggPSBpdGVtcy5maW5kSW5kZXgoKGMpID0+IGMuaWQgPT09IGNvbW1hbmRJZCk7XG4gICAgICAgIGlmIChjb21tYW5kSW5kZXggPiAtMSkge1xuICAgICAgICAgIGNvbnN0IGNvbW1hbmQgPSBpdGVtc1tjb21tYW5kSW5kZXhdO1xuICAgICAgICAgIGl0ZW1zLnNwbGljZShjb21tYW5kSW5kZXgsIDEpO1xuICAgICAgICAgIGl0ZW1zLnVuc2hpZnQoY29tbWFuZCk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG5cbiAgICByZXR1cm4gaXRlbXM7XG4gIH1cblxuICBwcml2YXRlIGlzQ29tbWFuZFBhbGV0dGVQbHVnaW5FbmFibGVkKCk6IGJvb2xlYW4ge1xuICAgIGNvbnN0IHBsdWdpbiA9IHRoaXMuZ2V0Q29tbWFuZFBhbGV0dGVQbHVnaW4oKTtcbiAgICByZXR1cm4gcGx1Z2luPy5lbmFibGVkO1xuICB9XG5cbiAgcHJpdmF0ZSBnZXRDb21tYW5kUGFsZXR0ZVBsdWdpbigpOiBJbnN0YWxsZWRQbHVnaW4ge1xuICAgIHJldHVybiBnZXRJbnRlcm5hbFBsdWdpbkJ5SWQodGhpcy5hcHAsIENPTU1BTkRfUEFMRVRURV9QTFVHSU5fSUQpO1xuICB9XG5cbiAgcHJpdmF0ZSBnZXRDb21tYW5kUGFsZXR0ZVBsdWdpbkluc3RhbmNlKCk6IENvbW1hbmRQYWxldHRlUGx1Z2luSW5zdGFuY2Uge1xuICAgIGNvbnN0IGNvbW1hbmRQYWxldHRlUGx1Z2luID0gdGhpcy5nZXRDb21tYW5kUGFsZXR0ZVBsdWdpbigpO1xuICAgIHJldHVybiBjb21tYW5kUGFsZXR0ZVBsdWdpbj8uaW5zdGFuY2UgYXMgQ29tbWFuZFBhbGV0dGVQbHVnaW5JbnN0YW5jZTtcbiAgfVxufVxuIiwiaW1wb3J0IHtcbiAgc29ydFNlYXJjaFJlc3VsdHMsXG4gIFdvcmtzcGFjZUxlYWYsXG4gIFRGaWxlLFxuICBUQWJzdHJhY3RGaWxlLFxuICBURm9sZGVyLFxuICBTZWFyY2hSZXN1bHQsXG59IGZyb20gJ29ic2lkaWFuJztcbmltcG9ydCB7XG4gIEFueVN1Z2dlc3Rpb24sXG4gIE1hdGNoVHlwZSxcbiAgTW9kZSxcbiAgUmVsYXRlZEl0ZW1zU3VnZ2VzdGlvbixcbiAgU2VhcmNoUmVzdWx0V2l0aEZhbGxiYWNrLFxuICBTb3VyY2VJbmZvLFxuICBTdWdnZXN0aW9uVHlwZSxcbn0gZnJvbSAnc3JjL3R5cGVzJztcbmltcG9ydCB7IElucHV0SW5mbywgU291cmNlZFBhcnNlZENvbW1hbmQgfSBmcm9tICdzcmMvc3dpdGNoZXJQbHVzJztcbmltcG9ydCB7IEhhbmRsZXIgfSBmcm9tICcuL2hhbmRsZXInO1xuaW1wb3J0IHsgaXNURmlsZSwgbWF0Y2hlckZuRm9yUmVnRXhMaXN0IH0gZnJvbSAnc3JjL3V0aWxzJztcblxuZXhwb3J0IGNsYXNzIFJlbGF0ZWRJdGVtc0hhbmRsZXIgZXh0ZW5kcyBIYW5kbGVyPFJlbGF0ZWRJdGVtc1N1Z2dlc3Rpb24+IHtcbiAgcHJpdmF0ZSBpbnB1dEluZm86IElucHV0SW5mbztcblxuICBvdmVycmlkZSBnZXQgY29tbWFuZFN0cmluZygpOiBzdHJpbmcge1xuICAgIHJldHVybiB0aGlzLnNldHRpbmdzPy5yZWxhdGVkSXRlbXNMaXN0Q29tbWFuZDtcbiAgfVxuXG4gIHZhbGlkYXRlQ29tbWFuZChcbiAgICBpbnB1dEluZm86IElucHV0SW5mbyxcbiAgICBpbmRleDogbnVtYmVyLFxuICAgIGZpbHRlclRleHQ6IHN0cmluZyxcbiAgICBhY3RpdmVTdWdnZXN0aW9uOiBBbnlTdWdnZXN0aW9uLFxuICAgIGFjdGl2ZUxlYWY6IFdvcmtzcGFjZUxlYWYsXG4gICk6IHZvaWQge1xuICAgIGNvbnN0IHNvdXJjZUluZm8gPSB0aGlzLmdldFNvdXJjZUluZm8oYWN0aXZlU3VnZ2VzdGlvbiwgYWN0aXZlTGVhZiwgaW5kZXggPT09IDApO1xuXG4gICAgaWYgKHNvdXJjZUluZm8pIHtcbiAgICAgIGlucHV0SW5mby5tb2RlID0gTW9kZS5SZWxhdGVkSXRlbXNMaXN0O1xuXG4gICAgICBjb25zdCBjbWQgPSBpbnB1dEluZm8ucGFyc2VkQ29tbWFuZChNb2RlLlJlbGF0ZWRJdGVtc0xpc3QpIGFzIFNvdXJjZWRQYXJzZWRDb21tYW5kO1xuXG4gICAgICBjbWQuc291cmNlID0gc291cmNlSW5mbztcbiAgICAgIGNtZC5pbmRleCA9IGluZGV4O1xuICAgICAgY21kLnBhcnNlZElucHV0ID0gZmlsdGVyVGV4dDtcbiAgICAgIGNtZC5pc1ZhbGlkYXRlZCA9IHRydWU7XG4gICAgfVxuICB9XG5cbiAgZ2V0U3VnZ2VzdGlvbnMoaW5wdXRJbmZvOiBJbnB1dEluZm8pOiBSZWxhdGVkSXRlbXNTdWdnZXN0aW9uW10ge1xuICAgIGNvbnN0IHN1Z2dlc3Rpb25zOiBSZWxhdGVkSXRlbXNTdWdnZXN0aW9uW10gPSBbXTtcblxuICAgIGlmIChpbnB1dEluZm8pIHtcbiAgICAgIHRoaXMuaW5wdXRJbmZvID0gaW5wdXRJbmZvO1xuICAgICAgaW5wdXRJbmZvLmJ1aWxkU2VhcmNoUXVlcnkoKTtcblxuICAgICAgY29uc3QgeyBoYXNTZWFyY2hUZXJtLCBwcmVwUXVlcnkgfSA9IGlucHV0SW5mby5zZWFyY2hRdWVyeTtcbiAgICAgIGNvbnN0IGNtZCA9IGlucHV0SW5mby5wYXJzZWRDb21tYW5kKE1vZGUuUmVsYXRlZEl0ZW1zTGlzdCkgYXMgU291cmNlZFBhcnNlZENvbW1hbmQ7XG4gICAgICBjb25zdCBpdGVtcyA9IHRoaXMuZ2V0UmVsYXRlZEZpbGVzKGNtZC5zb3VyY2UuZmlsZSk7XG5cbiAgICAgIGl0ZW1zLmZvckVhY2goKGl0ZW0pID0+IHtcbiAgICAgICAgbGV0IHNob3VsZFB1c2ggPSB0cnVlO1xuICAgICAgICBsZXQgcmVzdWx0OiBTZWFyY2hSZXN1bHRXaXRoRmFsbGJhY2sgPSB7IG1hdGNoVHlwZTogTWF0Y2hUeXBlLk5vbmUsIG1hdGNoOiBudWxsIH07XG5cbiAgICAgICAgaWYgKGhhc1NlYXJjaFRlcm0pIHtcbiAgICAgICAgICByZXN1bHQgPSB0aGlzLmZ1enp5U2VhcmNoV2l0aEZhbGxiYWNrKHByZXBRdWVyeSwgbnVsbCwgaXRlbSk7XG4gICAgICAgICAgc2hvdWxkUHVzaCA9IHJlc3VsdC5tYXRjaFR5cGUgIT09IE1hdGNoVHlwZS5Ob25lO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKHNob3VsZFB1c2gpIHtcbiAgICAgICAgICBzdWdnZXN0aW9ucy5wdXNoKHtcbiAgICAgICAgICAgIHR5cGU6IFN1Z2dlc3Rpb25UeXBlLlJlbGF0ZWRJdGVtc0xpc3QsXG4gICAgICAgICAgICByZWxhdGlvblR5cGU6ICdkaXNrTG9jYXRpb24nLFxuICAgICAgICAgICAgZmlsZTogaXRlbSxcbiAgICAgICAgICAgIC4uLnJlc3VsdCxcbiAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgICAgfSk7XG5cbiAgICAgIGlmIChoYXNTZWFyY2hUZXJtKSB7XG4gICAgICAgIHNvcnRTZWFyY2hSZXN1bHRzKHN1Z2dlc3Rpb25zKTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICByZXR1cm4gc3VnZ2VzdGlvbnM7XG4gIH1cblxuICByZW5kZXJTdWdnZXN0aW9uKHN1Z2c6IFJlbGF0ZWRJdGVtc1N1Z2dlc3Rpb24sIHBhcmVudEVsOiBIVE1MRWxlbWVudCk6IHZvaWQge1xuICAgIGlmIChzdWdnKSB7XG4gICAgICBjb25zdCB7IGZpbGUsIG1hdGNoVHlwZSwgbWF0Y2ggfSA9IHN1Z2c7XG4gICAgICBjb25zdCBjb250ZW50ID0gdGhpcy5nZXRUaXRsZVRleHQoZmlsZSk7XG4gICAgICBsZXQgY29udGVudE1hdGNoOiBTZWFyY2hSZXN1bHQgPSBtYXRjaDtcbiAgICAgIGxldCBwYXRoTWF0Y2g6IFNlYXJjaFJlc3VsdCA9IG51bGw7XG5cbiAgICAgIGlmIChtYXRjaFR5cGUgPT09IE1hdGNoVHlwZS5QYXJlbnRQYXRoKSB7XG4gICAgICAgIGNvbnRlbnRNYXRjaCA9IG51bGw7XG4gICAgICAgIHBhdGhNYXRjaCA9IG1hdGNoO1xuICAgICAgfVxuXG4gICAgICB0aGlzLmFkZENsYXNzZXNUb1N1Z2dlc3Rpb25Db250YWluZXIocGFyZW50RWwsIFsncXNwLXN1Z2dlc3Rpb24tcmVsYXRlZCddKTtcblxuICAgICAgY29uc3QgY29udGVudEVsID0gdGhpcy5yZW5kZXJDb250ZW50KHBhcmVudEVsLCBjb250ZW50LCBjb250ZW50TWF0Y2gpO1xuICAgICAgdGhpcy5yZW5kZXJQYXRoKGNvbnRlbnRFbCwgZmlsZSwgdHJ1ZSwgcGF0aE1hdGNoLCAhIXBhdGhNYXRjaCk7XG4gICAgfVxuICB9XG5cbiAgb25DaG9vc2VTdWdnZXN0aW9uKFxuICAgIHN1Z2c6IFJlbGF0ZWRJdGVtc1N1Z2dlc3Rpb24sXG4gICAgZXZ0OiBNb3VzZUV2ZW50IHwgS2V5Ym9hcmRFdmVudCxcbiAgKTogdm9pZCB7XG4gICAgaWYgKHN1Z2cpIHtcbiAgICAgIGNvbnN0IHsgZmlsZSB9ID0gc3VnZztcblxuICAgICAgdGhpcy5uYXZpZ2F0ZVRvTGVhZk9yT3BlbkZpbGUoXG4gICAgICAgIGV2dCxcbiAgICAgICAgZmlsZSxcbiAgICAgICAgYFVuYWJsZSB0byBvcGVuIHJlbGF0ZWQgZmlsZSAke2ZpbGUucGF0aH1gLFxuICAgICAgKTtcbiAgICB9XG4gIH1cblxuICBvdmVycmlkZSBnZXRUaXRsZVRleHQoc291cmNlRmlsZTogVEZpbGUpOiBzdHJpbmcge1xuICAgIHJldHVybiBzb3VyY2VGaWxlPy5iYXNlbmFtZTtcbiAgfVxuXG4gIGdldFJlbGF0ZWRGaWxlcyhzb3VyY2VGaWxlOiBURmlsZSk6IFRGaWxlW10ge1xuICAgIGNvbnN0IHJlbGF0ZWRGaWxlczogVEZpbGVbXSA9IFtdO1xuICAgIGNvbnN0IHsgZXhjbHVkZVJlbGF0ZWRGb2xkZXJzLCBleGNsdWRlT3BlblJlbGF0ZWRGaWxlcyB9ID0gdGhpcy5zZXR0aW5ncztcblxuICAgIGNvbnN0IGlzRXhjbHVkZWRGb2xkZXIgPSBtYXRjaGVyRm5Gb3JSZWdFeExpc3QoZXhjbHVkZVJlbGF0ZWRGb2xkZXJzKTtcbiAgICBsZXQgbm9kZXM6IFRBYnN0cmFjdEZpbGVbXSA9IFsuLi5zb3VyY2VGaWxlLnBhcmVudC5jaGlsZHJlbl07XG5cbiAgICB3aGlsZSAobm9kZXMubGVuZ3RoID4gMCkge1xuICAgICAgY29uc3Qgbm9kZSA9IG5vZGVzLnBvcCgpO1xuXG4gICAgICBpZiAoaXNURmlsZShub2RlKSkge1xuICAgICAgICBjb25zdCBpc1NvdXJjZUZpbGUgPSBub2RlID09PSBzb3VyY2VGaWxlO1xuICAgICAgICBjb25zdCBpc0V4Y2x1ZGVkID1cbiAgICAgICAgICBpc1NvdXJjZUZpbGUgfHwgKGV4Y2x1ZGVPcGVuUmVsYXRlZEZpbGVzICYmICEhdGhpcy5maW5kTWF0Y2hpbmdMZWFmKG5vZGUpLmxlYWYpO1xuXG4gICAgICAgIGlmICghaXNFeGNsdWRlZCkge1xuICAgICAgICAgIHJlbGF0ZWRGaWxlcy5wdXNoKG5vZGUpO1xuICAgICAgICB9XG4gICAgICB9IGVsc2UgaWYgKCFpc0V4Y2x1ZGVkRm9sZGVyKG5vZGUucGF0aCkpIHtcbiAgICAgICAgbm9kZXMgPSBub2Rlcy5jb25jYXQoKG5vZGUgYXMgVEZvbGRlcikuY2hpbGRyZW4pO1xuICAgICAgfVxuICAgIH1cblxuICAgIHJldHVybiByZWxhdGVkRmlsZXM7XG4gIH1cblxuICByZXNldCgpOiB2b2lkIHtcbiAgICB0aGlzLmlucHV0SW5mbyA9IG51bGw7XG4gIH1cblxuICBwcml2YXRlIGdldFNvdXJjZUluZm8oXG4gICAgYWN0aXZlU3VnZ2VzdGlvbjogQW55U3VnZ2VzdGlvbixcbiAgICBhY3RpdmVMZWFmOiBXb3Jrc3BhY2VMZWFmLFxuICAgIGlzUHJlZml4Q21kOiBib29sZWFuLFxuICApOiBTb3VyY2VJbmZvIHtcbiAgICBjb25zdCBwcmV2SW5wdXRJbmZvID0gdGhpcy5pbnB1dEluZm87XG4gICAgbGV0IHByZXZTb3VyY2VJbmZvOiBTb3VyY2VJbmZvID0gbnVsbDtcbiAgICBsZXQgcHJldk1vZGU6IE1vZGUgPSBNb2RlLlN0YW5kYXJkO1xuXG4gICAgaWYgKHByZXZJbnB1dEluZm8pIHtcbiAgICAgIHByZXZTb3VyY2VJbmZvID0gKHByZXZJbnB1dEluZm8ucGFyc2VkQ29tbWFuZCgpIGFzIFNvdXJjZWRQYXJzZWRDb21tYW5kKS5zb3VyY2U7XG4gICAgICBwcmV2TW9kZSA9IHByZXZJbnB1dEluZm8ubW9kZTtcbiAgICB9XG5cbiAgICAvLyBmaWd1cmUgb3V0IGlmIHRoZSBwcmV2aW91cyBvcGVyYXRpb24gd2FzIGEgc3ltYm9sIG9wZXJhdGlvblxuICAgIGNvbnN0IGhhc1ByZXZTb3VyY2UgPSBwcmV2TW9kZSA9PT0gTW9kZS5SZWxhdGVkSXRlbXNMaXN0ICYmICEhcHJldlNvdXJjZUluZm87XG5cbiAgICBjb25zdCBhY3RpdmVFZGl0b3JJbmZvID0gdGhpcy5nZXRFZGl0b3JJbmZvKGFjdGl2ZUxlYWYpO1xuICAgIGNvbnN0IGFjdGl2ZVN1Z2dJbmZvID0gdGhpcy5nZXRTdWdnZXN0aW9uSW5mbyhhY3RpdmVTdWdnZXN0aW9uKTtcblxuICAgIC8vIFBpY2sgdGhlIHNvdXJjZSBmaWxlIGZvciB0aGUgb3BlcmF0aW9uLCBwcmlvcml0aXppbmdcbiAgICAvLyBhbnkgcHJlLWV4aXN0aW5nIG9wZXJhdGlvbiB0aGF0IHdhcyBpbiBwcm9ncmVzc1xuICAgIGxldCBzb3VyY2VJbmZvOiBTb3VyY2VJbmZvID0gbnVsbDtcbiAgICBpZiAoaGFzUHJldlNvdXJjZSkge1xuICAgICAgc291cmNlSW5mbyA9IHByZXZTb3VyY2VJbmZvO1xuICAgIH0gZWxzZSBpZiAoYWN0aXZlU3VnZ0luZm8uaXNWYWxpZFNvdXJjZSkge1xuICAgICAgc291cmNlSW5mbyA9IGFjdGl2ZVN1Z2dJbmZvO1xuICAgIH0gZWxzZSBpZiAoYWN0aXZlRWRpdG9ySW5mby5pc1ZhbGlkU291cmNlICYmIGlzUHJlZml4Q21kKSB7XG4gICAgICBzb3VyY2VJbmZvID0gYWN0aXZlRWRpdG9ySW5mbztcbiAgICB9XG5cbiAgICByZXR1cm4gc291cmNlSW5mbztcbiAgfVxufVxuIiwiaW1wb3J0IHsgSGFuZGxlciB9IGZyb20gJy4vaGFuZGxlcic7XG5pbXBvcnQgeyBGaWxlU3VnZ2VzdGlvbiwgQWxpYXNTdWdnZXN0aW9uLCBBbnlTdWdnZXN0aW9uLCBNYXRjaFR5cGUgfSBmcm9tICdzcmMvdHlwZXMnO1xuaW1wb3J0IHsgU2VhcmNoUmVzdWx0LCBXb3Jrc3BhY2VMZWFmIH0gZnJvbSAnb2JzaWRpYW4nO1xuaW1wb3J0IHsgSW5wdXRJbmZvIH0gZnJvbSAnc3JjL3N3aXRjaGVyUGx1cyc7XG5pbXBvcnQgeyBpc0ZpbGVTdWdnZXN0aW9uIH0gZnJvbSAnc3JjL3V0aWxzJztcblxudHlwZSBTdXBwb3J0ZWRTeXN0ZW1TdWdnZXN0aW9ucyA9IEZpbGVTdWdnZXN0aW9uIHwgQWxpYXNTdWdnZXN0aW9uO1xuXG5leHBvcnQgY2xhc3MgU3RhbmRhcmRFeEhhbmRsZXIgZXh0ZW5kcyBIYW5kbGVyPFN1cHBvcnRlZFN5c3RlbVN1Z2dlc3Rpb25zPiB7XG4gIHZhbGlkYXRlQ29tbWFuZChcbiAgICBfaW5wdXRJbmZvOiBJbnB1dEluZm8sXG4gICAgX2luZGV4OiBudW1iZXIsXG4gICAgX2ZpbHRlclRleHQ6IHN0cmluZyxcbiAgICBfYWN0aXZlU3VnZ2VzdGlvbjogQW55U3VnZ2VzdGlvbixcbiAgICBfYWN0aXZlTGVhZjogV29ya3NwYWNlTGVhZixcbiAgKTogdm9pZCB7XG4gICAgdGhyb3cgbmV3IEVycm9yKCdNZXRob2Qgbm90IGltcGxlbWVudGVkLicpO1xuICB9XG5cbiAgZ2V0U3VnZ2VzdGlvbnMoX2lucHV0SW5mbzogSW5wdXRJbmZvKTogU3VwcG9ydGVkU3lzdGVtU3VnZ2VzdGlvbnNbXSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKCdNZXRob2Qgbm90IGltcGxlbWVudGVkLicpO1xuICB9XG5cbiAgcmVuZGVyU3VnZ2VzdGlvbihzdWdnOiBTdXBwb3J0ZWRTeXN0ZW1TdWdnZXN0aW9ucywgcGFyZW50RWw6IEhUTUxFbGVtZW50KTogdm9pZCB7XG4gICAgaWYgKGlzRmlsZVN1Z2dlc3Rpb24oc3VnZykpIHtcbiAgICAgIGNvbnN0IHsgZmlsZSwgbWF0Y2hUeXBlLCBtYXRjaCB9ID0gc3VnZztcbiAgICAgIGxldCBjb250ZW50TWF0Y2g6IFNlYXJjaFJlc3VsdCA9IG1hdGNoO1xuICAgICAgbGV0IHBhdGhNYXRjaDogU2VhcmNoUmVzdWx0ID0gbnVsbDtcblxuICAgICAgaWYgKG1hdGNoVHlwZSA9PT0gTWF0Y2hUeXBlLlBhcmVudFBhdGgpIHtcbiAgICAgICAgY29udGVudE1hdGNoID0gbnVsbDtcbiAgICAgICAgcGF0aE1hdGNoID0gbWF0Y2g7XG4gICAgICB9XG5cbiAgICAgIHRoaXMuYWRkQ2xhc3Nlc1RvU3VnZ2VzdGlvbkNvbnRhaW5lcihwYXJlbnRFbCwgWydxc3Atc3VnZ2VzdGlvbi1maWxlJ10pO1xuXG4gICAgICBjb25zdCBjb250ZW50RWwgPSB0aGlzLnJlbmRlckNvbnRlbnQocGFyZW50RWwsIGZpbGUuYmFzZW5hbWUsIGNvbnRlbnRNYXRjaCk7XG4gICAgICB0aGlzLnJlbmRlclBhdGgoY29udGVudEVsLCBmaWxlLCB0cnVlLCBwYXRoTWF0Y2gsICEhcGF0aE1hdGNoKTtcbiAgICB9XG4gIH1cblxuICBvbkNob29zZVN1Z2dlc3Rpb24oXG4gICAgc3VnZzogU3VwcG9ydGVkU3lzdGVtU3VnZ2VzdGlvbnMsXG4gICAgZXZ0OiBNb3VzZUV2ZW50IHwgS2V5Ym9hcmRFdmVudCxcbiAgKTogdm9pZCB7XG4gICAgaWYgKHN1Z2cpIHtcbiAgICAgIGNvbnN0IHsgZmlsZSB9ID0gc3VnZztcblxuICAgICAgdGhpcy5uYXZpZ2F0ZVRvTGVhZk9yT3BlbkZpbGUoXG4gICAgICAgIGV2dCxcbiAgICAgICAgZmlsZSxcbiAgICAgICAgYFVuYWJsZSB0byBvcGVuIGZpbGUgZnJvbSBTeXN0ZW1TdWdnZXN0aW9uICR7ZmlsZS5wYXRofWAsXG4gICAgICApO1xuICAgIH1cbiAgfVxufVxuIiwiaW1wb3J0IHsgcHJlcGFyZVF1ZXJ5IH0gZnJvbSAnb2JzaWRpYW4nO1xuaW1wb3J0IHsgTW9kZSwgU291cmNlSW5mbywgU2VhcmNoUXVlcnkgfSBmcm9tICdzcmMvdHlwZXMnO1xuXG5leHBvcnQgaW50ZXJmYWNlIFBhcnNlZENvbW1hbmQge1xuICBpc1ZhbGlkYXRlZDogYm9vbGVhbjtcbiAgaW5kZXg6IG51bWJlcjtcbiAgcGFyc2VkSW5wdXQ6IHN0cmluZztcbn1cblxuZXhwb3J0IGludGVyZmFjZSBTb3VyY2VkUGFyc2VkQ29tbWFuZCBleHRlbmRzIFBhcnNlZENvbW1hbmQge1xuICBzb3VyY2U6IFNvdXJjZUluZm87XG59XG5cbmV4cG9ydCBjbGFzcyBJbnB1dEluZm8ge1xuICBwcml2YXRlIHBhcnNlZENvbW1hbmRzOiBSZWNvcmQ8TW9kZSwgUGFyc2VkQ29tbWFuZD47XG4gIHByaXZhdGUgX3NlYXJjaFF1ZXJ5OiBTZWFyY2hRdWVyeTtcblxuICBwcml2YXRlIHN0YXRpYyBnZXQgZGVmYXVsdFBhcnNlZENvbW1hbmQoKTogUGFyc2VkQ29tbWFuZCB7XG4gICAgcmV0dXJuIHtcbiAgICAgIGlzVmFsaWRhdGVkOiBmYWxzZSxcbiAgICAgIGluZGV4OiAtMSxcbiAgICAgIHBhcnNlZElucHV0OiBudWxsLFxuICAgIH07XG4gIH1cblxuICBnZXQgc2VhcmNoUXVlcnkoKTogU2VhcmNoUXVlcnkge1xuICAgIHJldHVybiB0aGlzLl9zZWFyY2hRdWVyeTtcbiAgfVxuXG4gIGNvbnN0cnVjdG9yKHB1YmxpYyBpbnB1dFRleHQgPSAnJywgcHVibGljIG1vZGUgPSBNb2RlLlN0YW5kYXJkKSB7XG4gICAgY29uc3Qgc3ltYm9sTGlzdENtZDogU291cmNlZFBhcnNlZENvbW1hbmQgPSB7XG4gICAgICAuLi5JbnB1dEluZm8uZGVmYXVsdFBhcnNlZENvbW1hbmQsXG4gICAgICBzb3VyY2U6IG51bGwsXG4gICAgfTtcblxuICAgIGNvbnN0IHJlbGF0ZWRJdGVtc0xpc3RDbWQ6IFNvdXJjZWRQYXJzZWRDb21tYW5kID0ge1xuICAgICAgLi4uSW5wdXRJbmZvLmRlZmF1bHRQYXJzZWRDb21tYW5kLFxuICAgICAgc291cmNlOiBudWxsLFxuICAgIH07XG5cbiAgICBjb25zdCBwYXJzZWRDbWRzID0ge30gYXMgUmVjb3JkPE1vZGUsIFBhcnNlZENvbW1hbmQ+O1xuICAgIHBhcnNlZENtZHNbTW9kZS5TeW1ib2xMaXN0XSA9IHN5bWJvbExpc3RDbWQ7XG4gICAgcGFyc2VkQ21kc1tNb2RlLlN0YW5kYXJkXSA9IElucHV0SW5mby5kZWZhdWx0UGFyc2VkQ29tbWFuZDtcbiAgICBwYXJzZWRDbWRzW01vZGUuRWRpdG9yTGlzdF0gPSBJbnB1dEluZm8uZGVmYXVsdFBhcnNlZENvbW1hbmQ7XG4gICAgcGFyc2VkQ21kc1tNb2RlLldvcmtzcGFjZUxpc3RdID0gSW5wdXRJbmZvLmRlZmF1bHRQYXJzZWRDb21tYW5kO1xuICAgIHBhcnNlZENtZHNbTW9kZS5IZWFkaW5nc0xpc3RdID0gSW5wdXRJbmZvLmRlZmF1bHRQYXJzZWRDb21tYW5kO1xuICAgIHBhcnNlZENtZHNbTW9kZS5TdGFycmVkTGlzdF0gPSBJbnB1dEluZm8uZGVmYXVsdFBhcnNlZENvbW1hbmQ7XG4gICAgcGFyc2VkQ21kc1tNb2RlLkNvbW1hbmRMaXN0XSA9IElucHV0SW5mby5kZWZhdWx0UGFyc2VkQ29tbWFuZDtcbiAgICBwYXJzZWRDbWRzW01vZGUuUmVsYXRlZEl0ZW1zTGlzdF0gPSByZWxhdGVkSXRlbXNMaXN0Q21kO1xuICAgIHRoaXMucGFyc2VkQ29tbWFuZHMgPSBwYXJzZWRDbWRzO1xuICB9XG5cbiAgYnVpbGRTZWFyY2hRdWVyeSgpOiB2b2lkIHtcbiAgICBjb25zdCB7IG1vZGUgfSA9IHRoaXM7XG4gICAgY29uc3QgaW5wdXQgPSB0aGlzLnBhcnNlZENvbW1hbmRzW21vZGVdLnBhcnNlZElucHV0ID8/ICcnO1xuICAgIGNvbnN0IHByZXBRdWVyeSA9IHByZXBhcmVRdWVyeShpbnB1dC50cmltKCkudG9Mb3dlckNhc2UoKSk7XG4gICAgY29uc3QgaGFzU2VhcmNoVGVybSA9IHByZXBRdWVyeT8ucXVlcnk/Lmxlbmd0aCA+IDA7XG5cbiAgICB0aGlzLl9zZWFyY2hRdWVyeSA9IHsgcHJlcFF1ZXJ5LCBoYXNTZWFyY2hUZXJtIH07XG4gIH1cblxuICBwYXJzZWRDb21tYW5kKG1vZGU/OiBNb2RlKTogUGFyc2VkQ29tbWFuZCB7XG4gICAgbW9kZSA9IG1vZGUgPz8gdGhpcy5tb2RlO1xuICAgIHJldHVybiB0aGlzLnBhcnNlZENvbW1hbmRzW21vZGVdO1xuICB9XG59XG4iLCJpbXBvcnQge1xuICBIYW5kbGVyLFxuICBXb3Jrc3BhY2VIYW5kbGVyLFxuICBIZWFkaW5nc0hhbmRsZXIsXG4gIEVkaXRvckhhbmRsZXIsXG4gIFJlbGF0ZWRJdGVtc0hhbmRsZXIsXG4gIFN5bWJvbEhhbmRsZXIsXG4gIFN0YXJyZWRIYW5kbGVyLFxuICBDb21tYW5kSGFuZGxlcixcbiAgU3RhbmRhcmRFeEhhbmRsZXIsXG59IGZyb20gJ3NyYy9IYW5kbGVycyc7XG5pbXBvcnQge1xuICBpc1N5bWJvbFN1Z2dlc3Rpb24sXG4gIGVzY2FwZVJlZ0V4cCxcbiAgaXNFeFN1Z2dlc3Rpb24sXG4gIGlzT2ZUeXBlLFxuICBpc1VucmVzb2x2ZWRTdWdnZXN0aW9uLFxuICBpc0ZpbGVTdWdnZXN0aW9uLFxufSBmcm9tICdzcmMvdXRpbHMnO1xuaW1wb3J0IHsgSW5wdXRJbmZvIH0gZnJvbSAnLi9pbnB1dEluZm8nO1xuaW1wb3J0IHsgU3dpdGNoZXJQbHVzU2V0dGluZ3MgfSBmcm9tICdzcmMvc2V0dGluZ3MnO1xuaW1wb3J0IHsgV29ya3NwYWNlTGVhZiwgQXBwLCBDaG9vc2VyLCBEZWJvdW5jZXIsIGRlYm91bmNlIH0gZnJvbSAnb2JzaWRpYW4nO1xuaW1wb3J0IHsgTW9kZSwgQW55U3VnZ2VzdGlvbiwgU3ltYm9sU3VnZ2VzdGlvbiwgU3VnZ2VzdGlvblR5cGUgfSBmcm9tICdzcmMvdHlwZXMnO1xuaW1wb3J0IHsgU3dpdGNoZXJQbHVzS2V5bWFwIH0gZnJvbSAnLi9zd2l0Y2hlclBsdXNLZXltYXAnO1xuXG5leHBvcnQgY2xhc3MgTW9kZUhhbmRsZXIge1xuICBwcml2YXRlIGlucHV0SW5mbzogSW5wdXRJbmZvO1xuICBwcml2YXRlIGhhbmRsZXJzQnlNb2RlOiBNYXA8T21pdDxNb2RlLCAnU3RhbmRhcmQnPiwgSGFuZGxlcjxBbnlTdWdnZXN0aW9uPj47XG4gIHByaXZhdGUgaGFuZGxlcnNCeVR5cGU6IE1hcDxTdWdnZXN0aW9uVHlwZSwgSGFuZGxlcjxBbnlTdWdnZXN0aW9uPj47XG4gIHByaXZhdGUgZGVib3VuY2VkR2V0U3VnZ2VzdGlvbnM6IERlYm91bmNlcjxbSW5wdXRJbmZvLCBDaG9vc2VyPEFueVN1Z2dlc3Rpb24+XT47XG4gIHByaXZhdGUgc2Vzc2lvbk9wZW5Nb2RlU3RyaW5nOiBzdHJpbmc7XG5cbiAgY29uc3RydWN0b3IoXG4gICAgcHJpdmF0ZSBhcHA6IEFwcCxcbiAgICBwcml2YXRlIHNldHRpbmdzOiBTd2l0Y2hlclBsdXNTZXR0aW5ncyxcbiAgICBwdWJsaWMgZXhLZXltYXA6IFN3aXRjaGVyUGx1c0tleW1hcCxcbiAgKSB7XG4gICAgLy8gU3RhbmRhcmRFeEhhbmRsZXIgb25lIGlzIHNwZWNpYWwgaW4gdGhhdCBpdCBpcyBub3QgYSBcImZ1bGxcIiBoYW5kbGVyLFxuICAgIC8vIGFuZCBub3QgYXR0YWNoZWQgdG8gYSBtb2RlLCBhcyBhIHJlc3VsdCBpdCBpcyBub3QgaW4gdGhlIGhhbmRsZXJzQnlNb2RlIGxpc3RcbiAgICBjb25zdCBzdGFuZGFyZEV4SGFuZGxlciA9IG5ldyBTdGFuZGFyZEV4SGFuZGxlcihhcHAsIHNldHRpbmdzKTtcbiAgICBjb25zdCBoYW5kbGVyc0J5TW9kZSA9IG5ldyBNYXA8T21pdDxNb2RlLCAnU3RhbmRhcmQnPiwgSGFuZGxlcjxBbnlTdWdnZXN0aW9uPj4oW1xuICAgICAgW01vZGUuU3ltYm9sTGlzdCwgbmV3IFN5bWJvbEhhbmRsZXIoYXBwLCBzZXR0aW5ncyldLFxuICAgICAgW01vZGUuV29ya3NwYWNlTGlzdCwgbmV3IFdvcmtzcGFjZUhhbmRsZXIoYXBwLCBzZXR0aW5ncyldLFxuICAgICAgW01vZGUuSGVhZGluZ3NMaXN0LCBuZXcgSGVhZGluZ3NIYW5kbGVyKGFwcCwgc2V0dGluZ3MpXSxcbiAgICAgIFtNb2RlLkVkaXRvckxpc3QsIG5ldyBFZGl0b3JIYW5kbGVyKGFwcCwgc2V0dGluZ3MpXSxcbiAgICAgIFtNb2RlLlN0YXJyZWRMaXN0LCBuZXcgU3RhcnJlZEhhbmRsZXIoYXBwLCBzZXR0aW5ncyldLFxuICAgICAgW01vZGUuQ29tbWFuZExpc3QsIG5ldyBDb21tYW5kSGFuZGxlcihhcHAsIHNldHRpbmdzKV0sXG4gICAgICBbTW9kZS5SZWxhdGVkSXRlbXNMaXN0LCBuZXcgUmVsYXRlZEl0ZW1zSGFuZGxlcihhcHAsIHNldHRpbmdzKV0sXG4gICAgXSk7XG5cbiAgICB0aGlzLmhhbmRsZXJzQnlNb2RlID0gaGFuZGxlcnNCeU1vZGU7XG4gICAgdGhpcy5oYW5kbGVyc0J5VHlwZSA9IG5ldyBNYXA8U3VnZ2VzdGlvblR5cGUsIEhhbmRsZXI8QW55U3VnZ2VzdGlvbj4+KFtcbiAgICAgIFtTdWdnZXN0aW9uVHlwZS5Db21tYW5kTGlzdCwgaGFuZGxlcnNCeU1vZGUuZ2V0KE1vZGUuQ29tbWFuZExpc3QpXSxcbiAgICAgIFtTdWdnZXN0aW9uVHlwZS5FZGl0b3JMaXN0LCBoYW5kbGVyc0J5TW9kZS5nZXQoTW9kZS5FZGl0b3JMaXN0KV0sXG4gICAgICBbU3VnZ2VzdGlvblR5cGUuSGVhZGluZ3NMaXN0LCBoYW5kbGVyc0J5TW9kZS5nZXQoTW9kZS5IZWFkaW5nc0xpc3QpXSxcbiAgICAgIFtTdWdnZXN0aW9uVHlwZS5SZWxhdGVkSXRlbXNMaXN0LCBoYW5kbGVyc0J5TW9kZS5nZXQoTW9kZS5SZWxhdGVkSXRlbXNMaXN0KV0sXG4gICAgICBbU3VnZ2VzdGlvblR5cGUuU3RhcnJlZExpc3QsIGhhbmRsZXJzQnlNb2RlLmdldChNb2RlLlN0YXJyZWRMaXN0KV0sXG4gICAgICBbU3VnZ2VzdGlvblR5cGUuU3ltYm9sTGlzdCwgaGFuZGxlcnNCeU1vZGUuZ2V0KE1vZGUuU3ltYm9sTGlzdCldLFxuICAgICAgW1N1Z2dlc3Rpb25UeXBlLldvcmtzcGFjZUxpc3QsIGhhbmRsZXJzQnlNb2RlLmdldChNb2RlLldvcmtzcGFjZUxpc3QpXSxcbiAgICAgIFtTdWdnZXN0aW9uVHlwZS5GaWxlLCBzdGFuZGFyZEV4SGFuZGxlcl0sXG4gICAgICBbU3VnZ2VzdGlvblR5cGUuQWxpYXMsIHN0YW5kYXJkRXhIYW5kbGVyXSxcbiAgICBdKTtcblxuICAgIHRoaXMuZGVib3VuY2VkR2V0U3VnZ2VzdGlvbnMgPSBkZWJvdW5jZSh0aGlzLmdldFN1Z2dlc3Rpb25zLmJpbmQodGhpcyksIDQwMCwgdHJ1ZSk7XG4gICAgdGhpcy5yZXNldCgpO1xuICB9XG5cbiAgb25PcGVuKCk6IHZvaWQge1xuICAgIHRoaXMuZXhLZXltYXAuaXNPcGVuID0gdHJ1ZTtcbiAgfVxuXG4gIG9uQ2xvc2UoKSB7XG4gICAgdGhpcy5leEtleW1hcC5pc09wZW4gPSBmYWxzZTtcbiAgfVxuXG4gIHNldFNlc3Npb25PcGVuTW9kZShtb2RlOiBNb2RlLCBjaG9vc2VyOiBDaG9vc2VyPEFueVN1Z2dlc3Rpb24+KTogdm9pZCB7XG4gICAgdGhpcy5yZXNldCgpO1xuICAgIGNob29zZXI/LnNldFN1Z2dlc3Rpb25zKFtdKTtcblxuICAgIGlmIChtb2RlICE9PSBNb2RlLlN0YW5kYXJkKSB7XG4gICAgICB0aGlzLnNlc3Npb25PcGVuTW9kZVN0cmluZyA9IHRoaXMuZ2V0SGFuZGxlcihtb2RlKS5jb21tYW5kU3RyaW5nO1xuICAgIH1cbiAgfVxuXG4gIGluc2VydFNlc3Npb25PcGVuTW9kZUNvbW1hbmRTdHJpbmcoaW5wdXRFbDogSFRNTElucHV0RWxlbWVudCk6IHZvaWQge1xuICAgIGNvbnN0IHsgc2Vzc2lvbk9wZW5Nb2RlU3RyaW5nIH0gPSB0aGlzO1xuXG4gICAgaWYgKHNlc3Npb25PcGVuTW9kZVN0cmluZyAhPT0gbnVsbCAmJiBzZXNzaW9uT3Blbk1vZGVTdHJpbmcgIT09ICcnKSB7XG4gICAgICAvLyB1cGRhdGUgVUkgd2l0aCBjdXJyZW50IGNvbW1hbmQgc3RyaW5nIGluIHRoZSBjYXNlIHdlcmUgb3BlbkluTW9kZSB3YXMgY2FsbGVkXG4gICAgICBpbnB1dEVsLnZhbHVlID0gc2Vzc2lvbk9wZW5Nb2RlU3RyaW5nO1xuXG4gICAgICAvLyByZXNldCB0byBudWxsIHNvIHVzZXIgaW5wdXQgaXMgbm90IG92ZXJyaWRkZW4gdGhlIG5leHQgdGltZSBvbklucHV0IGlzIGNhbGxlZFxuICAgICAgdGhpcy5zZXNzaW9uT3Blbk1vZGVTdHJpbmcgPSBudWxsO1xuICAgIH1cbiAgfVxuXG4gIHVwZGF0ZVN1Z2dlc3Rpb25zKHF1ZXJ5OiBzdHJpbmcsIGNob29zZXI6IENob29zZXI8QW55U3VnZ2VzdGlvbj4pOiBib29sZWFuIHtcbiAgICBsZXQgaGFuZGxlZCA9IGZhbHNlO1xuICAgIGNvbnN0IHtcbiAgICAgIGV4S2V5bWFwLFxuICAgICAgYXBwOiB7XG4gICAgICAgIHdvcmtzcGFjZTogeyBhY3RpdmVMZWFmIH0sXG4gICAgICB9LFxuICAgIH0gPSB0aGlzO1xuXG4gICAgY29uc3QgYWN0aXZlU3VnZyA9IE1vZGVIYW5kbGVyLmdldEFjdGl2ZVN1Z2dlc3Rpb24oY2hvb3Nlcik7XG4gICAgY29uc3QgaW5wdXRJbmZvID0gdGhpcy5kZXRlcm1pbmVSdW5Nb2RlKHF1ZXJ5LCBhY3RpdmVTdWdnLCBhY3RpdmVMZWFmKTtcblxuICAgIGNvbnN0IHsgbW9kZSB9ID0gaW5wdXRJbmZvO1xuICAgIGV4S2V5bWFwLnVwZGF0ZUtleW1hcEZvck1vZGUobW9kZSk7XG5cbiAgICBpZiAobW9kZSAhPT0gTW9kZS5TdGFuZGFyZCkge1xuICAgICAgaWYgKG1vZGUgPT09IE1vZGUuSGVhZGluZ3NMaXN0ICYmIGlucHV0SW5mby5wYXJzZWRDb21tYW5kKCkucGFyc2VkSW5wdXQ/Lmxlbmd0aCkge1xuICAgICAgICAvLyBpZiBoZWFkaW5ncyBtb2RlIGFuZCB1c2VyIGlzIHR5cGluZyBhIHF1ZXJ5LCBkZWxheSBnZXR0aW5nIHN1Z2dlc3Rpb25zXG4gICAgICAgIHRoaXMuZGVib3VuY2VkR2V0U3VnZ2VzdGlvbnMoaW5wdXRJbmZvLCBjaG9vc2VyKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHRoaXMuZ2V0U3VnZ2VzdGlvbnMoaW5wdXRJbmZvLCBjaG9vc2VyKTtcbiAgICAgIH1cblxuICAgICAgaGFuZGxlZCA9IHRydWU7XG4gICAgfVxuXG4gICAgcmV0dXJuIGhhbmRsZWQ7XG4gIH1cblxuICByZW5kZXJTdWdnZXN0aW9uKHN1Z2c6IEFueVN1Z2dlc3Rpb24sIHBhcmVudEVsOiBIVE1MRWxlbWVudCk6IGJvb2xlYW4ge1xuICAgIGxldCBoYW5kbGVkID0gZmFsc2U7XG5cbiAgICAvLyBpbiBIZWFkaW5ncyBtb2RlLCBTdGFuZGFyZEV4SGFuZGxlciBzaG91bGQgaGFuZGxlIHJlbmRlcmluZyBmb3IgRmlsZVxuICAgIC8vIHN1Z2dlc3Rpb25zXG4gICAgY29uc3QgdXNlRXhIYW5kbGVyID1cbiAgICAgIHRoaXMuaW5wdXRJbmZvLm1vZGUgPT09IE1vZGUuSGVhZGluZ3NMaXN0ICYmIGlzRmlsZVN1Z2dlc3Rpb24oc3VnZyk7XG5cbiAgICBpZiAodXNlRXhIYW5kbGVyIHx8IGlzRXhTdWdnZXN0aW9uKHN1Z2cpKSB7XG4gICAgICB0aGlzLmdldEhhbmRsZXIoc3VnZykucmVuZGVyU3VnZ2VzdGlvbihzdWdnLCBwYXJlbnRFbCk7XG4gICAgICBoYW5kbGVkID0gdHJ1ZTtcbiAgICB9XG5cbiAgICByZXR1cm4gaGFuZGxlZDtcbiAgfVxuXG4gIG9uQ2hvb3NlU3VnZ2VzdGlvbihzdWdnOiBBbnlTdWdnZXN0aW9uLCBldnQ6IE1vdXNlRXZlbnQgfCBLZXlib2FyZEV2ZW50KTogYm9vbGVhbiB7XG4gICAgbGV0IGhhbmRsZWQgPSBmYWxzZTtcblxuICAgIC8vIGluIEhlYWRpbmdzIG1vZGUsIFN0YW5kYXJkRXhIYW5kbGVyIHNob3VsZCBoYW5kbGUgdGhlIG9uQ2hvb3NlIGFjdGlvbiBmb3IgRmlsZVxuICAgIC8vIGFuZCBBbGlhcyBzdWdnZXN0aW9uIHNvIHRoYXQgdGhlIHByZWZlck9wZW5Jbk5ld1BhbmUgc2V0dGluZyBjYW4gYmUgaGFuZGxlZCBwcm9wZXJseVxuICAgIGNvbnN0IHVzZUV4SGFuZGxlciA9XG4gICAgICB0aGlzLmlucHV0SW5mby5tb2RlID09PSBNb2RlLkhlYWRpbmdzTGlzdCAmJiAhaXNVbnJlc29sdmVkU3VnZ2VzdGlvbihzdWdnKTtcblxuICAgIGlmICh1c2VFeEhhbmRsZXIgfHwgaXNFeFN1Z2dlc3Rpb24oc3VnZykpIHtcbiAgICAgIHRoaXMuZ2V0SGFuZGxlcihzdWdnKS5vbkNob29zZVN1Z2dlc3Rpb24oc3VnZywgZXZ0KTtcbiAgICAgIGhhbmRsZWQgPSB0cnVlO1xuICAgIH1cblxuICAgIHJldHVybiBoYW5kbGVkO1xuICB9XG5cbiAgZGV0ZXJtaW5lUnVuTW9kZShcbiAgICBxdWVyeTogc3RyaW5nLFxuICAgIGFjdGl2ZVN1Z2c6IEFueVN1Z2dlc3Rpb24sXG4gICAgYWN0aXZlTGVhZjogV29ya3NwYWNlTGVhZixcbiAgKTogSW5wdXRJbmZvIHtcbiAgICBjb25zdCBpbnB1dCA9IHF1ZXJ5ID8/ICcnO1xuICAgIGNvbnN0IGluZm8gPSBuZXcgSW5wdXRJbmZvKGlucHV0KTtcblxuICAgIGlmIChpbnB1dC5sZW5ndGggPT09IDApIHtcbiAgICAgIHRoaXMucmVzZXQoKTtcbiAgICB9XG5cbiAgICB0aGlzLnZhbGlkYXRlUHJlZml4Q29tbWFuZHMoaW5mbywgYWN0aXZlU3VnZywgYWN0aXZlTGVhZik7XG4gICAgdGhpcy52YWxpZGF0ZVNvdXJjZWRDb21tYW5kcyhpbmZvLCBhY3RpdmVTdWdnLCBhY3RpdmVMZWFmKTtcblxuICAgIHJldHVybiBpbmZvO1xuICB9XG5cbiAgZ2V0U3VnZ2VzdGlvbnMoaW5wdXRJbmZvOiBJbnB1dEluZm8sIGNob29zZXI6IENob29zZXI8QW55U3VnZ2VzdGlvbj4pOiB2b2lkIHtcbiAgICB0aGlzLmlucHV0SW5mbyA9IGlucHV0SW5mbztcbiAgICBjb25zdCB7IG1vZGUgfSA9IGlucHV0SW5mbztcblxuICAgIGNob29zZXIuc2V0U3VnZ2VzdGlvbnMoW10pO1xuXG4gICAgY29uc3Qgc3VnZ2VzdGlvbnMgPSB0aGlzLmdldEhhbmRsZXIobW9kZSkuZ2V0U3VnZ2VzdGlvbnMoaW5wdXRJbmZvKTtcblxuICAgIGNob29zZXIuc2V0U3VnZ2VzdGlvbnMoc3VnZ2VzdGlvbnMpO1xuICAgIE1vZGVIYW5kbGVyLnNldEFjdGl2ZVN1Z2dlc3Rpb24obW9kZSwgY2hvb3Nlcik7XG4gIH1cblxuICBwcml2YXRlIHZhbGlkYXRlUHJlZml4Q29tbWFuZHMoXG4gICAgaW5wdXRJbmZvOiBJbnB1dEluZm8sXG4gICAgYWN0aXZlU3VnZzogQW55U3VnZ2VzdGlvbixcbiAgICBhY3RpdmVMZWFmOiBXb3Jrc3BhY2VMZWFmLFxuICApOiB2b2lkIHtcbiAgICBjb25zdCB7IHNldHRpbmdzIH0gPSB0aGlzO1xuICAgIGNvbnN0IHByZWZpeENtZHMgPSBbXG4gICAgICBzZXR0aW5ncy5lZGl0b3JMaXN0Q29tbWFuZCxcbiAgICAgIHNldHRpbmdzLndvcmtzcGFjZUxpc3RDb21tYW5kLFxuICAgICAgc2V0dGluZ3MuaGVhZGluZ3NMaXN0Q29tbWFuZCxcbiAgICAgIHNldHRpbmdzLnN0YXJyZWRMaXN0Q29tbWFuZCxcbiAgICAgIHNldHRpbmdzLmNvbW1hbmRMaXN0Q29tbWFuZCxcbiAgICBdXG4gICAgICAubWFwKCh2KSA9PiBgKCR7ZXNjYXBlUmVnRXhwKHYpfSlgKVxuICAgICAgLy8gYWNjb3VudCBmb3IgcG90ZW50aWFsIG92ZXJsYXBwaW5nIGNvbW1hbmQgc3RyaW5nc1xuICAgICAgLnNvcnQoKGEsIGIpID0+IGIubGVuZ3RoIC0gYS5sZW5ndGgpO1xuXG4gICAgLy8gcmVnZXggdGhhdCBtYXRjaGVzIGFueSBvZiB0aGUgcHJlZml4IGNvbW1hbmRzLCBhbmQgZXh0cmFjdCBmaWx0ZXIgdGV4dFxuICAgIGNvbnN0IG1hdGNoID0gbmV3IFJlZ0V4cChgXigke3ByZWZpeENtZHMuam9pbignfCcpfSkoLiopJGApLmV4ZWMoaW5wdXRJbmZvLmlucHV0VGV4dCk7XG5cbiAgICBpZiAobWF0Y2gpIHtcbiAgICAgIGNvbnN0IGNtZFN0ciA9IG1hdGNoWzFdO1xuICAgICAgY29uc3QgZmlsdGVyVGV4dCA9IG1hdGNoW21hdGNoLmxlbmd0aCAtIDFdO1xuICAgICAgY29uc3QgaGFuZGxlciA9IHRoaXMuZ2V0SGFuZGxlcihjbWRTdHIpO1xuXG4gICAgICBpZiAoaGFuZGxlcikge1xuICAgICAgICBoYW5kbGVyLnZhbGlkYXRlQ29tbWFuZChcbiAgICAgICAgICBpbnB1dEluZm8sXG4gICAgICAgICAgbWF0Y2guaW5kZXgsXG4gICAgICAgICAgZmlsdGVyVGV4dCxcbiAgICAgICAgICBhY3RpdmVTdWdnLFxuICAgICAgICAgIGFjdGl2ZUxlYWYsXG4gICAgICAgICk7XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgcHJpdmF0ZSB2YWxpZGF0ZVNvdXJjZWRDb21tYW5kcyhcbiAgICBpbnB1dEluZm86IElucHV0SW5mbyxcbiAgICBhY3RpdmVTdWdnOiBBbnlTdWdnZXN0aW9uLFxuICAgIGFjdGl2ZUxlYWY6IFdvcmtzcGFjZUxlYWYsXG4gICk6IHZvaWQge1xuICAgIGNvbnN0IHsgbW9kZSwgaW5wdXRUZXh0IH0gPSBpbnB1dEluZm87XG5cbiAgICAvLyBTdGFuZGFyZCwgSGVhZGluZ3MsIFN0YXJyZWQsIGFuZCBFZGl0b3JMaXN0IG1vZGUgY2FuIGhhdmUgYW4gZW1iZWRkZWQgY29tbWFuZFxuICAgIGNvbnN0IHN1cHBvcnRlZE1vZGVzID0gW1xuICAgICAgTW9kZS5TdGFuZGFyZCxcbiAgICAgIE1vZGUuRWRpdG9yTGlzdCxcbiAgICAgIE1vZGUuSGVhZGluZ3NMaXN0LFxuICAgICAgTW9kZS5TdGFycmVkTGlzdCxcbiAgICBdO1xuXG4gICAgaWYgKHN1cHBvcnRlZE1vZGVzLmluY2x1ZGVzKG1vZGUpKSB7XG4gICAgICBjb25zdCB7IHNldHRpbmdzIH0gPSB0aGlzO1xuICAgICAgY29uc3QgZW1iZWRkZWRDbWRzID0gW3NldHRpbmdzLnN5bWJvbExpc3RDb21tYW5kLCBzZXR0aW5ncy5yZWxhdGVkSXRlbXNMaXN0Q29tbWFuZF1cbiAgICAgICAgLm1hcCgodikgPT4gYCgke2VzY2FwZVJlZ0V4cCh2KX0pYClcbiAgICAgICAgLnNvcnQoKGEsIGIpID0+IGIubGVuZ3RoIC0gYS5sZW5ndGgpO1xuXG4gICAgICAvLyByZWdleCB0aGF0IG1hdGNoZXMgYW55IHNvdXJjZWQgY29tbWFuZCwgYW5kIGV4dHJhY3QgZmlsdGVyIHRleHRcbiAgICAgIGNvbnN0IG1hdGNoID0gbmV3IFJlZ0V4cChgKCR7ZW1iZWRkZWRDbWRzLmpvaW4oJ3wnKX0pKC4qKSRgKS5leGVjKGlucHV0VGV4dCk7XG5cbiAgICAgIGlmIChtYXRjaCkge1xuICAgICAgICBjb25zdCBjbWRTdHIgPSBtYXRjaFsxXTtcbiAgICAgICAgY29uc3QgZmlsdGVyVGV4dCA9IG1hdGNoW21hdGNoLmxlbmd0aCAtIDFdO1xuICAgICAgICBjb25zdCBoYW5kbGVyID0gdGhpcy5nZXRIYW5kbGVyKGNtZFN0cik7XG5cbiAgICAgICAgaWYgKGhhbmRsZXIpIHtcbiAgICAgICAgICBoYW5kbGVyLnZhbGlkYXRlQ29tbWFuZChcbiAgICAgICAgICAgIGlucHV0SW5mbyxcbiAgICAgICAgICAgIG1hdGNoLmluZGV4LFxuICAgICAgICAgICAgZmlsdGVyVGV4dCxcbiAgICAgICAgICAgIGFjdGl2ZVN1Z2csXG4gICAgICAgICAgICBhY3RpdmVMZWFmLFxuICAgICAgICAgICk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICBwcml2YXRlIHN0YXRpYyBzZXRBY3RpdmVTdWdnZXN0aW9uKG1vZGU6IE1vZGUsIGNob29zZXI6IENob29zZXI8QW55U3VnZ2VzdGlvbj4pOiB2b2lkIHtcbiAgICAvLyBvbmx5IHN5bWJvbCBtb2RlIGN1cnJlbnRseSBzZXRzIGFuIGFjdGl2ZSBzZWxlY3Rpb25cbiAgICBpZiAobW9kZSA9PT0gTW9kZS5TeW1ib2xMaXN0KSB7XG4gICAgICBjb25zdCBpbmRleCA9IGNob29zZXIudmFsdWVzXG4gICAgICAgIC5maWx0ZXIoKHYpOiB2IGlzIFN5bWJvbFN1Z2dlc3Rpb24gPT4gaXNTeW1ib2xTdWdnZXN0aW9uKHYpKVxuICAgICAgICAuZmluZEluZGV4KCh2KSA9PiB2Lml0ZW0uaXNTZWxlY3RlZCk7XG5cbiAgICAgIGlmIChpbmRleCAhPT0gLTEpIHtcbiAgICAgICAgY2hvb3Nlci5zZXRTZWxlY3RlZEl0ZW0oaW5kZXgsIHRydWUpO1xuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIHByaXZhdGUgc3RhdGljIGdldEFjdGl2ZVN1Z2dlc3Rpb24oY2hvb3NlcjogQ2hvb3NlcjxBbnlTdWdnZXN0aW9uPik6IEFueVN1Z2dlc3Rpb24ge1xuICAgIGxldCBhY3RpdmVTdWdnZXN0aW9uOiBBbnlTdWdnZXN0aW9uID0gbnVsbDtcblxuICAgIGlmIChjaG9vc2VyPy52YWx1ZXMpIHtcbiAgICAgIGFjdGl2ZVN1Z2dlc3Rpb24gPSBjaG9vc2VyLnZhbHVlc1tjaG9vc2VyLnNlbGVjdGVkSXRlbV07XG4gICAgfVxuXG4gICAgcmV0dXJuIGFjdGl2ZVN1Z2dlc3Rpb247XG4gIH1cblxuICBwcml2YXRlIHJlc2V0KCk6IHZvaWQge1xuICAgIHRoaXMuaW5wdXRJbmZvID0gbmV3IElucHV0SW5mbygpO1xuICAgIHRoaXMuc2Vzc2lvbk9wZW5Nb2RlU3RyaW5nID0gbnVsbDtcbiAgICAodGhpcy5nZXRIYW5kbGVyKE1vZGUuU3ltYm9sTGlzdCkgYXMgU3ltYm9sSGFuZGxlcikucmVzZXQoKTtcbiAgICAodGhpcy5nZXRIYW5kbGVyKE1vZGUuUmVsYXRlZEl0ZW1zTGlzdCkgYXMgUmVsYXRlZEl0ZW1zSGFuZGxlcikucmVzZXQoKTtcbiAgfVxuXG4gIHByaXZhdGUgZ2V0SGFuZGxlcihcbiAgICBraW5kOiBPbWl0PE1vZGUsICdTdGFuZGFyZCc+IHwgQW55U3VnZ2VzdGlvbiB8IHN0cmluZyxcbiAgKTogSGFuZGxlcjxBbnlTdWdnZXN0aW9uPiB7XG4gICAgbGV0IGhhbmRsZXI6IEhhbmRsZXI8QW55U3VnZ2VzdGlvbj47XG4gICAgY29uc3QgeyBoYW5kbGVyc0J5TW9kZSwgaGFuZGxlcnNCeVR5cGUgfSA9IHRoaXM7XG5cbiAgICBpZiAodHlwZW9mIGtpbmQgPT09ICdudW1iZXInKSB7XG4gICAgICBoYW5kbGVyID0gaGFuZGxlcnNCeU1vZGUuZ2V0KGtpbmQpO1xuICAgIH0gZWxzZSBpZiAoaXNPZlR5cGU8QW55U3VnZ2VzdGlvbj4oa2luZCwgJ3R5cGUnKSkge1xuICAgICAgaGFuZGxlciA9IGhhbmRsZXJzQnlUeXBlLmdldChraW5kLnR5cGUpO1xuICAgIH0gZWxzZSBpZiAodHlwZW9mIGtpbmQgPT09ICdzdHJpbmcnKSB7XG4gICAgICBjb25zdCB7IHNldHRpbmdzIH0gPSB0aGlzO1xuICAgICAgY29uc3QgaGFuZGxlcnNCeUNvbW1hbmQgPSBuZXcgTWFwPHN0cmluZywgSGFuZGxlcjxBbnlTdWdnZXN0aW9uPj4oW1xuICAgICAgICBbc2V0dGluZ3MuZWRpdG9yTGlzdENvbW1hbmQsIGhhbmRsZXJzQnlNb2RlLmdldChNb2RlLkVkaXRvckxpc3QpXSxcbiAgICAgICAgW3NldHRpbmdzLndvcmtzcGFjZUxpc3RDb21tYW5kLCBoYW5kbGVyc0J5TW9kZS5nZXQoTW9kZS5Xb3Jrc3BhY2VMaXN0KV0sXG4gICAgICAgIFtzZXR0aW5ncy5oZWFkaW5nc0xpc3RDb21tYW5kLCBoYW5kbGVyc0J5TW9kZS5nZXQoTW9kZS5IZWFkaW5nc0xpc3QpXSxcbiAgICAgICAgW3NldHRpbmdzLnN0YXJyZWRMaXN0Q29tbWFuZCwgaGFuZGxlcnNCeU1vZGUuZ2V0KE1vZGUuU3RhcnJlZExpc3QpXSxcbiAgICAgICAgW3NldHRpbmdzLmNvbW1hbmRMaXN0Q29tbWFuZCwgaGFuZGxlcnNCeU1vZGUuZ2V0KE1vZGUuQ29tbWFuZExpc3QpXSxcbiAgICAgICAgW3NldHRpbmdzLnN5bWJvbExpc3RDb21tYW5kLCBoYW5kbGVyc0J5TW9kZS5nZXQoTW9kZS5TeW1ib2xMaXN0KV0sXG4gICAgICAgIFtzZXR0aW5ncy5yZWxhdGVkSXRlbXNMaXN0Q29tbWFuZCwgaGFuZGxlcnNCeU1vZGUuZ2V0KE1vZGUuUmVsYXRlZEl0ZW1zTGlzdCldLFxuICAgICAgXSk7XG5cbiAgICAgIGhhbmRsZXIgPSBoYW5kbGVyc0J5Q29tbWFuZC5nZXQoa2luZCk7XG4gICAgfVxuXG4gICAgcmV0dXJuIGhhbmRsZXI7XG4gIH1cbn1cbiIsImltcG9ydCB7IEFueVN1Z2dlc3Rpb24sIE1vZGUsIFN3aXRjaGVyUGx1cyB9IGZyb20gJ3NyYy90eXBlcyc7XG5pbXBvcnQge1xuICBTY29wZSxcbiAgS2V5bWFwQ29udGV4dCxcbiAgQ2hvb3NlcixcbiAgTW9kaWZpZXIsXG4gIEtleW1hcEV2ZW50SGFuZGxlcixcbiAgS2V5bWFwSW5mbyxcbiAgSW5zdHJ1Y3Rpb24sXG4gIFBsYXRmb3JtLFxufSBmcm9tICdvYnNpZGlhbic7XG5cbnR5cGUgQ3VzdG9tS2V5bWFwSW5mbyA9IE9taXQ8S2V5bWFwRXZlbnRIYW5kbGVyLCAnc2NvcGUnPiAmXG4gIEtleW1hcEluZm8gJlxuICBJbnN0cnVjdGlvbiAmIHsgaXNJbnN0cnVjdGlvbk9ubHk/OiBib29sZWFuOyBtb2Rlcz86IE1vZGVbXSB9O1xuXG5leHBvcnQgY2xhc3MgU3dpdGNoZXJQbHVzS2V5bWFwIHtcbiAgcmVhZG9ubHkgc3RhbmRhcmRLZXlzSW5mbzogS2V5bWFwSW5mb1tdID0gW107XG4gIHJlYWRvbmx5IGN1c3RvbUtleXNJbmZvOiBDdXN0b21LZXltYXBJbmZvW10gPSBbXTtcbiAgcHJpdmF0ZSBfaXNPcGVuOiBib29sZWFuO1xuICBwcml2YXRlIHJlYWRvbmx5IHNhdmVkU3RhbmRhcmRLZXlzSW5mbzogS2V5bWFwRXZlbnRIYW5kbGVyW10gPSBbXTtcbiAgcHJpdmF0ZSBzdGFuZGFyZEluc3RydWN0aW9uc0VsU2VsZWN0b3IgPSAnLnByb21wdC1pbnN0cnVjdGlvbnMnO1xuICBwcml2YXRlIHN0YW5kYXJkSW5zdHJ1Y3Rpb25zRWxEYXRhVmFsdWUgPSAnc3RhbmRhcmQnO1xuXG4gIGdldCBpc09wZW4oKTogYm9vbGVhbiB7XG4gICAgcmV0dXJuIHRoaXMuX2lzT3BlbjtcbiAgfVxuXG4gIHNldCBpc09wZW4odmFsdWU6IGJvb2xlYW4pIHtcbiAgICB0aGlzLl9pc09wZW4gPSB2YWx1ZTtcbiAgfVxuXG4gIGNvbnN0cnVjdG9yKFxuICAgIHB1YmxpYyByZWFkb25seSBzY29wZTogU2NvcGUsXG4gICAgcHJpdmF0ZSBjaG9vc2VyOiBDaG9vc2VyPEFueVN1Z2dlc3Rpb24+LFxuICAgIHByaXZhdGUgbW9kYWw6IFN3aXRjaGVyUGx1cyxcbiAgKSB7XG4gICAgdGhpcy5pbml0S2V5c0luZm8oKTtcbiAgICB0aGlzLnJlZ2lzdGVyTmF2aWdhdGlvbkJpbmRpbmdzKHNjb3BlKTtcbiAgICB0aGlzLmFkZERhdGFBdHRyVG9JbnN0cnVjdGlvbnNFbChcbiAgICAgIG1vZGFsLmNvbnRhaW5lckVsLFxuICAgICAgdGhpcy5zdGFuZGFyZEluc3RydWN0aW9uc0VsU2VsZWN0b3IsXG4gICAgICB0aGlzLnN0YW5kYXJkSW5zdHJ1Y3Rpb25zRWxEYXRhVmFsdWUsXG4gICAgKTtcbiAgfVxuXG4gIGluaXRLZXlzSW5mbygpOiB2b2lkIHtcbiAgICBjb25zdCBjdXN0b21GaWxlQmFzZWRNb2RlcyA9IFtcbiAgICAgIE1vZGUuRWRpdG9yTGlzdCxcbiAgICAgIE1vZGUuSGVhZGluZ3NMaXN0LFxuICAgICAgTW9kZS5SZWxhdGVkSXRlbXNMaXN0LFxuICAgICAgTW9kZS5TdGFycmVkTGlzdCxcbiAgICAgIE1vZGUuU3ltYm9sTGlzdCxcbiAgICBdO1xuXG4gICAgbGV0IG1vZEtleSA9ICdDdHJsJztcbiAgICBsZXQgbW9kS2V5VGV4dCA9ICdjdHJsJztcblxuICAgIGlmIChQbGF0Zm9ybS5pc01hY09TKSB7XG4gICAgICBtb2RLZXkgPSAnTWV0YSc7XG4gICAgICBtb2RLZXlUZXh0ID0gJ2NtZCc7XG4gICAgfVxuXG4gICAgLy8gc3RhbmRhcmQgbW9kZSBrZXlzIHRoYXQgYXJlIHJlZ2lzdGVyZWQgYnkgZGVmYXVsdCwgYW5kXG4gICAgLy8gc2hvdWxkIGJlIHVucmVnaXN0ZXJlZCBpbiBjdXN0b20gbW9kZXMsIHRoZW4gcmUtcmVnaXN0ZXJlZCBpbiBzdGFuZGFyZCBtb2RlXG4gICAgY29uc3Qgc3RhbmRhcmRLZXlzSW5mbzogS2V5bWFwSW5mb1tdID0gW1xuICAgICAgeyBtb2RpZmllcnM6ICdTaGlmdCcsIGtleTogJ0VudGVyJyB9LFxuICAgICAgeyBtb2RpZmllcnM6IGAke21vZEtleX0sU2hpZnRgLCBrZXk6ICdFbnRlcicgfSxcbiAgICBdO1xuXG4gICAgLy8gY3VzdG9tIG1vZGUga2V5cyB0aGF0IHNob3VsZCBiZSByZWdpc3RlcmVkLCB0aGVuIHVucmVnaXN0ZXJlZCBpbiBzdGFuZGFyZCBtb2RlXG4gICAgLy8gTm90ZTogbW9kaWZpZXJzIHNob3VsZCBiZSBhIGNvbW1hIHNlcGFyYXRlZCBzdHJpbmcgb2YgTW9kaWZpZXJzXG4gICAgY29uc3QgY3VzdG9tS2V5c0luZm86IEN1c3RvbUtleW1hcEluZm9bXSA9IFtcbiAgICAgIHtcbiAgICAgICAgbW9kZXM6IGN1c3RvbUZpbGVCYXNlZE1vZGVzLFxuICAgICAgICBtb2RpZmllcnM6ICdNb2QnLFxuICAgICAgICBrZXk6ICdvJyxcbiAgICAgICAgZnVuYzogdGhpcy51c2VTZWxlY3RlZEl0ZW0uYmluZCh0aGlzKSxcbiAgICAgICAgY29tbWFuZDogYCR7bW9kS2V5VGV4dH0gb2AsXG4gICAgICAgIHB1cnBvc2U6ICdvcGVuIGluIG5ldyB3aW5kb3cnLFxuICAgICAgfSxcbiAgICAgIHtcbiAgICAgICAgaXNJbnN0cnVjdGlvbk9ubHk6IHRydWUsXG4gICAgICAgIG1vZGVzOiBjdXN0b21GaWxlQmFzZWRNb2RlcyxcbiAgICAgICAgbW9kaWZpZXJzOiBudWxsLFxuICAgICAgICBrZXk6IG51bGwsXG4gICAgICAgIGZ1bmM6IG51bGwsXG4gICAgICAgIGNvbW1hbmQ6IGAke21vZEtleVRleHR9IGVudGVyYCxcbiAgICAgICAgcHVycG9zZTogJ29wZW4gaW4gbmV3IHBhbmUnLFxuICAgICAgfSxcbiAgICAgIHtcbiAgICAgICAgaXNJbnN0cnVjdGlvbk9ubHk6IHRydWUsXG4gICAgICAgIG1vZGVzOiBbTW9kZS5Db21tYW5kTGlzdF0sXG4gICAgICAgIG1vZGlmaWVyczogbnVsbCxcbiAgICAgICAga2V5OiBudWxsLFxuICAgICAgICBmdW5jOiBudWxsLFxuICAgICAgICBjb21tYW5kOiBg4oa1YCxcbiAgICAgICAgcHVycG9zZTogJ2V4ZWN1dGUgY29tbWFuZCcsXG4gICAgICB9LFxuICAgICAge1xuICAgICAgICBpc0luc3RydWN0aW9uT25seTogdHJ1ZSxcbiAgICAgICAgbW9kZXM6IFtNb2RlLldvcmtzcGFjZUxpc3RdLFxuICAgICAgICBtb2RpZmllcnM6IG51bGwsXG4gICAgICAgIGtleTogbnVsbCxcbiAgICAgICAgZnVuYzogbnVsbCxcbiAgICAgICAgY29tbWFuZDogYOKGtWAsXG4gICAgICAgIHB1cnBvc2U6ICdvcGVuIHdvcmtzcGFjZScsXG4gICAgICB9LFxuICAgIF07XG5cbiAgICB0aGlzLnN0YW5kYXJkS2V5c0luZm8ucHVzaCguLi5zdGFuZGFyZEtleXNJbmZvKTtcbiAgICB0aGlzLmN1c3RvbUtleXNJbmZvLnB1c2goLi4uY3VzdG9tS2V5c0luZm8pO1xuICB9XG5cbiAgcmVnaXN0ZXJOYXZpZ2F0aW9uQmluZGluZ3Moc2NvcGU6IFNjb3BlKTogdm9pZCB7XG4gICAgY29uc3Qga2V5czogW01vZGlmaWVyW10sIHN0cmluZ11bXSA9IFtcbiAgICAgIFtbJ0N0cmwnXSwgJ24nXSxcbiAgICAgIFtbJ0N0cmwnXSwgJ3AnXSxcbiAgICAgIFtbJ0N0cmwnXSwgJ2onXSxcbiAgICAgIFtbJ0N0cmwnXSwgJ2snXSxcbiAgICBdO1xuXG4gICAga2V5cy5mb3JFYWNoKCh2KSA9PiB7XG4gICAgICBzY29wZS5yZWdpc3Rlcih2WzBdLCB2WzFdLCB0aGlzLm5hdmlnYXRlSXRlbXMuYmluZCh0aGlzKSk7XG4gICAgfSk7XG4gIH1cblxuICB1cGRhdGVLZXltYXBGb3JNb2RlKG1vZGU6IE1vZGUpOiB2b2lkIHtcbiAgICBjb25zdCBpc1N0YW5kYXJkTW9kZSA9IG1vZGUgPT09IE1vZGUuU3RhbmRhcmQ7XG4gICAgY29uc3QgeyBtb2RhbCwgc2NvcGUsIHNhdmVkU3RhbmRhcmRLZXlzSW5mbywgc3RhbmRhcmRLZXlzSW5mbywgY3VzdG9tS2V5c0luZm8gfSA9XG4gICAgICB0aGlzO1xuXG4gICAgaWYgKGlzU3RhbmRhcmRNb2RlKSB7XG4gICAgICB0aGlzLnJlZ2lzdGVyS2V5cyhzY29wZSwgc2F2ZWRTdGFuZGFyZEtleXNJbmZvKTtcbiAgICAgIHNhdmVkU3RhbmRhcmRLZXlzSW5mby5sZW5ndGggPSAwO1xuXG4gICAgICB0aGlzLnVucmVnaXN0ZXJLZXlzKHNjb3BlLCBjdXN0b21LZXlzSW5mbyk7XG4gICAgICB0aGlzLnRvZ2dsZVN0YW5kYXJkSW5zdHJ1Y3Rpb25zKG1vZGFsLmNvbnRhaW5lckVsLCB0cnVlKTtcbiAgICB9IGVsc2Uge1xuICAgICAgY29uc3QgY3VzdG9tS2V5bWFwcyA9IGN1c3RvbUtleXNJbmZvLmZpbHRlcihcbiAgICAgICAgKHYpID0+IHYubW9kZXM/LmluY2x1ZGVzKG1vZGUpICYmICF2LmlzSW5zdHJ1Y3Rpb25Pbmx5LFxuICAgICAgKTtcblxuICAgICAgY29uc3Qgc3RhbmRhcmRLZXltYXBzID0gdGhpcy51bnJlZ2lzdGVyS2V5cyhzY29wZSwgc3RhbmRhcmRLZXlzSW5mbyk7XG4gICAgICBpZiAoc3RhbmRhcmRLZXltYXBzLmxlbmd0aCkge1xuICAgICAgICBzYXZlZFN0YW5kYXJkS2V5c0luZm8uY29uY2F0KHN0YW5kYXJkS2V5bWFwcyk7XG4gICAgICB9XG5cbiAgICAgIHRoaXMudW5yZWdpc3RlcktleXMoc2NvcGUsIGN1c3RvbUtleXNJbmZvKTtcbiAgICAgIHRoaXMucmVnaXN0ZXJLZXlzKHNjb3BlLCBjdXN0b21LZXltYXBzKTtcbiAgICAgIHRoaXMuc2hvd0N1c3RvbUluc3RydWN0aW9ucyhtb2RhbCwgY3VzdG9tS2V5c0luZm8sIG1vZGUpO1xuICAgIH1cbiAgfVxuXG4gIHJlZ2lzdGVyS2V5cyhzY29wZTogU2NvcGUsIGtleW1hcHM6IE9taXQ8S2V5bWFwRXZlbnRIYW5kbGVyLCAnc2NvcGUnPltdKTogdm9pZCB7XG4gICAga2V5bWFwcy5mb3JFYWNoKChrZXltYXApID0+IHtcbiAgICAgIGNvbnN0IG1vZGlmaWVycyA9IGtleW1hcC5tb2RpZmllcnMuc3BsaXQoJywnKSBhcyBNb2RpZmllcltdO1xuICAgICAgc2NvcGUucmVnaXN0ZXIobW9kaWZpZXJzLCBrZXltYXAua2V5LCBrZXltYXAuZnVuYyk7XG4gICAgfSk7XG4gIH1cblxuICB1bnJlZ2lzdGVyS2V5cyhzY29wZTogU2NvcGUsIGtleUluZm86IEtleW1hcEluZm9bXSk6IEtleW1hcEV2ZW50SGFuZGxlcltdIHtcbiAgICBjb25zdCBwcmVkaWNhdGUgPSAoa2V5bWFwOiBLZXltYXBFdmVudEhhbmRsZXIpOiBrZXltYXAgaXMgS2V5bWFwRXZlbnRIYW5kbGVyID0+IHtcbiAgICAgIHJldHVybiBrZXlJbmZvLnNvbWUoKGtJbmZvKSA9PiB7XG4gICAgICAgIGNvbnN0IGlzTWF0Y2ggPSBrSW5mby5tb2RpZmllcnMgPT09IGtleW1hcC5tb2RpZmllcnMgJiYga0luZm8ua2V5ID09PSBrZXltYXAua2V5O1xuXG4gICAgICAgIGlmIChpc01hdGNoKSB7XG4gICAgICAgICAgc2NvcGUudW5yZWdpc3RlcihrZXltYXApO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIGlzTWF0Y2g7XG4gICAgICB9KTtcbiAgICB9O1xuXG4gICAgcmV0dXJuIHNjb3BlLmtleXMuZmlsdGVyKHByZWRpY2F0ZSk7XG4gIH1cblxuICBhZGREYXRhQXR0clRvSW5zdHJ1Y3Rpb25zRWwoXG4gICAgY29udGFpbmVyRWw6IEhUTUxFbGVtZW50LFxuICAgIHNlbGVjdG9yOiBzdHJpbmcsXG4gICAgdmFsdWU6IHN0cmluZyxcbiAgKTogSFRNTEVsZW1lbnQge1xuICAgIGNvbnN0IGVsID0gY29udGFpbmVyRWwucXVlcnlTZWxlY3RvcjxIVE1MRWxlbWVudD4oc2VsZWN0b3IpO1xuICAgIGVsPy5zZXRBdHRyaWJ1dGUoJ2RhdGEtbW9kZScsIHZhbHVlKTtcblxuICAgIHJldHVybiBlbDtcbiAgfVxuXG4gIGNsZWFyQ3VzdG9tSW5zdHJ1Y3Rpb25zKGNvbnRhaW5lckVsOiBIVE1MRWxlbWVudCk6IHZvaWQge1xuICAgIGNvbnN0IHsgc3RhbmRhcmRJbnN0cnVjdGlvbnNFbFNlbGVjdG9yLCBzdGFuZGFyZEluc3RydWN0aW9uc0VsRGF0YVZhbHVlIH0gPSB0aGlzO1xuICAgIGNvbnN0IHNlbGVjdG9yID0gYCR7c3RhbmRhcmRJbnN0cnVjdGlvbnNFbFNlbGVjdG9yfTpub3QoW2RhdGEtbW9kZT1cIiR7c3RhbmRhcmRJbnN0cnVjdGlvbnNFbERhdGFWYWx1ZX1cIl0pYDtcbiAgICBjb25zdCBlbGVtZW50cyA9IGNvbnRhaW5lckVsLnF1ZXJ5U2VsZWN0b3JBbGw8SFRNTEVsZW1lbnQ+KHNlbGVjdG9yKTtcblxuICAgIGVsZW1lbnRzLmZvckVhY2goKGVsKSA9PiBlbC5yZW1vdmUoKSk7XG4gIH1cblxuICB0b2dnbGVTdGFuZGFyZEluc3RydWN0aW9ucyhjb250YWluZXJFbDogSFRNTEVsZW1lbnQsIHNob3VsZFNob3c6IGJvb2xlYW4pOiB2b2lkIHtcbiAgICBjb25zdCB7IHN0YW5kYXJkSW5zdHJ1Y3Rpb25zRWxTZWxlY3RvciB9ID0gdGhpcztcbiAgICBsZXQgZGlzcGxheVZhbHVlID0gJ25vbmUnO1xuXG4gICAgaWYgKHNob3VsZFNob3cpIHtcbiAgICAgIGRpc3BsYXlWYWx1ZSA9ICcnO1xuICAgICAgdGhpcy5jbGVhckN1c3RvbUluc3RydWN0aW9ucyhjb250YWluZXJFbCk7XG4gICAgfVxuXG4gICAgY29uc3QgZWwgPSBjb250YWluZXJFbC5xdWVyeVNlbGVjdG9yPEhUTUxFbGVtZW50PihzdGFuZGFyZEluc3RydWN0aW9uc0VsU2VsZWN0b3IpO1xuICAgIGlmIChlbCkge1xuICAgICAgZWwuc3R5bGUuZGlzcGxheSA9IGRpc3BsYXlWYWx1ZTtcbiAgICB9XG4gIH1cblxuICBzaG93Q3VzdG9tSW5zdHJ1Y3Rpb25zKFxuICAgIG1vZGFsOiBTd2l0Y2hlclBsdXMsXG4gICAga2V5bWFwSW5mbzogQ3VzdG9tS2V5bWFwSW5mb1tdLFxuICAgIG1vZGU6IE1vZGUsXG4gICk6IHZvaWQge1xuICAgIGNvbnN0IHsgY29udGFpbmVyRWwgfSA9IG1vZGFsO1xuICAgIGNvbnN0IGtleW1hcHMgPSBrZXltYXBJbmZvLmZpbHRlcigoa2V5bWFwKSA9PiBrZXltYXAubW9kZXM/LmluY2x1ZGVzKG1vZGUpKTtcblxuICAgIHRoaXMudG9nZ2xlU3RhbmRhcmRJbnN0cnVjdGlvbnMoY29udGFpbmVyRWwsIGZhbHNlKTtcbiAgICB0aGlzLmNsZWFyQ3VzdG9tSW5zdHJ1Y3Rpb25zKGNvbnRhaW5lckVsKTtcbiAgICBtb2RhbC5zZXRJbnN0cnVjdGlvbnMoa2V5bWFwcyk7XG4gIH1cblxuICB1c2VTZWxlY3RlZEl0ZW0oZXZ0OiBLZXlib2FyZEV2ZW50LCBfY3R4OiBLZXltYXBDb250ZXh0KTogYm9vbGVhbiB8IHZvaWQge1xuICAgIHRoaXMuY2hvb3Nlci51c2VTZWxlY3RlZEl0ZW0oZXZ0KTtcbiAgfVxuXG4gIHByaXZhdGUgbmF2aWdhdGVJdGVtcyhfZXZ0OiBLZXlib2FyZEV2ZW50LCBjdHg6IEtleW1hcENvbnRleHQpOiBib29sZWFuIHwgdm9pZCB7XG4gICAgY29uc3QgeyBpc09wZW4sIGNob29zZXIgfSA9IHRoaXM7XG5cbiAgICBpZiAoaXNPcGVuKSB7XG4gICAgICBjb25zdCBuZXh0S2V5cyA9IFsnbicsICdqJ107XG5cbiAgICAgIGxldCBpbmRleCA9IGNob29zZXIuc2VsZWN0ZWRJdGVtO1xuICAgICAgaW5kZXggPSBuZXh0S2V5cy5pbmNsdWRlcyhjdHgua2V5KSA/ICsraW5kZXggOiAtLWluZGV4O1xuICAgICAgY2hvb3Nlci5zZXRTZWxlY3RlZEl0ZW0oaW5kZXgsIHRydWUpO1xuICAgIH1cblxuICAgIHJldHVybiBmYWxzZTtcbiAgfVxufVxuIiwiaW1wb3J0IHsgU3dpdGNoZXJQbHVzS2V5bWFwIH0gZnJvbSAnLi9zd2l0Y2hlclBsdXNLZXltYXAnO1xuaW1wb3J0IHsgZ2V0U3lzdGVtU3dpdGNoZXJJbnN0YW5jZSB9IGZyb20gJ3NyYy91dGlscyc7XG5pbXBvcnQgeyBNb2RlSGFuZGxlciB9IGZyb20gJy4vbW9kZUhhbmRsZXInO1xuaW1wb3J0IFN3aXRjaGVyUGx1c1BsdWdpbiBmcm9tICdzcmMvbWFpbic7XG5pbXBvcnQgeyBBcHAsIFF1aWNrU3dpdGNoZXJPcHRpb25zIH0gZnJvbSAnb2JzaWRpYW4nO1xuaW1wb3J0IHsgU3lzdGVtU3dpdGNoZXIsIFN3aXRjaGVyUGx1cywgQW55U3VnZ2VzdGlvbiwgTW9kZSB9IGZyb20gJ3NyYy90eXBlcyc7XG5cbmludGVyZmFjZSBTeXN0ZW1Td2l0Y2hlckNvbnN0cnVjdG9yIGV4dGVuZHMgU3lzdGVtU3dpdGNoZXIge1xuICBuZXcgKGFwcDogQXBwLCBidWlsdEluT3B0aW9uczogUXVpY2tTd2l0Y2hlck9wdGlvbnMpOiBTeXN0ZW1Td2l0Y2hlcjtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGNyZWF0ZVN3aXRjaGVyUGx1cyhhcHA6IEFwcCwgcGx1Z2luOiBTd2l0Y2hlclBsdXNQbHVnaW4pOiBTd2l0Y2hlclBsdXMge1xuICBjb25zdCBTeXN0ZW1Td2l0Y2hlck1vZGFsID0gZ2V0U3lzdGVtU3dpdGNoZXJJbnN0YW5jZShhcHApXG4gICAgPy5RdWlja1N3aXRjaGVyTW9kYWwgYXMgU3lzdGVtU3dpdGNoZXJDb25zdHJ1Y3RvcjtcblxuICBpZiAoIVN5c3RlbVN3aXRjaGVyTW9kYWwpIHtcbiAgICBjb25zb2xlLmxvZyhcbiAgICAgICdTd2l0Y2hlcisrOiB1bmFibGUgdG8gZXh0ZW5kIHN5c3RlbSBzd2l0Y2hlci4gUGx1Z2luIFVJIHdpbGwgbm90IGJlIGxvYWRlZC4gVXNlIHRoZSBidWlsdGluIHN3aXRjaGVyIGluc3RlYWQuJyxcbiAgICApO1xuICAgIHJldHVybiBudWxsO1xuICB9XG5cbiAgY29uc3QgU3dpdGNoZXJQbHVzTW9kYWwgPSBjbGFzcyBleHRlbmRzIFN5c3RlbVN3aXRjaGVyTW9kYWwgaW1wbGVtZW50cyBTd2l0Y2hlclBsdXMge1xuICAgIHByaXZhdGUgZXhNb2RlOiBNb2RlSGFuZGxlcjtcblxuICAgIGNvbnN0cnVjdG9yKGFwcDogQXBwLCBwdWJsaWMgcGx1Z2luOiBTd2l0Y2hlclBsdXNQbHVnaW4pIHtcbiAgICAgIHN1cGVyKGFwcCwgcGx1Z2luLm9wdGlvbnMuYnVpbHRJblN5c3RlbU9wdGlvbnMpO1xuXG4gICAgICBwbHVnaW4ub3B0aW9ucy5zaG91bGRTaG93QWxpYXMgPSB0aGlzLnNob3VsZFNob3dBbGlhcztcbiAgICAgIGNvbnN0IGV4S2V5bWFwID0gbmV3IFN3aXRjaGVyUGx1c0tleW1hcCh0aGlzLnNjb3BlLCB0aGlzLmNob29zZXIsIHRoaXMpO1xuICAgICAgdGhpcy5leE1vZGUgPSBuZXcgTW9kZUhhbmRsZXIoYXBwLCBwbHVnaW4ub3B0aW9ucywgZXhLZXltYXApO1xuICAgIH1cblxuICAgIG9wZW5Jbk1vZGUobW9kZTogTW9kZSk6IHZvaWQge1xuICAgICAgdGhpcy5leE1vZGUuc2V0U2Vzc2lvbk9wZW5Nb2RlKG1vZGUsIHRoaXMuY2hvb3Nlcik7XG4gICAgICBzdXBlci5vcGVuKCk7XG4gICAgfVxuXG4gICAgb25PcGVuKCk6IHZvaWQge1xuICAgICAgdGhpcy5leE1vZGUub25PcGVuKCk7XG4gICAgICBzdXBlci5vbk9wZW4oKTtcbiAgICB9XG5cbiAgICBvbkNsb3NlKCkge1xuICAgICAgc3VwZXIub25DbG9zZSgpO1xuICAgICAgdGhpcy5leE1vZGUub25DbG9zZSgpO1xuICAgIH1cblxuICAgIHByb3RlY3RlZCB1cGRhdGVTdWdnZXN0aW9ucygpOiB2b2lkIHtcbiAgICAgIGNvbnN0IHsgZXhNb2RlLCBpbnB1dEVsLCBjaG9vc2VyIH0gPSB0aGlzO1xuICAgICAgZXhNb2RlLmluc2VydFNlc3Npb25PcGVuTW9kZUNvbW1hbmRTdHJpbmcoaW5wdXRFbCk7XG5cbiAgICAgIGlmICghZXhNb2RlLnVwZGF0ZVN1Z2dlc3Rpb25zKGlucHV0RWwudmFsdWUsIGNob29zZXIpKSB7XG4gICAgICAgIHN1cGVyLnVwZGF0ZVN1Z2dlc3Rpb25zKCk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgb25DaG9vc2VTdWdnZXN0aW9uKGl0ZW06IEFueVN1Z2dlc3Rpb24sIGV2dDogTW91c2VFdmVudCB8IEtleWJvYXJkRXZlbnQpIHtcbiAgICAgIGlmICghdGhpcy5leE1vZGUub25DaG9vc2VTdWdnZXN0aW9uKGl0ZW0sIGV2dCkpIHtcbiAgICAgICAgc3VwZXIub25DaG9vc2VTdWdnZXN0aW9uKGl0ZW0sIGV2dCk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgcmVuZGVyU3VnZ2VzdGlvbih2YWx1ZTogQW55U3VnZ2VzdGlvbiwgcGFyZW50RWw6IEhUTUxFbGVtZW50KSB7XG4gICAgICBpZiAoIXRoaXMuZXhNb2RlLnJlbmRlclN1Z2dlc3Rpb24odmFsdWUsIHBhcmVudEVsKSkge1xuICAgICAgICBzdXBlci5yZW5kZXJTdWdnZXN0aW9uKHZhbHVlLCBwYXJlbnRFbCk7XG4gICAgICB9XG4gICAgfVxuICB9O1xuXG4gIHJldHVybiBuZXcgU3dpdGNoZXJQbHVzTW9kYWwoYXBwLCBwbHVnaW4pO1xufVxuIiwiaW1wb3J0IHsgUGx1Z2luIH0gZnJvbSAnb2JzaWRpYW4nO1xuaW1wb3J0IHsgU3dpdGNoZXJQbHVzU2V0dGluZ3MsIFN3aXRjaGVyUGx1c1NldHRpbmdUYWIgfSBmcm9tICdzcmMvc2V0dGluZ3MnO1xuaW1wb3J0IHsgY3JlYXRlU3dpdGNoZXJQbHVzIH0gZnJvbSAnc3JjL3N3aXRjaGVyUGx1cyc7XG5pbXBvcnQgeyBNb2RlIH0gZnJvbSAnc3JjL3R5cGVzJztcblxuZXhwb3J0IGRlZmF1bHQgY2xhc3MgU3dpdGNoZXJQbHVzUGx1Z2luIGV4dGVuZHMgUGx1Z2luIHtcbiAgcHVibGljIG9wdGlvbnM6IFN3aXRjaGVyUGx1c1NldHRpbmdzO1xuXG4gIGFzeW5jIG9ubG9hZCgpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBjb25zdCBvcHRpb25zID0gbmV3IFN3aXRjaGVyUGx1c1NldHRpbmdzKHRoaXMpO1xuICAgIGF3YWl0IG9wdGlvbnMubG9hZFNldHRpbmdzKCk7XG4gICAgdGhpcy5vcHRpb25zID0gb3B0aW9ucztcblxuICAgIHRoaXMuYWRkU2V0dGluZ1RhYihuZXcgU3dpdGNoZXJQbHVzU2V0dGluZ1RhYih0aGlzLmFwcCwgdGhpcywgb3B0aW9ucykpO1xuXG4gICAgdGhpcy5yZWdpc3RlckNvbW1hbmQoJ3N3aXRjaGVyLXBsdXM6b3BlbicsICdPcGVuJywgTW9kZS5TdGFuZGFyZCk7XG4gICAgdGhpcy5yZWdpc3RlckNvbW1hbmQoXG4gICAgICAnc3dpdGNoZXItcGx1czpvcGVuLWVkaXRvcnMnLFxuICAgICAgJ09wZW4gaW4gRWRpdG9yIE1vZGUnLFxuICAgICAgTW9kZS5FZGl0b3JMaXN0LFxuICAgICk7XG4gICAgdGhpcy5yZWdpc3RlckNvbW1hbmQoXG4gICAgICAnc3dpdGNoZXItcGx1czpvcGVuLXN5bWJvbHMnLFxuICAgICAgJ09wZW4gaW4gU3ltYm9sIE1vZGUnLFxuICAgICAgTW9kZS5TeW1ib2xMaXN0LFxuICAgICk7XG4gICAgdGhpcy5yZWdpc3RlckNvbW1hbmQoXG4gICAgICAnc3dpdGNoZXItcGx1czpvcGVuLXdvcmtzcGFjZXMnLFxuICAgICAgJ09wZW4gaW4gV29ya3NwYWNlcyBNb2RlJyxcbiAgICAgIE1vZGUuV29ya3NwYWNlTGlzdCxcbiAgICApO1xuICAgIHRoaXMucmVnaXN0ZXJDb21tYW5kKFxuICAgICAgJ3N3aXRjaGVyLXBsdXM6b3Blbi1oZWFkaW5ncycsXG4gICAgICAnT3BlbiBpbiBIZWFkaW5ncyBNb2RlJyxcbiAgICAgIE1vZGUuSGVhZGluZ3NMaXN0LFxuICAgICk7XG4gICAgdGhpcy5yZWdpc3RlckNvbW1hbmQoXG4gICAgICAnc3dpdGNoZXItcGx1czpvcGVuLXN0YXJyZWQnLFxuICAgICAgJ09wZW4gaW4gU3RhcnJlZCBNb2RlJyxcbiAgICAgIE1vZGUuU3RhcnJlZExpc3QsXG4gICAgKTtcbiAgICB0aGlzLnJlZ2lzdGVyQ29tbWFuZChcbiAgICAgICdzd2l0Y2hlci1wbHVzOm9wZW4tY29tbWFuZHMnLFxuICAgICAgJ09wZW4gaW4gQ29tbWFuZHMgTW9kZScsXG4gICAgICBNb2RlLkNvbW1hbmRMaXN0LFxuICAgICk7XG5cbiAgICB0aGlzLnJlZ2lzdGVyQ29tbWFuZChcbiAgICAgICdzd2l0Y2hlci1wbHVzOm9wZW4tcmVsYXRlZC1pdGVtcycsXG4gICAgICAnT3BlbiBpbiBSZWxhdGVkIEl0ZW1zIE1vZGUnLFxuICAgICAgTW9kZS5SZWxhdGVkSXRlbXNMaXN0LFxuICAgICk7XG4gIH1cblxuICByZWdpc3RlckNvbW1hbmQoaWQ6IHN0cmluZywgbmFtZTogc3RyaW5nLCBtb2RlOiBNb2RlKTogdm9pZCB7XG4gICAgdGhpcy5hZGRDb21tYW5kKHtcbiAgICAgIGlkLFxuICAgICAgbmFtZSxcbiAgICAgIGhvdGtleXM6IFtdLFxuICAgICAgY2hlY2tDYWxsYmFjazogKGNoZWNraW5nKSA9PiB7XG4gICAgICAgIC8vIG1vZGFsIG5lZWRzIHRvIGJlIGNyZWF0ZWQgZHluYW1pY2FsbHkgKHNhbWUgYXMgc3lzdGVtIHN3aXRjaGVyKVxuICAgICAgICAvLyBhcyBzeXN0ZW0gb3B0aW9ucyBhcmUgZXZhbHVhdGVkIGluIHRoZSBtb2RhbCBjb25zdHJ1Y3RvclxuICAgICAgICBjb25zdCBtb2RhbCA9IGNyZWF0ZVN3aXRjaGVyUGx1cyh0aGlzLmFwcCwgdGhpcyk7XG4gICAgICAgIGlmIChtb2RhbCkge1xuICAgICAgICAgIGlmICghY2hlY2tpbmcpIHtcbiAgICAgICAgICAgIG1vZGFsLm9wZW5Jbk1vZGUobW9kZSk7XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICB9LFxuICAgIH0pO1xuICB9XG59XG4iXSwibmFtZXMiOlsiU2V0dGluZyIsIk1vZGFsIiwiUGx1Z2luU2V0dGluZ1RhYiIsIlBsYXRmb3JtIiwiS2V5bWFwIiwic2V0SWNvbiIsInJlbmRlclJlc3VsdHMiLCJub3JtYWxpemVQYXRoIiwiZnV6enlTZWFyY2giLCJzb3J0U2VhcmNoUmVzdWx0cyIsInByZXBhcmVRdWVyeSIsImRlYm91bmNlIiwiUGx1Z2luIl0sIm1hcHBpbmdzIjoiOzs7O0FBcUJBLElBQVksb0JBSVgsQ0FBQTtBQUpELENBQUEsVUFBWSxvQkFBb0IsRUFBQTtBQUM5QixJQUFBLG9CQUFBLENBQUEsb0JBQUEsQ0FBQSxtQkFBQSxDQUFBLEdBQUEsQ0FBQSxDQUFBLEdBQUEsbUJBQXFCLENBQUE7QUFDckIsSUFBQSxvQkFBQSxDQUFBLG9CQUFBLENBQUEsU0FBQSxDQUFBLEdBQUEsQ0FBQSxDQUFBLEdBQUEsU0FBTyxDQUFBO0FBQ1AsSUFBQSxvQkFBQSxDQUFBLG9CQUFBLENBQUEsWUFBQSxDQUFBLEdBQUEsQ0FBQSxDQUFBLEdBQUEsWUFBVSxDQUFBO0FBQ1osQ0FBQyxFQUpXLG9CQUFvQixLQUFwQixvQkFBb0IsR0FJ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
