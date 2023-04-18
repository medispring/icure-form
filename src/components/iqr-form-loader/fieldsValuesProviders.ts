import { Field } from '../iqr-form/model'
import { Meta, VersionedMeta, VersionedValue } from '../iqr-text-field'
import { convertServicesToVersionedMetas, convertServicesToVersionedValues, getVersions } from '../../utils/icure-utils'
import { CodeStub, Content } from '@icure/api'
import { FormValuesContainer } from './formValuesContainer'
// @ts-ignore
import { v4 as uuid } from 'uuid'

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

export function dropdownFieldValuesProvider(formValuesContainer: FormValuesContainer, field: Field): () => VersionedValue[] {
	return () => convertServicesToVersionedValues(getVersions(formValuesContainer, field), (content: Content) => `${content.stringValue}`)
}

export function radioButtonFieldValuesProvider(formValuesContainer: FormValuesContainer, field: Field): () => VersionedValue[] {
	return () => convertServicesToVersionedValues(getVersions(formValuesContainer, field), (content: Content) => `${content.stringValue}`)
}

export function metaProvider(formValuesContainer: FormValuesContainer, field: Field): () => VersionedMeta[] {
	return () => convertServicesToVersionedMetas(getVersions(formValuesContainer, field))
}

export function handleFieldValueChangedProvider(
	field: Field,
	formValuesContainer: FormValuesContainer,
	formValuesContainerChanged: (newValue: FormValuesContainer) => void,
): (serviceId: string | undefined, language: string, content: { asString: string; value: Content }, codes: CodeStub[]) => void {
	return (serviceId: string | undefined, language: string, content: { asString: string; value: Content }, codes: CodeStub[]) => {
		const sId = serviceId ?? uuid()
		formValuesContainerChanged(
			formValuesContainer.setValue(
				field.shortLabel ?? field.label(),
				sId,
				language,
				content.value ?? new Content({ stringValue: content.asString }),
				codes,
				(field.tags ?? []).map((s) => {
					const parts = s.split('|')
					return new CodeStub({ id: s, type: parts[0], code: parts[1], version: parts[2] })
				}),
			),
		)
	}
}

export function handleMeasureFieldValueChangedProvider(
	field: Field,
	formValuesContainer: FormValuesContainer,
	formValuesContainerChanged: (newValue: FormValuesContainer) => void,
): (serviceId: string | undefined, language: string, content: { asString: string; value: Content }, codes: CodeStub[]) => void {
	return (serviceId: string | undefined, language: string, content: { asString: string; value: Content }, codes: CodeStub[]) => {
		const sId = serviceId ?? uuid()
		formValuesContainerChanged(
			formValuesContainer.setValue(
				field.shortLabel ?? field.label(),
				sId,
				language,
				content.value ?? new Content({ measureValue: { value: content.asString.split(' ')[0] || '', unit: content.asString.split(' ')[1] || '' } }),
				codes,
				(field.tags ?? []).map((s) => {
					const parts = s.split('|')
					return new CodeStub({ id: s, type: parts[0], code: parts[1], version: parts[2] })
				}),
			),
		)
	}
}

export function handleNumberFieldValueChangedProvider(
	field: Field,
	formValuesContainer: FormValuesContainer,
	formValuesContainerChanged: (newValue: FormValuesContainer) => void,
): (serviceId: string | undefined, language: string, content: { asString: string; value: Content }, codes: CodeStub[]) => void {
	return (serviceId: string | undefined, language: string, content: { asString: string; value: Content }, codes: CodeStub[]) => {
		const sId = serviceId ?? uuid()
		formValuesContainerChanged(
			formValuesContainer.setValue(
				field.shortLabel ?? field.label(),
				sId,
				language,
				content.value ?? new Content({ numberValue: content.value }),
				codes,
				(field.tags ?? []).map((s) => {
					const parts = s.split('|')
					return new CodeStub({ id: s, type: parts[0], code: parts[1], version: parts[2] })
				}),
			),
		)
	}
}

export function handleDateTimeFieldValueChangedProvider(
	field: Field,
	formValuesContainer: FormValuesContainer,
	formValuesContainerChanged: (newValue: FormValuesContainer) => void,
): (serviceId: string | undefined, language: string, content: { asString: string; value: Content }, codes: CodeStub[]) => void {
	return (serviceId: string | undefined, language: string, content: { asString: string; value: Content }, codes: CodeStub[]) => {
		const sId = serviceId ?? uuid()
		formValuesContainerChanged(
			formValuesContainer.setValue(
				field.shortLabel ?? field.label(),
				sId,
				language,
				content.value ?? new Content({ fuzzyDateValue: content.asString.replace(/[\/:-]/gm, '').replace(/(..)(..)(....)(......)/, '$3$2$1$4') || '' }),
				codes,
				(field.tags ?? []).map((s) => {
					const parts = s.split('|')
					return new CodeStub({ id: s, type: parts[0], code: parts[1], version: parts[2] })
				}),
			),
		)
	}
}

export function handleDateFieldValueChangedProvider(
	field: Field,
	formValuesContainer: FormValuesContainer,
	formValuesContainerChanged: (newValue: FormValuesContainer) => void,
): (serviceId: string | undefined, language: string, content: { asString: string; value: Content }, codes: CodeStub[]) => void {
	return (serviceId: string | undefined, language: string, content: { asString: string; value: Content }, codes: CodeStub[]) => {
		const sId = serviceId ?? uuid()
		formValuesContainerChanged(
			formValuesContainer.setValue(
				field.shortLabel ?? field.label(),
				sId,
				language,
				content.value ?? new Content({ fuzzyDateValue: content.asString.replace(/[\/-]/gm, '').replace(/(..)(..)(....)/, '$3$2$1') || '' }),
				codes,
				(field.tags ?? []).map((s) => {
					const parts = s.split('|')
					return new CodeStub({ id: s, type: parts[0], code: parts[1], version: parts[2] })
				}),
			),
		)
	}
}

export function handleTimeFieldValueChangedProvider(
	field: Field,
	formValuesContainer: FormValuesContainer,
	formValuesContainerChanged: (newValue: FormValuesContainer) => void,
): (serviceId: string | undefined, language: string, content: { asString: string; value: Content }, codes: CodeStub[]) => void {
	return (serviceId: string | undefined, language: string, content: { asString: string; value: Content }, codes: CodeStub[]) => {
		const sId = serviceId ?? uuid()
		formValuesContainerChanged(
			formValuesContainer.setValue(
				field.shortLabel ?? field.label(),
				sId,
				language,
				content.value ?? new Content({ fuzzyDateValue: content.asString.replace(/[-:]/gm, '') || '' }),
				codes,
				(field.tags ?? []).map((s) => {
					const parts = s.split('|')
					return new CodeStub({ id: s, type: parts[0], code: parts[1], version: parts[2] })
				}),
			),
		)
	}
}

export function handleDropdownFieldValueChangedProvider(
	field: Field,
	formValuesContainer: FormValuesContainer,
	formValuesContainerChanged: (newValue: FormValuesContainer) => void,
): (serviceId: string | undefined, language: string, content: { asString: string; value: Content }, codes: CodeStub[]) => void {
	return (serviceId: string | undefined, language: string, content: { asString: string; value: Content }, codes: CodeStub[]) => {
		const sId = serviceId ?? uuid()
		formValuesContainerChanged(
			formValuesContainer.setValue(
				field.shortLabel ?? field.label(),
				sId,
				language,
				content.value ?? new Content({ stringValue: content.asString }),
				codes,
				(field.tags ?? []).map((s) => {
					const parts = s.split('|')
					return new CodeStub({ id: s, type: parts[0], code: parts[1], version: parts[2] })
				}),
			),
		)
	}
}

export function handleRadioButtonFieldValueChangedProvider(
	field: Field,
	formValuesContainer: FormValuesContainer,
	formValuesContainerChanged: (newValue: FormValuesContainer) => void,
): (serviceId: string | undefined, language: string, content: { asString: string; value: Content }, codes: CodeStub[]) => void {
	return (serviceId: string | undefined, language: string, content: { asString: string; value: Content }, codes: CodeStub[]) => {
		const sId = serviceId ?? uuid()
		formValuesContainerChanged(
			formValuesContainer.setValue(
				field.shortLabel ?? field.label(),
				sId,
				language,
				content.value ?? new Content({ stringValue: content.asString }),
				codes,
				(field.tags ?? []).map((s) => {
					const parts = s.split('|')
					return new CodeStub({ id: s, type: parts[0], code: parts[1], version: parts[2] })
				}),
			),
		)
	}
}

export function handleMetaChangedProvider(formValuesContainer: FormValuesContainer): (serviceId: string, meta: Meta) => void {
	return (serviceId: string, meta: Meta) => {
		if (meta.owner !== undefined) formValuesContainer.setResponsible(serviceId, meta.owner === null ? null : meta.owner.id)
		if (meta.valueDate !== undefined) formValuesContainer.setValueDate(serviceId, meta.valueDate)
	}
}
