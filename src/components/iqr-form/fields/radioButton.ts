import { css, CSSResultGroup, html, LitElement } from 'lit'
import { property } from 'lit/decorators.js'
import '../../iqr-text-field'
import '../../iqr-radio-button-group'
import { LabelPosition, Labels, VersionedValue } from '../../iqr-text-field'
import { OptionCode } from '../../common'
import { CodeStub, Content } from '@icure/api'

export class RadioButton extends LitElement {
	/**
	 * Para-variables of the input field
	 */
	@property() labels: Labels = {
		[LabelPosition.float]: '',
	}
	@property() label = ''
	@property() labelPosition?: string = undefined
	/**
	 * Translation variables
	 */
	@property() defaultLanguage?: string = 'en'
	/**
	 * Input parameters
	 */
	@property() options?: (OptionCode | CodeStub)[] = []
	@property() codifications?: string[] = []
	@property() value?: string = ''
	@property() handleValueChanged?: (id: string | undefined, language: string, value: { asString: string; content?: Content }) => void = undefined

	/**
	 * Providers for the input field
	 */
	@property() valueProvider?: () => VersionedValue[] = undefined
	@property() translationProvider: (text: string) => string = (text) => text
	@property() optionsProvider: (codifications: string[], searchTerm?: string) => Promise<CodeStub[]> = async () => this.options || []

	static get styles(): CSSResultGroup[] {
		return [
			css`
				:host {
				}
			`,
		]
	}

	render() {
		const versionedValues = this.valueProvider?.()
		return (versionedValues?.length ? versionedValues : [undefined]).map((versionedValue, idx) => {
			return html`
				<iqr-radio-button
					type="radio"
					.labels="${this.labels}"
					labelPosition="${this.labelPosition}"
					label="${this.label}"
					.options="${this.options}"
					value="${this.value}"
					defaultLanguage="${this.defaultLanguage}"
					.valueProvider=${() => versionedValue}
					.handleValueChanged=${(language: string, value: { asString: string; content?: Content }) => this.handleValueChanged?.(versionedValue?.id, language, value)}
					.translationProvider=${this.translationProvider}
				></iqr-radio-button>
			`
		})
	}
}

customElements.define('iqr-form-radio-button', RadioButton)
