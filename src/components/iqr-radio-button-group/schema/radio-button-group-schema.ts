import { SchemaSpec } from 'prosemirror-model'

export type RadioButtonSchema = 'radio-button-group' | 'radio-button-group' | 'checkbox'

export function getRadioButtonGroupSpec(): SchemaSpec {
	return {
		topNode: 'radioButtonGroup',
		nodes: {
			paragraph: {
				content: 'radioButtonGroup',
			},
			radioButtonGroup: {
				content: '(radioButton | label)*',
				group: 'block',
				toDOM() {
					return ['div', 0]
				},
			},
			radioButton: {
				attrs: { id: { default: '' }, name: { default: '' }, type: { default: 'radio' } },
				content: 'inline*',
				group: 'block',
				toDOM(node) {
					return ['input', { id: node.attrs.id, type: node.attrs.type, name: node.attrs.name }, 0]
				},
			},
			label: {
				attrs: { for: { default: '' } },
				content: 'inline*',
				group: 'block',
				toDOM(node) {
					return ['label', { for: node.attrs.for }, 0]
				},
			},
			text: {
				group: 'inline',
			},
		},
		marks: {},
	}
}
