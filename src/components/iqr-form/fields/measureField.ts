import { css, CSSResult, html, LitElement, property, TemplateResult } from 'lit-element'
import '../../iqr-text-field'

export class MeasureField extends LitElement {
	@property() label = ''
	@property() labelPosition?: string = undefined

	static get styles(): CSSResult[] {
		return [
			css`
				:host {
				}
			`,
		]
	}

	render(): TemplateResult {
		return html` <iqr-text-field labelPosition=${this.labelPosition} label="${this.label}" schema="measure"></iqr-text-field> `
	}
}

customElements.define('iqr-form-measure-field', MeasureField)
