// Import the LitElement base class and html helper function
import { html, LitElement } from 'lit'
import { property, state } from 'lit/decorators.js'

import { Form, StateToUpdate, Trigger } from './model'

import './fields/textfield'
import './fields/measureField'
import './fields/numberField'
import './fields/datePicker'
import './fields/timePicker'
import './fields/dateTimePicker'
import './fields/multipleChoice'
import './fields/dropdown'
import './fields/radioButton'
import './fields/checkbox'
import './fields/label'
// @ts-ignore
import baseCss from './styles/style.scss'
// @ts-ignore
import kendoCss from './styles/kendo.scss'
import { Renderer } from './renderer'

import { render as renderAsCard } from './renderer/cards'
import { render as renderAsForm } from './renderer/form'
import { FormValuesContainer } from '../iqr-form-loader/formValuesContainer'
import { CodeStub } from '@icure/api'
import { ActionManager } from '../iqr-form-loader/actionManager'

// Extend the LitElement base class
class IqrForm extends LitElement {
	@property() form?: Form
	@property() skin = 'material'
	@property() theme = 'default'
	@property() renderer = 'form'
	@property() labelPosition?: string = undefined
	@property() defaultLanguage?: string = undefined
	@property() formValuesContainer?: FormValuesContainer = undefined
	@property() formValuesContainerChanged?: (newValue: FormValuesContainer) => void = undefined
	@property() translationProvider: (text: string) => string = (text) => text
	@property() codesProvider: (codifications: string[], searchTerm: string) => Promise<CodeStub[]> = () => Promise.resolve([])
	@property() actionManager?: ActionManager
	@state() display: boolean = true

	stateUpdate: (state: StateToUpdate, result: any) => void = (state, result) => {
		if (state === StateToUpdate.VISIBLE) {
			this.display = result
		}
	}

	constructor() {
		super()
	}

	connectedCallback() {
		super.connectedCallback()
	}

	disconnectedCallback() {
		super.disconnectedCallback()
	}

	static get styles() {
		return [baseCss, kendoCss]
	}

	render() {
		const renderer: Renderer | undefined = this.renderer === 'form' ? renderAsForm : this.renderer === 'form' ? renderAsCard : undefined

		if (!this.display) {
			return html``
		}
		return renderer && this.form
			? renderer(
					this.form,
					{ labelPosition: this.labelPosition, defaultLanguage: this.defaultLanguage },
					this.formValuesContainer,
					(newValue) => this.formValuesContainerChanged?.(newValue),
					this.translationProvider,
					() => [],
					this.codesProvider,
					this.actionManager,
			  )
			: this.form
			? html`<p>unknown renderer</p>`
			: html`<p>missing form</p>`
	}

	firstUpdated() {
		if (this.actionManager && this.form && this.formValuesContainer) {
			console.log('init action manager')
			this.actionManager.registerStateUpdater(this.form.form, this.stateUpdate)
			//launch init actions
			this.actionManager.launchActions(Trigger.INIT, this.form.form)
		}
	}
}

// Register the new element with the browser.
customElements.define('iqr-form', IqrForm)
