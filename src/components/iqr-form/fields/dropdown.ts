import { html, TemplateResult } from 'lit'
import { property } from 'lit/decorators.js'
import '../../iqr-dropdown'
import { CodeStub, Content, HealthcareParty } from '@icure/api'
import { OptionsField } from '../../common/optionsField'
import { VersionedValue } from '../../iqr-text-field'

export class DropdownField extends OptionsField<string, VersionedValue[]> {
	@property() ownersProvider: (speciality: string[]) => HealthcareParty[] = () => []

	render(): TemplateResult[] {
		const versionedValues = this.valueProvider?.()
		return (versionedValues?.length ? versionedValues : [undefined]).map(
			(versionedValue, idx) =>
				html`
					<iqr-dropdown-field
						.actionManager="${this.actionManager}"
						.editable="${this.editable}"
						label="${this.label}"
						.translate="${this.translate}"
						.options="${this.options}"
						value="${this.value}"
						.valueProvider=${() => versionedValue}
						.handleValueChanged=${(language: string, value: { asString: string; content?: Content }, serviceId?: string | undefined, codes?: CodeStub[]) =>
							this.handleValueChanged?.(language, value, versionedValue?.id || serviceId, codes ?? [])}
						.labelPosition=${this.labelPosition}
						.optionsProvider=${this.optionsProvider}
						.translationProvider=${this.translationProvider}
						.ownersProvider=${this.ownersProvider}
						defaultLanguage="${this.defaultLanguage}"
						.codifications=${this.codifications}
					></iqr-dropdown-field>
				`,
		)
	}

	public async firstUpdated(): Promise<void> {
		if (this.options === undefined || this.options.length === 0) {
			this.options = await this.fetchInitialsOptions()
		}
	}
}

customElements.define('iqr-form-dropdown-field', DropdownField)
