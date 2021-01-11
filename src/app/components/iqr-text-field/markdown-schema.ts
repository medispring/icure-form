import {MarkSpec, NodeSpec, Schema, SchemaSpec} from 'prosemirror-model';

type DocumentSchema = 'text-document'
type TokensSchema = 'tokens-list' | 'styled-tokens-list' | 'tokens-list-with-codes' | 'styled-tokens-list-with-codes'
type StyledSchema = 'text-document' | 'styled-text' | 'styled-text-with-codes' |'styled-tokens-list' | 'styled-tokens-list-with-codes'
type InlineSchema = 'styled-text' | 'text' | 'text-with-codes' | 'styled-text-with-codes'
type DateSchema = 'date'
type DateTimeSchema = 'date-time'

export type IqrTextFieldSchema = DocumentSchema | TokensSchema | StyledSchema | InlineSchema | DateSchema | DateTimeSchema

export const colors: { [key: string]: [string, string] } = {
	'I': ['#F44336', 'white'],
	'II': ['#E91E63', 'white'],
	'III': ['#9C27B0', 'white'],
	'IV': ['#673AB7', 'white'],
	'V': ['#009688', 'white'],
	'VI': ['#4CAF50', 'white'],
	'VII': ['#8BC34A', 'white'],
	'VIII': ['#03A9F4', 'white'],
	'IX': ['#00BCD4', 'white'],
	'X': ['#FFC107', 'black'],
	'XI': ['#FF9800', 'black'],
	'XII': ['#FF5722', 'white'],
	'XIII': ['#795548', 'white'],
	'XIV': ['#3949AB', 'white'],
	'XV': ['#C0CA33', 'black'],
	'XVI': ['#07F87F', 'black'],
	'XVII': ['#FF6262', 'white'],
	'XVIII': ['#718792', 'white'],
	'XIX': ['#00ECB9', 'black'],
	'XX': ['#FF20A3', 'black'],
	'XXI': ['#FFCE38', 'black'],
	'XXII': ['#721F01', 'white']
}

const getColor = (c:string) => colors[c] || [c, 'white']

function reduceNodes(nodes: {[key:string]:NodeSpec}, selector: (key:string, spec:NodeSpec) => boolean = () => true) {
	return Object.keys(nodes).reduce((r,k) => selector(k, nodes[k]) ? Object.assign(r, {[k]: nodes[k]}) : r ,{} as {[key:string]:NodeSpec})
}

function reduceMarks(marks: {[key:string]:MarkSpec}, selector: (key:string, spec:MarkSpec) => boolean = () => true) {
	return Object.keys(marks).reduce((r,k) => selector(k, marks[k]) ? Object.assign(r, {[k]: marks[k]}) : r ,{} as {[key:string]:MarkSpec})
}

function getMarks(contentProvider: (codes: { type: string; code: string }[]) => string, colorProvider: (type: string, code: string, isCode: boolean) => string) : {[key:string]:MarkSpec} {
	return {
		em: {
			parseDOM: [{tag: 'i'}, {tag: 'em'},
				{style: 'font-style', getAttrs: value => value === 'italic' && null}],
			toDOM() {
				return ['em']
			}
		},

		strong: {
			parseDOM: [{tag: 'b'}, {tag: 'strong'},
				{style: 'font-weight', getAttrs: value => /^(bold(er)?|[5-9]\d{2,})$/.test(value as string) && null}],
			toDOM() {
				return ['strong']
			}
		},

		link: {
			attrs: {
				href: {},
				title: {default: null}
			},
			inclusive: false,
			parseDOM: [{
				tag: 'span[data-href]', getAttrs(dom) {
					const el = dom as HTMLElement
					return {href: el.dataset.href, title: el.dataset.title}
				}
			}],
			toDOM(node) {
				const urls: string = node.attrs.href
				if (urls) {
					const refs = urls.split(',').map(url => {
						let pos = url.indexOf('://');
						const protocol = url.substring(0, pos)
						const code = url.substring(pos + 3)
						let parts = protocol.split('-');
						const category = parts[0]
						const type = parts[1]

						return {category, type, code}
					})

					const codes = refs.filter(x => x.category === 'c')
					const ilinks = refs.filter(x => x.category === 'i')

					const classes = (refs.some(x => x.category === 'x') ? ['ext-link'] : []).concat(codes.length ? [`code-count-${codes.length}`] : [])

					const dataAttributes = (codes.length ? [{'data-content': contentProvider(codes)} as any] : [])
						.concat(ilinks.map((c, idx) => ({[`data-link-color-${idx}`]: colorProvider(c.type, c.code, false)})))

					const styles = codes.map((c, idx) => {
						const color = getColor(colorProvider(c.type, c.code, true));
						return (`--bg-code-color-${idx + 1}: ${color[0]}; --text-code-color-${idx + 1}: ${color[1]};`);
					})

					return ['span', dataAttributes.reduce((acc, da) => Object.assign(da, acc), {
						['data-href']: node.attrs.href,
						['data-title']: node.attrs.title,
						'class': classes.join(' '),
						'style': styles.join('')
					})]
				}

				return ['span', {['data-href']: node.attrs.href, ['data-title']: node.attrs.title}]
			}
		}
	};
}

function getSpec(
	type: DocumentSchema | InlineSchema,
	contentProvider: (codes: { type: string; code: string }[]) => string,
	colorProvider: (type: string, code: string, isCode: boolean) => string): SchemaSpec {
	const nodesSelector: (key:string, spec:NodeSpec) => boolean = (key:string, spec:NodeSpec) => {
		// noinspection RedundantConditionalExpressionJS
		return (key === 'paragraph') ? true :
			((spec.group === 'block' || ['doc','list_item','hard_break','image'].includes(key)) && type !== 'text-document') ? false :  true
	}
	const marksSelector: (key:string, spec:MarkSpec) => boolean = (key:string, spec:MarkSpec) => {
		// noinspection RedundantConditionalExpressionJS
		return (key !== 'link' && ['text-document', 'styled-text' , 'styled-text-with-codes'].includes(type)) ? true :
			(key === 'link' && ['text-document', 'text-with-codes', 'styled-text-with-codes']) ? true : false
	}

	return {
		topNode: type === 'text-document' ? 'doc' : 'paragraph',
		nodes: reduceNodes({
			doc: {
				content: 'block+'
			},

			paragraph: {
				content: 'inline*',
				group: 'block',
				parseDOM: [{tag: 'p'}],
				toDOM() {
					return ['p', 0]
				}
			},

			blockquote: {
				content: 'block+',
				group: 'block',
				parseDOM: [{tag: 'blockquote'}],
				toDOM() {
					return ['blockquote', 0]
				}
			},

			horizontal_rule: {
				group: 'block',
				parseDOM: [{tag: 'hr'}],
				toDOM() {
					return ['div', ['hr']]
				}
			},

			heading: {
				attrs: {level: {default: 1}},
				content: '(text | image)*',
				group: 'block',
				defining: true,
				parseDOM: [{tag: 'h1', attrs: {level: 1}},
					{tag: 'h2', attrs: {level: 2}},
					{tag: 'h3', attrs: {level: 3}},
					{tag: 'h4', attrs: {level: 4}},
					{tag: 'h5', attrs: {level: 5}},
					{tag: 'h6', attrs: {level: 6}}],
				toDOM(node) {
					return ['h' + node.attrs.level, 0]
				}
			},

			ordered_list: {
				content: 'list_item+',
				group: 'block',
				attrs: {order: {default: 1}, tight: {default: false}},
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
				attrs: {tight: {default: false}},
				parseDOM: [{tag: 'ul', getAttrs: dom => ({tight: (dom as Element).hasAttribute('data-tight')})}],
				toDOM(node) {
					return ['ul', {'data-tight': node.attrs.tight ? 'true' : null}, 0]
				}
			},

			list_item: {
				content: 'paragraph block*',
				defining: true,
				parseDOM: [{tag: 'li'}],
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
					alt: {default: null},
					title: {default: null}
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
				parseDOM: [{tag: 'br'}],
				toDOM() {
					return ['br']
				}
			}
		}, nodesSelector),
		marks: reduceMarks(getMarks(contentProvider, colorProvider), marksSelector)
	};
}

function getTokensSpec(
	type: TokensSchema,
	contentProvider: (codes: { type: string; code: string }[]) => string,
	colorProvider: (type: string, code: string, isCode: boolean) => string): SchemaSpec {
	const marksSelector: (key:string, spec:MarkSpec) => boolean = (key:string, spec:MarkSpec) => {
		// noinspection RedundantConditionalExpressionJS
		return (key !== 'link' && ['styled-tokens-list', 'styled-tokens-list-with-codes'].includes(type)) ? true :
			(key === 'link' && ['tokens-list-with-codes', 'styled-text-with-codes']) ? true : false
	}
	return {
		nodes: reduceNodes({
			doc: {
				content: 'token+',
				parseDOM: [{tag: 'ul'}],
				toDOM() {
					return ['ul', 0]
				}
			},

			token: {
				content: 'inline*',
				group: 'block',
				parseDOM: [{tag: 'li'}],
				toDOM() {
					return ['li', 0]
				}
			},

			text: {
				group: 'inline'
			}
		}),
		marks: reduceMarks(getMarks(contentProvider, colorProvider), marksSelector)
	};
}

function getDateSpec(): SchemaSpec {
	return {
		topNode: 'paragraph',
		nodes: {
			paragraph: {
				content: 'date',
			},

			date: {
				content: 'inline*',
				group: 'block',
				parseDOM: [{tag: 'span'}],
				toDOM() {
					return ['span', 0]
				},
				regexp: '^([0-9]?[0-9]?[/.-]?[0-9]?[0-9]?[/.-]?[0-9]?[0-9]?[0-9]?[0-9]?)$'
			},

			text: {
				group: 'inline'
			}
		},
		marks: {}
	};
}


function getDateTimeSpec(): SchemaSpec {
	return {
		topNode: 'paragraph',
		nodes: {
			paragraph: {
				content: 'date time',
			},

			date: {
				content: 'inline*',
				group: 'block',
				parseDOM: [{tag: 'span'}],
				toDOM() {
					return ['span', {class:'date'}, 0]
				},
				regexp: '^([0-9]?[0-9]?[/.-]?[0-9]?[0-9]?[/.-]?[0-9]?[0-9]?[0-9]?[0-9]?)$'
			},

			time: {
				content: 'inline*',
				group: 'block',
				parseDOM: [{tag: 'span'}],
				toDOM() {
					return ['span', {class:'time'}, 0]
				},
				regexp: '^([0-9]?[0-9]?[:]?[0-9]?[0-9]?[:]?[0-9]?[0-9])$'
			},

			text: {
				group: 'inline'
			}
		},
		marks: {}
	};
}

export function createSchema(type: IqrTextFieldSchema, colorProvider: (type:string, code:string, isCode: boolean) => string, contentProvider: (codes: {type: string, code: string}[]) => string) {
	return new Schema(
		type === 'date' ? getDateSpec() :
			type === 'date-time' ? getDateTimeSpec() :
			type ==='tokens-list' || type ==='styled-tokens-list' || type ==='tokens-list-with-codes' || type === 'styled-tokens-list-with-codes' ? getTokensSpec(type, contentProvider, colorProvider) : getSpec(type, contentProvider, colorProvider))
}
