import {css, html, LitElement } from 'lit-element';
import '../../iqr-text-field';

class Textfield extends LitElement {
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

customElements.define('iqr-form-textfield', Textfield);
