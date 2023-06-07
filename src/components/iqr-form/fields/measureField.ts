import { css, CSSResultGroup, html, LitElement } from 'lit'
import { property } from 'lit/decorators.js'
import '../../iqr-text-field'
import { Labels, VersionedMeta, VersionedValue } from '../../iqr-text-field'
import { Content } from '@icure/api'

export class MeasureField extends LitElement {
	@property() label?: string = ''
	@property() labelPosition?: 'float' | 'side' | 'above' | 'hidden' = 'float'
	@property() labels?: Labels = undefined

	@property() value?: string = ''
	@property() unit?: string = ''

	@property() valueProvider?: () => VersionedValue[] = undefined
	@property() metaProvider?: () => VersionedMeta[] = undefined
	@property() handleValueChanged?: (id: string | undefined, language: string, value: { asString: string; content?: Content }) => void = undefined
	@property() handleMetaChanged?: (id: string, language: string, value: { asString: string; content?: Content }) => void = undefined
	@property() translationProvider: (text: string) => string = (text) => text
	@property() defaultLanguage?: string = 'en'

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
				<iqr-text-field
					labelPosition=${this.labelPosition}
					.labels="${this.labels}"
					label="${this.label}"
					schema="measure"
					defaultLanguage="${this.defaultLanguage}"
					value="${this.value} ${this.unit}"
					.valueProvider=${() => versionedValue}
					.metaProvider=${() => this.metaProvider?.()?.[idx]}
					.handleValueChanged=${(language: string, value: { asString: string; content?: Content }) => this.handleValueChanged?.(versionedValue?.id, language, value)}
					.handleMetaChanged=${this.handleMetaChanged}
					.translationProvider=${this.translationProvider}
				></iqr-text-field>
			`
		})
	}
}

customElements.define('iqr-form-measure-field', MeasureField)
