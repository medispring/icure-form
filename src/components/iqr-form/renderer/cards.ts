import { html, TemplateResult } from 'lit'
import { Field, Form, Group } from '../model'
import { Renderer } from './index'

export const render: Renderer = (form: Form) => {
	const h = function (level: number, content: TemplateResult): TemplateResult {
		return level === 1
			? html`<h1>${content}</h1>`
			: level === 2
			? html`<h2>${content}</h2>`
			: level === 3
			? html`<h3>${content}</h3>`
			: level === 4
			? html`<h4>${content}</h4>`
			: level === 5
			? html`<h5>${content}</h5>`
			: html`<h6>${content}</h6>`
	}
	const renderFieldOrGroup = function (fg: Field | Group, level: number): TemplateResult {
		return fg instanceof Group
			? html` <div class="group">${h(level, html`${fg.group}`)} ${fg.fields?.map((f) => renderFieldOrGroup(f, level + 1))}</div>`
			: html`${
					fg.type === 'textfield'
						? html`<iqr-form-textfield label="${fg.field}" multiline="${(fg.rows || 0) > 1 || fg.grows}" rows="${fg.rows || 1}" grows="${fg.grows || false}"></iqr-form-textfield>`
						: fg.type === 'measure-field'
						? html`<iqr-form-measure-field label="${fg.field}"></iqr-form-measure-field>`
						: fg.type === 'number-field'
						? html`<iqr-form-number-field label="${fg.field}"></iqr-form-number-field>`
						: fg.type === 'date-picker'
						? html`<iqr-form-date-picker label="${fg.field}"></iqr-form-date-picker>`
						: fg.type === 'time-picker'
						? html`<iqr-form-time-picker label="${fg.field}"></iqr-form-time-picker>`
						: fg.type === 'date-time-picker'
						? html`<iqr-form-date-time-picker label="${fg.field}"></iqr-form-date-time-picker>`
						: fg.type === 'multiple-choice'
						? html`<iqr-form-multiple-choice label="${fg.field}"></iqr-form-multiple-choice>`
						: ''
			  }
					</div>`
	}

	return html`
		<div class="iqr-form">
			${form?.sections?.map(
				(s) =>
					html`
						<h2>${s.section}</h2>
						${s.description ? html`<p>${s.description}</p>` : ''} ${s.fields?.map((f) => renderFieldOrGroup(f, 3))}
					`,
			)}
		</div>
	`
}
