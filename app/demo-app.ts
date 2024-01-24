// @ts-ignore
import bmi from './samples/0-BMI.yaml'
// @ts-ignore
import time_of_appointment from './samples/1-time-of-appointment.yaml'
// @ts-ignore
import preliminary_psycho_social_interview from './samples/2-preliminary-psycho-social-interview.yaml'
// @ts-ignore
import preliminary_medical_interview from './samples/3-preliminary-medical-interview.yaml'
// @ts-ignore
import termination_of_pregnancy_curetage from './samples/4-termination-of-pregnancy-curetage.yaml'
// @ts-ignore
import interruption_of_pregnancy_medical_part_1 from './samples/5-interruption-of-pregnancy-medical-part-1.yaml'
// @ts-ignore
import interruption_of_pregnancy_medical_part_2 from './samples/6-interruption-of-pregnancy-medical-part-2.yaml'
// @ts-ignore
import post_curetage from './samples/7-post-curetage.yaml'
// @ts-ignore
import extra from './samples/9-extra.yaml'
// @ts-ignore
import control from './samples/10-control.yaml'
import obstetrics from './samples/obstetrics.json'
import prescription from './samples/prescription.json'
import obstetrics_followup_long from './samples/obstetrics-followup-long.json'
import obstetrics_followup_short from './samples/obstetrics-followup-short.json'
import obstetrics_followup_midwife from './samples/obstetrics-followup-midwife.json'
import incapacity from './samples/incapacity.json'
import { CodeStub, FormLayout, IccHcpartyXApi } from '@icure/api'
import { css, html, LitElement } from 'lit'
import { convertLegacy } from '../src/conversion/icure-convert'

const legacyForms = [obstetrics, incapacity, prescription, obstetrics_followup_short, obstetrics_followup_long, obstetrics_followup_midwife] as FormLayout[]

import { Form } from '../src/components/model'
import { state } from 'lit/decorators.js'
import YAML from 'yaml'

import './decorated-form'

import { DecoratedForm } from './decorated-form'

const ultrasound = [
	{ id: 'ULTRASOUND-EVALUATION|01|1', code: '01', type: 'ULTRASOUND_EVALUATION', version: '1', label: { en: 'abortion-forms.field-options.EMPTY-CAVITY' } },
	{ id: 'ULTRASOUND-EVALUATION|02|1', code: '02', type: 'ULTRASOUND_EVALUATION', version: '1', label: { en: 'abortion-forms.field-options.CLOTS' } },
	{ id: 'ULTRASOUND-EVALUATION|03|1', code: '03', type: 'ULTRASOUND_EVALUATION', version: '1', label: { en: 'abortion-forms.field-options.RETENTION' } },
	{ id: 'ULTRASOUND-EVALUATION|04|1', code: '04', type: 'ULTRASOUND_EVALUATION', version: '1', label: { en: 'abortion-forms.field-options.NON-PROGRESSIVE-PREGNANCY' } },
	{ id: 'ULTRASOUND-EVALUATION|05|1', code: '05', type: 'ULTRASOUND_EVALUATION', version: '1', label: { en: 'abortion-forms.field-options.PROGRESSIVE-PREGNANCY' } },
	{ id: 'ULTRASOUND-EVALUATION|06|1', code: '06', type: 'ULTRASOUND_EVALUATION', version: '1', label: { en: 'abortion-forms.field-options.DIFFUSE-IMAGE' } },
]

class DemoApp extends LitElement {
	private hcpApi: IccHcpartyXApi = new IccHcpartyXApi('https://kraken.svc.icure.cloud/rest/v1', { Authorization: 'Basic YWJkZW1vQGljdXJlLmNsb3VkOmtuYWxvdQ==' })
	private samples = [
		[
			{ title: '0 - BMI', form: Form.parse(YAML.parse(bmi)) },
			{ title: '1 - Time of appointment', form: Form.parse(YAML.parse(time_of_appointment)) },
			{ title: 'Obstetrics', form: convertLegacy(obstetrics as FormLayout, legacyForms) },
			{ title: '2 - Preliminary psycho-social interview', form: Form.parse(YAML.parse(preliminary_psycho_social_interview)) },
			{ title: '3 - Preliminary medical interview', form: Form.parse(YAML.parse(preliminary_medical_interview)) },
			{ title: '4 - Termination of pregnancy curetage', form: Form.parse(YAML.parse(termination_of_pregnancy_curetage)) },
			{ title: '5 - Interuption of pregnancy medical part 1', form: Form.parse(YAML.parse(interruption_of_pregnancy_medical_part_1)) },
			{ title: '6 - Interuption of pregnancy medical part 2', form: Form.parse(YAML.parse(interruption_of_pregnancy_medical_part_2)) },
			{ title: '7 - Post curetage', form: Form.parse(YAML.parse(post_curetage)) },
			{ title: '9 - Extra', form: Form.parse(YAML.parse(extra)) },
			{ title: '10 - Control', form: Form.parse(YAML.parse(control)) },
		][0],
	]

	@state() private selectedForm: Form = this.samples[0].form
	static get styles() {
		return css`
			body {
				font-family: Arial, sans-serif;
			}

			.container {
				display: flex;
				border: 1px solid #ddd;
				padding: 0;
			}

			.master {
				flex: 1;
				padding: 10px;
				border-right: 1px solid #ddd;
			}

			.master ul {
				list-style-type: none;
				padding: 0;
			}

			.master ul li {
				padding: 8px;
				margin-bottom: 5px;
				background-color: #f4f4f4;
				border: 1px solid #ddd;
				cursor: pointer;
			}

			.master ul li:hover {
				background-color: #e9e9e9;
			}

			.detail {
				background-color: #ffffff;
				flex: 9;
				padding: 10px;
			}
		`
	}

	connectedCallback() {
		super.connectedCallback()
		window.onkeydown = (event) => {
			if ((event.key === 'Z' || event.key === 'z') && event.metaKey) {
				console.log(event.key)
				const target = this.shadowRoot?.getElementById(this.selectedForm.id ?? this.selectedForm.form)
				if (!target) {
					return
				}
				if (event.key === 'Z') {
					console.log('redo')
					event.preventDefault()
					;(target as DecoratedForm).redo()
				} else if (event.key === 'z') {
					console.log('undo')
					event.preventDefault()
					;(target as DecoratedForm).undo()
				}
			}
		}
	}
	async ownersProvider(terms: string[]) {
		const longestTerm = terms.reduce((w, t) => (w.length >= t.length ? w : t), '')
		const candidates = await this.hcpApi.findByName(longestTerm)
		return (candidates.rows || []).map((x) => ({
			id: x.id,
			text: [x.firstName, x.lastName].filter((x) => x?.length).join(' '),
		}))
	}

	async codesProvider(codifications: string[]): Promise<CodeStub[]> {
		const codes: CodeStub[] = []
		if (codifications.find((code) => code === 'ULTRASOUND-EVALUATION')) {
			ultrasound.map((x) => codes.push(new CodeStub(x)))
		}
		return codes
	}
	render() {
		return html`
			<div class="container">
				<div class="master">
					<ul>
						${this.samples.map((s) => {
							return html`<li class="${s.form === this.selectedForm ? 'selected' : ''}" @click="${() => (this.selectedForm = s.form)}">${s.title}</li>`
						})}
					</ul>
				</div>
				<div class="detail">
					${this.samples.map((s) => {
						return html`<div style="${s.form === this.selectedForm ? '' : 'display: none;'}">
							<decorated-form id="${s.form.id ?? s.form.form}" .form="${s.form}" .codesProvider="${this.codesProvider.bind(this)}"></decorated-form>
						</div>`
					})}
				</div>
			</div>
		`
	}
}

customElements.define('demo-app', DemoApp)
