import { property } from 'lit/decorators.js'
import { CodeStub } from '@icure/api'
import { ValuedField } from './valuedField'

export class OptionCode {
	id: string
	text: string
}

export abstract class OptionsField<T, V> extends ValuedField<T, V> {
	@property() options?: (OptionCode | CodeStub)[] = []
	@property() codifications?: string[] = []
	@property() optionsProvider: (codifications: string[], searchTerm?: string) => Promise<(OptionCode | CodeStub)[]> = async () => []
	protected async fetchInitialsOptions(): Promise<(OptionCode | CodeStub)[]> {
		return this.fetchOptions('') as Promise<(OptionCode | CodeStub)[]>
	}
	protected async fetchOptions(searchTerm: string): Promise<(OptionCode | CodeStub)[]> {
		return this.optionsProvider(this.codifications ?? [], searchTerm) as Promise<(OptionCode | CodeStub)[]>
	}
}
