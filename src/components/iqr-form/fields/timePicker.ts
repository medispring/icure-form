import { html } from 'lit'

import '../../iqr-text-field'
import { VersionedValue } from '../../iqr-text-field'
import { ValuedField } from '../../common/valuedField'
import { CodeStub, Content } from '@icure/api'
export class TimePicker extends ValuedField<string, VersionedValue[]> {
	render() {
		const versionedValues = this.valueProvider?.()
		return (versionedValues?.length ? versionedValues : [undefined]).map((versionedValue, idx) => {
			return html`
				<iqr-text-field
					.actionManager="${this.actionManager}"
					.labels="${this.labels}"
					labelPosition=${this.labelPosition}
					label="${this.label}"
					schema="time"
					.valueProvider=${() => versionedValue}
					value="${this.value}"
					defaultLanguage="${this.defaultLanguage}"
					.handleValueChanged=${(language: string, value: { asString: string; content?: Content }, serviceId?: string | undefined, codes?: CodeStub[]) =>
						this.handleValueChanged?.(language, value, versionedValue?.id || serviceId, codes ?? [])}
					.translationProvider=${this.translationProvider}
				></iqr-text-field>
			`
		})
	}
}

customElements.define('iqr-form-time-picker', TimePicker)
