import { html, nothing, TemplateResult } from 'lit'
import { Renderer, RendererProps } from '../index'
import { fieldValuesProvider, handleMetadataChanged, handleValueChanged } from '../../../../utils/fields-values-provider'
import { currentDate, currentDateTime, currentTime } from '../../../../utils/icure-utils'
import { CodeStub, HealthcareParty } from '@icure/api'
import { Code, FieldMetadata, FieldValue, Form, Field, Group, Subform, SortOptions } from '../../../model'
import { FormValuesContainer } from '../../../../generic'

import { defaultTranslationProvider } from '../../../../utils/languages'
import { getLabels } from '../../../common/utils'
import { filerAndSortOptionsFromFieldDefinition, sortCodes } from '../../../../utils/code-utils'

import './form-selection-button'

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
		return html`<div class="${['group', fg.borderless ? undefined : 'bordered'].filter((x) => !!x).join(' ')}" style="${calculateFieldOrGroupSize(fgSpan, 1)}">
			${fg.borderless ? nothing : html`<div>${h(level, html`${fg.group}`)}</div>`}
			<div class="icure-form">${(fg.fields ?? []).map((fieldOrGroup: Field | Group) => renderFieldGroupOrSubform(fieldOrGroup, level + 1))}</div>
		</div>`
	}

	function renderSubform(fg: Subform, fgSpan: number, level: number) {
		const children = formsValueContainer?.getChildren()?.filter((c) => c.getLabel() === fg.id)
		return html`<div class="subform" style="${calculateFieldOrGroupSize(fgSpan, 1)}">
			<div>${h(level, html`${fg.shortLabel}`)}</div>
			<form-selection-button
				class="float-right-btn top"
				.forms="${Object.entries(fg.forms)}"
				.formAdded="${(title: string, form: Form) => {
					form.id && formsValueContainer?.addChild(fg.id, form.id, fg.shortLabel ?? '')
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

	function renderTextField(fgSpan: number, fgRowSpan: number, fg: Field) {
		return html`<icure-form-text-field
			class="icure-form-field"
			style="${calculateFieldOrGroupSize(fgSpan, fgRowSpan, fg.styleOptions?.width)}"
			label="${fg.field}"
			value="${fg.value}"
			.displayedLabels="${getLabels(fg)}"
			.multiline="${fg.multiline || false}"
			.lines=${fgRowSpan}
			.defaultLanguage="${props.defaultLanguage}"
			.displayedLanguage="${props.displayedLanguage}"
			.linksProvider=${fg.options?.linksProvider}
			.suggestionProvider=${fg.options?.suggestionProvider}
			.ownersProvider=${fg.options?.ownersProvider}
			.translationProvider=${translationProvider ?? (form.translations && defaultTranslationProvider(form.translations))}
			.codeColorProvider=${fg.options?.codeColorProvider}
			.linkColorProvider=${fg.options?.linkColorProvider}
			.codeContentProvider=${fg.options?.codeContentProvider}
			.valueProvider="${formsValueContainer && fieldValuesProvider(formsValueContainer, fg)}"
			.metadataProvider=${formsValueContainer && formsValueContainer.getMetadata.bind(formsValueContainer)}
			.handleValueChanged=${handleValueChanged(formsValueContainer, fg, props.defaultOwner)}
			.handleMetadataChanged=${handleMetadataChanged(formsValueContainer)}
			.styleOptions="${fg.styleOptions}"
			.readonly="${readonly || fg.readonly || (fg.computedProperties?.readonly ? !formsValueContainer?.compute(fg.computedProperties?.readonly) : false)}"
		></icure-form-text-field>`
	}

	function renderTokenField(fgSpan: number, fgRowSpan: number, fg: Field) {
		return html`<icure-form-token-field
			class="icure-form-field"
			style="${calculateFieldOrGroupSize(fgSpan, fgRowSpan, fg.styleOptions?.width)}"
			label="${fg.field}"
			value="${fg.value}"
			.displayedLabels="${getLabels(fg)}"
			.multiline="${fg.multiline || false}"
			.lines=${fgRowSpan}
			.defaultLanguage="${props.defaultLanguage}"
			.displayedLanguage="${props.displayedLanguage}"
			.suggestionProvider=${fg.options?.suggestionProvider}
			.ownersProvider=${fg.options?.ownersProvider}
			.translationProvider=${translationProvider ?? (form.translations && defaultTranslationProvider(form.translations))}
			.valueProvider="${formsValueContainer && fieldValuesProvider(formsValueContainer, fg)}"
			.metadataProvider=${formsValueContainer && formsValueContainer.getMetadata.bind(formsValueContainer)}
			.handleValueChanged=${handleValueChanged(formsValueContainer, fg, props.defaultOwner)}
			.handleMetadataChanged=${handleMetadataChanged(formsValueContainer)}
			.styleOptions="${fg.styleOptions}"
			.readonly="${readonly || fg.readonly || (fg.computedProperties?.readonly ? !formsValueContainer?.compute(fg.computedProperties?.readonly) : false)}"
		></icure-form-token-field>`
	}

	function renderItemsListField(fgSpan: number, fgRowSpan: number, fg: Field) {
		return html`<icure-form-items-list-field
			class="icure-form-field"
			style="${calculateFieldOrGroupSize(fgSpan, fgRowSpan, fg.styleOptions?.width)}"
			label="${fg.field}"
			value="${fg.value}"
			.displayedLabels="${getLabels(fg)}"
			.multiline="${fg.multiline || false}"
			.lines=${fgRowSpan}
			.defaultLanguage="${props.defaultLanguage}"
			.displayedLanguage="${props.displayedLanguage}"
			.suggestionProvider=${fg.options?.suggestionProvider}
			.ownersProvider=${fg.options?.ownersProvider}
			.translationProvider=${translationProvider ?? (form.translations && defaultTranslationProvider(form.translations))}
			.valueProvider="${formsValueContainer && fieldValuesProvider(formsValueContainer, fg)}"
			.metadataProvider=${formsValueContainer && formsValueContainer.getMetadata.bind(formsValueContainer)}
			.handleValueChanged=${handleValueChanged(formsValueContainer, fg, props.defaultOwner)}
			.handleMetadataChanged=${handleMetadataChanged(formsValueContainer)}
			.styleOptions="${fg.styleOptions}"
			.readonly="${readonly || fg.readonly || (fg.computedProperties?.readonly ? !formsValueContainer?.compute(fg.computedProperties?.readonly) : false)}"
		></icure-form-items-list-field>`
	}

	function renderMeasureField(fgSpan: number, fgRowSpan: number, fg: Field) {
		return html`<icure-form-measure-field
			style="${calculateFieldOrGroupSize(fgSpan, fgRowSpan)}"
			label="${fg.field}"
			.displayedLabels="${getLabels(fg)}"
			value="${fg.value}"
			unit="${fg.unit}"
			.defaultLanguage="${props.defaultLanguage}"
			.displayedLanguage="${props.displayedLanguage}"
			.translationProvider=${translationProvider ?? (form.translations && defaultTranslationProvider(form.translations))}
			.valueProvider="${formsValueContainer && fieldValuesProvider(formsValueContainer, fg)}"
			.metadataProvider=${formsValueContainer && formsValueContainer.getMetadata.bind(formsValueContainer)}
			.handleValueChanged=${handleValueChanged(formsValueContainer, fg, props.defaultOwner)}
			.handleMetadataChanged=${handleMetadataChanged(formsValueContainer)}
			.styleOptions="${fg.styleOptions}"
			.readonly="${readonly || fg.readonly || (fg.computedProperties?.readonly ? !formsValueContainer?.compute(fg.computedProperties?.readonly) : false)}"
		></icure-form-measure-field>`
	}

	function renderNumberField(fgSpan: number, fgRowSpan: number, fg: Field) {
		return html`<icure-form-number-field
			style="${calculateFieldOrGroupSize(fgSpan, fgRowSpan)}"
			label="${fg.field}"
			.displayedLabels="${getLabels(fg)}"
			value="${fg.value}"
			.defaultLanguage="${props.defaultLanguage}"
			.displayedLanguage="${props.displayedLanguage}"
			.translationProvider=${translationProvider ?? (form.translations && defaultTranslationProvider(form.translations))}
			.valueProvider="${formsValueContainer && fieldValuesProvider(formsValueContainer, fg)}"
			.metadataProvider=${formsValueContainer && formsValueContainer.getMetadata.bind(formsValueContainer)}
			.handleValueChanged=${handleValueChanged(formsValueContainer, fg, props.defaultOwner)}
			.handleMetadataChanged=${handleMetadataChanged(formsValueContainer)}
			.styleOptions="${fg.styleOptions}"
			.readonly="${readonly || fg.readonly || (fg.computedProperties?.readonly ? !formsValueContainer?.compute(fg.computedProperties?.readonly) : false)}"
		></icure-form-number-field>`
	}

	function renderDatePicker(fgSpan: number, fgRowSpan: number, fg: Field) {
		return html`<icure-form-date-picker
			style="${calculateFieldOrGroupSize(fgSpan, fgRowSpan)}"
			label="${fg.field}"
			.displayedLabels="${getLabels(fg)}"
			value="${fg.now ? currentDate() : fg.value}"
			.defaultLanguage="${props.defaultLanguage}"
			.displayedLanguage="${props.displayedLanguage}"
			.translationProvider=${translationProvider ?? (form.translations && defaultTranslationProvider(form.translations))}
			.valueProvider="${formsValueContainer && fieldValuesProvider(formsValueContainer, fg)}"
			.metadataProvider=${formsValueContainer && formsValueContainer.getMetadata.bind(formsValueContainer)}
			.handleValueChanged=${handleValueChanged(formsValueContainer, fg, props.defaultOwner)}
			.handleMetadataChanged=${handleMetadataChanged(formsValueContainer)}
			.styleOptions="${fg.styleOptions}"
			.readonly="${readonly || fg.readonly || (fg.computedProperties?.readonly ? !formsValueContainer?.compute(fg.computedProperties?.readonly) : false)}"
		></icure-form-date-picker>`
	}

	function renderTimePicker(fgSpan: number, fgRowSpan: number, fg: Field) {
		return html`<icure-form-time-picker
			style="${calculateFieldOrGroupSize(fgSpan, fgRowSpan)}"
			label="${fg.field}"
			.displayedLabels="${getLabels(fg)}"
			value="${fg.now ? currentTime() : fg.value}"
			.defaultLanguage="${props.defaultLanguage}"
			.displayedLanguage="${props.displayedLanguage}"
			.translationProvider=${translationProvider ?? (form.translations && defaultTranslationProvider(form.translations))}
			.valueProvider="${formsValueContainer && fieldValuesProvider(formsValueContainer, fg)}"
			.metadataProvider=${formsValueContainer && formsValueContainer.getMetadata.bind(formsValueContainer)}
			.handleValueChanged=${handleValueChanged(formsValueContainer, fg, props.defaultOwner)}
			.handleMetadataChanged=${handleMetadataChanged(formsValueContainer)}
			.styleOptions="${fg.styleOptions}"
			.readonly="${readonly || fg.readonly || (fg.computedProperties?.readonly ? !formsValueContainer?.compute(fg.computedProperties?.readonly) : false)}"
		></icure-form-time-picker>`
	}

	function renderDateTimePicker(fgSpan: number, fgRowSpan: number, fg: Field) {
		return html`<icure-form-date-time-picker
			style="${calculateFieldOrGroupSize(fgSpan, fgRowSpan)}"
			label="${fg.field}"
			.displayedLabels="${getLabels(fg)}"
			value="${fg.now ? currentDateTime() : fg.value}"
			.defaultLanguage="${props.defaultLanguage}"
			.displayedLanguage="${props.displayedLanguage}"
			.translationProvider=${translationProvider ?? (form.translations && defaultTranslationProvider(form.translations))}
			.valueProvider="${formsValueContainer && fieldValuesProvider(formsValueContainer, fg)}"
			.metadataProvider=${formsValueContainer && formsValueContainer.getMetadata.bind(formsValueContainer)}
			.handleValueChanged=${handleValueChanged(formsValueContainer, fg, props.defaultOwner)}
			.handleMetadataChanged=${handleMetadataChanged(formsValueContainer)}
			.styleOptions="${fg.styleOptions}"
			.readonly="${readonly || fg.readonly || (fg.computedProperties?.readonly ? !formsValueContainer?.compute(fg.computedProperties?.readonly) : false)}"
		></icure-form-date-time-picker>`
	}

	function renderDropdownField(fgSpan: number, fgRowSpan: number, fg: Field) {
		return html`<icure-form-dropdown-field
			style="${calculateFieldOrGroupSize(fgSpan, fgRowSpan)}"
			.label=${fg.field}
			.displayedLabels=${getLabels(fg)}
			.defaultLanguage="${props.defaultLanguage}"
			.displayedLanguage="${props.displayedLanguage}"
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
			.metadataProvider=${formsValueContainer && formsValueContainer.getMetadata.bind(formsValueContainer)}
			.handleValueChanged=${handleValueChanged(formsValueContainer, fg, props.defaultOwner)}
			.handleMetadataChanged=${handleMetadataChanged(formsValueContainer)}
			.styleOptions="${fg.styleOptions}"
			.readonly="${readonly || fg.readonly || (fg.computedProperties?.readonly ? !formsValueContainer?.compute(fg.computedProperties?.readonly) : false)}"
		></icure-form-dropdown-field>`
	}

	function renderRadioButtons(fgSpan: number, fgRowSpan: number, fg: Field) {
		return html`<icure-form-radio-button
			style="${calculateFieldOrGroupSize(fgSpan, fgRowSpan)}"
			.label="${fg.field}"
			.displayedLabels="${getLabels(fg)}"
			.defaultLanguage="${props.defaultLanguage}"
			.displayedLanguage="${props.displayedLanguage}"
			.translate="${fg.translate}"
			.sortOptions="${fg.sortOptions}"
			.codifications="${fg.codifications}"
			.optionsProvider="${composedOptionsProvider && fg.codifications?.length
				? (language: string, searchTerms?: string) => composedOptionsProvider(language, fg.codifications ?? [], searchTerms, fg.sortOptions)
				: (language: string, searchTerms?: string) => filerAndSortOptionsFromFieldDefinition(language, fg, translationProvider, searchTerms)}"
			.ownersProvider=${ownersProvider}
			.translationProvider=${translationProvider ?? (form.translations && defaultTranslationProvider(form.translations))}
			.valueProvider="${formsValueContainer && fieldValuesProvider(formsValueContainer, fg)}"
			.metadataProvider=${formsValueContainer && formsValueContainer.getMetadata.bind(formsValueContainer)}
			.handleValueChanged=${handleValueChanged(formsValueContainer, fg, props.defaultOwner)}
			.handleMetadataChanged=${handleMetadataChanged(formsValueContainer)}
			.styleOptions="${fg.styleOptions}"
			.readonly="${readonly || fg.readonly || (fg.computedProperties?.readonly ? !formsValueContainer?.compute(fg.computedProperties?.readonly) : false)}"
		></icure-form-radio-button>`
	}

	function renderCheckboxes(fgSpan: number, fgRowSpan: number, fg: Field) {
		return html` <icure-form-checkbox
			style="${calculateFieldOrGroupSize(fgSpan, fgRowSpan)}"
			.label="${fg.field}"
			.displayedLabels="${getLabels(fg)}"
			.defaultLanguage="${props.defaultLanguage}"
			.displayedLanguage="${props.displayedLanguage}"
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
			.metadataProvider="${formsValueContainer && formsValueContainer.getMetadata.bind(formsValueContainer)}"
			.handleValueChanged="${handleValueChanged(formsValueContainer, fg, props.defaultOwner)}"
			.handleMetadataChanged="${handleMetadataChanged(formsValueContainer)}"
			.styleOptions="${fg.styleOptions}"
			.readonly="${readonly || fg.readonly || (fg.computedProperties?.readonly ? !formsValueContainer?.compute(fg.computedProperties?.readonly) : false)}"
		></icure-form-checkbox>`
	}

	function renderLabel(fgSpan: number, fgRowSpan: number, fg: Field) {
		return html`<icure-form-label
			style="${calculateFieldOrGroupSize(fgSpan, fgRowSpan)}"
			labelPosition=${props.labelPosition}
			label="${fg.field}"
			.translationProvider=${translationProvider ?? (form.translations && defaultTranslationProvider(form.translations))}
			.styleOptions="${fg.styleOptions}"
			.readonly="${readonly || fg.readonly || (fg.computedProperties?.readonly ? !formsValueContainer?.compute(fg.computedProperties?.readonly) : false)}"
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
		const fgRowSpan = computedProperties['rowSpan'] ?? fg.rowSpan ?? 1

		if (fg.clazz === 'group' && fg.fields?.length) {
			return renderGroup((fg as Group).copy({ ...computedProperties }), fgSpan, level)
		} else if (fg.clazz === 'subform' && (fg.id || computedProperties['title'])) {
			return renderSubform((fg as Subform).copy({ ...computedProperties }), fgSpan, level)
		} else if (fg.clazz === 'field') {
			const field = fg.copy({ ...computedProperties })
			return html`${fg.type === 'text-field'
				? renderTextField(fgSpan, fgRowSpan, field)
				: fg.type === 'measure-field'
				? renderMeasureField(fgSpan, fgRowSpan, field)
				: fg.type === 'token-field'
				? renderTokenField(fgSpan, fgRowSpan, field)
				: fg.type === 'items-list-field'
				? renderItemsListField(fgSpan, fgRowSpan, field)
				: fg.type === 'number-field'
				? renderNumberField(fgSpan, fgRowSpan, field)
				: fg.type === 'date-picker'
				? renderDatePicker(fgSpan, fgRowSpan, field)
				: fg.type === 'time-picker'
				? renderTimePicker(fgSpan, fgRowSpan, field)
				: fg.type === 'date-time-picker'
				? renderDateTimePicker(fgSpan, fgRowSpan, field)
				: fg.type === 'dropdown-field'
				? renderDropdownField(fgSpan, fgRowSpan, field)
				: fg.type === 'radio-button'
				? renderRadioButtons(fgSpan, fgRowSpan, field)
				: fg.type === 'checkbox'
				? renderCheckboxes(fgSpan, fgRowSpan, field)
				: fg.type === 'label'
				? renderLabel(fgSpan, fgRowSpan, field)
				: ''}`
		}
		return html``
	}

	const calculateFieldOrGroupSize = (span: number, rowSpan: number, fixedWidth?: number | undefined) => {
		if (fixedWidth) return `width: ${fixedWidth}px`
		return `grid-column: span ${span}; ${rowSpan > 1 ? `grid-row: span ${rowSpan}` : ''}`
	}

	const renderForm = (form: Form) => {
		return form.sections.map((s) => html`<div class="icure-form">${s.fields.map((fieldOrGroup: Field | Group) => renderFieldGroupOrSubform(fieldOrGroup, 3))}</div>`)
	}

	return html` ${renderForm(form)} `
}
