import { html, TemplateResult } from 'lit'
import { Field, Form, Group } from '../model'
import { Renderer } from './index'
import { FormValuesContainer } from '../../iqr-form-loader'
import {
	dateFieldValuesProvider,
	dateTimeFieldValuesProvider,
	handleMetaChangedProvider,
	handleTextFieldValueChangedProvider,
	measureFieldValuesProvider,
	metaProvider,
	numberFieldValuesProvider,
	textFieldValuesProvider,
	timeFieldValuesProvider,
} from '../../iqr-form-loader'
import { /*VersionedMeta,*/ VersionedValue } from '../../iqr-text-field'
import { dropdownOptionMapper } from '../../iqr-form-loader/fieldsMapper'

import '../fields/dropdown'

const firstItemValueProvider = (valuesProvider: () => VersionedValue[]) => () => valuesProvider()[0]
//const firstItemMetaProvider = (valuesProvider: () => VersionedMeta[]) => () => valuesProvider()[0]

export const render: Renderer = (
	form: Form,
	props: { [key: string]: unknown },
	formsValueContainer?: FormValuesContainer,
	formValuesContainerChanged?: (newValue: FormValuesContainer) => void,
) => {
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
	const renderFieldOrGroup = function (fg: Field | Group, level: number, fieldsInRow = 1): TemplateResult | TemplateResult[] {
		fg.columns = fg.columns || 1
		if (fg.clazz === 'group' && fg.fields) {
			const fieldsOrGroupByRows = groupFieldsOrGroupByRows(fg.fields)
			return html`<div class="group" style="${calculateFieldOrGroupWidth(fg.columns, fieldsInRow)}">
				${h(level, html`${fg.group}`)}
				${fieldsOrGroupByRows.map((fieldsOrGroupRow) => fieldsOrGroupRow.map((fieldOrGroup) => renderFieldOrGroup(fieldOrGroup, level + 1, sumColumnsOfFields(fieldsOrGroupRow))))}
			</div>`
			// 	return fieldsOrGroupByRows.map((fieldsOrGroupRow) =>
			// 	fieldsOrGroupRow.map(
			// 		(fieldOrGroup) => `<div class="group">${h(level, html`${fieldOrGroup}`)} ${renderFieldOrGroup(fieldOrGroup, level + 1, sumColumnsOfFields(fieldsOrGroupRow))}</div>`,
			// 	),
			// )
		} else if (fg.clazz === 'field') {
			return html`${fg.type === 'textfield'
				? html`<iqr-form-textfield
						class="iqr-form-field"
						style="${calculateFieldOrGroupWidth(fg.columns, fieldsInRow)}"
						labelPosition=${props.labelPosition}
						label="${fg.field}"
						.labels="${fg.labels}"
						multiline="${fg.multiline || false}"
						grows="${fg.grows || false}"
						.linksProvider=${fg.options?.linksProvider}
						.suggestionProvider=${fg.options?.suggestionProvider}
						.ownersProvider=${fg.options?.ownersProvider}
						.codeColorProvider=${fg.options?.codeColorProvider}
						.linkColorProvider=${fg.options?.linkColorProvider}
						.codeContentProvider=${fg.options?.codeContentProvider}
						.valueProvider="${formsValueContainer && textFieldValuesProvider(formsValueContainer, fg)}"
						.metaProvider=${formsValueContainer && metaProvider(formsValueContainer, fg)}
						.handleValueChanged=${formsValueContainer && formValuesContainerChanged && handleTextFieldValueChangedProvider(fg, formsValueContainer, formValuesContainerChanged)}
						.handleMetaChanged=${formsValueContainer && handleMetaChangedProvider(formsValueContainer)}
				  ></iqr-form-textfield>`
				: fg.type === 'measure-field'
				? html`<iqr-form-measure-field
						style="${calculateFieldOrGroupWidth(fg.columns, fieldsInRow)}"
						labelPosition=${props.labelPosition}
						label="${fg.field}"
						.labels="${fg.labels}"
						value="${fg.value}"
						unit="${fg.unit}"
						.valueProvider="${formsValueContainer && firstItemValueProvider(measureFieldValuesProvider(formsValueContainer, fg))}"
				  ></iqr-form-measure-field>`
				: fg.type === 'number-field'
				? html`<iqr-form-number-field
						style="${calculateFieldOrGroupWidth(fg.columns, fieldsInRow)}"
						labelPosition=${props.labelPosition}
						label="${fg.field}"
						.labels="${fg.labels}"
						.valueProvider="${formsValueContainer && firstItemValueProvider(numberFieldValuesProvider(formsValueContainer, fg))}"
				  ></iqr-form-number-field>`
				: fg.type === 'date-picker'
				? html`<iqr-form-date-picker
						style="${calculateFieldOrGroupWidth(fg.columns, fieldsInRow)}"
						labelPosition=${props.labelPosition}
						label="${fg.field}"
						.labels="${fg.labels}"
						.valueProvider="${formsValueContainer && firstItemValueProvider(dateFieldValuesProvider(formsValueContainer, fg))}"
				  ></iqr-form-date-picker>`
				: fg.type === 'time-picker'
				? html`<iqr-form-time-picker
						style="${calculateFieldOrGroupWidth(fg.columns, fieldsInRow)}"
						labelPosition=${props.labelPosition}
						label="${fg.field}"
						.labels="${fg.labels}"
						.valueProvider="${formsValueContainer && firstItemValueProvider(timeFieldValuesProvider(formsValueContainer, fg))}"
				  ></iqr-form-time-picker>`
				: fg.type === 'date-time-picker'
				? html`<iqr-form-date-time-picker
						style="${calculateFieldOrGroupWidth(fg.columns, fieldsInRow)}"
						labelPosition=${props.labelPosition}
						label="${fg.field}"
						.labels="${fg.labels}"
						.valueProvider="${formsValueContainer && firstItemValueProvider(dateTimeFieldValuesProvider(formsValueContainer, fg))}"
				  ></iqr-form-date-time-picker>`
				: fg.type === 'multiple-choice'
				? html`<iqr-form-multiple-choice
						style="${calculateFieldOrGroupWidth(fg.columns, fieldsInRow)}"
						labelPosition=${props.labelPosition}
						label="${fg.field}"
						.labels="${fg.labels}"
				  ></iqr-form-multiple-choice>`
				: fg.type === 'dropdown-field'
				? html`<iqr-form-dropdown-field
						style="${calculateFieldOrGroupWidth(fg.columns, fieldsInRow)}"
						labelPosition=${props.labelPosition}
						.label="${fg.field}"
						.labels="${fg.labels}"
						.options="${dropdownOptionMapper(fg)}"
						.handleValueChanged=${formsValueContainer && formValuesContainerChanged && handleTextFieldValueChangedProvider(fg, formsValueContainer, formValuesContainerChanged)}
				  ></iqr-form-dropdown-field>`
				: fg.type === 'radio-button'
				? html`<iqr-form-radio-button
						style="${calculateFieldOrGroupWidth(fg.columns, fieldsInRow)}"
						labelPosition=${props.labelPosition}
						label="${fg.field}"
						.labels="${fg.labels}"
						.options="${dropdownOptionMapper(fg)}"
				  ></iqr-form-radio-button>`
				: fg.type === 'checkbox'
				? html`<iqr-form-checkbox
						style="${calculateFieldOrGroupWidth(fg.columns, fieldsInRow)}"
						labelPosition=${props.labelPosition}
						label="${fg.field}"
						.labels="${fg.labels}"
						.options="${dropdownOptionMapper(fg)}"
				  ></iqr-form-checkbox>`
				: fg.type === 'label'
				? html`<iqr-form-label style="${calculateFieldOrGroupWidth(fg.columns, fieldsInRow)}" labelPosition=${props.labelPosition} label="${fg.field}"></iqr-form-label>`
				: ''}`
		}
		return html``
	}

	const calculateFieldOrGroupWidth = (columns: number, fieldsInRow: number) => {
		return `--width: ${(100 / fieldsInRow) * (columns || 0)}%`
	}

	const renderForm = (form: Form) => {
		return form.sections.map((s) =>
			groupFieldsOrGroupByRows(s.fields)?.map(
				(fieldsOrGroup) =>
					html`<div class="iqr-form">${fieldsOrGroup.map((fieldOrGroup: Field | Group) => renderFieldOrGroup(fieldOrGroup, 3, sumColumnsOfFields(fieldsOrGroup)))}</div> `,
			),
		)
	}

	const sumColumnsOfFields = (fieldsOrGroup: (Field | Group)[]) => {
		return fieldsOrGroup.map((item) => item.columns).reduce((prev, next) => (prev || 0) + (next || 0))
	}

	const groupFieldsOrGroupByRows = (fieldsOrGroup: (Field | Group)[]) => {
		return fieldsOrGroup
			.reduce<(Field | Group)[][]>((x, y) => {
				if (y.rows) (x[y.rows] = x[y.rows] || []).push(y)
				return x
			}, [])
			.filter((text) => text)
	}

	return html` ${renderForm(form)} `
}
