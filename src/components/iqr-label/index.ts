import { html, LitElement } from 'lit'
import { property } from 'lit/decorators.js'

import { generateLabel } from './utils'

class IqrLabel extends LitElement {
	@property() label = ''
	@property() labelPosition: 'float' | 'side' | 'above' | 'hidden' | 'left' | 'right' = 'float'

	constructor() {
		super()
	}

	render() {
		return html`${generateLabel(this.label, this.labelPosition)}`
	}
}
customElements.define('iqr-label', IqrLabel)
