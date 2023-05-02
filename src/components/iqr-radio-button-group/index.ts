import { CSSResultGroup, html, LitElement, TemplateResult } from 'lit'
import { property, state } from 'lit/decorators.js'

// @ts-ignore
import baseCss from '../iqr-radio-button-group/styles/style.scss'
// @ts-ignore
import kendoCss from '../iqr-radio-button-group/styles/kendo.scss'
import { VersionedValue } from '../iqr-text-field'
import { CodeStub, Content } from '@icure/api'
import { generateLabel } from '../iqr-label/utils'
import { OptionCode } from '../common'

class IqrRadioButtonGroup extends LitElement {
	@property() options?: OptionCode[] = []

	@property() placeholder = ''

	@property() valueProvider?: () => VersionedValue | undefined = undefined

	@property() codifications = ''
	@property() type: 'radio' | 'checkbox' = 'radio'

	@property() value = ''

	@property() label = ''
	@property() labelPosition: 'float' | 'side' | 'above' | 'hidden' = 'float'

	@state() protected displayMenu = false

	@state() protected inputValues: string[] = []

	@property() handleValueChanged?: (language: string, value: { asString: string; value?: Content }) => void = undefined
	@property() translationProvider: (text: string) => string = (text) => text

	static get styles(): CSSResultGroup[] {
		return [baseCss, kendoCss]
	}

	private VALUES_SEPARATOR = '|'

	togglePopup(): void {
		this.displayMenu = !this.displayMenu
	}

	render(): TemplateResult {
		this.valuesProvider()
		return html`
			<div class="iqr-text-field">
				${generateLabel(this.label, this.labelPosition, this.translationProvider)}
				<div>
					${this.options?.map(
						(x) => html`<input class="iqr-checkbox" type="${this.type}" id="${x.id}" name="${this.label}" value="${x.id}" .checked=${this.inputValues.includes(
							this.translationProvider(x.text || ''),
						)} @change=${this.checkboxChange} text="${x.text}"></input>
				<label class="iqr-radio-button-label" for="${x.id}"><span>${!(x instanceof CodeStub) ? this.translationProvider(x?.text) : ''}</span></label>`,
					)}
				</div>
			</div>
		`
	}

	public async firstUpdated(): Promise<void> {
		const providedValue = this.valueProvider && this.valueProvider()
		const displayedVersionedValue = providedValue?.versions?.find((version) => version.value)?.value
		if (displayedVersionedValue && Object.keys(displayedVersionedValue)?.length) {
		}
	}

	public valuesProvider() {
		const providedValue = this.valueProvider && this.valueProvider()
		const displayedVersionedValue = providedValue?.versions?.find((version) => version.value)?.value
		if (displayedVersionedValue && Object.keys(displayedVersionedValue)?.length) {
			this.inputValues = displayedVersionedValue[Object.keys(displayedVersionedValue)[0]].split(this.VALUES_SEPARATOR)
		} else if (this.value) this.inputValues = this.value.split(this.VALUES_SEPARATOR)
	}

	public checkboxChange() {
		if (this.handleValueChanged) {
			const inputs = Array.from(this.shadowRoot?.querySelectorAll('input') || []).filter((input) => input.checked)
			const value = inputs.map((i) => Array.from(i.labels || []).map((label) => label.textContent)).join('|')
			this.handleValueChanged?.('en', {
				asString: value,
				value: new Content({
					stringValue: this.translationProvider(value),
				}),
			})
		}
	}
}

customElements.define('iqr-radio-button', IqrRadioButtonGroup)
