import {css, html, LitElement, property} from 'lit-element';
import '../../iqr-text-field';

export class MultipleChoice extends LitElement {
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

customElements.define('iqr-form-multiple-choice', MultipleChoice);
