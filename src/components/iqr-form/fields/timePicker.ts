import { css, CSSResultGroup, html, LitElement } from 'lit'
import { property } from 'lit/decorators.js'

import '../../iqr-text-field'
import { Labels, VersionedValue } from '../../iqr-text-field'
export class TimePicker extends LitElement {
	@property() label = ''
	@property() labelPosition?: string = undefined
	@property() valueProvider?: () => VersionedValue[] = undefined
	@property() labels?: Labels = undefined
	@property() value?: string = ''
	@property() handleValueChanged?: (id: string | undefined, language: string, value: string) => void = undefined
	@property() translationProvider: (text: string) => string = (text) => text

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
					.labels="${this.labels}"
					labelPosition=${this.labelPosition}
					label="${this.label}"
					schema="time"
					.valueProvider=${() => versionedValue}
					value="${this.value}"
					.handleValueChanged=${(language: string, value: string) => this.handleValueChanged?.(versionedValue?.id, language, value)}
					.translationProvider=${this.translationProvider}
				></iqr-text-field>
			`
		})
	}
}

customElements.define('iqr-form-time-picker', TimePicker)
