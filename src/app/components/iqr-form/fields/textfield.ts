import {css, html, LitElement, property} from 'lit-element';
import '../../iqr-text-field';

class Textfield extends LitElement {
	@property() label: string = '';
	@property() multiline: boolean = false;
	@property() rows: number = 1;
	@property() grows: boolean = false;

	static get styles() {
		return [ css`
:host {
}
` ];
	}

	render() {
		return html`
		<iqr-text-field ?multiline="${this.multiline}" label="${this.label}"></iqr-text-field>
`
	}
}

customElements.define('iqr-form-textfield', Textfield);
