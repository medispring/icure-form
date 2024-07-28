import parse from 'date-fns/parse'

export function anyDateToDate(dateOrEpochOrLongCalendar?: Date | number | undefined): Date | undefined {
	if (dateOrEpochOrLongCalendar === undefined) {
		return undefined
	}
	if (dateOrEpochOrLongCalendar instanceof Date) {
		return anyDateToDate(+dateOrEpochOrLongCalendar)
	}
	if (!dateOrEpochOrLongCalendar && dateOrEpochOrLongCalendar !== 0) {
		return undefined
	}
	if (dateOrEpochOrLongCalendar >= 18000101 && dateOrEpochOrLongCalendar < 25400000) {
		return parse('' + dateOrEpochOrLongCalendar, 'yyyyMMdd', new Date())
	} else if (dateOrEpochOrLongCalendar >= 18000101000000) {
		return parse('' + dateOrEpochOrLongCalendar, 'yyyyMMddHHmmss', new Date())
	} else {
		return new Date(dateOrEpochOrLongCalendar)
	}
}

export function dateToFuzzyDate(date: Date): number {
	return parseInt(
		`${date.getFullYear()}${(date.getMonth() + 1).toString().padStart(2, '0')}${date.getDate().toString().padStart(2, '0')}${date.getHours().toString().padStart(2, '0')}${date
			.getMinutes()
			.toString()
			.padStart(2, '0')}${date.getSeconds().toString().padStart(2, '0')}`,
	)
}

export function anyDateToFuzzyDate(dateOrEpochOrLongCalendar: Date | number) {
	const date = anyDateToDate(dateOrEpochOrLongCalendar)
	if (!date) {
		return undefined
	}
	return dateToFuzzyDate(date)
}

export function currentTime() {
	const now = new Date()
	return `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`
}

export function currentDate() {
	const now = new Date()
	return `${now.getDate().toString().padStart(2, '0')}/${(now.getMonth() + 1).toString().padStart(2, '0')}/${now.getFullYear()}`
}

export function currentDateTime() {
	return `${currentDate()} ${currentTime()}`
}
