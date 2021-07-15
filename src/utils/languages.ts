export const languages = {
	en: 'English',
	fr: 'French',
	es: 'Spanish',
	nl: 'Dutch',
	de: 'German',
}

export function languageName(iso: string): string {
	return languages[iso] || iso
}
