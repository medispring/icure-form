import { css, CSSResultGroup, html, LitElement, TemplateResult } from 'lit'
import { property } from 'lit/decorators'
import '../../iqr-text-field'
import '../../iqr-radio-button-group'
import { Labels } from '../../iqr-text-field'
import { OptionCode } from '../../iqr-dropdown'

export class CheckBox extends LitElement {
	@property() label = ''
	@property() labelPosition?: string = undefined
	@property() labels?: Labels = undefined
	@property() options?: OptionCode[] = []

	static get styles(): CSSResultGroup[] {
		return [
			css`
				:host {
				}
			`,
		]
	}

	render(): TemplateResult {
		return html`
			<iqr-form-radio-button
				type="checkbox"
				.labels="${this.labels}"
				labelPosition="${this.labelPosition}"
				label="${this.label}"
				.options="${this.options}"
			></iqr-form-radio-button>
		`
	}
}

customElements.define('iqr-form-checkbox', CheckBox)
