import {css, html, LitElement, property} from 'lit-element';
import '../../iqr-text-field';

export class NumberField extends LitElement {
	@property() label: string = '';
	@property() labelPosition?: string = undefined

	static get styles() {
		return [ css`
:host {
}
` ];
	}

	render() {
		return html`
		<iqr-text-field labelPosition=${this.labelPosition} label="${this.label}" schema="decimal"></iqr-text-field>
`
	}
}

customElements.define('iqr-form-number-field', NumberField);
