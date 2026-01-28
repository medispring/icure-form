// @ts-ignore
import validators from './samples/000-validators.yaml'
// @ts-ignore
import tokenFields from './samples/01-token-fields.yaml'
// @ts-ignore
import bmi from './samples/1-BMI.yaml'
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
import note from './samples/9-note.yaml'
// @ts-ignore
import extra from './samples/8-extra.yaml'
// @ts-ignore
import control from './samples/7-control.yaml'
import obstetrics from './samples/obstetrics.json'
import prescription from './samples/prescription.json'
import obstetrics_followup_long from './samples/obstetrics-followup-long.json'
import obstetrics_followup_short from './samples/obstetrics-followup-short.json'
import obstetrics_followup_midwife from './samples/obstetrics-followup-midwife.json'
import incapacity from './samples/incapacity.json'
import { FormLayout, IccHcpartyXApi } from '@icure/api'
import { css, html, LitElement } from 'lit'
// @ts-ignore
import { convertLegacy } from '../src/conversion/icure-convert'
// @ts-ignore
const legacyForms = [obstetrics, incapacity, prescription, obstetrics_followup_short, obstetrics_followup_long, obstetrics_followup_midwife] as FormLayout[]

// @ts-ignore
import okido from './samples/physio/okido.yaml'
// @ts-ignore
import physio_assessment_full from './samples/physio/physio_assessment_full.yaml'
// @ts-ignore
import physio_clinical_decision from './samples/physio/physio_clinical_decision.yaml'
// @ts-ignore
import physio_closure from './samples/physio/physio_closure.yaml'
// @ts-ignore
import physio_exam_phy from './samples/physio/physio_exam_phy.yaml'
// @ts-ignore
import physio_exam_sub from './samples/physio/physio_exam_sub.yaml'
// @ts-ignore
import physio_followUp from './samples/physio/physio_followUp.yaml'
// @ts-ignore
import physio_uro_abdominoSpinalAssessment from './samples/physio/physio_uro_abdominoSpinalAssessment.yaml'
// @ts-ignore
import physio_uro_anorectalLeak from './samples/physio/physio_uro_anorectalLeak.yaml'
// @ts-ignore
import physio_uro_imperiousness from './samples/physio/physio_uro_imperiousness.yaml'
// @ts-ignore
import physio_uro_miscellaneous from './samples/physio/physio_uro_miscellaneous.yaml'
// @ts-ignore
import physio_uro_prolapse from './samples/physio/physio_uro_prolapse.yaml'
// @ts-ignore
import physio_uro_sexuality from './samples/physio/physio_uro_sexuality.yaml'
// @ts-ignore
import physio_uro_transit from './samples/physio/physio_uro_transit.yaml'
// @ts-ignore
import physio_uro_urinaryLeakage from './samples/physio/physio_uro_urinaryLeakage.yaml'

import { Form } from '../src/components/model'
import { state } from 'lit/decorators.js'
import YAML from 'yaml'

import './decorated-form'

import { DecoratedForm } from './decorated-form'

class DemoApp extends LitElement {
	private hcpApi: IccHcpartyXApi = new IccHcpartyXApi('https://kraken.svc.icure.cloud/rest/v1', { Authorization: 'Basic YWJkZW1vQGljdXJlLmNsb3VkOmtuYWxvdQ==' })
	private samples = [
		...[
			/*{ title: '2 - Preliminary psycho-social interview', form: Form.parse(YAML.parse(preliminary_psycho_social_interview)) },
			 */
			{ title: 'okido', form: Form.parse(YAML.parse(okido)) },
			{ title: 'physio_assessment_full', form: Form.parse(YAML.parse(physio_assessment_full)) },
			{ title: 'physio_clinical_decision', form: Form.parse(YAML.parse(physio_clinical_decision)) },
			{ title: 'physio_closure', form: Form.parse(YAML.parse(physio_closure)) },
			{ title: 'physio_exam_phy', form: Form.parse(YAML.parse(physio_exam_phy)) },
			{ title: 'physio_exam_sub', form: Form.parse(YAML.parse(physio_exam_sub)) },
			{ title: 'physio_followUp', form: Form.parse(YAML.parse(physio_followUp)) },
			{ title: 'physio_uro_abdominoSpinalAssessment', form: Form.parse(YAML.parse(physio_uro_abdominoSpinalAssessment)) },
			{ title: 'physio_uro_anorectalLeak', form: Form.parse(YAML.parse(physio_uro_anorectalLeak)) },
			{ title: 'physio_uro_imperiousness', form: Form.parse(YAML.parse(physio_uro_imperiousness)) },
			{ title: 'physio_uro_miscellaneous', form: Form.parse(YAML.parse(physio_uro_miscellaneous)) },
			{ title: 'physio_uro_prolapse', form: Form.parse(YAML.parse(physio_uro_prolapse)) },
			{ title: 'physio_uro_sexuality', form: Form.parse(YAML.parse(physio_uro_sexuality)) },
			{ title: 'physio_uro_transit', form: Form.parse(YAML.parse(physio_uro_transit)) },
			{ title: 'physio_uro_urinaryLeakage', form: Form.parse(YAML.parse(physio_uro_urinaryLeakage)) },
		], //.filter((x, idx) => idx === 0),
	]

	@state() private selectedForm: Form = this.samples[0].form
	static get styles() {
		return css`
			.container {
				display: flex;
				border: 1px solid #cad0d5;
			}

			.master {
				flex: 2;
				padding: 6px;
				border-right: 1px solid #cad0d5;
			}

			.master ul {
				list-style-type: none;
				padding: 0;
				display: flex;
				flex-direction: column;
				gap: 4px;
				margin: 8px 0;
			}

			.master ul li {
				font-family: 'Roboto', Helvetica, sans-serif;
				font-size: 12px;
				padding: 8px;
				background-color: #fcfcfd;
				border: 1px solid #dde3e7;
				cursor: pointer;
				border-radius: 2px;

				&.selected {
					background-color: #dce7f2;
					border-color: #dce7f2;
				}
			}

			.master ul li:hover {
				background-color: #dce7f2;
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
	async ownersProvider(terms: string[], ids?: string[], specialties?: string[]) {
		const longestTerm = terms.reduce((w, t) => (w.length >= t.length ? w : t), '')
		const candidates = await this.hcpApi.findByName(longestTerm)
		return (candidates.rows || []).map((x) => ({
			id: x.id,
			text: [x.firstName, x.lastName].filter((x) => x?.length).join(' '),
		}))
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
							<decorated-form id="${s.form.id ?? s.form.form}" .form="${s.form}"></decorated-form>
						</div>`
					})}
				</div>
			</div>
		`
	}
}

customElements.define('demo-app', DemoApp)
