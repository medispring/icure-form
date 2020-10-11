import equal from "fast-deep-equal";

import {EditorView} from "prosemirror-view";
import {EditorState, Transaction} from "prosemirror-state";

export class SuggestionPalette {
	private readonly palette: HTMLDivElement;
	private delay: () => boolean = () => false;
	private lastTime: number = 0;
	private suggestionProvider: (terms: string[]) => any[];
	private previousFingerprint?: string;

	private suggestionStopWordsProvider: () => Set<string>;
	private currentFocus?: number;
	private hasFocus: boolean = false;
	private suggestions: { id: string, code: string, text: string, terms: string[] }[] = [];

	constructor(view: EditorView, suggestionProvider: (terms: string[]) => any[], suggestionStopWordsProvider: () => Set<string>, delay?: () => boolean) {
		this.suggestionStopWordsProvider = suggestionStopWordsProvider;
		this.suggestionProvider = suggestionProvider;
		this.palette = document.createElement("div")
		this.palette.className = "suggestion-palette"

		view.dom?.parentNode?.appendChild(this.palette)

		delay && (this.delay = delay)

		this.update(view, undefined)
	}

	focusItem(idx?: number ) {
		const ul = this.palette.getElementsByTagName('ul')[0];
		if (ul) {
			const lis = ul.getElementsByTagName('li')
			this.currentFocus !== undefined && (lis[this.currentFocus] as HTMLElement).classList.remove('focused');
			idx !== undefined && (lis[idx] as HTMLElement).classList.add('focused');

			this.currentFocus = idx
		}
	}

	focus() {
		if (this.palette.style.display === "none") return false
		this.hasFocus = true
		this.focusItem(0)
		return true
	}

	focusOrInsert(view: EditorView, transactionProvider: (from: number, to:number, sug:{ id: string, code: string, text: string, terms: string[] }) => Promise<Transaction | undefined> ) {
		if (this.palette.style.display === "none") return false
		return this.hasFocus ? this.insert(view, transactionProvider) : this.focus()
	}

	insert(view: EditorView, transactionProvider: (from: number, to:number, sug:{ id: string, code: string, text: string, terms: string[] }) => Promise<Transaction | undefined> ) {
		if (this.palette.style.display === "none" || !this.hasFocus || this.currentFocus === undefined) return false
		const sug = this.suggestions[this.currentFocus]
		if (sug) {
				const sel = view.state.selection
				const stopWords = this.suggestionStopWordsProvider()

				let length = sug.terms.join(' ').length - 1
				while(sel.to - length >= 0 && !equal(view.state.doc.textBetween(sel.to - length, sel.to).split(/\s+/).filter(x => !stopWords.has(x)), sug.terms)) {
					length++
				}
				if (length>sel.to) {
					length = sug.terms.join(' ').length
					while(sel.to - length >= 0 && !view.state.doc.textBetween(sel.to - length, sel.to).startsWith(sug.terms[0])) {
						length++
					}
				}
				if (length<=sel.to) {
					transactionProvider(sel.to - length, sel.to, sug).then(tr => tr && view.dispatch(tr.scrollIntoView()))
				}
			return true
		}
		return false
	}



	arrowUp() {
		if (!this.hasFocus) return false
		this.currentFocus && this.focusItem(this.currentFocus - 1)
		return true
	}

	arrowDown() {
		if (!this.hasFocus) return false
		this.currentFocus !== undefined && this.currentFocus < this.palette.getElementsByTagName('ul')[0].childElementCount - 1 && this.focusItem(this.currentFocus + 1)
		return true
	}

	update(view: EditorView, lastState?: EditorState) {
		let state = view.state

		// Hide the palette if the selection is not empty
		this.focusItem(undefined)
		this.hasFocus = false

		if (!state.selection.empty) {
			this.palette.style.display = "none"
			return
		}

		let $pos = state.selection.$head
		const text = state.doc.textBetween($pos.before()+1, $pos.pos)

		const words = text.split(/\s+/)
		const terms = words.filter(x => x.length > 2 && !this.suggestionStopWordsProvider().has(x))
		const lastTerms = terms.length>3 ? terms.slice(length-3) : terms
		const fingerprint = lastTerms.join(' ')

		const { to } = state.selection

		if (this.previousFingerprint !== fingerprint) {
			this.previousFingerprint = fingerprint;
			setTimeout(() => {
				if (this.previousFingerprint !== fingerprint) return
				const res = this.suggestionProvider(lastTerms)
				this.suggestions = res
				if (res.length) {
					this.palette.innerHTML = `<ul>${res.map(x => `<li id="${x.id}" data-code="${x.code}">${x.text}</li>`).join('\n')}</ul>`
					// These are in screen coordinates
					const end = view.coordsAtPos(to)
					this.display(end, (this.lastTime = +new Date()));
				} else {
					this.palette.style.display = "none"
				}
			},30)
		}
	}

	private display(pos: { left: number; right: number; top: number; bottom: number }, time: number) {
		if (time !== this.lastTime) return
		if (this.delay()) { setTimeout(() => this.display(pos, time), 100); return }
		this.palette.style.display = ""
		const box = this.palette.offsetParent?.getBoundingClientRect()
		const palBox = this.palette.getBoundingClientRect()
		if (box) {
			const l = (box.left + pos.left)
			this.palette.style.left = Math.max(box.left, l - palBox.width) + 'px'
			this.palette.style.top = (pos.top + box.top) + "px"
		}
	}

	destroy() { this.palette.remove() }
}
