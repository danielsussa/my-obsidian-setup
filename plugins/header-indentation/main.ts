import { App, Plugin, PluginSettingTab, Setting } from 'obsidian';
import {
	Decoration,
	DecorationSet,
	EditorView,
	ViewPlugin,
	ViewUpdate,
} from "@codemirror/view";
import {RangeSetBuilder} from "@codemirror/state";
// @ts-ignore

interface MyPluginSettings {
	mySetting: string;
}


const indentHeading = ViewPlugin.fromClass(class {
	decorations: DecorationSet

	constructor(view: EditorView) {
		this.decorations = indentHeadingExec(view)
	}

	update(update: ViewUpdate) {
		this.decorations = indentHeadingExec(update.view)
	}
}, {
	decorations: v => v.decorations,

})

function indentHeadingExec(view: EditorView) {

	const builder = new RangeSetBuilder<Decoration>()

	let currClass = "cm-line-child-p"

	for (const {from, to} of view.visibleRanges) {
		for (let pos = 0; pos <= to;) {

			const lineText = view.state.doc.lineAt(pos)
			pos = lineText.to + 1

			if (lineText.text.startsWith("###### ")) {
				currClass = "cm-line-child-h6"
				continue
			}
			if (lineText.text.startsWith("##### ")) {
				currClass = "cm-line-child-h5"
				continue
			}
			if (lineText.text.startsWith("#### ")) {
				currClass = "cm-line-child-h4"
				continue
			}
			if (lineText.text.startsWith("### ")) {
				currClass = "cm-line-child-h3"
				continue
			}
			if (lineText.text.startsWith("## ")) {
				currClass = "cm-line-child-h2"
				continue
			}
			if (lineText.text.startsWith("# ")) {
				currClass = "cm-line-child-h1"
				continue
			}

			builder.add(lineText.from, lineText.from, Decoration.line({
				attributes: {class: currClass}
			}))

		}
	}
	return builder.finish()
}

export default class MyPlugin extends Plugin {
	async onload() {
		this.registerEditorExtension(indentHeading)
	}

	onunload() {
	}

}
