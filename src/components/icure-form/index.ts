// Import the LitElement base class and html helper function
import { html, LitElement } from 'lit'
import { property } from 'lit/decorators.js'

import { Renderer } from './renderer'
import { render as renderAsForm } from './renderer/form/form'
import { FieldMetadata, FieldValue, Form } from '../model'
import { FormValuesContainer, Suggestion } from '../../generic'

// @ts-ignore
import baseCss from '../common/styles/style.scss'
import { defaultTranslationProvider, languages } from '../../utils/languages'

/**
 * Form element
 */
export class IcureForm extends LitElement {
	@property() form?: Form
	@property() renderer = 'form'
	@property() visible = true
	@property() readonly = false
	@property() displayMetadata = false
	@property() labelPosition?: 'top' | 'left' | 'right' | 'bottom' | 'float' | undefined = undefined
	@property() language?: string
	@property() languages?: { [iso: string]: string } = languages
	@property() formValuesContainer?: FormValuesContainer<FieldValue, FieldMetadata> = undefined
	@property() translationProvider?: (language: string, text: string) => string
	@property() ownersProvider?: (terms: string[], ids?: string[], specialties?: string[]) => Promise<Suggestion[]>
	@property() optionsProvider?: (language: string, codifications: string[], terms?: string[]) => Promise<Suggestion[]>

	constructor() {
		super()
	}

	static get styles() {
		return [baseCss]
	}

	render() {
		const renderer: Renderer | undefined = this.renderer === 'form' ? renderAsForm : undefined

		console.log('Render metadata', this.displayMetadata)

		if (!this.visible) {
			return html``
		}
		const translationTables = this.form?.translations

		return renderer && this.form
			? renderer(
					this.form,
					{ labelPosition: this.labelPosition, language: this.language },
					this.formValuesContainer,
					this.translationProvider ?? (translationTables ? defaultTranslationProvider(translationTables) : undefined),
					this.ownersProvider,
					this.optionsProvider,
					this.languages,
					this.readonly,
					this.displayMetadata,
			  )
			: this.form
			? html`<p>unknown renderer</p>`
			: html`<p>missing form</p>`
	}
}
