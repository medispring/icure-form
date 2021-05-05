import { css, html, LitElement, property } from 'lit-element'
import '../../iqr-text-field'

export class DatePicker extends LitElement {
	@property() label = ''
	@property() labelPosition?: string = undefined

	static get styles() {
		return [
			css`
				:host {
					display: block;
				}
			`,
		]
	}

	render() {
		return html` <iqr-text-field labelPosition=${this.labelPosition} label="${this.label}" schema="date" owner="Antoine Duchâteau" style="width: 100%"></iqr-text-field>`
	}
}

customElements.define('iqr-form-date-picker', DatePicker)
