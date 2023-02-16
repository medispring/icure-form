import { SchemaSpec } from 'prosemirror-model'

export type DropdownSchema = 'dropdown'

export function getDropdownSpec(optionsProvider: (codes: { type: string; code: string }[]) => string): SchemaSpec {
	return {
		topNode: 'paragraph',
		nodes: {
			paragraph: {
				content: 'dropdown',
			},

			dropdown: {
				content: 'inline*',
				group: 'block',
				parseDOM: [{ tag: 'span' }],
				toDOM() {
					return ['span', 0]
				},
			},

			text: {
				group: 'inline',
			},
		},
		marks: {},
	}
}
