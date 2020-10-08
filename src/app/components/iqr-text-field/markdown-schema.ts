import { Schema } from 'prosemirror-model';

export const schema = new Schema({
	nodes: {
		doc: {
			content: 'block+'
		},

		paragraph: {
			content: 'inline*',
			group: 'block',
			parseDOM: [{ tag: 'p' }],
			toDOM() {
				return ['p', 0]
			}
		},

		blockquote: {
			content: 'block+',
			group: 'block',
			parseDOM: [{ tag: 'blockquote' }],
			toDOM() {
				return ['blockquote', 0]
			}
		},

		horizontal_rule: {
			group: 'block',
			parseDOM: [{ tag: 'hr' }],
			toDOM() {
				return ['div', ['hr']]
			}
		},

		heading: {
			attrs: { level: { default: 1 } },
			content: '(text | image)*',
			group: 'block',
			defining: true,
			parseDOM: [{ tag: 'h1', attrs: { level: 1 } },
				{ tag: 'h2', attrs: { level: 2 } },
				{ tag: 'h3', attrs: { level: 3 } },
				{ tag: 'h4', attrs: { level: 4 } },
				{ tag: 'h5', attrs: { level: 5 } },
				{ tag: 'h6', attrs: { level: 6 } }],
			toDOM(node) {
				return ['h' + node.attrs.level, 0]
			}
		},

		ordered_list: {
			content: 'list_item+',
			group: 'block',
			attrs: { order: { default: 1 }, tight: { default: false } },
			parseDOM: [{
				tag: 'ol', getAttrs(dom) {
					const el = dom as Element
					return {
						order: el.hasAttribute('start') ? +(el.getAttribute('start') || 0) : 1,
						tight: el.hasAttribute('data-tight')
					}
				}
			}],
			toDOM(node) {
				return ['ol', {
					start: node.attrs.order === 1 ? null : node.attrs.order,
					'data-tight': node.attrs.tight ? 'true' : null
				}, 0]
			}
		},

		bullet_list: {
			content: 'list_item+',
			group: 'block',
			attrs: { tight: { default: false } },
			parseDOM: [{ tag: 'ul', getAttrs: dom => ({ tight: (dom as Element).hasAttribute('data-tight') }) }],
			toDOM(node) {
				return ['ul', { 'data-tight': node.attrs.tight ? 'true' : null }, 0]
			}
		},

		list_item: {
			content: 'paragraph block*',
			defining: true,
			parseDOM: [{ tag: 'li' }],
			toDOM() {
				return ['li', 0]
			}
		},

		text: {
			group: 'inline'
		},

		image: {
			inline: true,
			attrs: {
				src: {},
				alt: { default: null },
				title: { default: null }
			},
			group: 'inline',
			draggable: true,
			parseDOM: [{
				tag: 'img[src]', getAttrs(dom) {
					const el = dom as Element
					return {
						src: el.getAttribute('src'),
						title: el.getAttribute('title'),
						alt: el.getAttribute('alt')
					}
				}
			}],
			toDOM(node) {
				return ['img', node.attrs]
			}
		},

		hard_break: {
			inline: true,
			group: 'inline',
			selectable: false,
			parseDOM: [{ tag: 'br' }],
			toDOM() {
				return ['br']
			}
		}
	},

	marks: {
		em: {
			parseDOM: [{ tag: 'i' }, { tag: 'em' },
				{ style: 'font-style', getAttrs: value => value === 'italic' && null }],
			toDOM() {
				return ['em']
			}
		},

		strong: {
			parseDOM: [{ tag: 'b' }, { tag: 'strong' },
				{ style: 'font-weight', getAttrs: value => /^(bold(er)?|[5-9]\d{2,})$/.test(value as string) && null }],
			toDOM() {
				return ['strong']
			}
		},

		link: {
			attrs: {
				href: {},
				title: { default: null }
			},
			inclusive: false,
			parseDOM: [{
				tag: 'a[href]', getAttrs(dom) {
					const el = dom as Element
					return { href: el.getAttribute('href'), title: el.getAttribute('title') }
				}
			}],
			toDOM(node) {
				return ['a', node.attrs]
			}
		},

		codification: {
			attrs: {
				type: { default: null },
				code: { default: null },
				version: { default: null },
				descr: { default: null }
			},
			inclusive: false,
			parseDOM: [{
				tag: 'span[data-code]', getAttrs(dom) {
					const el = dom as Element
					return {
						type: el.getAttribute('data-codetype'),
						code: el.getAttribute('data-codecode'),
						version: el.getAttribute('data-codeversion'),
						title: el.getAttribute('data-codedescr')
					}
				}
			}],
			toDOM(node) {
				return ['span', node.attrs.entries().reduce(([k, v]: [string, string], acc: any) => {
					acc['data-code' + k] = v;
					return acc
				}, {})]
			}
		}
	}
})
