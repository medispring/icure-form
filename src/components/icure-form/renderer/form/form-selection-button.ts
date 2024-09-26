import { css, html, LitElement, nothing } from 'lit'
import { property, state } from 'lit/decorators.js'
import { Form } from '../../../model'

export class FormSelectionButton extends LitElement {
	@property() forms?: [string, Form][]
	@property() formAdded: (title: string, form: Form) => void = () => {
		/* Do nothing */
	}
	@property() translationProvider: (language: string, text: string) => string = (language, text) => text
	@property() language = 'en'

	@state() private displayMenu = false
	static get styles() {
		return css`
			.options-container {
				position: relative;
			}

			.options {
				display: flex;
				flex-direction: column;
				align-items: flex-start;
				position: absolute;
				top: 30px;
				right: 0;
				z-index: 2;
				background: #fff;
				box-shadow: 0px 0px 4px rgba(0, 0, 0, 0.25);
				width: auto;
				min-width: 100%;
				overflow-y: auto;
				max-height: 280px;
			}

			.option {
				height: 28px;
				min-height: 28px;
				width: 100%;
				background: transparent;
				border-radius: 4px;
				font-size: 14px;
				color: #545454;
				display: flex;
				flex-flow: row nowrap;
				align-items: center;
				justify-content: flex-start;
				box-shadow: none;
				border: none;
				white-space: nowrap;
				overflow-x: hidden;
				text-overflow: ellipsis;
				padding: 4px 8px;
				-webkit-user-select: none; /* Safari */
				-ms-user-select: none; /* IE 10 and IE 11 */
				user-select: none; /* Standard syntax */
			}

			.option:hover {
				color: #656565;
				background-color: #ededed;
			}
		`
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
customElements.define('form-selection-button', FormSelectionButton)
