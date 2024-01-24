import '../src/components/themes/default'

import { css, html, LitElement } from 'lit'
import { BridgedFormValuesContainer } from '../src/icure'
import { property, state } from 'lit/decorators.js'
import { makeFormValuesContainer } from './form-values-container'
import { makeInterpreter } from '../src/utils/interpreter'
import MiniSearch, { SearchResult } from 'minisearch'
import { codes } from './codes'
import { Code, Field, FieldMetadata, Form, Group, Subform } from '../src/components/model'
import { initializeWithFormDefaultValues } from '../src/utils/form-value-container'
import { normalizeCode, sleep } from '@icure/api'

const icd10 = [
	['I', new RegExp('^[AB][0–9]')],
	['II', new RegExp('^C[0-9]–D[0-4]')],
	['III', new RegExp('^D[5–9]')],
	['IV', new RegExp('^E[0–9]')],
	['V', new RegExp('^F[0–9]')],
	['VI', new RegExp('^G[0–9]')],
	['VII', new RegExp('^H[0–5]')],
	['VIII', new RegExp('^H[6–9]')],
	['IX', new RegExp('^I[0–9]')],
	['X', new RegExp('^J[0–9]')],
	['XI', new RegExp('^K[0–9]')],
	['XII', new RegExp('^L[0–9]')],
	['XIII', new RegExp('^M[0–9]')],
	['XIV', new RegExp('^N[0–9]')],
	['XV', new RegExp('^O[0–9]')],
	['XVI', new RegExp('^P[0–9]')],
	['XVII', new RegExp('^Q[0–9]')],
	['XVIII', new RegExp('^R[0–9]')],
	['XIX', new RegExp('^[ST][0–9]')],
	['XX', new RegExp('^[VY][0–9]')],
	['XXI', new RegExp('^Z[0–9]')],
	['XXII', new RegExp('^U[0–9]')],
]

const icpc2 = {
	B: 'XX',
	D: 'XI',
	F: 'VI',
	H: 'VII',
	K: 'IX',
	L: 'XIII',
	N: 'VI',
	P: 'V',
	R: 'X',
	S: 'XII',
	T: 'VI',
	U: 'XIV',
	W: 'XV',
	X: 'XVI',
	Y: 'XVIII',
	Z: 'XXI',
}

const stopWords = new Set(['du', 'au', 'le', 'les', 'un', 'la', 'des', 'sur', 'de'])

export class DecoratedForm extends LitElement {
	@property() form: Form
	@property() codesProvider: (codifications: string[], searchTerm: string) => Promise<Code[]> = () => Promise.resolve([])

	@property() displayedLanguage?: string = 'fr'

	private undoStack: BridgedFormValuesContainer[] = []
	private redoStack: BridgedFormValuesContainer[] = []

	@state() formValuesContainer: BridgedFormValuesContainer | undefined = undefined

	private miniSearch: MiniSearch = new MiniSearch({
		fields: ['text'], // fields to index for full-text search
		storeFields: ['code', 'text', 'links'], // fields to return with search results
		processTerm: (term) =>
			term.length === 1 || stopWords.has(term)
				? null
				: term
						.normalize('NFD')
						.replace(/[\u0300-\u036f]/g, '')
						.toLowerCase(),
	})

	static get styles() {
		return css`
			icure-text-field {
				display: block;
			}

			h2 {
				width: 100%;
				font-size: 2em;
				margin-top: 1em;
				margin-bottom: 0;
				font-family: 'Roboto', Helvetica, sans-serif;
			}

			* {
				box-sizing: border-box;
			}
		`
	}

	public undo() {
		if (this.undoStack.length > 0) {
			this.redoStack.push(this.formValuesContainer!)
			const popped = this.undoStack.pop() as BridgedFormValuesContainer
			console.log('popped', popped)
			this.formValuesContainer = popped
		} else {
			console.log('undo stack is empty')
		}
	}

	public redo() {
		if (this.redoStack.length > 0) {
			this.undoStack.push(this.formValuesContainer!)
			this.formValuesContainer = this.redoStack.pop() as BridgedFormValuesContainer
		} else {
			console.log('redo stack is empty')
		}
	}

	async firstUpdated() {
		const contactFormValuesContainer = await makeFormValuesContainer()
		const responsible = 'user-id'

		const initialisedFormValueContainer = initializeWithFormDefaultValues(
			new BridgedFormValuesContainer(
				responsible,
				contactFormValuesContainer,
				makeInterpreter(),
				undefined,
				(anchorId, templateId) => {
					const findForm = (form: Form, anchorId: string | undefined, templateId: string): Form | undefined => {
						if (anchorId === undefined) {
							return form
						}
						return form.sections
							.flatMap((s) => s.fields)
							.map((fg) => {
								if (fg.clazz === 'subform') {
									if (fg.id === anchorId) {
										return fg.forms[templateId]
									} else {
										const candidate = Object.values(fg.forms)
											.map((f) => findForm(f, anchorId, templateId))
											.find((f) => !!f)
										if (candidate) {
											return candidate
										}
									}
								}
								return undefined
							})
							.find((f) => !!f)
					}

					const form = findForm(this.form, anchorId, templateId)

					const extractFormulas = (fgss: (Field | Group | Subform)[]): { metadata: FieldMetadata; formula: string }[] =>
						fgss.flatMap((fg) => {
							if (fg.clazz === 'group') {
								return extractFormulas(fg.fields ?? [])
							} else if (fg.clazz === 'field') {
								const formula = fg.computedProperties?.['value']
								return formula ? [{ metadata: { label: fg.label(), tags: fg.tags?.map((id) => ({ label: {}, ...normalizeCode({ id: id }), id: id! })) }, formula }] : []
							} else {
								return []
							}
						}) ?? []

					return form ? extractFormulas(form.sections?.flatMap((f) => f.fields) ?? []) : []
				},
				this.displayedLanguage,
			),
			this.form,
			this.displayedLanguage,
			responsible,
		) as BridgedFormValuesContainer

		this.formValuesContainer = initialisedFormValueContainer
		initialisedFormValueContainer.registerChangeListener((newValue) => {
			const fvc = this.formValuesContainer
			this.redoStack = []
			fvc && this.undoStack.push(fvc)
			this.formValuesContainer = newValue

			const toSave = this.formValuesContainer.getContactFormValuesContainer()

			setTimeout(() => {
				if (toSave === this.formValuesContainer?.getContactFormValuesContainer()) {
					console.log('saving')
				}
			}, 10000)
		})
		this.miniSearch.addAll(codes.map((x) => ({ id: x.id, code: x.code, text: x.label?.fr, links: x.links })))
	}

	codeColorProvider(type: string, code: string) {
		if (!code) {
			return 'XXII'
		}
		return type === 'ICD' ? (icd10.find((x) => code.match(x[1])) || [])[0] || 'XXII' : icpc2[code.substring(0, 1)] || 'XXII'
	}

	async suggestionProvider(terms: string[]) {
		let normalisedTerms = terms.map((x) =>
			x
				.normalize('NFD')
				.replace(/[\u0300-\u036f]/g, '')
				.toLowerCase(),
		)
		const res: (SearchResult & { terms: string[] })[] = []
		if (this.miniSearch) {
			while (normalisedTerms.length && res.length < 20) {
				res.push(
					...this.miniSearch
						.search(normalisedTerms.join(' '))
						.filter((x) => {
							return normalisedTerms.every((t) => x.terms.includes(t))
						})
						.map((s) => Object.assign(s, { terms }))
						.filter((t) => !res.some((x) => x.text === t.text)),
				)
				res.length < 20 &&
					res.push(
						...this.miniSearch
							.search(normalisedTerms.join(' '), { prefix: true })
							.filter((x) => normalisedTerms.every((t) => x.terms.some((mt) => mt.startsWith(t))))
							.map((s) => Object.assign(s, { terms }))
							.filter((t) => !res.some((x) => x.text === t.text)),
					)
				normalisedTerms = normalisedTerms.slice(1)
				terms = terms.slice(1)
			}
		}
		return res
	}

	async linksProvider(sug: { id: string; code: string; text: string; terms: string[]; links: string[] }) {
		const links = (await Promise.all((sug.links || []).map((id) => codes.find((c) => c.id === id))))
			.map((c) => ({ id: c?.id, code: c?.code, text: c?.label?.fr, type: c?.type }))
			.concat([Object.assign({ type: sug.id.split('|')[0] }, sug)])
		return { href: links.map((c) => `c-${c.type}://${c.code}`).join(','), title: links.map((c) => c.text).join('; ') }
	}

	async optionsProvider(language: string, codifications: string[], searchTerms: string[]) {
		await sleep(100)
		return codifications.flatMap((c) => {
			const formCodifications = this.form?.codifications
			if (formCodifications?.map((c) => c.type)?.includes(c)) {
				return []
			} else {
				return []
			}
		})
	}

	render() {
		// noinspection DuplicatedCode
		// @ts-ignore

		console.log('redoStack', this.redoStack)
		console.log('undoStack', this.undoStack)

		return html`
			<icure-form
				.form="${this.form}"
				labelPosition="above"
				renderer="form"
				displayedLanguage="${this.displayedLanguage}"
				.formValuesContainer="${this.formValuesContainer}"
				.codesProvider="${this.codesProvider.bind(this)}"
				.optionsProvider="${this.optionsProvider.bind(this)}"
			></icure-form>
		`
	}
}

customElements.define('decorated-form', DecoratedForm)
