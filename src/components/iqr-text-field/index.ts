// Import the LitElement base class and html helper function
import { html, LitElement } from 'lit'
import { property, state, query } from 'lit/decorators'
import { EditorState, Plugin } from 'prosemirror-state'
import { EditorView } from 'prosemirror-view'
import { Node as ProsemirrorNode, Schema } from 'prosemirror-model'
import { history, redo, undo } from 'prosemirror-history'
import { keymap } from 'prosemirror-keymap'
import { baseKeymap, chainCommands, exitCode, joinDown, joinUp, setBlockType, toggleMark } from 'prosemirror-commands'
import { liftListItem, sinkListItem, splitListItem, wrapInList } from 'prosemirror-schema-list'

import { createSchema, IqrTextFieldSchema } from './schema'
import MarkdownIt from 'markdown-it'
import { MarkdownParser } from 'prosemirror-markdown'
import { unwrapFrom, wrapInIfNeeded } from './prosemirror-commands'
import { SelectionCompanion } from './selection-companion'
import { Suggestion, SuggestionPalette } from './suggestion-palette'
import { caretFixPlugin } from './plugin/caret-fix-plugin'
import { hasMark } from './prosemirror-utils'

// @ts-ignore
import baseCss from './styles/style.scss'
// @ts-ignore
import kendoCss from './styles/kendo.scss'

import { maskPlugin } from './plugin/mask-plugin'
import { hasContentClassPlugin } from './plugin/has-content-class-plugin'
import { regexpPlugin } from './plugin/regexp-plugin'
import { sorted } from '../../utils/no-lodash'
import { datePicto, i18nPicto, ownerPicto, searchPicto, versionPicto } from './styles/paths'
import { languageName } from '../../utils/languages'

export { IqrTextFieldSchema } from './schema'
export { Suggestion } from './suggestion-palette'

type FullSchema = Schema<
	'doc' | 'paragraph' | 'list_item' | 'image' | 'blockquote' | 'bullet_list' | 'hard_break' | 'heading' | 'horizontal_rule' | 'ordered_list' | 'text',
	'strong' | 'em' | 'link'
>
type DateTimeSchema = Schema<'paragraph' | 'date' | 'time' | 'text'>

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
class IqrTextField extends LitElement {
	@property() suggestionStopWords: Set<string> = new Set<string>()
	@property({ type: Boolean }) displayOwnerMenu = false
	@property({ type: Boolean }) suggestions = false
	@property({ type: Boolean }) links = false
	@property() linksProvider: (sug: { id: string; code: string; text: string; terms: string[] }) => Promise<{ href: string; title: string } | undefined> = () =>
		Promise.resolve(undefined)
	@property() suggestionProvider: (terms: string[]) => Promise<Suggestion[]> = async () => []
	@property() ownersProvider: (terms: string[]) => Promise<Suggestion[]> = async () => []
	@property() codeColorProvider: (type: string, code: string) => string = () => 'XI'
	@property() linkColorProvider: (type: string, code: string) => string = () => 'cat1'
	@property() codeContentProvider: (codes: { type: string; code: string }[]) => string = (codes) => codes.map((c) => c.code).join(',')
	@property() schema: IqrTextFieldSchema = 'styled-text-with-codes'
	@property() label = ''
	@property() labelPosition: 'float' | 'side' | 'above' | 'hidden' = 'float'
	@property() placeholder = ''
	@property() textRegex = ''

	@property() value = ''
	@property() defaultLanguage = 'en'
	@property() owner?: string

	@property() valueProvider?: () => VersionedValue = undefined
	@property() metaProvider?: () => VersionedMeta = undefined
	@property() handleValueChanged?: (value: string) => void = undefined
	@property() handleMetaChanged?: (id: string, meta: Meta) => void = undefined

	@state() protected displayOwnersMenu = false
	@state() protected ownerInputValue = ''
	@state() protected availableOwners: Suggestion[] = []

	@state() protected displayLanguagesMenu = false
	@state() protected languageInputValue = ''

	@state() protected displayVersionsMenu = false

	@state() protected displayedLanguage = this.defaultLanguage
	@state() protected displayedVersion = '0'

	@state() protected availableLanguages = [this.displayedLanguage]

	private proseMirrorSchema?: Schema
	private parser?: MarkdownParser<FullSchema> | { parse: (value: string) => ProsemirrorNode<DateTimeSchema> }

	private view?: EditorView
	private container?: HTMLElement
	private readonly windowListeners: [string, () => void][] = []
	private suggestionPalette?: SuggestionPalette
	private mouseCount = 0
	private serviceId?: string = undefined

	constructor() {
		super()
	}

	connectedCallback() {
		super.connectedCallback()
		const cmu = this.mouseUp.bind(this)
		const cmd = this.mouseDown.bind(this)

		this.windowListeners.push(['mouseup', cmu], ['mousedown', cmd])
		window.addEventListener('mouseup', cmu)
		window.addEventListener('mousedown', cmd)
	}

	disconnectedCallback() {
		super.disconnectedCallback()
		this.windowListeners.forEach((wl) => window.removeEventListener(wl[0], wl[1]))
	}

	static get styles() {
		return [baseCss, kendoCss]
	}

	@query('#ownerSearch') _ownerSearch!: HTMLInputElement
	render() {
		return html`
			<div id="root" class="iqr-text-field" data-placeholder=${this.placeholder}>
				<label class="iqr-label ${this.labelPosition}"><span>${this.label}</span></label>
				<div class="iqr-input">
					<div id="editor"></div>
					<div id="extra" class=${'extra' + (this.displayOwnersMenu ? ' forced' : '')}>
						<div class="info">~${this.owner}</div>
						<div class="buttons-container">
							<div class="menu-container">
								<button data-content="${this.getMeta()?.owner}" @click="${this.toggleOwnerMenu}" class="btn menu-trigger author">${ownerPicto}</button>
								${this.displayOwnersMenu
									? html`
											<div id="menu" class="menu">
												<div class="input-container">${searchPicto} <input id="ownerSearch" @input="${this.searchOwner}" /></div>
												${this.availableOwners?.map((x) => html`<button @click="${this.handleOwnerButtonClicked(x.id)}" id="${x.id}" class="item">${x.text}</button>`)}
											</div>
									  `
									: ''}
							</div>
							<div class="menu-container">
								<button data-content="${this.getMeta()?.valueDate}" class="btn date">${datePicto}</button>
							</div>
							<div class="menu-container">
								<button data-content="1.0" class="btn version">${versionPicto}</button>
							</div>
							<div class="menu-container">
								<button data-content="${this.displayedLanguage}" @click="${this.toggleLanguageMenu}" class="btn menu-trigger language">${i18nPicto}</button>
								${this.displayLanguagesMenu
									? html`
											<div id="menu" class="menu">
												<div class="input-container">${searchPicto} <input /></div>
												${this.availableLanguages?.map((x) => html`<button id="${x}" class="item">${languageName(x)}</button>`)}
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

	toggleOwnerMenu() {
		this.displayOwnersMenu = !this.displayOwnersMenu
	}

	searchOwner(e: InputEvent) {
		const text = (e.target as HTMLInputElement).value
		setTimeout(async () => {
			if (this._ownerSearch.value === text) {
				if (this.ownersProvider) {
					const availableOwners = await this.ownersProvider(text.split(' '))
					console.log(availableOwners)
					this.availableOwners = availableOwners
				}
			}
		}, 300)
	}

	handleOwnerButtonClicked(id: string) {
		this.handleMetaChanged && this.serviceId && this.handleMetaChanged(this.serviceId, { revision: this.displayedVersion, owner: { id } })
		this.displayOwnersMenu = false
	}

	toggleLanguageMenu() {
		this.displayLanguagesMenu = !this.displayLanguagesMenu
	}

	mouseDown() {
		this.mouseCount++
	}

	mouseUp() {
		this.mouseCount = 0
		if (!this.view?.dom?.classList?.contains('ProseMirror-focused')) {
			this.view?.dom?.parentElement?.querySelectorAll('.companion')?.forEach((x) => {
				;(x as HTMLElement).style.display = 'none'
			})
		}
	}

	firstUpdated() {
		// eslint-disable-next-line @typescript-eslint/no-this-alias
		const cmp = this
		const pms: Schema = (this.proseMirrorSchema = createSchema(
			this.schema,
			(t, c, isC) => (isC ? this.codeColorProvider(t, c) : this.linkColorProvider(t, c)),
			this.codeContentProvider,
		))

		this.parser = this.makeParser(pms)
		this.container = this.shadowRoot?.getElementById('editor') || undefined

		if (this.container) {
			const br = pms.nodes.hard_break
			const hardBreak = chainCommands(exitCode, (state, dispatch) => {
				dispatch && dispatch(state.tr.replaceSelectionWith(br.create()).scrollIntoView())
				return true
			})

			const replaceRangeWithSuggestion = async (from: number, to: number, sug: { id: string; code: string; text: string; terms: string[] }) => {
				const link = await this.linksProvider(sug)
				return (link && cmp.view && cmp.view.state.tr.replaceWith(from, to, pms.text(sug.text, [pms.mark('link', link)]))) || undefined
			}

			const headingsKeymap = keymap(
				[1, 2, 3, 4, 5, 6].reduce((acc, idx) => {
					return Object.assign(acc, { [`Mod-ctrl-${idx}`]: setBlockType(pms.nodes.heading, { level: '' + idx }) })
				}, {}),
			)

			const providedValue = this.valueProvider && this.valueProvider()
			this.displayedVersion = providedValue?.versions?.[0]?.revision || '0'
			const displayedVersionedValue = providedValue?.versions?.[0]?.value
			this.serviceId = providedValue?.id

			this.availableLanguages = displayedVersionedValue && Object.keys(displayedVersionedValue).length ? sorted(Object.keys(displayedVersionedValue)) : this.availableLanguages
			if (!this.availableLanguages.includes(this.displayedLanguage)) {
				this.displayedLanguage = this.availableLanguages[0]
			}

			const parsedDoc = this.parser.parse(this.valueProvider ? displayedVersionedValue?.[this.displayedLanguage] || '' : this.value)

			this.view = new EditorView(this.container, {
				state: EditorState.create({
					doc: parsedDoc,
					schema: this.proseMirrorSchema,
					plugins: [
						caretFixPlugin(),
						history(),
						this.links
							? new Plugin({
									view(editorView) {
										return new SelectionCompanion(editorView, () => cmp.mouseCount > 0)
									},
							  })
							: null,
						this.suggestions
							? new Plugin({
									view(editorView) {
										return (cmp.suggestionPalette = new SuggestionPalette(
											pms,
											editorView,
											(terms: string[]) => cmp.suggestionProvider(terms),
											() => cmp.suggestionStopWords,
										))
									},
							  })
							: null,
						this.suggestions
							? keymap({
									Tab: () => {
										return (cmp.suggestionPalette && this.view && cmp.suggestionPalette.focusOrInsert(this.view, replaceRangeWithSuggestion)) || false
									},
									ArrowUp: () => {
										return (cmp.suggestionPalette && cmp.suggestionPalette.arrowUp()) || false
									},
									ArrowDown: () => {
										return (cmp.suggestionPalette && cmp.suggestionPalette.arrowDown()) || false
									},
									Enter: () => {
										return (cmp.suggestionPalette && this.view && cmp.suggestionPalette.insert(this.view, replaceRangeWithSuggestion)) || false
									},
							  })
							: null,
						keymap({ 'Mod-z': undo, 'Mod-Shift-z': redo }),
						keymap(
							Object.assign(
								{},
								pms.marks.strong ? { 'Mod-b': toggleMark(pms.marks.strong) } : {},
								pms.marks.em ? { 'Mod-i': toggleMark(pms.marks.em) } : {},
								pms.nodes.paragraph ? { 'Alt-ArrowUp': joinUp } : {},
								pms.nodes.paragraph ? { 'Alt-ArrowDown': joinDown } : {},
								pms.nodes.paragraph ? { 'Alt-Enter': hardBreak } : {},
								pms.nodes.paragraph ? { 'Shift-Enter': hardBreak } : {},
								pms.nodes.ordered_list ? { 'Shift-ctrl-1': wrapInList(pms.nodes.ordered_list) } : {},
								pms.nodes.bullet_list ? { 'Shift-ctrl-*': wrapInList(pms.nodes.bullet_list) } : {},
								pms.nodes.blockquote ? { 'Shift-ctrl-w': wrapInIfNeeded(pms.nodes.blockquote) } : {},
								pms.nodes.blockquote ? { 'Shift-ctrl-u': unwrapFrom(pms.nodes.blockquote) } : {},
								pms.nodes.paragraph ? { 'Mod-ctrl-0': setBlockType(pms.nodes.paragraph) } : {},
								pms.nodes.paragraph ? { 'Shift-ctrl-0': setBlockType(pms.nodes.paragraph) } : {},
								pms.nodes.list_item ? { Enter: splitListItem(pms.nodes.list_item) } : {},
								pms.nodes.ordered_list || pms.nodes.bullet_list ? { 'Mod-(': liftListItem(pms.nodes.list_item) } : {},
								pms.nodes.ordered_list || pms.nodes.bullet_list ? { 'Mod-[': liftListItem(pms.nodes.list_item) } : {},
								pms.nodes.ordered_list || pms.nodes.bullet_list ? { 'Mod-)': sinkListItem(pms.nodes.list_item) } : {},
								pms.nodes.ordered_list || pms.nodes.bullet_list ? { 'Mod-]': sinkListItem(pms.nodes.list_item) } : {},
							),
						),
						pms.nodes.heading ? headingsKeymap : null,
						maskPlugin(),
						regexpPlugin(),
						hasContentClassPlugin(this.shadowRoot || undefined),
						keymap(baseKeymap),
					]
						.filter((x) => !!x)
						.map((x) => x as Plugin),
				}),
				dispatchTransaction: (tr) => {
					this.view && this.view.updateState(this.view.state.apply(tr))
					//current state as json in text area
					//this.view && console.log(JSON.stringify(this.view.state.doc.toJSON(), null, 2));
					this.view && this.handleValueChanged && this.handleValueChanged(this.view.state.doc.text ?? '')
				},
			})
		}
	}

	private makeParser(pms: Schema) {
		const tokenizer = MarkdownIt('commonmark', { html: false })
		return this.schema === 'date'
			? {
					parse: (value: string) => pms.node('paragraph', {}, [pms.node('date', {}, value ? [pms.text(value)] : [])]),
			  }
			: this.schema === 'time'
			? {
					parse: (value: string) => pms.node('paragraph', {}, [pms.node('time', {}, value ? [pms.text(value)] : [])]),
			  }
			: this.schema === 'measure'
			? {
					parse: (value: string) => {
						const decimal = value ? value.split(' ')[0] : ''
						const unit = value ? value.split(' ')[1] : ''

						return pms.node('paragraph', {}, [
							pms.node('decimal', {}, decimal && decimal.length ? [pms.text(decimal)] : [pms.text(' ')]),
							pms.node('unit', {}, unit && unit.length ? [pms.text(unit)] : [pms.text(' ')]),
						])
					},
			  }
			: this.schema === 'date-time'
			? {
					parse: (value: string) => {
						const date = value ? value.split(' ')[0] : ''
						const time = value ? value.split(' ')[1] : ''

						return pms.node('paragraph', {}, [
							pms.node('date', {}, date && date.length ? [pms.text(date)] : [pms.text(' ')]),
							pms.node('time', {}, time && time.length ? [pms.text(time)] : [pms.text(' ')]),
						])
					},
			  }
			: this.schema === 'text-document'
			? new MarkdownParser(pms, MarkdownIt('commonmark', { html: false }), {
					blockquote: { block: 'blockquote' },
					paragraph: { block: 'paragraph' },
					list_item: { block: 'list_item' },
					bullet_list: { block: 'bullet_list' },
					ordered_list: { block: 'ordered_list', getAttrs: (tok) => ({ order: +(tok.attrGet('start') || 1) }) },
					heading: { block: 'heading', getAttrs: (tok) => ({ level: +tok.tag.slice(1) }) },
					hr: { node: 'horizontal_rule' },
					image: {
						node: 'image',
						getAttrs: (tok) => ({
							src: tok.attrGet('src'),
							title: tok.attrGet('title') || null,
							alt: (tok.children || [])[0]?.content || null,
						}),
					},
					hardBreak: { node: 'hard_break' },

					em: hasMark(pms.spec.marks, 'em') ? { mark: 'em' } : { ignore: true },
					strong: hasMark(pms.spec.marks, 'strong') ? { mark: 'strong' } : { ignore: true },
					link: hasMark(pms.spec.marks, 'link')
						? {
								mark: 'link',
								getAttrs: (tok) => ({
									href: tok.attrGet('href'),
									title: tok.attrGet('title') || null,
								}),
						  }
						: { ignore: true },
			  })
			: new MarkdownParser(
					pms,
					{
						parse: (src: string, env: unknown): unknown[] => {
							return tokenizer.parse(src, env).filter((t) => !t.type.startsWith('paragraph_'))
						},
					} as MarkdownIt,
					{
						em: hasMark(pms.spec.marks, 'em') ? { mark: 'em' } : { ignore: true },
						strong: hasMark(pms.spec.marks, 'strong') ? { mark: 'strong' } : { ignore: true },
						link: hasMark(pms.spec.marks, 'link')
							? {
									mark: 'link',
									getAttrs: (tok) => ({
										href: tok.attrGet('href'),
										title: tok.attrGet('title') || null,
									}),
							  }
							: { ignore: true },
					},
			  )
	}

	private getMeta(): Meta | undefined {
		return (this.metaProvider && this.metaProvider()?.metas?.find((vm) => vm.revision === this.displayedVersion)) || undefined
	}
}

// Register the new element with the browser.
customElements.define('iqr-text-field', IqrTextField)
