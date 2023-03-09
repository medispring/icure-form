import { css, CSSResultGroup, html, LitElement, TemplateResult } from 'lit'
import { property } from 'lit/decorators'

import '../../iqr-text-field'
import { Labels } from '../../iqr-text-field'

export class NumberField extends LitElement {
	@property() label = ''
	@property() labelPosition?: string = undefined
	@property() labels?: Labels = undefined

	static get styles(): CSSResultGroup[] {
		return [
			css`
				:host {
				}
			`,
		]
	}

	render(): TemplateResult {
		return html`<iqr-text-field labelPosition=${this.labelPosition} label="${this.label}" .labels="${this.labels}" schema="decimal"></iqr-text-field>`
	}
}

customElements.define('iqr-form-number-field', NumberField)
