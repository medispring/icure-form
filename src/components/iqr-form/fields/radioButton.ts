import { css, CSSResultGroup, html, LitElement } from 'lit'
import { property } from 'lit/decorators.js'
import '../../iqr-text-field'
import '../../iqr-radio-button-group'
import { Labels, VersionedValue } from '../../iqr-text-field'
import { OptionCode } from '../../common'

export class RadioButton extends LitElement {
	@property() label = ''
	@property() labelPosition?: string = undefined
	@property() labels?: Labels = undefined
	@property() options?: OptionCode[] = []
	@property() value?: string = ''
	@property() valueProvider?: () => VersionedValue[] = undefined
	@property() handleValueChanged?: (id: string | undefined, language: string, value: string) => void = undefined

	static get styles(): CSSResultGroup[] {
		return [
			css`
				:host {
				}
			`,
		]
	}

	render() {
		const versionedValues = this.valueProvider?.()
		return (versionedValues?.length ? versionedValues : [undefined]).map((versionedValue, idx) => {
			return html`
				<iqr-form-radio-button
					type="radio"
					.labels="${this.labels}"
					labelPosition="${this.labelPosition}"
					label="${this.label}"
					.options="${this.options}"
					value="${this.value}"
					.valueProvider=${() => versionedValue}
					.handleValueChanged=${(language: string, value: string) => this.handleValueChanged?.(versionedValue?.id, language, value)}
				></iqr-form-radio-button>
			`
		})
	}
}

customElements.define('iqr-radio-button', RadioButton)
