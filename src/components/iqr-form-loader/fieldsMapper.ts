import { Field } from '../iqr-form/model'
import { OptionCode } from '../common'

export function optionMapper(field: Field): OptionCode[] {
	return Object.keys(field?.options ?? []).map((optionKey) => {
		const text: string = (field?.options?.[optionKey] as string) ?? ''
		return {
			id: optionKey,
			text: text,
		}
	})
}
