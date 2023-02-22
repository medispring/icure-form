import { SchemaSpec } from 'prosemirror-model'

export type DropdownSchema = 'dropdown'

export function getDropdownSpec(): SchemaSpec {
	return {
		topNode: 'paragraph',
		nodes: {
			paragraph: {
				content: 'selectedOptionGroup*',
			},

			selectedOptionGroup: {
				content: 'selectedOption*',
				group: 'block',
				toDOM() {
					return ['div', 0]
				},
			},

			selectedOption: {
				content: 'inline*',
				group: 'block',
				toDOM() {
					return ['span', { class: 'selected-option' }, 0]
				},
				parseDOM: [{ tag: 'span' }],
			},

			//dropdownMenu: {
			//	content: 'dropdownOption*',
			//	group: 'block',
			//	toDOM() {
			//		return ['div', { class: 'dropdown-menu' }, 0]
			//	},
			//},

			text: {
				group: 'inline',
			},
		},
		marks: {},
	}
}
