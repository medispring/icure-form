import '../src/components/themes/icure-blue'
//import '../src/components/themes/kendo'
import { css, html, LitElement } from 'lit'
import { BridgedFormValuesContainer } from '../src/icure'
import { property, state } from 'lit/decorators.js'
import { makeFormValuesContainer } from './form-values-container'
import { makeInterpreter } from '../src/utils/interpreter'
import MiniSearch, { SearchResult } from 'minisearch'
import { codes, icd10, icpc2 } from './codes'
import { Field, FieldMetadata, Form, Group, Subform, Validator } from '../src/components/model'
import { computeFormDefaultValues } from '../src/utils/form-value-container'
import { normalizeCode, sleep } from '@icure/api'
import { Suggestion } from '../src/generic'

const stopWords = new Set(['du', 'au', 'le', 'les', 'un', 'la', 'des', 'sur', 'de'])

export class DecoratedForm extends LitElement {
	@property() form: Form
	@property() language?: string = 'fr'

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
			.icure-text-field {
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
		if (!this.formValuesContainer) return
		if (this.undoStack.length > 0) {
			this.redoStack.push(this.formValuesContainer)
			const popped = this.undoStack.pop() as BridgedFormValuesContainer
			console.log('popped', popped)
			this.formValuesContainer = popped.synchronise()
		} else {
			console.log('undo stack is empty')
		}
	}

	public redo() {
		if (!this.formValuesContainer) return
		if (this.redoStack.length > 0) {
			this.undoStack.push(this.formValuesContainer)
			this.formValuesContainer = this.redoStack.pop()!.synchronise()
		} else {
			console.log('redo stack is empty')
		}
	}

	async firstUpdated() {
		const contactFormValuesContainer = await makeFormValuesContainer()
		const responsible = '1'

		const findForm = (form: Form, anchorId: string | undefined, templateId: string | undefined): Form | undefined => {
			if (anchorId === undefined || templateId === undefined) {
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

		const initialisedFormValueContainer = new BridgedFormValuesContainer(
			responsible,
			contactFormValuesContainer,
			makeInterpreter(),
			undefined,
			(formValueContainer, anchorId, templateId) => computeFormDefaultValues(formValueContainer, findForm(this.form, anchorId, templateId), this.language, responsible),
			(anchorId, templateId) => {
				const form = findForm(this.form, anchorId, templateId)

				const extractFormulas = (fgss: (Field | Group | Subform)[]): { metadata: FieldMetadata; formula: string }[] =>
					fgss.flatMap((fg) => {
						if (fg.clazz === 'group') {
							return extractFormulas(fg.fields ?? [])
						} else if (fg.clazz === 'field') {
							const formula = fg.computedProperties?.['value']
							// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
							return formula ? [{ metadata: { label: fg.label(), tags: fg.tags?.map((id) => ({ label: {}, ...normalizeCode({ id: id }), id: id! })) }, formula }] : []
						} else {
							return []
						}
					}) ?? []

				return form ? extractFormulas(form.sections?.flatMap((f) => f.fields) ?? []) : []
			},
			(anchorId, templateId) => {
				const form = findForm(this.form, anchorId, templateId)

				const extractValidators = (fgss: (Field | Group | Subform)[]): { metadata: FieldMetadata; validators: Validator[] }[] =>
					fgss.flatMap((fg) => {
						if (fg.clazz === 'group') {
							return extractValidators(fg.fields ?? [])
						} else if (fg.clazz === 'field') {
							const validators = fg.validators
							return validators?.length ? [{ metadata: { label: fg.label(), tags: fg.tags?.map((id) => ({ label: {}, ...normalizeCode({ id: id }), id: id! })) }, validators }] : []
						} else {
							return []
						}
					}) ?? []

				return form ? extractValidators(form.sections?.flatMap((f) => f.fields) ?? []) : []
			},
			this.language,
			undefined,
		)

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
		const codeSplited: string[][] = codifications?.map((codification) => codification.split('|'))
		if (codeSplited.some((codification) => codification[0] === 'ENTITY-LIST')) {
			return [
				{ id: 'haselt', label: { fr: 'hasselt', nl: 'hasselt' } },
				{ id: 'gent', label: { fr: 'ostend', nl: 'ostend' } },
			]
		} else
			return codifications.flatMap((c) => {
				const formCodifications = this.form?.codifications
				if (formCodifications?.map((c) => c.type)?.includes(c)) {
					return []
				} else {
					return []
				}
			})
	}

	async ownersProvider(terms: string[], ids?: string[], specialties?: string[]): Promise<Suggestion[]> {
		await sleep(100)
		return [
			{ id: '1', name: 'Dr. John Doe', specialties: ['General Medicine'] },
			{ id: '2', name: 'Dr. Jane Doe', specialties: ['ORL'] },
		]
			.filter((hcp) => {
				return (
					terms.every((t) => hcp.name.toLowerCase().includes(t.toLowerCase())) &&
					(!ids?.length || ids.includes(hcp.id)) &&
					(!specialties?.length || specialties.some((s) => hcp.specialties.includes(s)))
				)
			})
			.map((x) => ({ id: x.id, text: x.name, terms: terms, label: {} }))
	}

	render() {
		return html`
			<icure-form
				.form="${this.form}"
				labelPosition="above"
				renderer="form"
				.displayMetadata="${true}"
				.language="${this.language}"
				.formValuesContainer="${this.formValuesContainer}"
				.ownersProvider="${this.ownersProvider.bind(this)}"
				.optionsProvider="${this.optionsProvider.bind(this)}"
				.actionListener="${(event: string) => {
					alert(event)
				}}"
				)
			></icure-form>
		`
	}
}

customElements.define('decorated-form', DecoratedForm)
