// Import the LitElement base class and html helper function
import { html, LitElement } from 'lit'
import { property } from 'lit/decorators.js'

import { Renderer } from './renderer'
import { render as renderAsForm } from './renderer/form/form'
import { Code, Field, FieldMetadata, FieldValue, Form, Group, Subform } from '../model'
import { FormValuesContainer } from '../../generic'

// @ts-ignore
import baseCss from '../common/styles/style.scss'
import { defaultTranslationProvider } from '../../utils/languages'
import { PropertyValues } from '@lit/reactive-element'
import { fieldValuesProvider } from '../../utils/fields-values-provider'

/**
 * Form element
 */
export class IcureForm extends LitElement {
	@property() form?: Form
	@property() skin = 'material'
	@property() renderer = 'form'
	@property() visible = true
	@property() readonly = false
	@property() labelPosition?: 'top' | 'left' | 'right' | 'bottom' | 'float' | undefined = undefined
	@property() defaultLanguage?: string
	@property() displayedLanguage?: string
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

	extractDefaultValues(fgs: Array<Field | Group | Subform>) {
		const fvc = this.formValuesContainer
		if (fvc) {
			fgs.forEach((fg) => {
				if (fg.clazz === 'group' && fg.fields?.length) {
					this.extractDefaultValues(fg.fields)
				} else if (fg.clazz === 'field') {
					//Check that no value already exists
					if (!Object.keys(fieldValuesProvider(fvc, fg)() ?? {}).length) {
						if (fg.computedProperties?.defaultValue) {
							const value: FieldValue | undefined = fvc?.compute(fg.computedProperties?.defaultValue)
							if (value) {
								//TODO support batch changes
								fvc?.setValue((fg as Field).label(), this.displayedLanguage ?? 'en', value)
							}
						}
					}
				}
			})
		}
	}

	protected firstUpdated(_changedProperties: PropertyValues) {
		super.firstUpdated(_changedProperties)

		if (this.formValuesContainer) {
			this.form?.sections.forEach((section) => {
				this.extractDefaultValues(section.fields ?? [])
			})
		}
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
					{ labelPosition: this.labelPosition, defaultLanguage: this.defaultLanguage, displayedLanguage: this.displayedLanguage },
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
