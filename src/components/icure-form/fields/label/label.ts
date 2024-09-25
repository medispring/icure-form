import { css, CSSResultGroup, html, LitElement, TemplateResult } from 'lit'
import { property } from 'lit/decorators.js'

import '../../../icure-label'

export class Label extends LitElement {
	//override
	static get styles(): CSSResultGroup[] {
		return [
			css`
				:host {
				}
			`,
		]
	}

	@property() label?: string
	@property() labelPosition?: string
	@property() visible = true
	@property() translationProvider: (language: string, text: string) => string = (language, text) => text
	@property() defaultLanguage = 'en'

	render(): TemplateResult {
		return html`<icure-label
			.visible="${this.visible}"
			.translationProvider=${this.translationProvider}
			.label="${this.label}"
			.defaultLanguage="${this.defaultLanguage}"
			.labelPosition="${this.labelPosition}"
		></icure-label>`
	}
}
