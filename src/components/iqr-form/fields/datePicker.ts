import { css, CSSResultGroup, html, LitElement, TemplateResult } from 'lit'
import { property } from 'lit/decorators'
import '../../iqr-text-field'

export class DatePicker extends LitElement {
	@property() label = ''
	@property() labelPosition?: string = undefined

	static get styles(): CSSResultGroup[] {
		return [
			css`
				:host {
					display: block;
				}
			`,
		]
	}

	render(): TemplateResult {
		return html` <iqr-text-field labelPosition=${this.labelPosition} label="${this.label}" schema="date" owner="Antoine Duchâteau" style="width: 100%"></iqr-text-field>`
	}
}

customElements.define('iqr-form-date-picker', DatePicker)
