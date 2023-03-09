import { css, CSSResultGroup, html, LitElement, TemplateResult } from 'lit'
import { property, state } from 'lit/decorators'
import { Suggestion } from '../../iqr-radio-button-group/suggestion-palette'
import '../../iqr-text-field'
import '../../iqr-radio-button-group'
import { Labels } from '../../iqr-text-field'

export class CheckBox extends LitElement {
	@property() label = ''
	@property() labelPosition?: string = undefined
	@property() optionProvider: (terms: string[], limit: number) => Promise<Suggestion[]> = async () => this.options || []
	@property() options?: Suggestion[] = []
	@property() labels?: Labels = undefined

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
		return html`
			<iqr-radio-button-group-field
				schema="checkbox"
				.labels="${this.labels}"
				labelPosition="${this.labelPosition}"
				label="${this.label}"
				.options="${this.options}"
			></iqr-radio-button-group-field>
		`
	}
}

customElements.define('iqr-form-checkbox', CheckBox)
