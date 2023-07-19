import { html, TemplateResult } from 'lit'
import { state } from 'lit/decorators.js'
import { CodeStub, Content } from '@icure/api'
import { generateLabel } from '../iqr-label/utils'
import { dropdownPicto } from '../iqr-text-field/styles/paths'
import { OptionsField } from '../common/optionsField'
import { VersionedValue } from '../iqr-text-field'
import { Trigger } from '../iqr-form/model'

class IqrDropdownField extends OptionsField<string, VersionedValue> {
	@state() protected displayMenu = false

	@state() protected inputValue = ''

	togglePopup(): void {
		if (!this.editable) return
		this.displayMenu = !this.displayMenu
	}

	handleOptionButtonClicked(id: string | undefined): (e: Event) => boolean {
		return (e: Event) => {
			e.preventDefault()
			e.stopPropagation()
			if (id) {
				const option = (this.options || []).find((option) => option.id === id)
				const code = option instanceof CodeStub ? option : new CodeStub({ id: 'CUSTOM_OPTION|' + id + '|1', type: 'CUSTOM_OPTION', code: id, version: '1' })
				this.value = id
				this.inputValue =
					(!(option instanceof CodeStub)
						? this.translate
							? this.translateText(option?.text || '')
							: option?.text
						: option?.label?.[this.displayedLanguage || this.defaultLanguage || 'en']) ?? ''
				this.displayMenu = false
				if (this.handleValueChanged) {
					this.handleValueChanged?.(
						this.displayedLanguage || this.defaultLanguage || 'en',
						{
							asString: this.inputValue,
							content: new Content({
								stringValue: this.inputValue || '',
							}),
						},
						undefined,
						[code],
					)
				}
				if (this.actionManager) {
					this.actionManager.launchActions(Trigger.CHANGE, this.label || '', { value: this.inputValue, id: this.value, code: code, options: this.options || [] })
				}
				return true
			}
			return false
		}
	}

	render(): TemplateResult {
		if (!this.display) {
			return html``
		}
		return html`
			<div id="root" class="iqr-text-field ${this.inputValue != '' ? 'has-content' : ''}" data-placeholder=${this.placeholder}>
				${generateLabel(this.label ?? '', this.labelPosition ?? 'float', this.translationProvider)}
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
													${!(x instanceof CodeStub)
														? this.translate
															? this.translationProvider(x.text)
															: x.text || ''
														: x?.label?.[this.displayedLanguage || this.defaultLanguage || 'en'] || ''}
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

	public async firstUpdated(): Promise<void> {
		this.options = await this.optionsProvider(this.codifications || [], '')
		this.registerStateUpdater(this.label || '')

		document.addEventListener('click', (event) => {
			if (!event.composedPath().includes(this)) {
				this.displayMenu = false
				event.stopPropagation()
			}
		})
		let providedValue = this.valueProvider && this.valueProvider()
		if (!providedValue) {
			providedValue = { id: '', versions: [] }
		}
		const displayedVersionedValue = providedValue?.versions?.find((version) => version.value)?.value
		if (displayedVersionedValue && Object.keys(displayedVersionedValue)?.length) {
			this.inputValue = displayedVersionedValue[Object.keys(displayedVersionedValue)[0]]
			this.value =
				this.options?.find((option) => {
					return !(option instanceof CodeStub) ? option.text === this.inputValue : this.translateText(option?.label?.[this.displayedLanguage || 'en'] || '') === this.inputValue
				})?.id ?? ''
		} else if (this.value) {
			this.inputValue = this.value
			this.value =
				this.options?.find((option) => {
					return !(option instanceof CodeStub) ? option.text === this.inputValue : this.translateText(option?.label?.[this.displayedLanguage || 'en'] || '') === this.inputValue
				})?.id ?? ''
		}
		if (this.value && this.handleValueChanged && this.inputValue) {
			this.handleValueChanged?.(
				this.displayedLanguage || this.defaultLanguage || 'en',
				{
					asString: this.inputValue,
					content: new Content({
						stringValue: this.inputValue || '',
					}),
				},
				undefined,
				[
					this.options?.find((option) => option instanceof CodeStub && option.id === this.value) ??
						new CodeStub({ id: 'CUSTOM_OPTION|' + this.value + '|1', type: 'CUSTOM_OPTION', code: this.value, version: '1' }),
				],
			)
		}
	}
}

customElements.define('iqr-dropdown-field', IqrDropdownField)
