import {css, html, LitElement, property} from 'lit-element';
import '../../iqr-text-field';

export class DateTimePicker extends LitElement {
	@property() label: string = '';

	static get styles() {
		return [ css`
:host {
}
` ];
	}

	render() {
		return html`
			<iqr-text-field label="${this.label}" schema="date-time"></iqr-text-field>
`
	}
}

customElements.define('iqr-form-date-time-picker', DateTimePicker);
