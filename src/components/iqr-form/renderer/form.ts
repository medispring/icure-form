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
	const renderFieldOrGroup = function (fg: Field | Group, level: number): TemplateResult {
		return fg.clazz === 'group'
			? html` <div class="group">${h(level, html`${fg.group}`)} ${fg.fields?.map((f) => renderFieldOrGroup(f, level + 1))}</div>`
			: html`${
					fg.type === 'textfield'
						? html`<iqr-form-textfield
								labelPosition=${props.labelPosition}
								label="${fg.field}"
								multiline="${(fg.rows || 0) > 1 || fg.grows}"
								rows="${fg.rows || 1}"
								grows="${fg.grows || false}"
								.linksProvider=${fg.options?.linksProvider}
								.suggestionProvider=${fg.options?.suggestionProvider}
								.ownersProvider=${fg.options?.ownersProvider}
								.codeColorProvider=${fg.options?.codeColorProvider}
								.linkColorProvider=${fg.options?.linkColorProvider}
								.codeContentProvider=${fg.options?.codeContentProvider}
								.valueProvider="${formsValueContainer && textFieldValuesProvider(formsValueContainer, fg)}"
								.metaProvider=${formsValueContainer && metaProvider(formsValueContainer, fg)}
								.handleValueChanged=${formsValueContainer && formValuesContainerChanged && handleTextFieldValueChangedProvider(formsValueContainer, formValuesContainerChanged)}
								.handleMetaChanged=${formsValueContainer && handleMetaChangedProvider(formsValueContainer)}
								.editable="${props.editable}"
						  ></iqr-form-textfield>`
						: fg.type === 'measure-field'
						? html`<iqr-form-measure-field
								labelPosition=${props.labelPosition}
								label="${fg.field}"
								.editable="${props.editable}"
								.valueProvider="${formsValueContainer && firstItemValueProvider(measureFieldValuesProvider(formsValueContainer, fg))}"
						  ></iqr-form-measure-field>`
						: fg.type === 'number-field'
						? html`<iqr-form-number-field
								labelPosition=${props.labelPosition}
								label="${fg.field}"
								.editable="${props.editable}"
								.valueProvider="${formsValueContainer && firstItemValueProvider(numberFieldValuesProvider(formsValueContainer, fg))}"
						  ></iqr-form-number-field>`
						: fg.type === 'date-picker'
						? html`<iqr-form-date-picker
								labelPosition=${props.labelPosition}
								label="${fg.field}"
								.editable="${props.editable}"
								.valueProvider="${formsValueContainer && firstItemValueProvider(dateFieldValuesProvider(formsValueContainer, fg))}"
						  ></iqr-form-date-picker>`
						: fg.type === 'time-picker'
						? html`<iqr-form-time-picker
								labelPosition=${props.labelPosition}
								label="${fg.field}"
								.editable="${props.editable}"
								.valueProvider="${formsValueContainer && firstItemValueProvider(timeFieldValuesProvider(formsValueContainer, fg))}"
						  ></iqr-form-time-picker>`
						: fg.type === 'date-time-picker'
						? html`<iqr-form-date-time-picker
								labelPosition=${props.labelPosition}
								label="${fg.field}"
								.editable="${props.editable}"
								.valueProvider="${formsValueContainer && firstItemValueProvider(dateTimeFieldValuesProvider(formsValueContainer, fg))}"
						  ></iqr-form-date-time-picker>`
						: fg.type === 'multiple-choice'
						? html`<iqr-form-multiple-choice labelPosition=${props.labelPosition} label="${fg.field}" .editable="${props.editable}"></iqr-form-multiple-choice>`
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
