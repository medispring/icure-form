import { property, state } from 'lit/decorators.js'
import { ActionManager } from '../iqr-form-loader'
import { StateToUpdate } from '../iqr-form/model'
import { LitElement } from 'lit'

export abstract class ActionedField extends LitElement {
	@property() actionManager?: ActionManager
	@state() public display = true
	public stateUpdater(state: StateToUpdate, result: any): void{
		if (state === StateToUpdate.VISIBLE) {
			this.display = result
		}
	}

	public registerStateUpdater(name: string, stateUpdater?: (state: StateToUpdate, result: any) => void) {
		if (this.actionManager) {
			this.actionManager.registerStateUpdater(name || '', stateUpdater || this.stateUpdater.bind(this))
		}
	}
}
