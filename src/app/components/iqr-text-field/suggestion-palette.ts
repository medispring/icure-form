import {EditorView} from "prosemirror-view";
import {EditorState} from "prosemirror-state";

export class SuggestionPalette {
	private readonly palette: HTMLDivElement;
	private delay: () => boolean = () => false;
	private lastTime: number = 0;
	private suggestionProvider: (terms: string[]) => any[];
	private previousFingerprint?: string;

	private suggestionStopWordsProvider: () => Set<string>;

	constructor(view: EditorView, suggestionProvider: (terms: string[]) => any[], suggestionStopWordsProvider: () => Set<string>, delay?: () => boolean) {
		this.suggestionStopWordsProvider = suggestionStopWordsProvider;
		this.suggestionProvider = suggestionProvider;
		this.palette = document.createElement("div")
		this.palette.className = "suggestion-palette"

		view.dom?.parentNode?.appendChild(this.palette)

		delay && (this.delay = delay)

		this.update(view, undefined)
	}

	update(view: EditorView, lastState?: EditorState) {
		let state = view.state

		// Hide the palette if the selection is not empty
		if (!state.selection.empty) {
			this.palette.style.display = "none"
			return
		}

		let $pos = state.selection.$head
		const text = state.doc.textBetween($pos.before()+1, $pos.pos)

		const terms = text.split(/\s+/).filter(x => x.length > 2 && !this.suggestionStopWordsProvider().has(x))
		const lastTerms = terms.length>3 ? terms.slice(length-3) : terms
		const fingerprint = lastTerms.join(' ')

		if (this.previousFingerprint !== fingerprint) {
			this.previousFingerprint = fingerprint;
			setTimeout(() => {
				if (this.previousFingerprint !== fingerprint) return
				const res = this.suggestionProvider(lastTerms)
				if (res.length) {
					this.palette.innerHTML = `<ul>${res.map(x => `<li id="${x.code}">${x.text}</li>`).join('\n')}</ul>`

					const { to } = state.selection
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
			this.palette.style.left = Math.max(palBox.left, l - palBox.width) + 'px'
			this.palette.style.top = (pos.top + box.top) + "px"
		}
	}

	destroy() { this.palette.remove() }
}
