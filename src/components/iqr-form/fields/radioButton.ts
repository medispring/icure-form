import { css, CSSResultGroup, html, LitElement, TemplateResult } from 'lit'
import { property, state } from 'lit/decorators'
import { Suggestion } from '../../iqr-radio-button-group/suggestion-palette'
import '../../iqr-text-field'
import '../../iqr-radio-button-group'

export class RadioButton extends LitElement {
	@property() label = ''
	@property() labelPosition?: string = undefined
	@property() optionsProvider: (codes: { type: string; code: string }[]) => string = (codes) => codes.map((c) => c.code).join(',')

	@state() protected availableOptions: Suggestion[] = []

	static get styles(): CSSResultGroup[] {
		return [
			css`
				:host {
				}
			`,
		]
	}

	render(): TemplateResult {
		return html` <iqr-radio-button-group-field labelPosition=${this.labelPosition} label="${this.label}" .optionsProvider=${this.optionsProvider}></iqr-radio-button-group-field> `
	}
}

customElements.define('iqr-form-radio-button', RadioButton)
