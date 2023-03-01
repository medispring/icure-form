import { Field } from '../iqr-form/model'
import { Suggestion } from '../iqr-text-field'

export function dropdownOptionMapper(field: Field): Suggestion[] {
	const code = field.codifications?.[0]

	return Object.keys(field?.options ?? []).map((optionKey) => {
		const text: string = (field?.options?.[optionKey] as string) ?? ''
		return {
			id: optionKey,
			code: code ?? '',
			text: text,
			terms: text?.split(' ') ?? [],
		}
	})
}
