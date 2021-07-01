import { css, CSSResultGroup, html, LitElement, TemplateResult } from 'lit'
import { property } from 'lit/decorators'

import '../../iqr-text-field'

export class TimePicker extends LitElement {
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
		return html` <iqr-text-field labelPosition=${this.labelPosition} label="${this.label}" schema="time"></iqr-text-field> `
	}
}

customElements.define('iqr-form-time-picker', TimePicker)
