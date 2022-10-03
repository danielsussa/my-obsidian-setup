import { AnySuggestion, Mode, SwitcherPlus } from 'src/types';
import {
  Scope,
  KeymapContext,
  Chooser,
  Modifier,
  KeymapEventHandler,
  KeymapInfo,
  Instruction,
  Platform,
} from 'obsidian';

type CustomKeymapInfo = Omit<KeymapEventHandler, 'scope'> &
  KeymapInfo &
  Instruction & { isInstructionOnly?: boolean; modes?: Mode[] };

export class SwitcherPlusKeymap {
  readonly standardKeysInfo: KeymapInfo[] = [];
  readonly customKeysInfo: CustomKeymapInfo[] = [];
  private _isOpen: boolean;
  private readonly savedStandardKeysInfo: KeymapEventHandler[] = [];
  private standardInstructionsElSelector = '.prompt-instructions';
  private standardInstructionsElDataValue = 'standard';

  get isOpen(): boolean {
    return this._isOpen;
  }

  set isOpen(value: boolean) {
    this._isOpen = value;
  }

  constructor(
    public readonly scope: Scope,
    private chooser: Chooser<AnySuggestion>,
    private modal: SwitcherPlus,
  ) {
    this.initKeysInfo();
    this.registerNavigationBindings(scope);
    this.addDataAttrToInstructionsEl(
      modal.containerEl,
      this.standardInstructionsElSelector,
      this.standardInstructionsElDataValue,
    );
  }

  initKeysInfo(): void {
    const customFileBasedModes = [
      Mode.EditorList,
      Mode.HeadingsList,
      Mode.RelatedItemsList,
      Mode.StarredList,
      Mode.SymbolList,
    ];

    let modKey = 'Ctrl';
    let modKeyText = 'ctrl';

    if (Platform.isMacOS) {
      modKey = 'Meta';
      modKeyText = 'cmd';
    }

    // standard mode keys that are registered by default, and
    // should be unregistered in custom modes, then re-registered in standard mode
    const standardKeysInfo: KeymapInfo[] = [
      { modifiers: 'Shift', key: 'Enter' },
      { modifiers: `${modKey},Shift`, key: 'Enter' },
    ];

    // custom mode keys that should be registered, then unregistered in standard mode
    // Note: modifiers should be a comma separated string of Modifiers
    const customKeysInfo: CustomKeymapInfo[] = [
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

  registerNavigationBindings(scope: Scope): void {
    const keys: [Modifier[], string][] = [
      [['Ctrl'], 'n'],
      [['Ctrl'], 'p'],
      [['Ctrl'], 'j'],
      [['Ctrl'], 'k'],
    ];

    keys.forEach((v) => {
      scope.register(v[0], v[1], this.navigateItems.bind(this));
    });
  }

  updateKeymapForMode(mode: Mode): void {
    const isStandardMode = mode === Mode.Standard;
    const { modal, scope, savedStandardKeysInfo, standardKeysInfo, customKeysInfo } =
      this;

    if (isStandardMode) {
      this.registerKeys(scope, savedStandardKeysInfo);
      savedStandardKeysInfo.length = 0;

      this.unregisterKeys(scope, customKeysInfo);
      this.toggleStandardInstructions(modal.containerEl, true);
    } else {
      const customKeymaps = customKeysInfo.filter(
        (v) => v.modes?.includes(mode) && !v.isInstructionOnly,
      );

      const standardKeymaps = this.unregisterKeys(scope, standardKeysInfo);
      if (standardKeymaps.length) {
        savedStandardKeysInfo.concat(standardKeymaps);
      }

      this.unregisterKeys(scope, customKeysInfo);
      this.registerKeys(scope, customKeymaps);
      this.showCustomInstructions(modal, customKeysInfo, mode);
    }
  }

  registerKeys(scope: Scope, keymaps: Omit<KeymapEventHandler, 'scope'>[]): void {
    keymaps.forEach((keymap) => {
      const modifiers = keymap.modifiers.split(',') as Modifier[];
      scope.register(modifiers, keymap.key, keymap.func);
    });
  }

  unregisterKeys(scope: Scope, keyInfo: KeymapInfo[]): KeymapEventHandler[] {
    const predicate = (keymap: KeymapEventHandler): keymap is KeymapEventHandler => {
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

  addDataAttrToInstructionsEl(
    containerEl: HTMLElement,
    selector: string,
    value: string,
  ): HTMLElement {
    const el = containerEl.querySelector<HTMLElement>(selector);
    el?.setAttribute('data-mode', value);

    return el;
  }

  clearCustomInstructions(containerEl: HTMLElement): void {
    const { standardInstructionsElSelector, standardInstructionsElDataValue } = this;
    const selector = `${standardInstructionsElSelector}:not([data-mode="${standardInstructionsElDataValue}"])`;
    const elements = containerEl.querySelectorAll<HTMLElement>(selector);

    elements.forEach((el) => el.remove());
  }

  toggleStandardInstructions(containerEl: HTMLElement, shouldShow: boolean): void {
    const { standardInstructionsElSelector } = this;
    let displayValue = 'none';

    if (shouldShow) {
      displayValue = '';
      this.clearCustomInstructions(containerEl);
    }

    const el = containerEl.querySelector<HTMLElement>(standardInstructionsElSelector);
    if (el) {
      el.style.display = displayValue;
    }
  }

  showCustomInstructions(
    modal: SwitcherPlus,
    keymapInfo: CustomKeymapInfo[],
    mode: Mode,
  ): void {
    const { containerEl } = modal;
    const keymaps = keymapInfo.filter((keymap) => keymap.modes?.includes(mode));

    this.toggleStandardInstructions(containerEl, false);
    this.clearCustomInstructions(containerEl);
    modal.setInstructions(keymaps);
  }

  useSelectedItem(evt: KeyboardEvent, _ctx: KeymapContext): boolean | void {
    this.chooser.useSelectedItem(evt);
  }

  private navigateItems(_evt: KeyboardEvent, ctx: KeymapContext): boolean | void {
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
