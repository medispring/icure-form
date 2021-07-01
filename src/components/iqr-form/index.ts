// Import the LitElement base class and html helper function
import { html, LitElement } from 'lit'
import { property } from 'lit/decorators'

import { Form } from './model'

import './fields/textfield'
import './fields/measureField'
import './fields/numberField'
import './fields/datePicker'
import './fields/timePicker'
import './fields/dateTimePicker'
import './fields/multipleChoice'
// @ts-ignore
import baseCss from './styles/style.scss'
// @ts-ignore
import kendoCss from './styles/kendo.scss'
import { Renderer } from './renderer'

import { render as renderAsCard } from './renderer/cards'
import { render as renderAsForm } from './renderer/form'

// Extend the LitElement base class
class IqrForm extends LitElement {
	@property() form?: Form
	@property() skin = 'material'
	@property() theme = 'default'
	@property() renderer = 'form'
	@property() labelPosition?: string = undefined

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

		return renderer && this.form ? renderer(this.form, { labelPosition: this.labelPosition }) : this.form ? html`<p>unknown renderer</p>` : html`<p>missing form</p>`
	}

	firstUpdated() {
		//Do nothing
	}
}

// Register the new element with the browser.
customElements.define('iqr-form', IqrForm)
