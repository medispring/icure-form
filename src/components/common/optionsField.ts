import { property } from 'lit/decorators.js'
import { CodeStub } from '@icure/api'
import { ValuedField } from './valuedField'

export class OptionCode {
	id: string
	text: string
}

export class TranslatedOptionCode {
	id: string
	text: string
	translatedText: string
}

export abstract class OptionsField<T, V> extends ValuedField<T, V> {
	@property() options?: (OptionCode | CodeStub)[] = []
	@property() codifications?: string[] = []
	@property() optionsProvider: (codifications: string[], searchTerm?: string) => Promise<(OptionCode | CodeStub)[]> = async () => []
	@property() sortable?: boolean = false

	protected translatedOptions: (TranslatedOptionCode | CodeStub)[] = []
	protected async fetchInitialsOptions(): Promise<(OptionCode | CodeStub)[]> {
		return this.fetchOptions('') as Promise<(OptionCode | CodeStub)[]>
	}
	protected async fetchOptions(searchTerm: string): Promise<(OptionCode | CodeStub)[]> {
		return (this.optionsProvider(this.codifications ?? [], searchTerm) as Promise<(OptionCode | CodeStub)[]>).then(this.sort.bind(this))
	}
	protected fetchTranslateOptions(): void {
		this.translatedOptions =
			this.options?.map((option) => {
				if (Boolean(option?.['text'])) {
					return {
						id: option.id,
						text: option?.['text'],
						translatedText: this.translateText(option?.['text'] || ''),
					}
				} else {
					if (Boolean(option?.['label'])) {
						option['translatedText'] = this.translateText(option?.['label']?.[this.defaultLanguage || 'en'] || '')
					}
					return option
				}
			}) ?? []
		this.sort(this.translatedOptions)
	}

	protected sort(array: (OptionCode | CodeStub | TranslatedOptionCode)[]): (OptionCode | CodeStub | TranslatedOptionCode)[] {
		if (this.sortable) {
			const comparatorProperty: (arg0: OptionCode | TranslatedOptionCode | CodeStub) => string = (obj: OptionCode | CodeStub | TranslatedOptionCode): string =>
				obj?.['translatedText'] || obj?.['text'] || obj?.['label']?.[this.displayedLanguage || this.defaultLanguage || 'en'] || ''
			array = array.sort((a, b) => {
				if (a?.['id'] === 'other') return 1
				if (b?.['id'] === 'other') return -1
				if (a?.['id'] === 'nonne') return 1
				if (b?.['id'] === 'nonne') return -1
				return (comparatorProperty(a) || '').localeCompare(comparatorProperty(b) || '', this.displayedLanguage || this.defaultLanguage || 'en', { sensitivity: 'base' })
			})
		}
		return array
	}
}
