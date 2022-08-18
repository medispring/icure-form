import { css, CSSResultGroup, html, LitElement, TemplateResult } from 'lit'
import { property } from 'lit/decorators'

import '../../iqr-text-field'

export class MultipleChoice extends LitElement {
	@property() label = ''
	@property() labelPosition?: string = undefined
	@property({ type: Boolean }) editable = true

	static get styles(): CSSResultGroup[] {
		return [
			css`
				:host {
				}
			`,
		]
	}

	render(): TemplateResult {
		return html` <iqr-text-field labelPosition=${this.labelPosition} label="${this.label}" .editable="${this.editable}"></iqr-text-field> `
	}
}

customElements.define('iqr-form-multiple-choice', MultipleChoice)
