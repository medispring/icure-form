import { css, CSSResultGroup, html, LitElement, TemplateResult } from 'lit'
import { property } from 'lit/decorators'

import '../../iqr-text-field'

export class NumberField extends LitElement {
	@property() label = ''
	@property() labelPosition?: string = undefined

	static get styles(): CSSResultGroup[] {
		return [
			css`
				:host {
				}
			`,
		]
	}

	render(): TemplateResult {
		return html`<iqr-text-field labelPosition=${this.labelPosition} label="${this.label}" schema="decimal"></iqr-text-field>`
	}
}

customElements.define('iqr-form-number-field', NumberField)
