import { TranslatedField } from './translatedField'
import { property } from 'lit/decorators.js'
import { CodeStub, Content } from '@icure/api'

export abstract class ValuedField<T, V> extends TranslatedField {
	@property() value: T | undefined | null = undefined
	@property() handleValueChanged?: (language: string, value: { asString: string; content?: Content }, serviceId?: string | undefined, codes?: CodeStub[]) => void = undefined
	@property() valueProvider?: () => V | undefined = undefined
}
