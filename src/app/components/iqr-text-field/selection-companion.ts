import {EditorView} from "prosemirror-view";
import {EditorState} from "prosemirror-state";

export class SelectionCompanion {
	private readonly companion: HTMLDivElement;
	private delay: () => boolean;
	private lastTime: number = 0;

	constructor(view: EditorView, delay: () => boolean) {
		this.companion = document.createElement("div")
		this.companion.className = "companion"

		view.dom?.parentNode?.appendChild(this.companion)

		this.delay = delay

		this.update(view, undefined)
	}

	update(view: EditorView, lastState?: EditorState) {
		let state = view.state
		// Don't do anything if the document/selection didn't change
		if (lastState && lastState.doc.eq(state.doc) &&
			lastState.selection.eq(state.selection)) {
			return
		}

		// Hide the companion if the selection is empty
		if (state.selection.empty) {
			this.companion.style.display = "none"
			return
		}

		// Otherwise, reposition it and update its content
		const { to } = state.selection
		// These are in screen coordinates
		const end = view.coordsAtPos(to)
		this.display(end, (this.lastTime = +new Date()));
	}

	private display(pos: { left: number; right: number; top: number; bottom: number }, time: number) {
		if (time !== this.lastTime) return
		if (this.delay()) { setTimeout(() => this.display(pos, time), 100); return }
		this.companion.style.display = ""
		const box = this.companion.offsetParent?.getBoundingClientRect()
		if (box) {
			this.companion.style.left = pos.right + "px"
			this.companion.style.top = (pos.top + box.top - 20) + "px"
			this.companion.style.height = (pos.bottom - pos.top) + "px"
			this.companion.textContent = "x"
		}
	}

	destroy() { this.companion.remove() }
}
