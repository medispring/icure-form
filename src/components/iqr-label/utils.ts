import { html, TemplateResult } from 'lit'
import { Labels } from '../iqr-text-field'

export function generateLabels(labels: Labels): TemplateResult[] {
	return Object.keys(labels).map((position) => {
		switch (position) {
			case 'right':
			case 'left':
				return html` <label class="iqr-label side above ${position}"><span>${labels[position]}</span></iqr-label> `
			default:
				return html` <label class="iqr-label ${position}"><span>${labels[position]}</span></iqr-label> `
		}
	})
}

export function generateLabel(label: string, labelPosition: string): TemplateResult {
	switch (labelPosition) {
		case 'right':
		case 'left':
			return html` <label class="iqr-label side above ${labelPosition}"><span>${label}</span></iqr-label> `
		default:
			return html` <label class="iqr-label ${labelPosition}"><span>${label}</span></iqr-label> `
	}
}
