import { html, TemplateResult } from 'lit'
import { property } from 'lit/decorators.js'
import { Field } from '../../../common'
import { handleSingleMetadataChanged, handleSingleValueChanged, singleValueProvider } from '../utils'
import { Code } from '../../../model'
import { Suggestion } from '../../../../generic'

export class DropdownField extends Field {
	@property() ownersProvider: (terms: string[], ids?: string[], specialties?: string[]) => Promise<Suggestion[]> = async () => []
	@property() optionsProvider: (language: string, searchTerm?: string) => Promise<Code[]> = async () => []

	render(): TemplateResult[] {
		const versionedValues = this.valueProvider?.()
		return (versionedValues && Object.keys(versionedValues).length ? Object.keys(versionedValues) : [undefined]).map((id) => {
			return html`
				<icure-dropdown-field
					.readonly="${this.readonly}"
					.displayMetadata="${this.displayMetadata}"
					.translate="${this.translate}"
					label="${this.label}"
					.displayedLabels="${this.displayedLabels}"
					.valueProvider=${singleValueProvider(this.valueProvider, id)}
					.validationErrorsProvider=${this.validationErrorsProvider}
					.metadataProvider=${this.metadataProvider}
					.handleValueChanged=${handleSingleValueChanged(this.handleValueChanged, id)}
					.handleMetaChanged=${handleSingleMetadataChanged(this.handleMetadataChanged, id)}
					.optionsProvider=${this.optionsProvider}
					.translationProvider=${this.translationProvider}
					.ownersProvider=${this.ownersProvider}
					.defaultLanguage="${this.defaultLanguage}"
				></icure-dropdown-field>
			`
		})
	}
}
