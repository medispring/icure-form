import { css, html, LitElement, property } from 'lit-element'
import '../../iqr-text-field'

export class TimePicker extends LitElement {
	@property() label = ''
	@property() labelPosition?: string = undefined

	static get styles() {
		return [
			css`
				:host {
				}
			`,
		]
	}

	render() {
		return html` <iqr-text-field labelPosition=${this.labelPosition} label="${this.label}" schema="time"></iqr-text-field> `
	}
}

customElements.define('iqr-form-time-picker', TimePicker)
