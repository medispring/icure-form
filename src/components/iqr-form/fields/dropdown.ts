import { CSSResultGroup, html, LitElement, TemplateResult } from 'lit'
import { property } from 'lit/decorators.js'
// @ts-ignore
import baseCss from '../../iqr-text-field/styles/style.scss'
// @ts-ignore
import kendoCss from '../../iqr-text-field/styles/kendo.scss'

import { LabelPosition, Labels, VersionedValue } from '../../iqr-text-field'
import '../../iqr-dropdown'
// @ts-ignore
import { OptionCode } from '../../iqr-dropdown'
import { CodeStub, Content, HealthcareParty } from '@icure/api'

export class DropdownField extends LitElement {
	@property() labels: Labels = {
		[LabelPosition.float]: '',
	}
	@property() label = ''
	@property() labelPosition?: string = undefined
	@property() options?: (OptionCode | CodeStub)[] = []

	@property() placeholder = ''

	@property() optionsProvider: (codifications: string[], searchTerm?: string) => Promise<CodeStub[]> = async () => this.options || []
	@property() codifications: string[] = []
	@property() valueProvider?: () => VersionedValue[] = undefined

	@property() value = ''
	@property() translate = true

	@property() handleValueChanged?: (id: string | undefined, language: string, value: { asString: string; content?: Content }, codes: CodeStub[]) => void = undefined
	@property() translationProvider: (text: string) => string = (text) => text
	@property() ownersProvider: (speciality: string[]) => HealthcareParty[] = () => []
	@property() defaultLanguage?: string = 'en'

	static get styles(): CSSResultGroup[] {
		return [baseCss, kendoCss]
	}

	render(): TemplateResult[] {
		const versionedValues = this.valueProvider?.()
		return (versionedValues?.length ? versionedValues : [undefined]).map(
			(versionedValue, idx) =>
				html`
					<iqr-dropdown-field
						label="${this.label}"
						.translate="${this.translate}"
						.options="${this.options}"
						.valueProvider=${() => versionedValue}
						.handleValueChanged=${(language: string, value: { asString: string; content?: Content }, code?: CodeStub) =>
							this.handleValueChanged?.(versionedValue?.id, language, value, code ? [code] : [])}
						.labelPosition=${this.labelPosition}
						.optionsProvider=${this.optionsProvider}
						.translationProvider=${this.translationProvider}
						.ownersProvider=${this.ownersProvider}
						defaultLanguage="${this.defaultLanguage}"
					></iqr-dropdown-field>
				`,
		)
	}

	public async firstUpdated(): Promise<void> {
		if ((this.options === undefined || this.options.length === 0) && this.optionsProvider) {
			this.options = await this.optionsProvider(this.codifications || [])
		}
	}
}

customElements.define('iqr-form-dropdown-field', DropdownField)
