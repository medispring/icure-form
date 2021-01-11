import {css, html, LitElement, property} from 'lit-element';
import '../../iqr-text-field';

class Textfield extends LitElement {
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

customElements.define('iqr-form-textfield', Textfield);
