import { Field, Code, SortOptions } from '../components/model'
import { CodeStub } from '@icure/api'
import { defaultCodePromoter, defaultCodesComparator, makePromoter } from '../components/common/utils'

/**
 * Maps the options defined in a field into a list of codes
 *
 * @param language
 * @param field
 * @param translationProvider
 */
export const optionMapper = (language: string, field: Field, translationProvider?: (language: string, text: string) => string): Code[] =>
	Object.keys(field?.options ?? []).map((optionKey) => {
		const text: string = (field?.options?.[optionKey] as string) ?? ''
		return {
			id: optionKey,
			label: { [language]: translationProvider ? translationProvider(language, text) : text },
		}
	})

export const sortCodes = (codes: Code[], language: string, sortOptions?: SortOptions) =>
	sortOptions?.sort && sortOptions?.sort !== 'natural'
		? codes.sort(defaultCodesComparator(language, sortOptions?.sort === 'asc', sortOptions?.promotions ? makePromoter(sortOptions.promotions.split(/ ?, ?/)) : defaultCodePromoter))
		: codes

export const filterAndSortOptionsFromFieldDefinition = (
	language: string,
	fg: Field,
	translationProvider: ((language: string, text: string) => string) | undefined,
	searchTerms: string | undefined,
) =>
	Promise.resolve(
		sortCodes(
			optionMapper(language, fg, translationProvider).filter(
				(x) =>
					!searchTerms ||
					searchTerms
						.split(/\s+/)
						.map((st) => st.toLowerCase())
						.every((st) => x.label[language].toLowerCase().includes(st)),
			),
			language,
			fg.sortOptions,
		),
	)
export const codeStubToCode = (c: CodeStub) => ({ id: c.id ?? `${c.type}|${c.code}|${c.version}`, label: c.label ?? {} })
