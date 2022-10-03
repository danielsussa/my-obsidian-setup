import {
  EditorSettingsTabSection,
  SettingsTabSection,
  SwitcherPlusSettings,
} from 'src/settings';
import { mock, MockProxy } from 'jest-mock-extended';
import { App, PluginSettingTab, ViewRegistry } from 'obsidian';

describe('editorSettingsTabSection', () => {
  let mockApp: MockProxy<App>;
  let mockPluginSettingTab: MockProxy<PluginSettingTab>;
  let config: SwitcherPlusSettings;
  let mockContainerEl: MockProxy<HTMLElement>;
  let sut: EditorSettingsTabSection;

  beforeAll(() => {
    mockApp = mock<App>({ viewRegistry: mock<ViewRegistry>() });
    mockContainerEl = mock<HTMLElement>();
    mockPluginSettingTab = mock<PluginSettingTab>({ containerEl: mockContainerEl });
    config = new SwitcherPlusSettings(null);

    sut = new EditorSettingsTabSection(mockApp, mockPluginSettingTab, config);
  });

  it('should display a header for the section', () => {
    const addSectionTitleSpy = jest.spyOn(
      SettingsTabSection.prototype,
      'addSectionTitle',
    );

    sut.display(mockContainerEl);

    expect(addSectionTitleSpy).toHaveBeenCalledWith(
      mockContainerEl,
      'Editor List Mode Settings',
    );

    addSectionTitleSpy.mockRestore();
  });

  it('should show the mode trigger setting', () => {
    const addTextSettingSpy = jest.spyOn(SettingsTabSection.prototype, 'addTextSetting');

    sut.display(mockContainerEl);

    expect(addTextSettingSpy).toBeCalledWith(
      mockContainerEl,
      'Editor list mode trigger',
      expect.any(String),
      config.editorListCommand,
      'editorListCommand',
      config.editorListPlaceholderText,
    );

    addTextSettingSpy.mockRestore();
  });

  it('should show the includeSidePanelViewTypes setting', () => {
    const addTextAreaSettingSpy = jest.spyOn(
      SettingsTabSection.prototype,
      'addTextAreaSetting',
    );

    sut.display(mockContainerEl);

    expect(addTextAreaSettingSpy).toBeCalledWith(
      mockContainerEl,
      'Include side panel views',
      expect.any(String),
      config.includeSidePanelViewTypes.join('\n'),
      'includeSidePanelViewTypes',
      config.includeSidePanelViewTypesPlaceholder,
    );

    addTextAreaSettingSpy.mockRestore();
  });
});
