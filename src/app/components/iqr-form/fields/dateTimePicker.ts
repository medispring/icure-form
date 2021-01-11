import {css, html, LitElement } from 'lit-element';
import '../../iqr-text-field';

export class DateTimePicker extends LitElement {
	static get styles() {
		return [ css`
:host {
}
` ];
	}

	render() {
		return html`
			<iqr-text-field schema="date-time"></iqr-text-field>
`
	}
}

customElements.define('iqr-form-date-time-picker', DateTimePicker);
