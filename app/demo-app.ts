import { css, html, LitElement } from 'lit'
import { IccHcpartyXApi } from '@icure/api'
import * as YAML from 'yaml'
import '../src/components/iqr-text-field'
import '../src/components/iqr-form'
import MiniSearch, { SearchResult } from 'minisearch'
import { DatePicker, DateTimePicker, Form, Group, MeasureField, MultipleChoice, NumberField, Section, TextField, TimePicker } from '../src/components/iqr-form/model'
import { codes } from './codes'

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
//import yamlForm from './form.yaml'
import yamlForm from './4919.yaml'

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

class DemoApp extends LitElement {
	private hcpApi: IccHcpartyXApi = new IccHcpartyXApi('https://kraken.svc.icure.cloud/rest/v1', { Authorization: 'Basic YWJkZW1vQGljdXJlLmNsb3VkOmtuYWxvdQ==' })

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
			iqr-text-field {
				display: block;
			}
			h2 {
				width: 100%;
				font-size: 2em;
				margin-top: 1em;
				margin-bottom: 0;
				font-family: 'Roboto', Helvetica, sans-serif;
			}
		`
	}

	async firstUpdated() {
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

	public options = [
		{ id: '1', code: '1', text: 'Form 1', terms: ['Form', '1'] },
		{ id: '2', code: '2', text: 'Form 2', terms: ['Form', '2'] },
		{ id: '3', code: '3', text: 'Form 3', terms: ['Form', '3'] },
		{ id: '4', code: '4', text: 'Form 4', terms: ['Form', '4'] },
		{ id: '5', code: '5', text: 'Form 5', terms: ['Form', '5'] },
	]

	async optionProvider(terms: string[], limit?: number) {
		const longestTerm = terms.reduce((w, t) => (w.length >= t.length ? w : t), '')
		const options = this.options.filter((x) => x.text.toLowerCase().includes(longestTerm.toLowerCase()))
		return Promise.resolve(limit && limit > 0 ? options.slice(0, limit) : options)
	}

	async ownersProvider(terms: string[]) {
		const longestTerm = terms.reduce((w, t) => (w.length >= t.length ? w : t), '')
		const candidates = await this.hcpApi.findByName(longestTerm)
		return (candidates.rows || []).map((x) => ({ id: x.id, text: [x.firstName, x.lastName].filter((x) => x?.length).join(' ') }))
	}

	render() {
		// noinspection DuplicatedCode
		const form = new Form(
			'Waiting room GP',
			[
				new Section('All fields', [
					new TextField('This field is a TextField', 'TextField'),
					new NumberField('This field is a NumberField', 'NumberField'),
					new MeasureField('This field is a MeasureField', 'MeasureField'),
					new DatePicker('This field is a DatePicker', 'DatePicker'),
					new TimePicker('This field is a TimePicker', 'TimePicker'),
					new DateTimePicker('This field is a DateTimePicker', 'DateTimePicker'),
					new MultipleChoice('This field is a MultipleChoice', 'MultipleChoice'),
				]),
				new Section('Grouped fields', [
					new Group('You can group fields together', [
						new TextField('This field is a TextField', 'TextField', undefined, undefined, undefined, ['CD-ITEM|diagnosis|1']),
						new NumberField('This field is a NumberField', 'NumberField'),
						new MeasureField('This field is a MeasureField', 'MeasureField'),
						new DatePicker('This field is a DatePicker', 'DatePicker'),
						new TimePicker('This field is a TimePicker', 'TimePicker'),
						new DateTimePicker('This field is a DateTimePicker', 'DateTimePicker'),
						new MultipleChoice('This field is a MultipleChoice', 'MultipleChoice'),
					]),
					new Group('And you can add tags and codes', [
						new TextField('This field is a TextField', 'TextField', 3, true, 'text-document', ['CD-ITEM|diagnosis|1'], ['BE-THESAURUS', 'ICD10'], { option: 'blink' }),
						new NumberField('This field is a NumberField', 'NumberField', ['CD-ITEM|parameter|1', 'CD-PARAMETER|bmi|1'], [], { option: 'bang' }),
						new MeasureField('This field is a MeasureField', 'MeasureField', ['CD-ITEM|parameter|1', 'CD-PARAMETER|heartbeat|1'], [], { unit: 'bpm' }),
						new MultipleChoice('This field is a MultipleChoice', 'MultipleChoice', 4, 4, [], ['KATZ'], { many: 'no' }),
					]),
				]),
			],
			'Fill in the patient information inside the waiting room',
		)

		const shortForm = new Form(
			'Semantic example',
			[
				new Section('Dates & Time', [new DatePicker('The Date', 'DatePicker'), new TimePicker('A TimePicker', 'DatePicker'), new DateTimePicker('DateTime', 'DateTimePicker')]),
				new Section('Completion & Links', [
					new TextField('This field is a TextField', 'TextField', 3, true, 'styled-text-with-codes', ['CD-ITEM|diagnosis|1'], [], {
						codeColorProvider: this.codeColorProvider,
						suggestionStopWords: stopWords,
						ownersProvider: this.ownersProvider.bind(this),
						linksProvider: this.linksProvider.bind(this),
						suggestionProvider: this.suggestionProvider.bind(this),
					}),
				]),
			],
			'Fill in the patient information inside the waiting room',
		)

		return html`
			<iqr-text-field
				suggestions
				links
				.codeColorProvider="${this.codeColorProvider.bind(this)}"
				.suggestionStopWords="${stopWords}"
				.ownersProvider="${this.ownersProvider.bind(this)}"
				.linksProvider="${this.linksProvider.bind(this)}"
				.suggestionProvider="${this.suggestionProvider.bind(this)}"
				value="[Céphalée de tension](c-ICPC://N01,c-ICD://G05.8,i-he://1234) persistante avec [migraine ophtalmique](c-ICPC://N02) associée. [Grosse fatigue](c-ICPC://K56). A suivi un [protocole de relaxation](x-doc://5678)"
				owner="M. Mennechet"
			></iqr-text-field>
			<iqr-radio-button-group-field .optionProvider="${this.optionProvider.bind(this)}"></iqr-radio-button-group-field>
			<iqr-form .form="${shortForm}" labelPosition="above" skin="kendo" theme="gray" renderer="form"></iqr-form>
			<iqr-form .form="${form}" labelPosition="above" skin="kendo" theme="gray" renderer="form"></iqr-form>
			<h3>A Yaml syntax is also available</h3>
			<pre>${yamlForm}</pre>
			<h3>is interpreted as</h3>
			<iqr-form .form="${Form.parse(YAML.parse(yamlForm))}" labelPosition="above" skin="kendo" theme="gray" renderer="form"></iqr-form>
		`
	}
}

customElements.define('demo-app', DemoApp)
