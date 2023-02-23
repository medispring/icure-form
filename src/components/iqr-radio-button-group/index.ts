// Import the LitElement base class and html helper function
import { html, LitElement } from 'lit'
import { property, state } from 'lit/decorators'
// @ts-ignore
import baseCss from './styles/style.scss'
// @ts-ignore
import kendoCss from './styles/kendo.scss'
import { Suggestion } from './suggestion-palette'
import { Schema } from 'prosemirror-model'
export { Suggestion } from './suggestion-palette'
import { RadioButtonSchema } from './schema/radio-button-group-schema'
import { createSchema } from './schema'
import { EditorView } from 'prosemirror-view'
import { EditorState } from 'prosemirror-state'
import { schema } from 'prosemirror-schema-basic'
import { MarkdownParser } from 'prosemirror-markdown'
import { Node as ProsemirrorNode } from 'prosemirror-model'

export interface Meta {
	revision: string
	modified?: number
	valueDate?: number | null
	owner?: { id: string; descr?: string } | null
}

export interface Version {
	revision: string
	modified?: number
	value: { [language: string]: string }
}

export interface VersionedMeta {
	id: string
	metas: Meta[]
}

export interface VersionedValue {
	id: string
	versions: Version[]
}

// Extend the LitElement base class
class IqrRadioButtonGroupField extends LitElement {
	@property() suggestionStopWords: Set<string> = new Set<string>()
	@property({ type: Boolean }) displayOwnerMenu = false
	@property({ type: Boolean }) suggestions = false
	@property({ type: Boolean }) links = false
	@property() linksProvider: (sug: { id: string; code: string; text: string; terms: string[] }) => Promise<{ href: string; title: string } | undefined> = () =>
		Promise.resolve(undefined)
	//@property() suggestionProvider: (terms: string[]) => Promise<Suggestion[]> = async () => []
	//@property() ownersProvider: (terms: string[]) => Promise<Suggestion[]> = async () => []
	@property() codeColorProvider: (type: string, code: string) => string = () => 'XI'
	@property() linkColorProvider: (type: string, code: string) => string = () => 'cat1'
	@property() codeContentProvider: (codes: { type: string; code: string }[]) => string = (codes) => codes.map((c) => c.code).join(',')
	@property() optionProvider: (terms: string[], limit: number) => Promise<Suggestion[]> = async () => this.options || []
	@property() options?: Suggestion[] = []
	@property() schema: RadioButtonSchema = 'radio-button-group'
	@property() label = ''
	@property() labelPosition: 'float' | 'side' | 'above' | 'hidden' = 'float'
	@property() placeholder = ''
	@property() textRegex = ''

	@property() value = ''
	@property() defaultLanguage = 'en'
	@property() owner?: string

	@property() valueProvider?: () => VersionedValue | undefined = undefined
	@property() metaProvider?: () => VersionedMeta | undefined = undefined
	@property() handleValueChanged?: (language: string, value: string) => void = undefined
	@property() handleMetaChanged?: (id: string, meta: Meta) => void = undefined

	@state() protected displayOwnersMenu = false
	@state() protected ownerInputValue = ''
	@state() protected availableOptions: Suggestion[] = []

	@state() protected displayLanguagesMenu = false
	@state() protected languageInputValue = ''

	@state() protected displayVersionsMenu = false

	@state() protected displayedLanguage = this.defaultLanguage
	@state() protected displayedVersion = '0'

	@state() protected availableLanguages = [this.displayedLanguage]

	private proseMirrorSchema?: Schema
	private view?: EditorView
	private container?: HTMLElement
	private parser?: MarkdownParser | { parse: (options: ProsemirrorNode<Schema<any, any>>[]) => ProsemirrorNode }
	//private trToSave?: Transaction = undefined

	constructor() {
		super()
	}
	render() {
		return html`
			<div id="root" class="iqr-text-field" data-placeholder=${this.placeholder}>
				Hello World
				<div class="iqr-input">
					<div id="editor"></div>
				</div>
			</div>
		`
	}

	public async firstUpdated() {
		// eslint-disable-next-line @typescript-eslint/no-this-alias
		//const cmp = this

		this.proseMirrorSchema = schema
		const pms: Schema = (this.proseMirrorSchema = createSchema())

		this.container = this.shadowRoot?.getElementById('editor') || undefined
		const providedOptions = await this.optionProvider([''], 10)
		const test = []
		for (const option of providedOptions) {
			test.push(pms.node('radioButton', { id: option.id, type: 'checkbox', name: 'option' }, []))
			test.push(pms.node('label', { for: option.id }, [pms.text(option.id)]))
		}
		this.parser = this.makeParser(pms)
		const parsedDoc = this.parser.parse(test)

		this.view = new EditorView(this.container, {
			state: EditorState.create({
				doc: parsedDoc,
				schema: this.proseMirrorSchema,
			}),
			dispatchTransaction: (tr) => {
				this.view && this.view.updateState(this.view.state.apply(tr))
				//current state as json in text area
				//this.view && console.log(JSON.stringify(this.view.state.doc.toJSON(), null, 2));
			},
		})
	}

	private makeParser(pms: Schema) {
		return {
			parse: (options: ProsemirrorNode<Schema<any, any>>[]) => {
				return pms.node('paragraph', {}, [pms.node('radioButtonGroup', {}, options)])
			},
		}
	}
}
// Register the new element with the browser.
customElements.define('iqr-radio-button-group-field', IqrRadioButtonGroupField)
