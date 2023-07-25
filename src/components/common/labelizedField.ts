import { property } from 'lit/decorators.js'
import { LabelPosition, Labels } from '../iqr-form/fields/text-field/iqr-text-field'
import { StylizedField } from './stylizedField'

export abstract class LabelizedField extends StylizedField {
	@property() labels: Labels = {
		[LabelPosition.float]: '',
	}
	@property() label?: string = ''
	@property() labelPosition?: 'float' | 'side' | 'above' | 'hidden' | 'left' | 'right' = 'float'
	@property() placeholder?: string = ''
}
