import { css, html, LitElement } from 'lit'
import { property } from 'lit/decorators'

import '../../iqr-text-field'
import { Suggestion, VersionedMeta, VersionedValue } from '../../iqr-text-field'

class Textfield extends LitElement {
	@property() label = ''
	@property() multiline = false
	@property() rows = 1
	@property() grows = false
	@property() labelPosition?: string = undefined
	@property({ type: Boolean }) editable = true
	@property() suggestionStopWords: Set<string> = new Set<string>()
	@property() linksProvider: (sug: { id: string; code: string; text: string; terms: string[] }) => Promise<{ href: string; title: string } | undefined> = () =>
		Promise.resolve(undefined)
	@property() suggestionProvider: (terms: string[]) => Promise<Suggestion[]> = async () => []
	@property() ownersProvider: (terms: string[]) => Promise<Suggestion[]> = async () => []
	@property() codeColorProvider: (type: string, code: string) => string = () => 'XI'
	@property() linkColorProvider: (type: string, code: string) => string = () => 'cat1'
	@property() codeContentProvider: (codes: { type: string; code: string }[]) => string = (codes) => codes.map((c) => c.code).join(',')

	@property() valueProvider?: () => VersionedValue[] = undefined
	@property() metaProvider?: () => VersionedMeta[] = undefined
	@property() handleValueChanged?: (id: string, language: string, value: string) => void = undefined
	@property() handleMetaChanged?: (id: string, language: string, value: string) => void = undefined

	static get styles() {
		return [
			css`
				:host {
				}
			`,
		]
	}

	render() {
		const versionedValues = this.valueProvider?.()
		return html`
			${(versionedValues?.length ? versionedValues : [undefined]).map((versionedValue, idx) => {
				return html`<iqr-text-field
					labelPosition=${this.labelPosition}
					?multiline="${this.multiline}"
					label="${this.label}"
					?suggestions=${!!this.suggestionProvider}
					?links=${!!this.linksProvider}
					.linksProvider=${this.linksProvider}
					.suggestionProvider=${this.suggestionProvider}
					.ownersProvider=${this.ownersProvider}
					.codeColorProvider=${this.codeColorProvider}
					.linkColorProvider=${this.linkColorProvider}
					.codeContentProvider=${this.codeContentProvider}
					.valueProvider=${() => versionedValue}
					.metaProvider=${() => this.metaProvider?.()?.[idx]}
					.handleValueChanged=${(language: string, value: string) => versionedValue?.id && this.handleValueChanged?.(versionedValue.id, language, value)}
					.handleMetaChanged=${this.handleMetaChanged}
					.editable="${this.editable}"
				></iqr-text-field>`
			})}
		`
	}
}

customElements.define('iqr-form-textfield', Textfield)
