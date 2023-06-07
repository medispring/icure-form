import { CSSResultGroup, LitElement } from 'lit'
// @ts-ignore
import baseCss from '../iqr-text-field/styles/style.scss'
// @ts-ignore
import kendoCss from '../iqr-text-field/styles/kendo.scss'

export abstract class StylizedField extends LitElement {
	static get styles(): CSSResultGroup[] {
		return [baseCss, kendoCss]
	}
}
