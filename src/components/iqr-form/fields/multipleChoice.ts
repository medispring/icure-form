import { css, CSSResultGroup, html, LitElement, TemplateResult } from 'lit'
import { property } from 'lit/decorators'

import '../../iqr-text-field'
import { Labels } from '../../iqr-text-field'

export class MultipleChoice extends LitElement {
	@property() label = ''
	@property() labelPosition?: string = undefined
	@property() labels?: Labels = undefined
	@property() value?: string = ''

	static get styles(): CSSResultGroup[] {
		return [
			css`
				:host {
				}
			`,
		]
	}

	render(): TemplateResult {
		return html`<iqr-text-field .labels="${this.labels}" value="${this.value}" labelPosition=${this.labelPosition} label="${this.label}"></iqr-text-field>`
	}
}

customElements.define('iqr-form-multiple-choice', MultipleChoice)
