import { Action, Trigger, Form, StateToUpdate, Group, Field, Section } from '../iqr-form/model'
import { FormValuesContainer } from './formValuesContainer'

export function extractActions(actions: Action[], name: string, trigger?: Trigger): Action[] {
	return actions.filter((action) => action.launchers.some((launcher) => launcher.name === name && (!trigger || launcher.triggerer === trigger)))
}
export function extractActionsByTrigger(actions: Action[], trigger: Trigger): Action[] {
	return actions.filter((action) => action.launchers.some((launcher) => launcher.triggerer === trigger))
}
export class ActionManager {
	actions: Action[] = []
	formValuesContainer: FormValuesContainer
	stateUpdaters: { [name: string]: (state: StateToUpdate, result: any) => void } = {}
	readyChildrenCount: Map<string, { total: number; count: number; parent: string }> = new Map()

	constructor(form: Form, formValueContainer: FormValuesContainer) {
		this.formValuesContainer = formValueContainer
		this.actions = form.actions || []
		this.readyChildrenCount.set(form.form || 'main', { total: (form.sections || []).length, count: 0, parent: '' })
		form.sections.forEach((section) => {
			this.readyChildrenCount = this.getTotalChildrenCount(section, this.readyChildrenCount, form.form || 'main')
		})
	}
	private getTotalChildrenCount(
		sg: Section | Group | Field,
		childrenCount: Map<string, { total: number; count: number; parent: string }>,
		parentName: string,
	): Map<string, { total: number; count: number; parent: string }> {
		let name = ''
		if (sg instanceof Section) {
			name = sg.section || ''
		} else if (sg instanceof Group) {
			name = sg.group || ''
		} else {
			{
				name = sg.field || ''
				{
					childrenCount.set(name, { total: 0, count: 0, parent: parentName })
					return childrenCount
				}
			}
		}
		childrenCount.set(name, { total: (sg.fields || []).length, count: 0, parent: parentName })
		;(sg.fields || []).forEach((field) => {
			childrenCount = this.getTotalChildrenCount(field, childrenCount, name)
		})
		return childrenCount
	}

	public registerStateUpdater(name: string, updater: (state: StateToUpdate, result: any) => void) {
		this.stateUpdaters[name] = updater
		this.childrenReady(name)
	}
	private childrenReady(name: string) {
		const parentName = this.readyChildrenCount.get(name)?.parent
		if (parentName) {
			const parent = this.readyChildrenCount.get(parentName)
			const count = parent?.count || 0
			const total = parent?.total || 0
			this.readyChildrenCount.set(parentName, { total, count: count + 1, parent: parent?.parent || ''})
			if (count + 1 === total) {
				this.childrenReady(parentName)
			}
		} else if (this.allReady()) {
			this.launchInitActions()
		}
	}

	private allReady(): boolean {
		return Array.from(this.readyChildrenCount.values()).every((count) => count.count === count.total)
	}
	private launchInitActions() {
		if (this.formValuesContainer && this.actions) {
			extractActionsByTrigger(this.actions || [], Trigger.INIT).forEach((action) => {
				const result = this.formValuesContainer?.compute(action.expression, {})
				if (result !== undefined) {
					action.states.forEach((state) => {
						this.stateUpdaters[state.name]?.(state.stateToUpdate, result)
					})
				}
			})
		}
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
