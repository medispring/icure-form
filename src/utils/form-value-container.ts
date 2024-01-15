import { Field, FieldMetadata, FieldValue, Form, Group, Subform } from '../components/model'
import { fieldValuesProvider, makeMetadata } from './fields-values-provider'
import { FormValuesContainer } from '../generic'

export const initializeWithFormDefaultValues = (
	formValuesContainer: FormValuesContainer<FieldValue, FieldMetadata>,
	form: Form,
	language?: string,
	owner?: string,
): FormValuesContainer<FieldValue, FieldMetadata> => {
	const fvc = [formValuesContainer]

	const extractDefaultValues = (fgs: Array<Field | Group | Subform>, language?: string) => {
		if (fvc[0]) {
			fgs.forEach((fg) => {
				if (fg.clazz === 'group' && fg.fields?.length) {
					extractDefaultValues(fg.fields, language)
				} else if (fg.clazz === 'field') {
					//Check that no value already exists
					if (!Object.keys(fieldValuesProvider(fvc[0], fg)() ?? {}).length) {
						if (fg.computedProperties?.defaultValue) {
							const value: FieldValue | undefined = fvc[0]?.compute(fg.computedProperties?.defaultValue)
							if (value !== undefined) {
								const lng = language ?? 'en'
								if (!value.content[lng] && value.content['*']) {
									value.content[lng] = value.content['*']
								}
								//TODO support batch changes
								fvc[0]?.setValue((fg as Field).label(), lng, value, undefined, makeMetadata(fg, owner))
							}
						}
					}
				}
			})
		}
	}

	const listener = (newValue: FormValuesContainer<FieldValue, FieldMetadata>) => {
		fvc[0] = newValue
	}
	fvc[0].registerChangeListener(listener)

	form?.sections.forEach((section) => {
		extractDefaultValues(section.fields ?? [], language)
	})

	fvc[0].unregisterChangeListener(listener)
	return fvc[0]
}
