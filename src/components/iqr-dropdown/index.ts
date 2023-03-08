import { CSSResultGroup, html, LitElement, TemplateResult } from 'lit'
import { property, state } from 'lit/decorators'

// @ts-ignore
import baseCss from '../iqr-text-field/styles/style.scss'
// @ts-ignore
import kendoCss from '../iqr-text-field/styles/kendo.scss'
import { VersionedValue } from '../iqr-text-field'
import { versionPicto } from '../iqr-text-field/styles/paths'

export interface OptionCode {
	id: string

	text: string
}

export class IqrDropdownField extends LitElement {
	@property() options?: OptionCode[] = []

	@property() placeholder = ''

	@property() valueProvider?: () => VersionedValue | undefined = undefined

	@property({ type: String }) codifications = ''

	@property({ type: String }) value = ''

	@property() label = ''
	@property() labelPosition: 'float' | 'side' | 'above' | 'hidden' = 'float'

	@state() protected displayMenu = false

	@state() protected inputValue = ''

	static get styles(): CSSResultGroup[] {
		return [baseCss, kendoCss]
	}

	togglePopup(): void {
		this.displayMenu = !this.displayMenu
	}

	handleOptionButtonClicked(id: string): (e: Event) => boolean {
		return (e: Event) => {
			e.preventDefault()
			e.stopPropagation()
			if (id) {
				this.inputValue = (this.options || []).find((option) => option.id === id)?.text ?? ''
				this.displayMenu = false
				return true
			}
			return false
		}
	}

	render(): TemplateResult {
		return html`
			<div id="root" class="iqr-text-field ${this.inputValue != '' ? 'has-content' : ''}" data-placeholder=${this.placeholder}>
				<label class="iqr-label ${this.labelPosition}"><span>${this.label}</span></label>
				<div class="iqr-input" @click="${this.togglePopup}">
					<div id="editor">${this.inputValue}</div>
					<div id="extra" class=${'extra forced'}>
						<div class="buttons-container">
							<div class="menu-container">
								<button class="btn menu-trigger">${versionPicto}</button>
								${this.displayMenu
									? html`
											<div id="menu" class="menu">
												${this.options?.map((x) => html`<button @click="${this.handleOptionButtonClicked(x.id)}" id="${x.id}" class="item">${x.text}</button>`)}
											</div>
									  `
									: ''}
							</div>
						</div>
					</div>
				</div>
			</div>
		`
	}

	public async firstUpdated(): Promise<void> {
		return
	}
}

customElements.define('iqr-dropdown-field', IqrDropdownField)
