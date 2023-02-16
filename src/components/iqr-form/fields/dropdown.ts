import { css, CSSResultGroup, html, LitElement, TemplateResult } from 'lit'
import { property } from 'lit/decorators'

import '../../iqr-text-field'

export class DropdownField extends LitElement {
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

	togglePopup() {
		console.log('togglePopup')
	}

	render(): TemplateResult {
		return html`
			<iqr-text-field labelPosition=${this.labelPosition} label="${this.label}" schema="dropdown"
				><button @click="${this.togglePopup}" class="btn menu-trigger author"></button
			></iqr-text-field>
		`
	}
}

customElements.define('iqr-form-dropdown-field', DropdownField)
