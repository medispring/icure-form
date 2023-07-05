import { Action, Trigger, Form, StateToUpdate} from '../iqr-form/model'
import { FormValuesContainer } from './formValuesContainer'

export function extractActions(actions: Action[], name: string, trigger?: Trigger): Action[] {
	return actions.filter((action) => action.launchers.some((launcher) => launcher.name === name && (!trigger || launcher.triggerer === trigger)))
}
export class ActionManager {
	actions: Action[] = []
	formValuesContainer: FormValuesContainer
	stateUpdaters: { [name: string]: (state: StateToUpdate, result: any) => void } = {}

	constructor(form: Form, formValueContainer: FormValuesContainer) {
		this.formValuesContainer = formValueContainer
		this.actions = form.actions || []
	}
	public registerStateUpdater(name: string, updater: (state: StateToUpdate, result: any) => void) {
		this.stateUpdaters[name] = updater
	}
	public launchActions(trigger: Trigger, name: string) {
		if (this.formValuesContainer && this.actions) {
			extractActions(this.actions || [], name, trigger).forEach((action) => {
				const result = this.formValuesContainer?.compute(action.expression, {})
				if (result !== undefined) {
					action.states.forEach((state) => {
						this.stateUpdaters[state.name]?.(state.stateToUpdate, result)
					})
				}
			})
		}
	}
}
