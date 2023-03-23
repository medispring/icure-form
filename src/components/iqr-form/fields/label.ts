import { css, CSSResultGroup, html, LitElement, TemplateResult } from 'lit'
import { property, state } from 'lit/decorators.js'
import '../../iqr-label'

export class Label extends LitElement {
	@property() label = ''
	@property() labelPosition?: string = undefined
	static get styles(): CSSResultGroup[] {
		return [
			css`
				:host {
				}
			`,
		]
	}

	render(): TemplateResult {
		return html`<iqr-label label="${this.label}" labelPosition="${this.labelPosition}"></iqr-label>`
	}
}

customElements.define('iqr-form-label', Label)
