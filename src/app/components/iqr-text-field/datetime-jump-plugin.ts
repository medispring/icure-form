import {EditorState, Plugin, Transaction} from 'prosemirror-state';
export const datetimeJumpPlugin = () => {
	return new Plugin({
		appendTransaction: (
			transactions: Array<Transaction>,
			oldState: EditorState,
			newState: EditorState
		) =>  {
			//Get selection at the end of the last transaction
		}
	})
}
