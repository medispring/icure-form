import { html } from 'lit'
import { property } from 'lit/decorators.js'
import '../../iqr-date-picker'
import { VersionedMeta, VersionedValue } from '../../iqr-text-field'
import { CodeStub, Content } from '@icure/api'
import { ValuedField } from '../../common/valuedField'
export class DatePicker extends ValuedField<string, VersionedValue[]> {
	@property() metaProvider?: () => VersionedMeta[] = undefined
	@property() handleMetaChanged?: (id: string, language: string, value: { asString: string; content?: Content }) => void = undefined

	render() {
		const versionedValues = this.valueProvider?.()
		return (versionedValues?.length ? versionedValues : [undefined]).map((versionedValue, idx) => {
			return html`<iqr-date-picker-field
				.actionManager="${this.actionManager}"
				labelPosition=${this.labelPosition}
				label="${this.label}"
				.labels="${this.labels}"
				value=${this.value}
				.valueProvider=${() => versionedValue}
				.handleValueChanged=${(language: string, value: { asString: string; content?: Content }, serviceId?: string | undefined, codes?: CodeStub[]) =>
					this.handleValueChanged?.(language, value, versionedValue?.id || serviceId, codes ?? [])}
				.translationProvider=${this.translationProvider}
				defaultLanguage="${this.defaultLanguage}"
			></iqr-date-picker-field>`
		})
	}
}

customElements.define('iqr-form-date-picker', DatePicker)
