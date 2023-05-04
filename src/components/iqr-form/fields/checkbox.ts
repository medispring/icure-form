import { css, CSSResultGroup, html, LitElement } from 'lit'
import { property } from 'lit/decorators.js'
import '../../iqr-text-field'
import '../../iqr-radio-button-group'
import { OptionCode } from '../../common'
import { Labels, VersionedValue } from '../../iqr-text-field'
import { Content } from '@icure/api'

export class CheckBox extends LitElement {
	@property() label = ''
	@property() labelPosition?: string = undefined
	@property() labels?: Labels = undefined
	@property() options?: OptionCode[] = []
	@property() value?: string = ''
	@property() valueProvider?: () => VersionedValue[] = undefined
	@property() handleValueChanged?: (id: string | undefined, language: string, value: { asString: string; content?: Content }) => void = undefined
	@property() translationProvider: (text: string) => string = (text) => text
	@property() defaultLanguage?: string = 'en'

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
				<iqr-radio-button
					type="checkbox"
					.labels="${this.labels}"
					labelPosition="${this.labelPosition}"
					label="${this.label}"
					.options="${this.options}"
					value="${this.value}"
					.valueProvider=${() => versionedValue}
					.handleValueChanged=${(language: string, value: { asString: string; content?: Content }) => this.handleValueChanged?.(versionedValue?.id, language, value)}
					.translationProvider=${this.translationProvider}
					defaultLanguage="${this.defaultLanguage}"
				></iqr-radio-button>
			`
		})
	}
}

customElements.define('iqr-form-checkbox', CheckBox)
