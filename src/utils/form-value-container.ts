import { Field, FieldMetadata, FieldValue, Form, Group, Subform } from '../components/model'
import { makeMetadata } from './fields-values-provider'
import { FormValuesContainer } from '../generic'

export const computeFormDefaultValues = (
	formValuesContainer: FormValuesContainer<FieldValue, FieldMetadata>,
	form?: Form,
	language?: string,
	owner?: string,
): [FieldValue, FieldMetadata][] => {
	const extractDefaultValues = (fgs: Array<Field | Group | Subform>, language?: string): [FieldValue, FieldMetadata][] =>
		fgs.reduce((acc, fg) => {
			if (fg.clazz === 'group' && fg.fields?.length) {
				return [...acc, ...extractDefaultValues(fg.fields, language)]
			} else if (fg.clazz === 'field') {
				if (fg.computedProperties?.defaultValue) {
					const value: FieldValue | undefined = formValuesContainer?.compute(fg.computedProperties?.defaultValue)
					if (value !== undefined) {
						const lng = language ?? 'en'
						if (!value.content[lng] && value.content['*']) {
							value.content[lng] = value.content['*']
						}
						if (value.content[lng]) {
							return [...acc, [value, makeMetadata(fg, owner)]]
						}
					}
				}
			}
			return acc
		}, [] as [FieldValue, FieldMetadata][])

	return (
		form?.sections.reduce((acc, section) => {
			return [...acc, ...extractDefaultValues(section.fields ?? [], language)]
		}, [] as [FieldValue, FieldMetadata][]) ?? []
	)
}
