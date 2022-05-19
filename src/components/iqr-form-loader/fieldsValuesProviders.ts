import { Field } from '../iqr-form/model'
import { Meta, VersionedMeta, VersionedValue } from '../iqr-text-field'
import { convertServicesToVersionedMetas, convertServicesToVersionedValues, getVersions } from '../../utils/icure-utils'
import { CodeStub, Content } from '@icure/api'
import { FormValuesContainer } from './formValuesContainer'

export function numberFieldValuesProvider(formValuesContainer: FormValuesContainer, field: Field): () => VersionedValue[] {
	return () =>
		convertServicesToVersionedValues(getVersions(formValuesContainer, field), (content: Content) =>
			content.numberValue || content.numberValue === 0 ? new Intl.NumberFormat('fr').format(content.numberValue) : '',
		)
}

export function measureFieldValuesProvider(formValuesContainer: FormValuesContainer, field: Field): () => VersionedValue[] {
	return () =>
		convertServicesToVersionedValues(getVersions(formValuesContainer, field), (content: Content) =>
			content.measureValue?.value || content.measureValue?.value === 0 ? `${new Intl.NumberFormat('fr').format(content.measureValue.value)} ${content.measureValue?.unit}` : '',
		)
}

export function textFieldValuesProvider(formValuesContainer: FormValuesContainer, field: Field): () => VersionedValue[] {
	return () => convertServicesToVersionedValues(getVersions(formValuesContainer, field), (content: Content) => content.stringValue || '')
}

export function dateFieldValuesProvider(formValuesContainer: FormValuesContainer, field: Field): () => VersionedValue[] {
	return () =>
		convertServicesToVersionedValues(getVersions(formValuesContainer, field), (content: Content) => `${content.fuzzyDateValue}`.replace(/(....)(..)(..)/, '$3$2$1') || '')
}

export function dateTimeFieldValuesProvider(formValuesContainer: FormValuesContainer, field: Field): () => VersionedValue[] {
	return () =>
		convertServicesToVersionedValues(
			getVersions(formValuesContainer, field),
			(content: Content) => `${content.fuzzyDateValue}`.replace(/(....)(..)(..)(......)/, '$3$2$1 $4') || '',
		)
}

export function timeFieldValuesProvider(formValuesContainer: FormValuesContainer, field: Field): () => VersionedValue[] {
	return () => convertServicesToVersionedValues(getVersions(formValuesContainer, field), (content: Content) => `${content.fuzzyDateValue}`)
}

export function metaProvider(formValuesContainer: FormValuesContainer, field: Field): () => VersionedMeta[] {
	return () => convertServicesToVersionedMetas(getVersions(formValuesContainer, field))
}

export function handleTextFieldValueChangedProvider(
	formValuesContainer: FormValuesContainer,
	formValuesContainerChanged: (newValue: FormValuesContainer) => void,
): (serviceId: string, language: string, content: string, codes: CodeStub[]) => void {
	return (serviceId: string, language: string, content: string, codes: CodeStub[]) => {
		formValuesContainerChanged(formValuesContainer.setValue(serviceId, language, new Content({ stringValue: content }), codes))
	}
}

export function handleMetaChangedProvider(formValuesContainer: FormValuesContainer): (serviceId: string, meta: Meta) => void {
	return (serviceId: string, meta: Meta) => {
		if (meta.owner !== undefined) formValuesContainer.setResponsible(serviceId, meta.owner === null ? null : meta.owner.id)
		if (meta.valueDate !== undefined) formValuesContainer.setValueDate(serviceId, meta.valueDate)
	}
}
