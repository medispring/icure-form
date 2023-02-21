import { CSSResultGroup, html, LitElement, TemplateResult } from 'lit'
import { property, state } from 'lit/decorators'

import '../../iqr-text-field'
// @ts-ignore
import baseCss from '../../iqr-text-field/styles/style.scss'
// @ts-ignore
import kendoCss from '../../iqr-text-field/styles/kendo.scss'
import { Schema, DOMParser } from 'prosemirror-model'
import { EditorView } from 'prosemirror-view'
import { EditorState, Plugin, Transaction } from 'prosemirror-state'
import { Suggestion, VersionedValue } from '../../iqr-text-field'
import { history, redo, undo } from 'prosemirror-history'
import { versionPicto } from '../../iqr-text-field/styles/paths'
import { keymap } from 'prosemirror-keymap'
import { hasContentClassPlugin } from '../../iqr-text-field/plugin/has-content-class-plugin'
import { Keymap } from 'prosemirror-commands'
import { getDropdownSpec } from '../../iqr-text-field/schema/dropdown-schema'
import { schema } from 'prosemirror-schema-basic'

export class DropdownField extends LitElement {
	@property() label = ''
	@property() labelPosition: 'float' | 'side' | 'above' | 'hidden' = 'float'

	@property() options?: Suggestion[] = []

	@property() placeholder = ''

	//@property() schema: IqrTextFieldSchema = 'dropdown'

	@property() optionProvider: (terms: string[], limit: number) => Promise<Suggestion[]> = async () => this.options || []

	@property() valueProvider?: () => VersionedValue | undefined = undefined

	@property({ type: String }) value = ''

	@property({ type: Boolean }) isMultipleChoice = false

	@property({ type: Boolean }) preload = true

	@property({ type: Number }) limitResultProvider = 0

	@state() protected displayMenu = false

	private container?: HTMLElement

	private proseMirrorSchema

	private view?: EditorView

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
		const tr = state.tr
		if (!this.isMultipleChoice) {
			tr.delete(0, state.doc.nodeSize - 2)
		}
		tr.insertText(this.options?.find((x) => x.id === id)?.text || '')
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
				<label class="iqr-label ${this.labelPosition}"><span>${this.label}</span></label>
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

		this.proseMirrorSchema = new Schema({
			nodes: Object.assign(getDropdownSpec(), schema.spec.nodes),
			marks: schema.spec.marks,
		})
		this.container = this.shadowRoot?.getElementById('editor') || undefined

		const keyMapOptions = this.constructKeyMap()

		if (this.container) {
			this.view = new EditorView(this.container, {
				state: EditorState.create({
					schema: this.proseMirrorSchema,
					doc: DOMParser.fromSchema(this.proseMirrorSchema).parse(this.container),
					plugins: [
						history(),
						keymap({ 'Mod-z': undo, 'Mod-y': redo }),
						this.options ? keymap(keyMapOptions) : null,
						hasContentClassPlugin(this.shadowRoot || undefined),
						/*this.optionsProvider
							? new Plugin({
								view(editorView) {
									component.optionsProvider
								}
							})
							: null,*/
					]
						.filter((x) => !!x)
						.map((x) => x as Plugin),
				}),
			})
		}
	}
}

customElements.define('iqr-form-dropdown-field', DropdownField)
