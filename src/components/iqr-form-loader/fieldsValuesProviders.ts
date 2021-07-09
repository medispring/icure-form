import { Field } from '../iqr-form/model'
import { VersionedValue } from '../iqr-text-field'
import { convertServicesToVersionedValues, getVersions } from '../../utils/icure-utils'
import { Content } from '@icure/api'
import { FormValuesContainer } from './formValuesContainer'

export function numberFieldValuesProvider(formsValueContainer: FormValuesContainer, field: Field): () => VersionedValue[] {
	return () =>
		convertServicesToVersionedValues(getVersions(formsValueContainer, field), (content: Content) =>
			content.numberValue || content.numberValue === 0 ? new Intl.NumberFormat('fr').format(content.numberValue) : '',
		)
}

export function measureFieldValuesProvider(formsValueContainer: FormValuesContainer, field: Field): () => VersionedValue[] {
	return () =>
		convertServicesToVersionedValues(getVersions(formsValueContainer, field), (content: Content) =>
			content.measureValue?.value || content.measureValue?.value === 0 ? `${new Intl.NumberFormat('fr').format(content.measureValue.value)} ${content.measureValue?.unit}` : '',
		)
}

export function textFieldValuesProvider(formsValueContainer: FormValuesContainer, field: Field): () => VersionedValue[] {
	return () => convertServicesToVersionedValues(getVersions(formsValueContainer, field), (content: Content) => content.stringValue || '')
}

export function dateFieldValuesProvider(formsValueContainer: FormValuesContainer, field: Field): () => VersionedValue[] {
	return () =>
		convertServicesToVersionedValues(getVersions(formsValueContainer, field), (content: Content) => `${content.fuzzyDateValue}`.replace(/(....)(..)(..)/, '$3$2$1') || '')
}

export function dateTimeFieldValuesProvider(formsValueContainer: FormValuesContainer, field: Field): () => VersionedValue[] {
	return () =>
		convertServicesToVersionedValues(
			getVersions(formsValueContainer, field),
			(content: Content) => `${content.fuzzyDateValue}`.replace(/(....)(..)(..)(......)/, '$3$2$1 $4') || '',
		)
}

export function timeFieldValuesProvider(formsValueContainer: FormValuesContainer, field: Field): () => VersionedValue[] {
	return () => convertServicesToVersionedValues(getVersions(formsValueContainer, field), (content: Content) => `${content.fuzzyDateValue}`)
}
