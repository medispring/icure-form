import { BooleanType, CompoundType, DateTimeType, MeasureType, NumberType, PrimitiveType, StringType, TimestampType } from '../components/model'
import { anyDateToDate } from './icure-utils'
import { Content } from '@icure/api'

export const normalizeUnit = (value: number, unit?: string): number => {
	if (!unit) {
		return value
	}
	switch (unit) {
		case 'kg':
			return value
		case 'g':
			return value / 1000
		case 'mg':
			return value / 1000000
		case 'l':
			return value
		case 'ml':
			return value / 1000
		case 'cl':
			return value / 100
		case 'm':
			return value
		case 'cm':
			return value / 100
		case 'mm':
			return value / 1000
		case 's':
			return value
		case 'min':
			return value * 60
		case 'h':
			return value * 60 * 60
		case 'd':
			return value * 60 * 60 * 24
		case 'week':
			return value * 60 * 60 * 24 * 7
		case 'month':
			return value * 60 * 60 * 24 * 30
		case 'year':
			return value * 60 * 60 * 24 * 365.25
	}
	return value
}

export type ParsedPrimitiveType = number | string | boolean | Date | ParsedPrimitiveType[]
export const parsePrimitive = (value: PrimitiveType): ParsedPrimitiveType | undefined => {
	switch (value.type) {
		case 'measure':
			const normalizedValue = normalizeUnit(+value.value, value.unit)
			return normalizedValue
		case 'datetime':
			return anyDateToDate(value.value)
		case 'timestamp':
			return anyDateToDate(value.value)
		case 'number':
			return +value.value
		case 'boolean':
			return value.value
		case 'string':
			return value.value
		case 'compound':
			return Object.values(value.value)
				.map(parsePrimitive)
				.filter((x) => x !== undefined) as ParsedPrimitiveType[]
	}
}

export const primitiveTypeToContent = (language: string, value: PrimitiveType): Content => {
	return {
		...(value.type === 'number' ? { numberValue: (value as NumberType).value } : {}),
		...(value.type === 'measure'
			? {
					measureValue: {
						value: (value as MeasureType).value,
						unit: (value as MeasureType).unit,
					},
			  }
			: {}),
		...(value.type === 'string' ? { stringValue: (value as StringType).value } : {}),
		...(value.type === 'datetime' ? { fuzzyDateValue: (value as DateTimeType).value } : {}),
		...(value.type === 'boolean' ? { booleanValue: (value as BooleanType).value } : {}),
		...(value.type === 'timestamp' ? { instantValue: (value as TimestampType).value } : {}),
		...(value.type === 'compound'
			? {
					compoundValue: Object.entries((value as CompoundType).value).map(([label, value]) => ({
						label,
						content: {
							[language]: primitiveTypeToContent(language, value),
						},
					})),
			  }
			: {}),
	}
}

export const contentToPrimitiveType = (language: string, content: Content | undefined): PrimitiveType | undefined => {
	if (!content) {
		return undefined
	}
	if (content.numberValue || content.numberValue === 0) {
		return { type: 'number', value: content.numberValue }
	}
	if (content.measureValue?.value || content.measureValue?.value === 0) {
		return { type: 'measure', value: content.measureValue?.value, unit: content.measureValue?.unit }
	}
	if (content.stringValue) {
		return { type: 'string', value: content.stringValue }
	}
	if (content.fuzzyDateValue) {
		return { type: 'datetime', value: content.fuzzyDateValue }
	}
	if (content.booleanValue) {
		return { type: 'boolean', value: content.booleanValue }
	}
	if (content.instantValue) {
		return { type: 'timestamp', value: content.instantValue }
	}
	if (content.compoundValue) {
		return {
			type: 'compound',
			value: content.compoundValue.reduce((acc: { [label: string]: PrimitiveType }, { label, content }) => {
				const primitiveValue = contentToPrimitiveType(language, content?.[language])
				return label && primitiveValue ? { ...acc, [label]: primitiveValue } : acc
			}, {}),
		}
	}

	return undefined
}
