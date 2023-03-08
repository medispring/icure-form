import { CSSResultGroup, html, LitElement, TemplateResult } from 'lit'
import { property } from 'lit/decorators'

// @ts-ignore
import baseCss from '../../iqr-text-field/styles/style.scss'
// @ts-ignore
import kendoCss from '../../iqr-text-field/styles/kendo.scss'

import { LabelPosition, Labels, VersionedValue } from '../../iqr-text-field'
import '../../iqr-dropdown'
import { OptionCode } from '../../iqr-dropdown'

export class DropdownField extends LitElement {
	@property() labels: Labels = {
		[LabelPosition.float]: '',
	}

	@property() options?: OptionCode[] = []

	@property() placeholder = ''

	@property() optionProvider: () => Promise<OptionCode[]> = async () => this.options || []

	@property() valueProvider?: () => VersionedValue | undefined = undefined

	@property({ type: String }) value = ''

	static get styles(): CSSResultGroup[] {
		return [baseCss, kendoCss]
	}

	render(): TemplateResult {
		return html` <iqr-dropdown-field label="Form" .options="${this.options}"></iqr-dropdown-field> `
	}

	public async firstUpdated(): Promise<void> {
		if (this.options === undefined || this.options.length === 0) {
			this.options = await this.optionProvider()
		}
	}
}

customElements.define('iqr-form-dropdown-field', DropdownField)
