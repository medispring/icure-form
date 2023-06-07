import { css, CSSResultGroup, html, LitElement } from 'lit'
import { property } from 'lit/decorators.js'

import '../../iqr-text-field'
import { Labels, VersionedValue } from '../../iqr-text-field'

export class MultipleChoice extends LitElement {
	@property() label = ''
	@property() labelPosition?: string = undefined
	@property() labels?: Labels = undefined
	@property() value?: string = ''
	@property() valueProvider?: () => VersionedValue[] = undefined
	@property() handleValueChanged?: (id: string | undefined, language: string, value: string) => void = undefined
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
			return html`<iqr-text-field
				.labels="${this.labels}"
				value="${this.value}"
				labelPosition=${this.labelPosition}
				label="${this.label}"
				defaultLanguage="${this.defaultLanguage}"
				.valueProvider=${() => versionedValue}
				.handleValueChanged=${(language: string, value: string) => this.handleValueChanged?.(versionedValue?.id, language, value)}
				.translationProvider=${this.translationProvider}
			></iqr-text-field>`
		})
	}
}

customElements.define('iqr-form-multiple-choice', MultipleChoice)
