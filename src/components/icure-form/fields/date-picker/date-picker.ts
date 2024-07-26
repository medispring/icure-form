import { html } from 'lit'
import { handleSingleMetadataChanged, handleSingleValueChanged, singleValueProvider } from '../utils'
import { Field } from '../../../common'

export class DatePicker extends Field {
	render() {
		const versionedValues = this.valueProvider?.()
		return (versionedValues && Object.keys(versionedValues).length ? Object.keys(versionedValues) : [undefined]).map((id) => {
			return html`<icure-date-picker-field
				.readonly="${this.readonly}"
				.displayMetadata="${this.displayMetadata}"
				label="${this.label}"
				.displayedLabels="${this.displayedLabels}"
				.defaultLanguage="${this.defaultLanguage}"
				schema="decimal"
				.translationProvider=${this.translationProvider}
				.valueProvider=${singleValueProvider(this.valueProvider, id)}
				.validationErrorsProvider=${this.validationErrorsProvider}
				.metadataProvider=${this.metadataProvider}
				.handleValueChanged=${handleSingleValueChanged(this.handleValueChanged, id)}
				.handleMetaChanged=${handleSingleMetadataChanged(this.handleMetadataChanged, id)}
			></icure-date-picker-field>`
		})
	}
}
