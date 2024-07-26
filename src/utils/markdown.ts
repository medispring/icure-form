import { MarkdownParser } from 'prosemirror-markdown'
import { Fragment, Node as ProsemirrorNode, Schema } from 'prosemirror-model'
import { PrimitiveType } from '../components/model'

export class SpacePreservingMarkdownParser {
	constructor(private mkdp: MarkdownParser) {}

	parse(primitiveValue: PrimitiveType): ProsemirrorNode | null {
		if (primitiveValue.type !== 'string') {
			return null
		}
		const value = primitiveValue.value
		const node = this.mkdp.parse(value)
		const trailingSpaces = value.match(/([ ]+)$/)?.[1]
		if (node && trailingSpaces) {
			const appendTextToLastTextChild = (node: ProsemirrorNode, text: string): ProsemirrorNode => {
				if (node.isText) {
					return (node as any).withText(node.text + text)
				}
				const lastChild = node.lastChild
				if (lastChild) {
					return node.copy(node.content.replaceChild(node.childCount - 1, appendTextToLastTextChild(lastChild, text)))
				}
				return node
			}

			return appendTextToLastTextChild(node, trailingSpaces)
		}
		return node
	}
}

export const preprocessEmptyNodes = (node: ProsemirrorNode, schema: Schema): ProsemirrorNode => {
	const content = node.content
	if (node.isText) {
		return (node as any).withText((node.text ?? '').replace(/^( +)/g, (x) => x.replace(/ /g, '\u00a0')))
	}
	if (node.isBlock && node.type.name === 'paragraph' && content.size === 0) {
		return node.copy(Fragment.fromArray([schema.text('\u00a0')]))
	}
	if (content.childCount === 0) {
		return node
	}
	let idx = 0
	const iterate = {
		next: () => {
			if (content.childCount === idx) return { value: content.child(idx - 1), done: true }
			return { value: content.child(idx++), done: false }
		},
		[Symbol.iterator]() {
			return this
		},
	}
	const originals = Array.from(iterate)
	const treated = originals.map((n) => preprocessEmptyNodes(n, schema))
	return node.copy(Fragment.fromArray(treated))
}
