import { property } from 'lit/decorators.js'
import { CodeStub } from '@icure/api'
import { ValuedField } from './valuedField'

export interface OptionCode {
	id: string
	text: string
}

export abstract class OptionsField<T, V> extends ValuedField<T, V> {
	@property() options?: (OptionCode | CodeStub)[] = []
	@property() codifications?: string[] = []
	@property() optionsProvider: (codifications: string[], searchTerm?: string) => Promise<CodeStub[]> = async () => []
	protected async fetchInitialsOptions(): Promise<CodeStub[]> {
		return this.fetchOptions('')
	}
	protected async fetchOptions(searchTerm: string): Promise<CodeStub[]> {
		return this.optionsProvider(this.codifications ?? [], searchTerm)
	}
}
