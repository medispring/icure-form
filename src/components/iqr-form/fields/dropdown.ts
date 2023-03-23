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
import { CodeStub } from '@icure/api'

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

	@property() handleValueChanged?: (id: string, language: string, value: string, codes: CodeStub) => void = undefined

	static get styles(): CSSResultGroup[] {
		return [baseCss, kendoCss]
	}

	render(): TemplateResult[] {
		const versionedValues = this.valueProvider?.()
		return (versionedValues?.length ? versionedValues : [undefined]).map(
			(versionedValue, idx) =>
				html`
					<iqr-dropdown-field label="${this.label}" .options="${this.options}" .valueProvider="${() => versionedValue}" labelPosition=${this.labelPosition}></iqr-dropdown-field>
				`,
		)
	}
	//.handleValueChanged=${(language: string, value: string) => this.handleValueChanged?.(versionedValue?.id, language, value)}

	public async firstUpdated(): Promise<void> {
		if (this.options === undefined || this.options.length === 0) {
			this.options = await this.optionProvider()
		}
	}
}

customElements.define('iqr-form-dropdown-field', DropdownField)
