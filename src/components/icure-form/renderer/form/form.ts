import { css, html, LitElement, nothing, TemplateResult } from 'lit'
import { Renderer, RendererProps } from '../index'
import { fieldValuesProvider, handleMetadataChanged, handleValueChanged } from '../../../../utils/fields-values-provider'
import { currentDate, currentDateTime, currentTime } from '../../../../utils/icure-utils'
import { CodeStub, HealthcareParty } from '@icure/api'
import { Code, FieldMetadata, FieldValue, Form, Field, Group, Subform, SortOptions } from '../../../model'
import { FormValuesContainer } from '../../../../generic'

import { defaultTranslationProvider } from '../../../../utils/languages'
import { getLabels } from '../../../common/utils'
import { filerAndSortOptionsFromFieldDefinition, sortCodes } from '../../../../utils/code-utils'

// @ts-ignore
import baseCss from '../../../common/styles/style.scss'
import { property, state } from 'lit/decorators.js'

export class FormSelectionButton extends LitElement {
	@property() forms?: [string, Form][]
	@property() formAdded: (title: string, form: Form) => void = () => {
		/* Do nothing */
	}
	@state() private displayMenu = false
	static get styles() {
		return css`
			.options-container {
				position: relative;
			}

			.options {
				display: flex;
				flex-direction: column;
				align-items: flex-start;
				position: absolute;
				top: 30px;
				right: 0;
				z-index: 2;
				background: #fff;
				box-shadow: 0px 0px 4px rgba(0, 0, 0, 0.25);
				width: auto;
				min-width: 100%;
				overflow-y: auto;
				max-height: 280px;
			}

			.option {
				height: 28px;
				min-height: 28px;
				width: 100%;
				background: transparent;
				border-radius: 4px;
				font-size: 14px;
				color: #545454;
				display: flex;
				flex-flow: row nowrap;
				align-items: center;
				justify-content: flex-start;
				box-shadow: none;
				border: none;
				white-space: nowrap;
				overflow-x: hidden;
				text-overflow: ellipsis;
				padding: 4px 8px;
				-webkit-user-select: none; /* Safari */
				-ms-user-select: none; /* IE 10 and IE 11 */
				user-select: none; /* Standard syntax */
			}

			.option:hover {
				color: #656565;
				background-color: #ededed;
			}
		`
	}
	render() {
		return html`<div class="options-container">
			<button class="btn" @click="${() => (this.displayMenu = true)}">+</button>
			${this.displayMenu
				? html`<div class="options">
						${this.forms?.map(
							([id, form]) =>
								html`<button
									class="option"
									@click=${() => {
										this.formAdded(id, form)
										this.displayMenu = false
									}}
								>
									${id}
								</button>`,
						)}
				  </div>`
				: nothing}
		</div>`
	}
}
customElements.define('form-selection-button', FormSelectionButton)

export const render: Renderer = (
	form: Form,
	props: RendererProps,
	formsValueContainer?: FormValuesContainer<FieldValue, FieldMetadata>,
	translationProvider?: (language: string, text: string) => string,
	ownersProvider: (speciality: string[]) => HealthcareParty[] = () => [],
	codesProvider: (codifications: string[], searchTerm: string) => Promise<CodeStub[]> = () => Promise.resolve([]),
	optionsProvider?: (language: string, codifications: string[], searchTerm?: string) => Promise<Code[]>,
	readonly?: boolean,
) => {
	const composedOptionsProvider =
		optionsProvider && form.codifications
			? async (language: string, codifications: string[], searchTerms?: string): Promise<Code[]> => {
					const originalOptions = optionsProvider ? await optionsProvider(language, codifications, searchTerms) : []
					return originalOptions.concat(
						form.codifications
							?.filter((c) => codifications.includes(c.type))
							?.flatMap((c) =>
								c.codes.filter(
									(c) =>
										!searchTerms ||
										searchTerms
											.split(/\s+/)
											.map((st) => st.toLowerCase())
											.every((st) => c.label[language].toLowerCase().includes(st)),
								),
							) ?? [],
					)
			  }
			: optionsProvider
			? (language: string, codifications: string[], searchTerms?: string, sortOptions?: SortOptions): Promise<Code[]> => {
					return optionsProvider?.(language, codifications, searchTerms).then((codes) => sortCodes(codes, language, sortOptions)) ?? Promise.resolve([])
			  }
			: undefined

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

	function renderGroup(fg: Group, fgSpan: number, level: number) {
		return html`<div class="${['group', fg.borderless ? undefined : 'bordered'].filter((x) => !!x).join(' ')}" style="${calculateFieldOrGroupWidth(fgSpan, fg.width)}">
			${fg.borderless ? nothing : html`<div>${h(level, html`${fg.group}`)}</div>`}
			<div class="icure-form">${(fg.fields ?? []).map((fieldOrGroup: Field | Group) => renderFieldGroupOrSubform(fieldOrGroup, level + 1))}</div>
		</div>`
	}

	function renderSubform(fg: Subform, fgSpan: number, level: number) {
		const children = formsValueContainer?.getChildren()?.filter((c) => c.getLabel() === fg.id)
		return html`<div class="subform" style="${calculateFieldOrGroupWidth(fgSpan, fg.width)}">
			<div>${h(level, html`${fg.shortLabel}`)}</div>
			<form-selection-button
				class="float-right-btn top"
				.forms="${Object.entries(fg.forms)}"
				.formAdded="${(title: string, form: Form) => {
					form.id && formsValueContainer?.addChild(fg.id, form.id, fg.id)
				}}"
			></form-selection-button>
			${children
				?.map((child) => {
					const childForm = Object.values(fg.forms).find((f) => f.id === child.getFormId())
					return (
						childForm &&
						html`
							<div class="container">
								${render(childForm, props, child, translationProvider, ownersProvider, codesProvider, optionsProvider)}
								<button @click="${() => formsValueContainer?.removeChild?.(child)}" class="float-right-btn bottom">-</button>
								<hr />
							</div>
						`
					)
				})
				.filter((x) => !!x)}
		</div>`
	}

	function renderTextField(fgSpan: number, fg: Field) {
		return html`<icure-form-textfield
			class="icure-form-field"
			style="${calculateFieldOrGroupWidth(fgSpan, fg.width, fg.grows, fg.styleOptions?.width)}"
			label="${fg.field}"
			value="${fg.value}"
			.displayedLabels="${getLabels(fg)}"
			.multiline="${fg.multiline || false}"
			defaultLanguage="${props.defaultLanguage}"
			.linksProvider=${fg.options?.linksProvider}
			.suggestionProvider=${fg.options?.suggestionProvider}
			.ownersProvider=${fg.options?.ownersProvider}
			.translationProvider=${translationProvider ?? (form.translations && defaultTranslationProvider(form.translations))}
			.codeColorProvider=${fg.options?.codeColorProvider}
			.linkColorProvider=${fg.options?.linkColorProvider}
			.codeContentProvider=${fg.options?.codeContentProvider}
			.valueProvider="${formsValueContainer && fieldValuesProvider(formsValueContainer, fg)}"
			.metadataProvider=${formsValueContainer && formsValueContainer.getMetadata}
			.handleValueChanged=${handleValueChanged(formsValueContainer, props.defaultOwner, fg)}
			.handleMetadataChanged=${handleMetadataChanged(formsValueContainer)}
			.styleOptions="${fg.styleOptions}"
			.readonly="${readonly || (fg.computedProperties?.readonly ? !formsValueContainer?.compute(fg.computedProperties?.readonly) : false)}"
		></icure-form-textfield>`
	}

	function renderMeasureField(fgSpan: number, fg: Field) {
		return html`<icure-form-measure-field
			style="${calculateFieldOrGroupWidth(fgSpan, fg.width, fg.grows)}"
			label="${fg.field}"
			.displayedLabels="${getLabels(fg)}"
			value="${fg.value}"
			unit="${fg.unit}"
			defaultLanguage="${props.defaultLanguage}"
			.translationProvider=${translationProvider ?? (form.translations && defaultTranslationProvider(form.translations))}
			.valueProvider="${formsValueContainer && fieldValuesProvider(formsValueContainer, fg)}"
			.metadataProvider=${formsValueContainer && formsValueContainer.getMetadata}
			.handleValueChanged=${handleValueChanged(formsValueContainer, props.defaultOwner, fg)}
			.handleMetadataChanged=${handleMetadataChanged(formsValueContainer)}
			.styleOptions="${fg.styleOptions}"
			.readonly="${readonly || (fg.computedProperties?.readonly ? !formsValueContainer?.compute(fg.computedProperties?.readonly) : false)}"
		></icure-form-measure-field>`
	}

	function renderNumberField(fgSpan: number, fg: Field) {
		return html`<icure-form-number-field
			style="${calculateFieldOrGroupWidth(fgSpan, fg.width, fg.grows)}"
			label="${fg.field}"
			.displayedLabels="${getLabels(fg)}"
			value="${fg.value}"
			defaultLanguage="${props.defaultLanguage}"
			.translationProvider=${translationProvider ?? (form.translations && defaultTranslationProvider(form.translations))}
			.valueProvider="${formsValueContainer && fieldValuesProvider(formsValueContainer, fg)}"
			.metadataProvider=${formsValueContainer && formsValueContainer.getMetadata}
			.handleValueChanged=${handleValueChanged(formsValueContainer, props.defaultOwner, fg)}
			.handleMetadataChanged=${handleMetadataChanged(formsValueContainer)}
			.styleOptions="${fg.styleOptions}"
			.readonly="${readonly || (fg.computedProperties?.readonly ? !formsValueContainer?.compute(fg.computedProperties?.readonly) : false)}"
		></icure-form-number-field>`
	}

	function renderDatePicker(fgSpan: number, fg: Field) {
		return html`<icure-form-date-picker
			style="${calculateFieldOrGroupWidth(fgSpan, fg.width, fg.grows)}"
			label="${fg.field}"
			.displayedLabels="${getLabels(fg)}"
			value="${fg.now ? currentDate() : fg.value}"
			defaultLanguage="${props.defaultLanguage}"
			.translationProvider=${translationProvider ?? (form.translations && defaultTranslationProvider(form.translations))}
			.valueProvider="${formsValueContainer && fieldValuesProvider(formsValueContainer, fg)}"
			.metadataProvider=${formsValueContainer && formsValueContainer.getMetadata}
			.handleValueChanged=${handleValueChanged(formsValueContainer, props.defaultOwner, fg)}
			.handleMetadataChanged=${handleMetadataChanged(formsValueContainer)}
			.styleOptions="${fg.styleOptions}"
			.readonly="${readonly || (fg.computedProperties?.readonly ? !formsValueContainer?.compute(fg.computedProperties?.readonly) : false)}"
		></icure-form-date-picker>`
	}

	function renderTimePicker(fgSpan: number, fg: Field) {
		return html`<icure-form-time-picker
			style="${calculateFieldOrGroupWidth(fgSpan, fg.width, fg.grows)}"
			label="${fg.field}"
			.displayedLabels="${getLabels(fg)}"
			value="${fg.now ? currentTime() : fg.value}"
			defaultLanguage="${props.defaultLanguage}"
			.translationProvider=${translationProvider ?? (form.translations && defaultTranslationProvider(form.translations))}
			.valueProvider="${formsValueContainer && fieldValuesProvider(formsValueContainer, fg)}"
			.metadataProvider=${formsValueContainer && formsValueContainer.getMetadata}
			.handleValueChanged=${handleValueChanged(formsValueContainer, props.defaultOwner, fg)}
			.handleMetadataChanged=${handleMetadataChanged(formsValueContainer)}
			.styleOptions="${fg.styleOptions}"
			.readonly="${readonly || (fg.computedProperties?.readonly ? !formsValueContainer?.compute(fg.computedProperties?.readonly) : false)}"
		></icure-form-time-picker>`
	}

	function renderDateTimePicker(fgSpan: number, fg: Field) {
		return html`<icure-form-date-time-picker
			style="${calculateFieldOrGroupWidth(fgSpan, fg.width, fg.grows)}"
			label="${fg.field}"
			.displayedLabels="${getLabels(fg)}"
			value="${fg.now ? currentDateTime() : fg.value}"
			defaultLanguage="${props.defaultLanguage}"
			.translationProvider=${translationProvider ?? (form.translations && defaultTranslationProvider(form.translations))}
			.valueProvider="${formsValueContainer && fieldValuesProvider(formsValueContainer, fg)}"
			.metadataProvider=${formsValueContainer && formsValueContainer.getMetadata}
			.handleValueChanged=${handleValueChanged(formsValueContainer, props.defaultOwner, fg)}
			.handleMetadataChanged=${handleMetadataChanged(formsValueContainer)}
			.styleOptions="${fg.styleOptions}"
			.readonly="${readonly || (fg.computedProperties?.readonly ? !formsValueContainer?.compute(fg.computedProperties?.readonly) : false)}"
		></icure-form-date-time-picker>`
	}

	function renderDropdownField(fgSpan: number, fg: Field) {
		return html`<icure-form-dropdown-field
			style="${calculateFieldOrGroupWidth(fgSpan, fg.width, fg.grows)}"
			.label=${fg.field}
			.displayedLabels=${getLabels(fg)}
			defaultLanguage="${props.defaultLanguage}"
			.translate="${fg.translate}"
			.sortOptions="${fg.sortOptions}"
			value="${fg.value}"
			.codifications="${fg.codifications}"
			.optionsProvider="${composedOptionsProvider && fg.codifications?.length
				? (language: string, searchTerms?: string) => composedOptionsProvider(language, fg.codifications ?? [], searchTerms, fg.sortOptions)
				: (language: string, searchTerms?: string) => filerAndSortOptionsFromFieldDefinition(language, fg, translationProvider, searchTerms)}"
			.ownersProvider=${ownersProvider}
			.translationProvider=${translationProvider ?? (form.translations && defaultTranslationProvider(form.translations))}
			.valueProvider="${formsValueContainer && fieldValuesProvider(formsValueContainer, fg)}"
			.metadataProvider=${formsValueContainer && formsValueContainer.getMetadata}
			.handleValueChanged=${handleValueChanged(formsValueContainer, props.defaultOwner, fg)}
			.handleMetadataChanged=${handleMetadataChanged(formsValueContainer)}
			.styleOptions="${fg.styleOptions}"
			.readonly="${readonly || (fg.computedProperties?.readonly ? !formsValueContainer?.compute(fg.computedProperties?.readonly) : false)}"
		></icure-form-dropdown-field>`
	}

	function renderRadioButtons(fgSpan: number, fg: Field) {
		return html`<icure-form-radio-button
			style="${calculateFieldOrGroupWidth(fgSpan, fg.width, fg.grows)}"
			.label="${fg.field}"
			.displayedLabels="${getLabels(fg)}"
			defaultLanguage="${props.defaultLanguage}"
			.translate="${fg.translate}"
			.sortOptions="${fg.sortOptions}"
			.codifications="${fg.codifications}"
			.optionsProvider="${composedOptionsProvider && fg.codifications?.length
				? (language: string, searchTerms?: string) => composedOptionsProvider(language, fg.codifications ?? [], searchTerms, fg.sortOptions)
				: (language: string, searchTerms?: string) => filerAndSortOptionsFromFieldDefinition(language, fg, translationProvider, searchTerms)}"
			.ownersProvider=${ownersProvider}
			.translationProvider=${translationProvider ?? (form.translations && defaultTranslationProvider(form.translations))}
			.valueProvider="${formsValueContainer && fieldValuesProvider(formsValueContainer, fg)}"
			.metadataProvider=${formsValueContainer && formsValueContainer.getMetadata}
			.handleValueChanged=${handleValueChanged(formsValueContainer, props.defaultOwner, fg)}
			.handleMetadataChanged=${handleMetadataChanged(formsValueContainer)}
			.styleOptions="${fg.styleOptions}"
			.readonly="${readonly || (fg.computedProperties?.readonly ? !formsValueContainer?.compute(fg.computedProperties?.readonly) : false)}"
		></icure-form-radio-button>`
	}

	function renderCheckboxes(fgSpan: number, fg: Field) {
		return html` <icure-form-checkbox
			style="${calculateFieldOrGroupWidth(fgSpan, fg.width, fg.grows)}"
			.label="${fg.field}"
			.displayedLabels="${getLabels(fg)}"
			defaultLanguage="${props.defaultLanguage}"
			.translate="${fg.translate}"
			.sortOptions="${fg.sortOptions}"
			value="${fg.value}"
			.codifications="${fg.codifications}"
			.optionsProvider="${composedOptionsProvider && fg.codifications?.length
				? (language: string, searchTerms?: string) => composedOptionsProvider(language, fg.codifications ?? [], searchTerms, fg.sortOptions)
				: (language: string, searchTerms?: string) => filerAndSortOptionsFromFieldDefinition(language, fg, translationProvider, searchTerms)}"
			.ownersProvider="${ownersProvider}"
			.translationProvider="${translationProvider ?? (form.translations && defaultTranslationProvider(form.translations))}"
			.valueProvider="${formsValueContainer && fieldValuesProvider(formsValueContainer, fg)}"
			.metadataProvider="${formsValueContainer && formsValueContainer.getMetadata}"
			.handleValueChanged="${handleValueChanged(formsValueContainer, props.defaultOwner, fg)}"
			.handleMetadataChanged="${handleMetadataChanged(formsValueContainer)}"
			.styleOptions="${fg.styleOptions}"
			.readonly="${readonly || (fg.computedProperties?.readonly ? !formsValueContainer?.compute(fg.computedProperties?.readonly) : false)}"
		></icure-form-checkbox>`
	}

	function renderLabel(fgSpan: number, fg: Field) {
		return html`<icure-form-label
			style="${calculateFieldOrGroupWidth(fgSpan, fg.width, fg.grows)}"
			labelPosition=${props.labelPosition}
			label="${fg.field}"
			.translationProvider=${translationProvider ?? (form.translations && defaultTranslationProvider(form.translations))}
			.styleOptions="${fg.styleOptions}"
			.readonly="${readonly || (fg.computedProperties?.readonly ? !formsValueContainer?.compute(fg.computedProperties?.readonly) : false)}"
		></icure-form-label>`
	}

	const renderFieldGroupOrSubform = function (fg: Field | Group | Subform, level: number): TemplateResult | TemplateResult[] | typeof nothing {
		if (!fg) {
			return nothing
		}
		const computedProperties = Object.keys(fg.computedProperties ?? {}).reduce(
			(acc, k) => ({ ...acc, [k]: fg.computedProperties?.[k] && formsValueContainer?.compute(fg.computedProperties[k]) }),
			{},
		)
		if (computedProperties['hidden']) {
			return html``
		}

		const fgSpan = computedProperties['span'] ?? fg.span ?? 6

		if (fg.clazz === 'group' && fg.fields?.length) {
			return renderGroup((fg as Group).copy({ ...computedProperties }), fgSpan, level)
		} else if (fg.clazz === 'subform' && (fg.id || computedProperties['title'])) {
			return renderSubform((fg as Subform).copy({ ...computedProperties }), fgSpan, level)
		} else if (fg.clazz === 'field') {
			const field = fg.copy({ ...computedProperties })
			return html`${fg.type === 'textfield'
				? renderTextField(fgSpan, field)
				: fg.type === 'measure-field'
				? renderMeasureField(fgSpan, field)
				: fg.type === 'number-field'
				? renderNumberField(fgSpan, field)
				: fg.type === 'date-picker'
				? renderDatePicker(fgSpan, field)
				: fg.type === 'time-picker'
				? renderTimePicker(fgSpan, field)
				: fg.type === 'date-time-picker'
				? renderDateTimePicker(fgSpan, field)
				: fg.type === 'dropdown-field'
				? renderDropdownField(fgSpan, field)
				: fg.type === 'radio-button'
				? renderRadioButtons(fgSpan, field)
				: fg.type === 'checkbox'
				? renderCheckboxes(fgSpan, field)
				: fg.type === 'label'
				? renderLabel(fgSpan, field)
				: ''}`
		}
		return html``
	}

	const calculateFieldOrGroupWidth = (span: number, fieldWidth?: number, shouldFieldGrow?: boolean, fixedWidth?: number | undefined) => {
		if (fixedWidth) return `width: ${fixedWidth}px`
		return `grid-column: span ${span};`
	}

	const renderForm = (form: Form) => {
		return form.sections.map((s) => html`<div class="icure-form">${s.fields.map((fieldOrGroup: Field | Group) => renderFieldGroupOrSubform(fieldOrGroup, 3))}</div>`)
	}

	return html` ${renderForm(form)} `
}
