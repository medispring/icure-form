import { css, CSSResultGroup, html, LitElement, TemplateResult } from 'lit'
import { property } from 'lit/decorators'
import '../../iqr-text-field'
import { Labels, VersionedValue } from '../../iqr-text-field'

export class MeasureField extends LitElement {
	@property() label?: string = ''
	@property() labelPosition?: 'float' | 'side' | 'above' | 'hidden' = 'float'
	@property() labels?: Labels = undefined

	@property({ type: String }) value = ''

	@property() valueProvider?: () => VersionedValue | undefined = undefined

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
			<iqr-text-field
				labelPosition=${this.labelPosition}
				.labels="${this.labels}"
				label="${this.label}"
				schema="measure"
				value="${this.value}"
				.valueProvider="${this.valueProvider}"
			></iqr-text-field>
		`
	}
}

customElements.define('iqr-form-measure-field', MeasureField)
