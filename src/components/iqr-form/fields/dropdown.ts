import { CSSResultGroup, html, LitElement, TemplateResult } from 'lit'
import { property, state } from 'lit/decorators'

import '../../iqr-text-field'
// @ts-ignore
import baseCss from '../../iqr-text-field/styles/style.scss'
// @ts-ignore
import kendoCss from '../../iqr-text-field/styles/kendo.scss'
import { Schema, DOMParser, Node as ProsemirrorNode } from 'prosemirror-model'
import { EditorView } from 'prosemirror-view'
import { EditorState, Plugin, Transaction } from 'prosemirror-state'
import { LabelPosition, Labels, Suggestion, VersionedValue } from '../../iqr-text-field'
import { history, redo, undo } from 'prosemirror-history'
import { versionPicto } from '../../iqr-text-field/styles/paths'
import { keymap } from 'prosemirror-keymap'
import { hasContentClassPlugin } from '../../iqr-text-field/plugin/has-content-class-plugin'
import { Keymap } from 'prosemirror-commands'

import { getDropdownSpec } from '../../iqr-text-field/schema/dropdown-schema'

// @ts-ignore
const options = [
	{ id: '1', code: '1', text: 'Form 1', terms: ['Form', '1'] },
	{ id: '2', code: '2', text: 'Form 2', terms: ['Form', '2'] },
	{ id: '3', code: '3', text: 'Form 3', terms: ['Form', '3'] },
	{ id: '4', code: '4', text: 'Form 4', terms: ['Form', '4'] },
	{ id: '5', code: '5', text: 'Form 5', terms: ['Form', '5'] },
]

export class DropdownField extends LitElement {
	@property() labels: Labels = {
		[LabelPosition.float]: '',
	}

	@property() options?: Suggestion[] = []

	@property() placeholder = ''

	@property() optionProvider: (terms: string[], limit: number) => Promise<Suggestion[]> = async () => this.options || []

	@property() valueProvider?: () => VersionedValue | undefined = undefined

	@property({ type: String }) value = ''

	@property({ type: Boolean }) isMultipleChoice = false

	@property({ type: Boolean }) preload = true

	@property({ type: Number }) limitResultProvider = 0

	@state() protected displayMenu = false

	private container?: HTMLElement

	private proseMirrorSchema?: Schema

	private view?: EditorView

	private parser?: { parse: (value: string) => ProsemirrorNode }

	static get styles(): CSSResultGroup[] {
		return [baseCss, kendoCss]
	}

	togglePopup(): void {
		this.displayMenu = !this.displayMenu
	}

	handleOptionButtonClicked(id: string): (e: Event) => boolean {
		return (e: Event) => {
			e.preventDefault()
			if (this.view) {
				this.dispatcher(this.view.state, this.view.dispatch, id)
				this.displayMenu = false
				return true
			}
			return false
		}
	}

	public dispatcher(state: EditorState, dispatch: (tr: Transaction) => void, id: string): boolean {
		if (!state || !dispatch) return false
		const selectedOption = this.proseMirrorSchema?.nodes.selectedOption
		if (!selectedOption) return false
		const tr = state.tr
		if (!this.isMultipleChoice) {
			tr.delete(0, state.doc.nodeSize - 2)
		}
		const text = this.options?.find((x) => x.id === id)?.text || ''
		tr.replaceSelectionWith(selectedOption.create())
		tr.insertText(text)
		dispatch(tr)
		return true
	}

	public constructKeyMap(): Keymap {
		return (this.options ?? []).reduce((acc, x, index) => {
			// @ts-ignore
			acc['Shift-' + (index + 1)] = (state, dispatch) => {
				if (state && dispatch) return this.dispatcher(state, dispatch, x.id)
				return false
			}
			return acc
		}, {})
	}

	render(): TemplateResult {
		return html`
			<div id="root" class="iqr-text-field" data-placeholder=${this.placeholder}>
				${Object.keys(this.labels).map((position) => html` <label class="iqr-label ${position}"><span>${this.labels[position]}</span></label> `)}
				<div class="iqr-input">
					<div id="editor"></div>
					<div id="extra" class=${'extra forced'}>
						<div class="buttons-container">
							<div class="menu-container">
								<button @click="${this.togglePopup}" class="btn menu-trigger">${versionPicto}</button>
								${this.displayMenu
									? html`
											<div id="menu" class="menu">
												${this.options?.map((x) => html`<button @click="${this.handleOptionButtonClicked(x.id)}" id="${x.id}" class="item">${x.text}</button>`)}
											</div>
									  `
									: ''}
							</div>
						</div>
					</div>
				</div>
			</div>
		`
	}

	public async firstUpdated(): Promise<void> {
		if (this.preload && (this.options === undefined || this.options.length === 0)) {
			this.options = await this.optionProvider([''], this.limitResultProvider)
		}

		this.proseMirrorSchema = new Schema(getDropdownSpec())
		this.parser = this.makeParser(this.proseMirrorSchema)

		this.container = this.shadowRoot?.getElementById('editor') || undefined

		const keyMapOptions = this.constructKeyMap()

		const parsedDoc = this.parser.parse(this.value)
		if (this.container) {
			this.view = new EditorView(this.container, {
				state: EditorState.create({
					schema: this.proseMirrorSchema,
					doc: this.value && parsedDoc ? parsedDoc : DOMParser.fromSchema(this.proseMirrorSchema).parse(this.container),
					plugins: [history(), keymap({ 'Mod-z': undo, 'Mod-y': redo }), this.options ? keymap(keyMapOptions) : null, hasContentClassPlugin(this.shadowRoot || undefined)]
						.filter((x) => !!x)
						.map((x) => x as Plugin),
				}),
			})
		}
	}

	public makeParser(schema: Schema) {
		return {
			parse: (value: string) => {
				return schema.node('paragraph', {}, value ? [schema.node('selectedOptionGroup', {}, [schema.node('selectedOption', {}, [schema.text(value)])])] : [])
			},
		}
	}
}

customElements.define('iqr-form-dropdown-field', DropdownField)
