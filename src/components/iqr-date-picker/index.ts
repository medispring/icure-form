import { ValuedField } from '../common/valuedField'
import { VersionedValue } from '../iqr-text-field'
import { html, TemplateResult } from 'lit'
import { generateLabel } from '../iqr-label/utils'
import { state } from 'lit/decorators.js'
import { dropdownPicto } from '../iqr-text-field/styles/paths'
import 'app-datepicker'
import { CustomEventDetail } from 'app-datepicker/dist/typings'
import { Content } from '@icure/api'
import { MAX_DATE } from 'app-datepicker/dist/constants'
import { toResolvedDate } from 'app-datepicker/dist/helpers/to-resolved-date'
import {Trigger} from "../iqr-form/model";

class IqrDatePickerField extends ValuedField<string, VersionedValue> {
	@state() protected displayDatePicker = false
	@state() protected inputValue = ''

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
						${this.displayDatePicker
							? html`<div id="menu" class="date-picker" @click="${(event: Event) => event.stopPropagation()}">
									<app-date-picker style="" max="${MAX_DATE}" min="${toResolvedDate('1970-01-01')}" @date-updated="${this.dateUpdated}"></app-date-picker>
							  </div>`
							: ''}
					</div>
				</div>
			</div>
		`
	}
	public firstUpdated(): void {
		this.registerStateUpdater(this.label || '')

		let providedValue = this.valueProvider && this.valueProvider()
		if (!providedValue) {
			providedValue = { id: '', versions: [] }
		}
		const displayedVersionedValue = providedValue?.versions?.find((version) => version.value)?.value
		if (displayedVersionedValue && Object.keys(displayedVersionedValue)?.length) {
			this.inputValue = displayedVersionedValue[Object.keys(displayedVersionedValue)[0]]
			this.value = this.inputValue
		} else if (this.value) {
			this.inputValue = this.value
		}
		if (this.value && this.handleValueChanged && this.inputValue) {
			this.handleValueChanged?.(
				this.displayedLanguage || this.defaultLanguage || 'en',
				{
					asString: this.inputValue,
					content: new Content({
						fuzzyDateValue: this.inputValue.split('/').reduce((acc, x) => x + '' + acc, ''),
					}),
				},
				undefined,
				[],
			)
		}
	}

	public dateUpdated(date: CustomEventDetail['date-updated']): void {
		this.inputValue = date.detail.value?.split('-').reverse().join('/') ?? ''
		this.handleValueChanged?.(
			this.displayedLanguage || this.defaultLanguage || 'en',
			{
				asString: this.inputValue,
				content: new Content({
					fuzzyDateValue: this.inputValue.split('/').reduce((acc, x) => x + '' + acc, ''),
				}),
			},
			undefined,
			[],
		)
		if (this.actionManager) {
			this.actionManager.launchActions(Trigger.CHANGE, this.label || '', { value: this.inputValue })
		}
		this.togglePopup()
	}

	public togglePopup(): void {
		this.displayDatePicker = !this.displayDatePicker
	}
}

customElements.define('iqr-date-picker-field', IqrDatePickerField)
