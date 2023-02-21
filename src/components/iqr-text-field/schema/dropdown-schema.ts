export type DropdownSchema = 'dropdown'

const options = [
	{ id: '1', code: '1', text: 'Form 1', terms: ['Form', '1'] },
	{ id: '2', code: '2', text: 'Form 2', terms: ['Form', '2'] },
	{ id: '3', code: '3', text: 'Form 3', terms: ['Form', '3'] },
	{ id: '4', code: '4', text: 'Form 4', terms: ['Form', '4'] },
	{ id: '5', code: '5', text: 'Form 5', terms: ['Form', '5'] },
]
export function getDropdownSpec() {
	return {
		selectedOption: {
			attrs: {
				option: { default: '' },
			},
			inline: true,
			group: 'inline',
			toDOM: (node: any) => [
				'span',
				{
					option: node.attrs.option,
					class: 'dropdown',
				},
			],
			parseDOM: [
				{
					tag: 'span[option]',
					getAttrs: (dom: any) => {
						const comparator = dom?.getAttribute('text')
						return options.some((option) => option.id === comparator) ? { comparator } : false
					},
				},
			],
		},
	}
}
