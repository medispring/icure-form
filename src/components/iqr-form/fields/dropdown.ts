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
import { Content } from '@icure/api'

export class DropdownField extends LitElement {
	@property() labels: Labels = {
		[LabelPosition.float]: '',
	}
	@property() label = ''
	@property() labelPosition?: string = undefined
	@property() options?: OptionCode[] = []

	@property() placeholder = ''

	@property() optionProvider: () => Promise<OptionCode[]> = async () => this.options || []

	@property() valueProvider?: () => VersionedValue[] = undefined

	@property() value = ''
	@property() translate = true

	@property() handleValueChanged?: (id: string | undefined, language: string, value: { asString: string; content?: Content }) => void = undefined
	@property() translationProvider: (text: string) => string = (text) => text

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
						translate="${this.translate}"
						.options="${this.options}"
						.valueProvider=${() => versionedValue}
						.handleValueChanged=${(language: string, value: { asString: string; content?: Content }) => this.handleValueChanged?.(versionedValue?.id, language, value)}
						.labelPosition=${this.labelPosition}
						.optionProvider=${this.optionProvider}
						.translationProvider=${this.translationProvider}
					></iqr-dropdown-field>
				`,
		)
	}
	//.handleValueChanged=${(language: string, value: { asString: string; content?: Content }) => this.handleValueChanged?.(versionedValue?.id, language, value)}

	public async firstUpdated(): Promise<void> {
		if (this.options === undefined || this.options.length === 0) {
			this.options = await this.optionProvider()
		}
	}
}

customElements.define('iqr-form-dropdown-field', DropdownField)
