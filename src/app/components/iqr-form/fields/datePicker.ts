import {css, html, LitElement } from 'lit-element';
import '../../iqr-text-field';

export class DatePicker extends LitElement {
	static get styles() {
		return [ css`
:host {
}
` ];
	}

	render() {
		return html`
			<iqr-text-field textRegex="^([0-9]?[0-9]?[/.-]?[0-9]?[0-9]?[/.-]?[0-9]?[0-9]?[0-9]?[0-9]?)$" schema="date" owner="Antoine Duchâteau"></iqr-text-field>`
	}
}

customElements.define('iqr-form-date-picker', DatePicker);
