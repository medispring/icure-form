import { CSSResultGroup, html, LitElement, TemplateResult } from 'lit'
import { property, state } from 'lit/decorators'

// @ts-ignore
import baseCss from '../iqr-radio-button-group/styles/style.scss'
// @ts-ignore
import kendoCss from '../iqr-radio-button-group/styles/kendo.scss'
import { VersionedValue } from '../iqr-text-field'
import { CodeStub } from '@icure/api'
import { generateLabel } from '../iqr-label/utils'

export interface OptionCode {
	id: string
	text: string
}

class IqrRadioButtonGroup extends LitElement {
	@property() options?: (OptionCode | CodeStub)[] = []

	@property() placeholder = ''

	@property() valueProvider?: () => VersionedValue | undefined = undefined

	@property() codifications = ''
	@property() type: 'radio' | 'checkbox' = 'radio'

	@property() value = ''

	@property() label = ''
	@property() labelPosition: 'float' | 'side' | 'above' | 'hidden' = 'float'

	@state() protected displayMenu = false

	@state() protected inputValue = ''

	@property() handleValueChanged?: (id: string | undefined, language: string, value: string, codes: CodeStub) => void = undefined

	static get styles(): CSSResultGroup[] {
		return [baseCss, kendoCss]
	}

	togglePopup(): void {
		this.displayMenu = !this.displayMenu
	}

	handleOptionButtonClicked(id: string | undefined): (e: Event) => boolean {
		return (e: Event) => {
			e.preventDefault()
			e.stopPropagation()
			if (id) {
				const option = (this.options || []).find((option) => option.id === id)
				this.value = id
				this.inputValue = (!(option instanceof CodeStub) ? option?.text : option?.label?.['fr']) ?? ''
				this.displayMenu = false
				//this.handleValueChanged()
				return true
			}
			return false
		}
	}

	render(): TemplateResult {
		return html`
			<div class="iqr-text-field">
				${generateLabel(this.label, this.labelPosition)}
				<div>
					${this.options?.map(
						(x) => html`<input type="${this.type}" id="${x.id}" name="${this.label}" value="${x.id}"></input>
				<label class="iqr-radio-button-label" for="${x.id}"><span>${!(x instanceof CodeStub) ? x?.text : x?.label?.['fr']}</span></label>`,
					)}
				</div>
			</div>
		`
	}

	public async firstUpdated(): Promise<void> {
		const providedValue = this.valueProvider && this.valueProvider()
		const displayedVersionedValue = providedValue?.versions?.find((version) => version.value)?.value
		if (displayedVersionedValue && Object.keys(displayedVersionedValue)?.length) {
			this.inputValue = displayedVersionedValue[Object.keys(displayedVersionedValue)[0]]
			this.value =
				this.options?.find((option) => {
					return !(option instanceof CodeStub) ? option.text === this.inputValue : option?.label?.['fr'] === this.inputValue
				})?.id ?? ''
		}
		return
	}
}

customElements.define('iqr-form-radio-button', IqrRadioButtonGroup)
