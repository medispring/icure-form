import { CSSResultGroup, html, LitElement, TemplateResult } from 'lit'
import { property, state } from 'lit/decorators.js'

// @ts-ignore
import baseCss from '../iqr-text-field/styles/style.scss'
// @ts-ignore
import kendoCss from '../iqr-text-field/styles/kendo.scss'
import { VersionedValue } from '../iqr-text-field'
import { CodeStub, Content } from '@icure/api'
import { OptionCode } from '../common'
import { generateLabel } from '../iqr-label/utils'
import { dropdownPicto } from '../iqr-text-field/styles/paths'

class IqrDropdownField extends LitElement {
	@property() options?: (OptionCode | CodeStub)[] = []

	@property() placeholder = ''

	@property() valueProvider?: () => VersionedValue | undefined = undefined

	@property({ type: String }) codifications = ''

	@property({ type: String }) value = ''
	@property({ type: Boolean }) translate = true

	@property() label = ''
	@property() labelPosition: 'float' | 'side' | 'above' | 'hidden' = 'float'
	@property() defaultLanguage = 'en'

	@state() protected displayedLanguage = this.defaultLanguage

	@state() protected displayMenu = false

	@state() protected inputValue = ''

	@property() handleValueChanged?: (language: string, value: { asString: string; value?: Content }) => void = undefined

	@property() optionProvider: () => Promise<OptionCode[]> = async () => []
	@property() translationProvider: (text: string) => string = (text) => text

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
				this.inputValue = (!(option instanceof CodeStub) ? (this.translate ? this.translationProvider(option?.text || '') : option?.text) : option?.label?.['fr']) ?? ''
				this.displayMenu = false
				if (this.handleValueChanged) {
					this.handleValueChanged?.(this.displayedLanguage, {
						asString: this.inputValue,
						value: new Content({
							stringValue: this.inputValue,
						}),
					})
				}
				return true
			}
			return false
		}
	}

	render(): TemplateResult {
		return html`
			<div id="root" class="iqr-text-field ${this.inputValue != '' ? 'has-content' : ''}" data-placeholder=${this.placeholder}>
				${generateLabel(this.label, this.labelPosition, this.translationProvider)}
				<div class="iqr-input" @click="${this.togglePopup}" id="test">
					<div id="editor">${this.inputValue}</div>
					<div id="extra" class=${'extra forced'}>
						<button class="btn select-arrow">${dropdownPicto}</button>
						${this.displayMenu
							? html`
									<div id="menu" class="options">
										${this.options?.map(
											(x) =>
												html`<button @click="${this.handleOptionButtonClicked(x.id)}" id="${x.id}" class="option">
													${!(x instanceof CodeStub) ? (this.translate ? this.translationProvider(x.text) : x.text || '') : ''}
												</button>`,
										)}
									</div>
							  `
							: ''}
					</div>
				</div>
			</div>
		`
	}

	public firstUpdated(): void {
		document.addEventListener('click', (event) => {
			if (!event.composedPath().includes(this)) {
				this.displayMenu = false
				event.stopPropagation()
			}
		})
		const providedValue = this.valueProvider && this.valueProvider()
		const displayedVersionedValue = providedValue?.versions?.find((version) => version.value)?.value
		if (displayedVersionedValue && Object.keys(displayedVersionedValue)?.length) {
			this.inputValue = displayedVersionedValue[Object.keys(displayedVersionedValue)[0]]
			this.value =
				this.options?.find((option) => {
					return !(option instanceof CodeStub) ? option.text === this.inputValue : this.translationProvider(option?.label?.[this.displayedLanguage] || '') === this.inputValue
				})?.id ?? ''
		} else if (this.value) this.inputValue = this.value
	}
}

customElements.define('iqr-dropdown-field', IqrDropdownField)
