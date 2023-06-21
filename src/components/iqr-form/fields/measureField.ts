import { html } from 'lit'
import { property } from 'lit/decorators.js'
import '../../iqr-text-field'
import { VersionedMeta, VersionedValue } from '../../iqr-text-field'
import { CodeStub, Content } from '@icure/api'
import { ValuedField } from '../../common/valuedField'

export class MeasureField extends ValuedField<string, VersionedValue[]> {
	@property() unit?: string = ''
	@property() metaProvider?: () => VersionedMeta[] = undefined
	@property() handleMetaChanged?: (id: string, language: string, value: { asString: string; content?: Content }) => void = undefined

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
					.handleValueChanged=${(language: string, value: { asString: string; content?: Content }, serviceId?: string | undefined, codes?: CodeStub[]) =>
						this.handleValueChanged?.(language, value, versionedValue?.id || serviceId, codes ?? [])}
					.handleMetaChanged=${this.handleMetaChanged}
					.translationProvider=${this.translationProvider}
				></iqr-text-field>
			`
		})
	}
}

customElements.define('iqr-form-measure-field', MeasureField)
