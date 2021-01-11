import {css, html, LitElement } from 'lit-element';
import '../../iqr-text-field';

export class MeasureField extends LitElement {
	static get styles() {
		return [ css`
:host {
}
` ];
	}

	render() {
		return html`
		<iqr-text-field></iqr-text-field>
`
	}
}

customElements.define('iqr-form-measure-field', MeasureField);
