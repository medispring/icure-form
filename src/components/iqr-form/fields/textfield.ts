import { css, html, LitElement } from 'lit'
import { property } from 'lit/decorators'

import '../../iqr-text-field'
import { Meta, Suggestion, VersionedValue } from '../../iqr-text-field'

class Textfield extends LitElement {
	@property() label = ''
	@property() multiline = false
	@property() rows = 1
	@property() grows = false
	@property() labelPosition?: string = undefined
	@property() suggestionStopWords: Set<string> = new Set<string>()
	@property() linksProvider: (sug: { id: string; code: string; text: string; terms: string[] }) => Promise<{ href: string; title: string } | undefined> = () =>
		Promise.resolve(undefined)
	@property() suggestionProvider: (terms: string[]) => Promise<Suggestion[]> = async () => []
	@property() ownersProvider: (terms: string[]) => Promise<Suggestion[]> = async () => []
	@property() codeColorProvider: (type: string, code: string) => string = () => 'XI'
	@property() linkColorProvider: (type: string, code: string) => string = () => 'cat1'
	@property() codeContentProvider: (codes: { type: string; code: string }[]) => string = (codes) => codes.map((c) => c.code).join(',')

	@property() valueProvider?: () => VersionedValue[] = undefined
	@property() metaProvider?: () => Meta = undefined
	@property() handleValueChanged?: (id: string, value: string) => void = undefined
	@property() handleMetaChanged?: (id: string, value: string) => void = undefined

	static get styles() {
		return [
			css`
				:host {
				}
			`,
		]
	}

	render() {
		return html`
			<iqr-text-field
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
				.valueProvider=${this.valueProvider}
				.metaProvider=${this.metaProvider}
				.handleValueChanged=${this.handleValueChanged}
				.handleMetaChanged=${this.handleMetaChanged}
			></iqr-text-field>
		`
	}
}

customElements.define('iqr-form-textfield', Textfield)
