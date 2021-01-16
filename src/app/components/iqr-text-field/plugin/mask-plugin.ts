import {EditorState, Plugin, TextSelection, Transaction} from 'prosemirror-state';
import {ResolvedPos} from "prosemirror-model";
import {EditorView} from "prosemirror-view";

export const maskPlugin = () => {
	const maskText = ($pos: ResolvedPos, text: string, mask: string, state: EditorState) => {
		const textFromBeginning = $pos.parent.textBetween(0, $pos.parentOffset) + text
		// @ts-ignore
		const trailingText = $pos.parent.textBetween($pos.parentOffset, $pos.parent.content.size)

		let t = textFromBeginning
		let skip = 0
		let completed = false
		for (let i = 0; i < mask.length && i < t.length; i++) {
			if (
				mask[i] === '.' && t[i].normalize("NFD").replace(/[\u0300-\u036f]/g, "").match(/\w|-/) ||
				mask[i] === '-' && t[i].match(/\d/)
			) {
				//skip
			} else {
				if (mask[i] === t[i]) {
					//skip
				} else {
					t = t.substring(0, i) + mask[i] + t.substring(i)
					if (!completed) skip++
				}
			}
			if (t.length == i + 1 && !completed) {
				t += trailingText.substring(text.length + skip)
				completed = true
			}
		}

		let trail = t.length < mask.length ? mask.substring(t.length) : ''
		if (t === textFromBeginning && trail === trailingText) {
			return undefined
		}

		const tr = state.tr.insertText(t.substring(0, mask.length) + trail, $pos.pos - $pos.parentOffset, $pos.pos - $pos.parentOffset + $pos.parent.content.size)
		return tr.setSelection(TextSelection.create(tr.doc, $pos.pos + text.length + skip))
	}
	return new Plugin({
		view: (v: EditorView) => {
			let tr = v.state.tr
			let posMark = 0
			//Scan nodes and add mask when needed
			while (tr.doc && posMark < tr.doc.nodeSize - 2) {
				const node = tr.doc.nodeAt(posMark)
				if (node && node.type.spec.mask) {
					const mask = node.type.spec.mask
					const text = node.textContent || ''
					if (text.length < mask.length) {
						tr = tr.insertText(mask.substring(text.length), posMark + 1 + text.length, posMark + 1 + text.length)
					}
					posMark += 1 + mask.length + 1
				} else {
					posMark++
				}
			}
			v.updateState(v.state.apply(tr))
			return {}
		},
		props: {
			handleTextInput: (view, from, to, text) => {
				if (view.composing) return false

				const state = view.state
				const $from = state.doc.resolve(from)
				const mask = $from.parent.type.spec.mask;
				const regexp = $from.parent.type.spec.regexp;

				if (!mask) return false

				const tr = maskText($from, regexp && regexp.length ? text.split('').filter(x => x.match(new RegExp(regexp))).join('') : text, mask, state);
				if (tr) {
					view.dispatch(tr)
					return true
				}
				return false
			}
		},
		appendTransaction: (transactions: Array<Transaction>,
												oldState: EditorState,
												newState: EditorState) => {
			const $from = newState.selection?.$from
			const $to = newState.selection.$to
			if ($from.pos - $to.pos !== 0) {
				return null
			}
			const parent = $from?.parent
			const mask = parent?.type?.spec?.mask

			if (!!mask) {
				return maskText($from, '', mask, newState)
			}
			return null
		}
	});
}
