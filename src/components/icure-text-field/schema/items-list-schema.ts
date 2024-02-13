import { SchemaSpec } from 'prosemirror-model'
import { reduceNodes } from './utils'

export type ItemsListSchema = 'items-list'

export function getItemsListSpec(): SchemaSpec {
	return {
		nodes: reduceNodes({
			doc: {
				content: 'item*',
			},

			item: {
				content: 'inline*',
				group: 'block',
				attrs: { id: { default: undefined } },
				parseDOM: [{ tag: 'li' }],
				toDOM() {
					return ['li', 0]
				},
			},

			text: {
				group: 'inline',
			},
		}),
		marks: {},
	}
}
