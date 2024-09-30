import { html, LitElement, nothing } from 'lit'
import { property, state } from 'lit/decorators.js'
import { Form } from '../../../model'
// @ts-ignore
import baseCss from '../../../common/styles/style.scss'

export class FormSelectionButton extends LitElement {
	@property() forms?: [string, Form][]
	@property() formAdded: (title: string, form: Form) => void = () => {
		/* Do nothing */
	}
	@property() translationProvider: (language: string, text: string) => string = (language, text) => text
	@property() language = 'en'

	@state() private displayMenu = false
	static get styles() {
		return [baseCss]
	}

	_handleClickOutside(event: MouseEvent): void {
		if (!event.composedPath().includes(this)) {
			if (this.displayMenu) {
				this.displayMenu = false
			}
			event.stopPropagation()
		}
	}

	connectedCallback() {
		super.connectedCallback()
		document.addEventListener('click', this._handleClickOutside.bind(this))
	}

	disconnectedCallback() {
		super.disconnectedCallback()
		document.removeEventListener('click', this._handleClickOutside.bind(this))
	}

	render() {
		return html`<div class="options-container">
			<button class="btn" @click="${() => (this.displayMenu = true)}">+</button>
			${this.displayMenu
				? html`<div class="options">
						${this.forms?.map(
							([id, form]) =>
								html`<button
									class="option"
									@click=${() => {
										this.formAdded(id, form)
										this.displayMenu = false
									}}
								>
									${(this.translationProvider ? this.translationProvider(this.language, form.form) : form.form) ?? id}
								</button>`,
						)}
				  </div>`
				: nothing}
		</div>`
	}
}
