import { css, CSSResultGroup, html, LitElement, TemplateResult } from 'lit'
import { property, state } from 'lit/decorators'

import '../../iqr-text-field'

export class DropdownField extends LitElement {
	@property() label = ''
	@property() labelPosition?: string = undefined

	@property() options?: { id: string; text: string }[] = [
		{
			id: '1',
			text: 'Option 1',
		},
		{
			id: '2',
			text: 'Option 2',
		},
		{
			id: '3',
			text: 'Option 3',
		},
	]

	@state() @property({ type: String }) value = ''
	@state() protected displayMenu = false
	static get styles(): CSSResultGroup[] {
		return [
			css`
				:host {
				}
			`,
		]
	}

	togglePopup() {
		console.log('togglePopup')
		this.displayMenu = !this.displayMenu
	}

	handleOptionButtonClicked(id: string) {
		return (e: Event) => {
			console.log('handleOwnerButtonClicked', id)
			this.value = this.options?.find((x) => x.id === id)?.text ?? ''
			this.displayMenu = false
		}
	}

	render(): TemplateResult {
		return html`
			<iqr-text-field labelPosition=${this.labelPosition} label="${this.label}" value="${this.value}" schema="dropdown">
				<button @click="${this.togglePopup}" class="btn menu-trigger author"></button>
				${this.displayMenu
					? html`
							<div id="menu" class="menu">
								${this.options?.map((x) => html`<button @click="${this.handleOptionButtonClicked(x.id)}" id="${x.id}" class="item">${x.text}</button>`)}
							</div>
					  `
					: ''}
			</iqr-text-field>
		`
	}
}

customElements.define('iqr-form-dropdown-field', DropdownField)
