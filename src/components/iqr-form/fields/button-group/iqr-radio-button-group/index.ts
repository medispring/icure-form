import { CSSResultGroup, html, TemplateResult } from 'lit'
import { property, state } from 'lit/decorators.js'
// @ts-ignore
import baseCss from './styles/style.scss'
// @ts-ignore
import kendoCss from './styles/kendo.scss'
import { VersionedValue } from '../../text-field'
import { CodeStub, Content } from '@icure/api'
import { generateLabel } from '../../label'
import { OptionsField } from '../../../../common'
import { Trigger } from '../../../model'

export class IqrRadioButtonGroup extends OptionsField<string, VersionedValue> {
	@property() type: 'radio' | 'checkbox' = 'radio'
	@state() protected inputValues: string[] = []

	//override
	static get styles(): CSSResultGroup[] {
		return [baseCss, kendoCss]
	}

	private VALUES_SEPARATOR = '|'
	public checkboxChange() {
		if (!this.editable) return
		if (this.handleValueChanged) {
			const inputs = Array.from(this.shadowRoot?.querySelectorAll('input') || []).filter((input) => input.checked)
			const value = inputs.map((i) => Array.from(i.labels || []).map((label) => label.textContent)).join(this.VALUES_SEPARATOR)
			const codes = (this.options || [])
				.filter((option) => inputs.find((i) => i.id === option.id))
				.map((option) =>
					Boolean(option?.['text'])
						? new CodeStub({
								id: (this.codifications?.length ? this.codifications[0] + '|' : 'CUSTOM_OPTION|') + option.id + '|1',
								type: this.codifications?.length ? this.codifications[0] : 'CUSTOM_OPTION',
								code: option.id,
								version: '1',
						  })
						: option,
				)
			this.handleValueChanged?.(
				this.displayedLanguage || this.defaultLanguage || 'en',
				{
					asString: value,
					content: new Content({
						stringValue: value,
					}),
				},
				undefined,
				codes,
			)
			if (this.actionManager) {
				this.actionManager.launchActions(Trigger.CHANGE, this.label || '', { value: value, codes: codes, options: this.options || [] })
			}
		}
	}
	render(): TemplateResult {
		if (!this.display) {
			return html``
		}
		return html`
			<div class="iqr-text-field">
				${generateLabel(this.label ?? '', this.labelPosition ?? 'float', this.translationProvider)}
				${this.options?.map((x) => {
					const text = Boolean(x?.['text'])
						? this.translateText(x?.['text']) || ''
						: this.translateText(x?.['label']?.[this.defaultLanguage || 'en'] || x?.['label']?.[this.displayedLanguage || 'en'] || '')
					if (!this.editable) {
						return html`<div>
							<input
								class="iqr-checkbox"
								disabled
								type="${this.type}"
								id="${x.id}"
								name="${this.label}"
								value="${Boolean(x?.['text']) ? x.id : x?.['code']}"
								.checked=${this.inputValues.includes(text)}
								text="${text}"
							/><label class="iqr-radio-button-label" for="${x.id}"><span>${text}</span></label>
						</div>`
					}
					return html`<div>
						<input
							class="iqr-checkbox"
							type="${this.type}"
							id="${x.id}"
							name="${this.label}"
							value="${Boolean(x?.['text']) ? x.id : x?.['code']}"
							.checked=${this.inputValues.includes(text)}
							@change=${this.checkboxChange}
							text="${text}"
						/><label class="iqr-radio-button-label" for="${x.id}"><span>${text}</span></label>
					</div>`
				})}
			</div>
		`
	}
	public async firstUpdated(): Promise<void> {
		this.registerStateUpdater(this.label || '')

		const providedValue = this.valueProvider && this.valueProvider()
		const displayedVersionedValue = providedValue?.versions?.find((version) => version.value)?.value
		if (displayedVersionedValue && Object.keys(displayedVersionedValue)?.length) {
			this.inputValues = displayedVersionedValue[Object.keys(displayedVersionedValue)[0]].split(this.VALUES_SEPARATOR)
		} else if (this.value) this.inputValues = this.value.split(this.VALUES_SEPARATOR)
		if (this.inputValues.length) {
			this.handleValueChanged?.(
				this.displayedLanguage || this.defaultLanguage || 'en',
				{
					asString: this.inputValues.join(this.VALUES_SEPARATOR),
					content: new Content({
						stringValue: this.inputValues.join(this.VALUES_SEPARATOR),
					}),
				},
				undefined,
				[
					...(this.options || [])
						.filter((option) =>
							this.inputValues.some((i) =>
								Boolean(option?.['text'])
									? i === option?.['text']
									: i === option?.['label']?.[this.defaultLanguage || 'en'] || i === option?.['label']?.[this.displayedLanguage || 'en'],
							),
						)
						.map((option) =>
							Boolean(option?.['text'])
								? new CodeStub({
										id: (this.codifications?.length ? this.codifications[0] + '|' : 'CUSTOM_OPTION|') + option.id + '|1',
										type: this.codifications?.length ? this.codifications[0] : 'CUSTOM_OPTION',
										code: option.id,
										version: '1',
								  })
								: option,
						),
				],
			)
		}
	}
}

customElements.define('iqr-radio-button', IqrRadioButtonGroup)
