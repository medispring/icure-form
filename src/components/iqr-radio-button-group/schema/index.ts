import { Schema } from 'prosemirror-model'
import { getRadioButtonGroupSpec, RadioButtonSchema } from './radio-button-group-schema'

export type IqrRadioButtonGroupSchema = RadioButtonSchema

export function createSchema(): Schema {
	return new Schema(getRadioButtonGroupSpec())
}
