import { html } from 'lit'
import { generateLabel } from './utils'
import { LabelizedField } from '../common/labelizedField'

class IqrLabel extends LabelizedField {
	constructor() {
		super()
	}

	render() {
		return html`${generateLabel(this.label ?? '', this.labelPosition ?? 'float')}`
	}
}
customElements.define('iqr-label', IqrLabel)
