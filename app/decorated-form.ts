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
import { Contact, Form as ICureForm, normalizeCode } from '@icure/api'
import { Suggestion, Version } from '../src/generic'
import { getRevisionsFilter } from '../src/utils/fields-values-provider'
import { v4 as uuid } from 'uuid'
import { defaultTranslationProvider } from '../src/utils/languages'

const stopWords = new Set(['du', 'au', 'le', 'les', 'un', 'la', 'des', 'sur', 'de'])

const currentContact = new Contact({
	id: 'c2',
	created: +new Date(),
	subContacts: [],
	services: [
	],
})

const history = [
	new Contact({
		created: 1771337056221,
		id: "c1",
		services: [
			{
			content: {fr: {stringValue: "test 3"}},
			created: 1771337056515,
			id: "ec0e597e-ddd9-482c-841f-9c4d6a361650",
			label: "physio-forms.closure.field.label.closureReason",
			modified: 1771337231657,
			responsible: "1",
			tags: [{code: "closureReason", id: "MS-PHYSIO-CLOSURE-EXAM-ITEM|closureReason|1", label: {}, type: "MS-PHYSIO-CLOSURE-EXAM-ITEM", version: "1"}],
			valueDate: 20260217150711
		},
		{
			content: {fr: {stringValue: "test 4"}},
			created: 1771337056515,
			id: "7b8634b4-4865-4c2d-94e7-5ab8bc8a1502",
			label: "physio-forms.closure.field.label.appreciationOfPatient",
			modified: 1771337234543,
			responsible: "1",
			tags: [
				{code: "appreciationOfPatient", id: "MS-PHYSIO-CLOSURE-EXAM-ITEM|appreciationOfPatient|1", label: {}, type: "MS-PHYSIO-CLOSURE-EXAM-ITEM", version: "1"},
				{code: "outcome", id: "CD-ITEM|outcome|1", label: {}, type: "CD-ITEM", version: "1"}
			],
			valueDate: 20260217150714
		},
		{
			content: {fr: {stringValue: "test 1"}},
			created: 1771337056515,
			id: "1828c19f-790c-4b2e-b4b0-b691c8372aa7",
			label: "physio-forms.dailyFollowUp.field.label.progressOfSession",
			modified: 1771337222438,
			responsible: "1",
			tags: [
				{code: "progressOfSession", id: "MS-PHYSIO-DAILY-FOLLOW-UP-ITEM|progressOfSession|1", label: {}, type: "MS-PHYSIO-DAILY-FOLLOW-UP-ITEM", version: "1"},{code: "act", id: "CD-ITEM|act|1", label: {}, type: "CD-ITEM", version: "1"},{code: "completed", id: "CD-LIFECYCLE|completed|1", label: {}, type: "CD-LIFECYCLE", version: "1"}
			],
			valueDate: 20260217150702
		},
		{
			content: {fr: {stringValue: "test 2"}},
			created: 1771337056515,
			id: "de203821-e262-47f2-a8e9-030f965c1fde",
			label: "physio-forms.dailyFollowUp.field.label.elementsHighlight",
			modified: 1771337226582,
			responsible: "1",
			tags: [
				{code: "elementsHighlight", id: "MS-PHYSIO-DAILY-FOLLOW-UP-ITEM|elementsHighlight|1", label: {}, type: "MS-PHYSIO-DAILY-FOLLOW-UP-ITEM", version: "1"}
			],
			valueDate: 20260217150706
		}
	],
		subContacts: [
		{
			formId: "f4194428-df67-405a-a746-ce165f7da067",
			services: [
				{
					serviceId: "ec0e597e-ddd9-482c-841f-9c4d6a361650"
				},
				{
					serviceId: "7b8634b4-4865-4c2d-94e7-5ab8bc8a1502"
				}
			]
		},
		{
			formId: "e65e3ee4-42c1-4cac-a7e3-e612e6a0604b",
			services: [
				{
					serviceId: "1828c19f-790c-4b2e-b4b0-b691c8372aa7"
				},
				{
					serviceId: "de203821-e262-47f2-a8e9-030f965c1fde"
				}
			]
		}
	]
}),
]

const rootForm = new ICureForm({
	id: 'f1',
	rev: '12345',
	formTemplateId: 'abortion',
})

const db = JSON.parse(localStorage.getItem('com.icure.storage') || '{}') as {
	forms?: Record<string, ICureForm>
	contacts?: Record<string, Contact>
}
if (!db.forms) {
	db.forms = { [rootForm.id!]: rootForm }
	localStorage.setItem('com.icure.storage', JSON.stringify(db))
}
if (!db.contacts) {
	db.contacts = { [currentContact.id!]: currentContact, [history[0].id!]: history[0] }
	localStorage.setItem('com.icure.storage', JSON.stringify(db))
}

async function destroyForm(fid: string) {
	delete db.forms![fid]
	localStorage.setItem('com.icure.storage', JSON.stringify(db))
}

async function makeForm(f: ICureForm): Promise<ICureForm> {
	const form = (db.forms![f.id!] = f)
	localStorage.setItem('com.icure.storage', JSON.stringify(db))
	return form
}

async function getForms(formTemplateId: string | undefined, parentId: string | undefined): Promise<ICureForm[]> {
	const forms = Object.values(db.forms!).filter((f) => (!formTemplateId || f.formTemplateId === formTemplateId) && (f.parent === parentId || (!f.parent && !parentId)))
	return forms
}

export class DecoratedForm extends LitElement {
	@property() renderer = 'form'
	@property() form: Form
	@property() language?: string = 'fr'

	private undoStack: BridgedFormValuesContainer[] = []
	private redoStack: BridgedFormValuesContainer[] = []

	@state() formValuesContainer: BridgedFormValuesContainer | undefined = undefined
	@state() observedForms: Record<string, Form> = {}

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
			this.formValuesContainer = popped.synchronise()
		} else {
			console.log('undo stack is empty')
		}
	}

	public redo() {
		if (!this.formValuesContainer) return
		if (this.redoStack.length > 0) {
			this.undoStack.push(this.formValuesContainer)
			const popped = this.redoStack.pop() as BridgedFormValuesContainer
			this.formValuesContainer = popped.synchronise()
		} else {
			console.log('redo stack is empty')
		}
	}

	async firstUpdated() {
		const forms = await getForms(this.form.id, undefined)
		const form =
			forms[0] ??
			(await makeForm(
				new ICureForm({
					id: uuid(),
					rev: uuid(),
					formTemplateId: this.form.id,
				}),
			))
		const contactFormValuesContainer = await makeFormValuesContainer(this.observedForms, form, Object.values(db.contacts ?? {}).find((c) => c.rev === null) ?? currentContact, history, (parentId) =>
			getForms(undefined, parentId),
		)
		contactFormValuesContainer.allForms().forEach((f) => (this.observedForms[f.id!] = this.form))
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

		const extractFormulas = (
			fieldGroupOrSubForms: (Field | Group | Subform)[],
			property: (fg: Field) => string | undefined,
		): {
			metadata: FieldMetadata
			revisionsFilter: (id: string, history: Version<FieldMetadata>[]) => (string | null)[]
			formula: string
		}[] =>
			fieldGroupOrSubForms.flatMap((fg) => {
				if (fg.clazz === 'group') {
					return extractFormulas(fg.fields ?? [], property)
				} else if (fg.clazz === 'field') {
					const formula = property(fg)
					// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
					return formula
						? [
								{
									metadata: {
										label: fg.label(),
										tags: fg.tags?.map((id) => ({ label: {}, ...normalizeCode({ id: id }), id: id! })),
									},
									revisionsFilter: getRevisionsFilter(fg),
									formula,
								},
						  ]
						: []
				} else {
					return []
				}
			}) ?? []

		const initialisedFormValueContainer = await new BridgedFormValuesContainer(
			responsible,
			contactFormValuesContainer,
			makeInterpreter(),
			undefined,
			(anchorId, templateId) => {
				const form = findForm(this.form, anchorId, templateId)
				return form ? extractFormulas(form.sections?.flatMap((f) => f.fields) ?? [], (fg) => fg.computedProperties?.['defaultValue']) : []
			},
			(anchorId, templateId) => {
				const form = findForm(this.form, anchorId, templateId)
				return form ? extractFormulas(form.sections?.flatMap((f) => f.fields) ?? [], (fg) => fg.computedProperties?.['value']) : []
			},
			(anchorId, templateId) => {
				const form = findForm(this.form, anchorId, templateId)

				const extractValidators = (
					fgss: (Field | Group | Subform)[],
				): {
					metadata: FieldMetadata
					validators: Validator[]
				}[] =>
					fgss.flatMap((fg) => {
						if (fg.clazz === 'group') {
							return extractValidators(fg.fields ?? [])
						} else if (fg.clazz === 'field') {
							const validators = fg.validators
							return validators?.length
								? [
										{
											metadata: {
												label: fg.label(),
												tags: fg.tags?.map((id) => ({ label: {}, ...normalizeCode({ id: id }), id: id! })),
											},
											validators,
										},
								  ]
								: []
						} else {
							return []
						}
					}) ?? []

				return form ? extractValidators(form.sections?.flatMap((f) => f.fields) ?? []) : []
			},
			this.language,
			undefined,
			{
				language: () => this.language ?? 'fr',
				summarize: () => (context: string, questions: [string, string][]) =>
					new Promise((resolve) => {
						setTimeout(() => {
							resolve(`${context} \n ${questions.map(([question, answer]) => `${question}: ${answer}`).join('\n')}`)
						}, 1000)
					}),
				translate: () => async (language: string, text: string) => this.form.translations ? defaultTranslationProvider(this.form.translations)(language, text) : text,
			},
		).init()

		this.formValuesContainer = initialisedFormValueContainer
		initialisedFormValueContainer.registerChangeListener((newValue) => {
			const fvc = this.formValuesContainer
			this.redoStack = []
			fvc && this.undoStack.push(fvc)
			this.formValuesContainer = newValue

			const toSave = this.formValuesContainer.getContactFormValuesContainer()

			setTimeout(() => {
				if (toSave === this.formValuesContainer?.getContactFormValuesContainer()) {
					console.log('Saving', toSave)

					// Save to the backend
					const allForms = toSave.allForms()
					Promise.all(
						allForms.map(async (f) => {
							if (!(db.forms ?? (db.forms = {}))[f.id!]) {
								makeForm(f).catch(console.error)
							}
						}),
					)
						.then(() =>
							Promise.all(
								Object.values(db.forms ?? {}).map(async (f) => {
									if (!allForms.some((af) => af.id === f.id) && this.observedForms[f.id!]) {
										destroyForm(f.id!).catch(console.error)
									}
								}),
							),
						)
						.then(() => {
							const c = toSave.coordinatedContact()
							;(db.contacts ?? (db.contacts = {}))[c.id!] = c
							localStorage.setItem('com.icure.storage', JSON.stringify(db))
						})
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
				renderer="${this.renderer}"
				.readOnly="${false}"
				.displayMetadata="${false}"
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
