import { css, CSSResult, html, LitElement, property, TemplateResult } from 'lit-element'
import '../../iqr-text-field'

export class DatePicker extends LitElement {
	@property() label = ''
	@property() labelPosition?: string = undefined

	static get styles(): CSSResult[] {
		return [
			css`
				:host {
					display: block;
				}
			`,
		]
	}

	render(): TemplateResult {
		return html` <iqr-text-field labelPosition=${this.labelPosition} label="${this.label}" schema="date" owner="Antoine Duchâteau" style="width: 100%"></iqr-text-field>`
	}
}

customElements.define('iqr-form-date-picker', DatePicker)
