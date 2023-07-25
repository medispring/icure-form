import { html } from 'lit'
import { generateLabel } from './utils'
import { LabelizedField } from '../../../../common/labelizedField'

export class IqrLabel extends LabelizedField {
	constructor() {
		super()
	}

	render() {
		if (!this.display) {
			return html``
		}
		return html`${generateLabel(this.label ?? '', this.labelPosition ?? 'float')}`
	}
	public firstUpdated(): void {
		this.registerStateUpdater(this.label || '')
	}
}
customElements.define('iqr-label', IqrLabel)
