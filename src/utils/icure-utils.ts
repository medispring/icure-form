import parse from 'date-fns/parse'
import { Content, Service } from '@icure/api'

export function fuzzyDate(epochOrLongCalendar?: number): Date | undefined {
	if (!epochOrLongCalendar && epochOrLongCalendar !== 0) {
		return undefined
	}
	if (epochOrLongCalendar >= 18000101 && epochOrLongCalendar < 25400000) {
		return parse('' + epochOrLongCalendar, 'YYYYMMDD', new Date())
	} else if (epochOrLongCalendar >= 18000101000000) {
		return parse('' + epochOrLongCalendar, 'YYYYMMDDHHmmss', new Date())
	} else {
		return new Date(epochOrLongCalendar)
	}
}

export function isServiceEqual(service1: Service, service2: Service): boolean {
	return true
}

export function isContentEqual(content1: Content, content2: Content): boolean {
	return (
		((!content1.binaryValue && !content2.binaryValue) || content1.binaryValue === content2.binaryValue) &&
		(((content1.booleanValue === null || content1.booleanValue === undefined) && (content2.booleanValue === null || content2.booleanValue === undefined)) ||
			content1.booleanValue === content2.booleanValue) &&
		((!content1.documentId && !content2.documentId) || content1.documentId === content2.documentId) &&
		(((content1.fuzzyDateValue === null || content1.fuzzyDateValue === undefined) && (content2.fuzzyDateValue === null || content2.fuzzyDateValue === undefined)) ||
			content1.fuzzyDateValue === content2.fuzzyDateValue) &&
		((!content1.instantValue && !content2.instantValue) || content1.instantValue === content2.instantValue) &&
		((!content1.measureValue && !content2.measureValue) || content1.measureValue === content2.measureValue) &&
		((!content1.medicationValue && !content2.medicationValue) || content1.medicationValue === content2.medicationValue) &&
		((!content1.stringValue && !content2.stringValue) || content1.stringValue === content2.stringValue) &&
		(((content1.numberValue === null || content1.numberValue === undefined) && (content2.numberValue === null || content2.numberValue === undefined)) ||
			content1.numberValue === content2.numberValue) &&
		((!content1.compoundValue && !content2.compoundValue) ||
			((content1.compoundValue?.every((s1) => content2.compoundValue?.some((s2) => isServiceEqual(s1, s2))) || false) &&
				(content2?.compoundValue?.every((s2) => content1?.compoundValue?.some((s1) => isServiceEqual(s1, s2))) || false)))
	)
}

export function isServiceContentEqual(content1: { [language: string]: Content }, content2: { [language: string]: Content }): boolean {
	return Object.keys(content1).reduce((isEqual, lng) => isEqual && isContentEqual(content1[lng], content2[lng]), true as boolean)
}
