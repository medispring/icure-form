// Import the LitElement base class and html helper function
import { html, LitElement } from 'lit'
import { property } from 'lit/decorators.js'

import { Renderer } from './renderer'
import { render as renderAsForm } from './renderer/form/form'
import { Code, FieldMetadata, FieldValue, Form } from '../model'
import { FormValuesContainer } from '../../generic'

// @ts-ignore
import baseCss from '../common/styles/style.scss'
import { defaultTranslationProvider } from '../../utils/languages'

/**
 * Form element
 */
export class IcureForm extends LitElement {
	@property() form?: Form
	@property() renderer = 'form'
	@property() visible = true
	@property() readonly = false
	@property() labelPosition?: 'top' | 'left' | 'right' | 'bottom' | 'float' | undefined = undefined
	@property() language?: string
	@property() formValuesContainer?: FormValuesContainer<FieldValue, FieldMetadata> = undefined
	@property() translationProvider?: (language: string, text: string) => string
	@property() codesProvider: (codifications: string[], searchTerm: string) => Promise<Code[]> = () => Promise.resolve([])
	@property() optionsProvider: (language: string, codifications: string[], searchTerm: string) => Promise<Code[]> = () => Promise.resolve([])

	constructor() {
		super()
	}

	static get styles() {
		return [baseCss]
	}

	render() {
		const renderer: Renderer | undefined = this.renderer === 'form' ? renderAsForm : undefined

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
					() => [],
					this.codesProvider,
					this.optionsProvider,
					this.readonly,
			  )
			: this.form
			? html`<p>unknown renderer</p>`
			: html`<p>missing form</p>`
	}
}
