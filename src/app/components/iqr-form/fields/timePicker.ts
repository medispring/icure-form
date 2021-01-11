import {css, html, LitElement, property} from 'lit-element';
import '../../iqr-text-field';

export class TimePicker extends LitElement {
	@property() label: string = '';

	static get styles() {
		return [ css`
:host {
}
` ];
	}

	render() {
		return html`
		<iqr-text-field label="${this.label}"></iqr-text-field>
`
	}
}

customElements.define('iqr-form-time-picker', TimePicker);
