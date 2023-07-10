import { html } from 'lit'
import '../../iqr-text-field'
import '../../iqr-radio-button-group'
import { VersionedValue } from '../../iqr-text-field'
import { CodeStub, Content } from '@icure/api'
import { OptionsField } from '../../common/optionsField'

export class RadioButton extends OptionsField<string, VersionedValue[]> {
	render() {
		const versionedValues = this.valueProvider?.()
		return (versionedValues?.length ? versionedValues : [undefined]).map((versionedValue, idx) => {
			return html`
				<iqr-radio-button
					.actionManager="${this.actionManager}"
					type="radio"
					.labels="${this.labels}"
					labelPosition="${this.labelPosition}"
					label="${this.label}"
					.options="${this.options}"
					value="${this.value}"
					defaultLanguage="${this.defaultLanguage}"
					.valueProvider=${() => versionedValue}
					.handleValueChanged=${(language: string, value: { asString: string; content?: Content }, serviceId?: string | undefined, codes?: CodeStub[]) =>
						this.handleValueChanged?.(language, value, versionedValue?.id || serviceId, codes ?? [])}
					.translationProvider=${this.translationProvider}
					.codifications=${this.codifications}
					.optionsProvider=${this.optionsProvider}
				></iqr-radio-button>
			`
		})
	}

	public async firstUpdated(): Promise<void> {
		if (this.options === undefined || this.options.length === 0) {
			this.options = await this.fetchInitialsOptions()
		}
	}
}

customElements.define('iqr-form-radio-button', RadioButton)
