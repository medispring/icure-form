import { IqrTextFieldSchema } from '../fields/text-field'
import { Labels } from '../../../models'

type FieldType =
	| 'textfield'
	| 'measure-field'
	| 'number-field'
	| 'date-picker'
	| 'time-picker'
	| 'date-time-picker'
	| 'multiple-choice'
	| 'dropdown-field'
	| 'radio-button'
	| 'checkbox'
	| 'label'

export abstract class Field {
	clazz = 'field' as const
	field: string
	type: FieldType
	shortLabel?: string
	rows?: number
	columns?: number
	grows?: boolean
	schema?: IqrTextFieldSchema
	tags?: string[]
	codifications?: string[]
	options?: { [key: string]: unknown }
	labels?: Labels
	value?: string
	unit?: string
	multiline?: boolean
	hideCondition?: string
	now?: boolean
	translate?: boolean
	width?: number
	styleOptions?: { [key: string]: unknown }

	label(): string {
		return this.field
	}

	protected constructor(
		type: FieldType,
		label: string,
		shortLabel?: string,
		rows?: number,
		grows?: boolean,
		columns?: number,
		schema?: IqrTextFieldSchema,
		tags?: string[],
		codifications?: string[],
		options?: { [key: string]: unknown },
		labels?: Labels,
		value?: string,
		unit?: string,
		multiline?: boolean,
		hideCondition?: string,
		now?: boolean,
		translate?: boolean,
		width?: number,
		styleOptions?: { [key: string]: unknown },
	) {
		this.field = label
		this.type = type
		this.shortLabel = shortLabel
		this.rows = rows || 1
		this.grows = grows || false
		this.columns = columns || 1
		this.schema = schema
		this.tags = tags
		this.codifications = codifications
		this.options = options
		this.labels = labels
		this.value = value
		this.unit = unit
		this.multiline = multiline
		this.hideCondition = hideCondition
		this.now = now
		this.translate = translate ?? true
		this.width = width
		this.styleOptions = styleOptions
	}

	static parse(json: Field): Field {
		switch (json.type as string) {
			case 'textfield':
				return new TextField(
					json.field,
					json.shortLabel,
					json.rows,
					json.grows,
					json.columns,
					json.schema,
					json.tags,
					json.codifications,
					json.options,
					json.labels,
					json.value,
					undefined,
					json.multiline,
					json.hideCondition,
					json.translate,
					json.width,
				)
			case 'measure-field':
				return new MeasureField(
					json.field,
					json.shortLabel,
					json.rows,
					json.grows,
					json.columns,
					json.tags,
					json.codifications,
					json.options,
					json.labels,
					json.value,
					json.unit,
					json.hideCondition,
					json.translate,
					json.width,
				)
			case 'number-field':
				return new NumberField(
					json.field,
					json.shortLabel,
					json.rows,
					json.grows,
					json.columns,
					json.tags,
					json.codifications,
					json.options,
					json.labels,
					json.value,
					undefined,
					json.hideCondition,
					json.translate,
					json.width,
				)
			case 'date-picker':
				return new DatePicker(
					json.field,
					json.shortLabel,
					json.rows,
					json.grows,
					json.columns,
					json.tags,
					json.codifications,
					json.options,
					json.labels,
					json.value,
					undefined,
					json.hideCondition,
					json.now,
					json.translate,
					json.width,
				)
			case 'time-picker':
				return new TimePicker(
					json.field,
					json.shortLabel,
					json.rows,
					json.grows,
					json.columns,
					json.tags,
					json.codifications,
					json.options,
					json.labels,
					json.value,
					undefined,
					json.hideCondition,
					json.now,
					json.translate,
					json.width,
				)
			case 'date-time-picker':
				return new DateTimePicker(
					json.field,
					json.shortLabel,
					json.rows,
					json.grows,
					json.columns,
					json.tags,
					json.codifications,
					json.options,
					json.labels,
					json.value,
					undefined,
					json.hideCondition,
					json.now,
					json.translate,
					json.width,
				)
			case 'multiple-choice':
				return new MultipleChoice(
					json.field,
					json.shortLabel,
					json.rows,
					json.grows,
					json.columns,
					json.tags,
					json.codifications,
					json.options,
					json.labels,
					json.value,
					undefined,
					json.hideCondition,
					json.translate,
					json.width,
				)
			case 'dropdown':
				return new DropdownField(
					json.field,
					json.shortLabel,
					json.rows,
					json.grows,
					json.columns,
					json.tags,
					json.codifications,
					json.options,
					json.labels,
					json.value,
					json.hideCondition,
					json.translate,
					json.width,
				)
			case 'radio-button':
				return new RadioButton(
					json.field,
					json.shortLabel,
					json.rows,
					json.grows,
					json.columns,
					json.tags,
					json.codifications,
					json.options,
					json.value,
					json.hideCondition,
					json.translate,
					json.width,
					json.styleOptions,
				)
			case 'checkbox':
				return new CheckBox(
					json.field,
					json.shortLabel,
					json.rows,
					json.grows,
					json.columns,
					json.tags,
					json.codifications,
					json.options,
					json.value,
					json.hideCondition,
					json.translate,
					json.width,
					json.styleOptions,
				)
			case 'label':
				return new Label(json.field, json.shortLabel, json.rows, json.grows, json.columns)
			default:
				throw Error('Invalid field type ' + json.type)
		}
	}
}

export class TextField extends Field {
	constructor(
		label: string,
		shortLabel?: string,
		rows?: number,
		grows?: boolean,
		columns?: number,
		schema?: IqrTextFieldSchema,
		tags?: string[],
		codifications?: string[],
		options?: { [key: string]: unknown },
		labels?: Labels,
		value?: string,
		unit?: string,
		multiline?: boolean,
		hideCondition?: string,
		translate?: boolean,
		width?: number,
	) {
		super(
			'textfield',
			label,
			shortLabel,
			rows,
			grows,
			columns,
			schema || 'styled-text-with-codes',
			tags,
			codifications,
			options,
			labels,
			value,
			unit,
			multiline,
			hideCondition,
			false,
			translate,
			width,
		)
	}
}

export class MeasureField extends Field {
	constructor(
		label: string,
		shortLabel?: string,
		rows?: number,
		grows?: boolean,
		columns?: number,
		tags?: string[],
		codifications?: string[],
		options?: { [key: string]: unknown },
		labels?: Labels,
		value?: string,
		unit?: string,
		hideCondition?: string,
		translate?: boolean,
		width?: number,
	) {
		super('measure-field', label, shortLabel, rows, grows, columns, undefined, tags, codifications, options, labels, value, unit, false, hideCondition, false, translate, width)
	}
}

export class NumberField extends Field {
	constructor(
		label: string,
		shortLabel?: string,
		rows?: number,
		grows?: boolean,
		columns?: number,
		tags?: string[],
		codifications?: string[],
		options?: { [key: string]: unknown },
		labels?: Labels,
		value?: string,
		unit?: string,
		hideCondition?: string,
		translate?: boolean,
		width?: number,
	) {
		super('number-field', label, shortLabel, rows, grows, columns, undefined, tags, codifications, options, labels, value, unit, false, hideCondition, false, translate, width)
	}
}

export class DatePicker extends Field {
	constructor(
		label: string,
		shortLabel?: string,
		rows?: number,
		grows?: boolean,
		columns?: number,
		tags?: string[],
		codifications?: string[],
		options?: { [key: string]: unknown },
		labels?: Labels,
		value?: string,
		unit?: string,
		hideCondition?: string,
		now?: boolean,
		translate?: boolean,
		width?: number,
	) {
		super('date-picker', label, shortLabel, rows, grows, columns, undefined, tags, codifications, options, labels, value, unit, false, hideCondition, now, translate, width)
	}
}

export class TimePicker extends Field {
	constructor(
		label: string,
		shortLabel?: string,
		rows?: number,
		grows?: boolean,
		columns?: number,
		tags?: string[],
		codifications?: string[],
		options?: { [key: string]: unknown },
		labels?: Labels,
		value?: string,
		unit?: string,
		hideCondition?: string,
		now?: boolean,
		translate?: boolean,
		width?: number,
	) {
		super('time-picker', label, shortLabel, rows, grows, columns, undefined, tags, codifications, options, labels, value, unit, false, hideCondition, now, translate, width)
	}
}

export class DateTimePicker extends Field {
	constructor(
		label: string,
		shortLabel?: string,
		rows?: number,
		grows?: boolean,
		columns?: number,
		tags?: string[],
		codifications?: string[],
		options?: { [key: string]: unknown },
		labels?: Labels,
		value?: string,
		unit?: string,
		hideCondition?: string,
		now?: boolean,
		translate?: boolean,
		width?: number,
	) {
		super('date-time-picker', label, shortLabel, rows, grows, columns, undefined, tags, codifications, options, labels, value, unit, false, hideCondition, now, translate, width)
	}
}

export class MultipleChoice extends Field {
	constructor(
		label: string,
		shortLabel?: string,
		rows?: number,
		grows?: boolean,
		columns?: number,
		tags?: string[],
		codifications?: string[],
		options?: { [key: string]: unknown },
		labels?: Labels,
		value?: string,
		unit?: string,
		hideCondition?: string,
		translate?: boolean,
		width?: number,
	) {
		super('multiple-choice', label, shortLabel, rows, grows, columns, undefined, tags, codifications, options, labels, value, unit, false, hideCondition, false, translate, width)
	}
}

export class DropdownField extends Field {
	constructor(
		label: string,
		shortLabel?: string,
		rows?: number,
		grows?: boolean,
		columns?: number,
		tags?: string[],
		codifications?: string[],
		options?: { [key: string]: unknown },
		labels?: Labels,
		value?: string,
		hideCondition?: string,
		translate?: boolean,
		width?: number,
	) {
		super(
			'dropdown-field',
			label,
			shortLabel,
			rows,
			grows,
			columns,
			undefined,
			tags,
			codifications,
			options,
			labels,
			value,
			undefined,
			false,
			hideCondition,
			false,
			translate,
			width,
		)
	}
}

export class RadioButton extends Field {
	constructor(
		label: string,
		shortLabel?: string,
		rows?: number,
		grows?: boolean,
		columns?: number,
		tags?: string[],
		codifications?: string[],
		options?: { [key: string]: unknown },
		value?: string,
		hideCondition?: string,
		translate?: boolean,
		width?: number,
		stylesOptions?: { [key: string]: unknown },
	) {
		super(
			'radio-button',
			label,
			shortLabel,
			rows,
			grows,
			columns,
			undefined,
			tags,
			codifications,
			options,
			undefined,
			value,
			undefined,
			false,
			hideCondition,
			false,
			translate,
			width,
			stylesOptions,
		)
	}
}

export class CheckBox extends Field {
	constructor(
		label: string,
		shortLabel?: string,
		rows?: number,
		grows?: boolean,
		columns?: number,
		tags?: string[],
		codifications?: string[],
		options?: { [key: string]: unknown },
		value?: string,
		hideCondition?: string,
		translate?: boolean,
		width?: number,
		stylesOptions?: { [key: string]: unknown },
	) {
		super(
			'checkbox',
			label,
			shortLabel,
			rows,
			grows,
			columns,
			undefined,
			tags,
			codifications,
			options,
			undefined,
			value,
			undefined,
			false,
			hideCondition,
			false,
			translate,
			width,
			stylesOptions,
		)
	}
}
export class Label extends Field {
	constructor(label: string, shortLabel?: string, rows?: number, grows?: boolean, columns?: number) {
		super('label', label, shortLabel, rows, grows, columns)
	}
}
export class Group {
	clazz = 'group' as const
	group: string
	fields?: Array<Field | Group>
	rows?: number
	columns?: number
	hideCondition?: string
	width?: number
	styleOptions?: { [key: string]: unknown }

	constructor(title: string, fields: Array<Field | Group>, rows?: number, columns?: number, hideCondition?: string, width?: number, styleOptions?: { [key: string]: unknown }) {
		this.group = title
		this.fields = fields
		this.rows = rows
		this.columns = columns
		this.hideCondition = hideCondition
		this.width = width
		this.styleOptions = styleOptions
	}

	static parse(json: { group: string; fields?: Array<Field | Group>; rows?: number; columns?: number; hideCondition?: string; width?: number }): Group {
		return new Group(
			json.group,
			(json.fields || []).map((s: Field | Group) => (s['group'] ? Group.parse(s as Group) : Field.parse(s as Field))),
			json.rows,
			json.columns,
			json.hideCondition,
			json.width,
		)
	}
}

export class Section {
	section: string
	fields: Array<Field | Group>
	description?: string
	keywords?: string[]

	constructor(title: string, fields: Array<Field | Group>, description?: string, keywords?: string[]) {
		this.section = title
		this.fields = fields
		this.description = description
		this.keywords = keywords
	}

	static parse(json: {
		section: string
		fields?: Array<Field | Group>
		groups?: Array<Field | Group>
		sections?: Array<Field | Group>
		description?: string
		keywords?: string[]
	}): Section {
		return new Section(
			json.section,
			(json.fields || json.groups || json.sections || []).map((s: Field | Group) => (s['group'] ? Group.parse(s as Group) : Field.parse(s as Field))),
			json.description,
			json.keywords,
		)
	}
}

export class Form {
	form: string
	sections: Section[]
	description?: string
	keywords?: string[]
	actions?: Action[]

	constructor(title: string, sections: Section[], description?: string, keywords?: string[], actions?: Action[]) {
		this.form = title
		this.description = description
		this.keywords = keywords
		this.sections = sections
		this.actions = actions
	}

	static parse(json: { form: string; sections: Section[]; description?: string; keywords?: string[]; actions?: Action[] }): Form {
		return new Form(
			json.form,
			(json.sections || []).map((s: Section) => Section.parse(s)),
			json.description,
			json.keywords,
			(json.actions || []).map((a: Action) => Action.parse(a)),
		)
	}
}

/**
 * Action part.
 * An action is an expression that can be triggered by a launcher and that can change the state of the form.
 * Launchers are defined by a trigger and a name. Launchers are events that will trigger the action.
 * Expression is evaluated by an Interpreter (get from the frontend). The expression can change the state of the form or launch another action on the frontend.
 * States are the states that can be changed by the action. States are defined by a name and a state to update.
 * There is 3 types of Action:
 * - Formulas: the expression is a formula that will change the value of a field.
 * 		Example: OnChange of field A and B, expresion is A + B and state is value of field C.
 * - ExternalAction: the expression is a call to an external action.
 * 		Example: OnClick of button A, expression is open dialog B and state is value of field C (that will be returned by the dialog).
 * - ExternalEvent: the launcher is an external event.
 * 		Example: Frontend send an event, expression is value of the event and state is value of field A.
 */
export class Action {
	launchers: Launcher[]
	expression: string
	states: State[]
	constructor(launchers: Launcher[], expression: string, states: State[]) {
		this.launchers = launchers
		this.expression = expression
		this.states = states
	}

	static parse(json: { launchers: Launcher[]; expression: string; states: State[] }): Action {
		return new Action(
			(json.launchers || []).map((l: Launcher) => Launcher.parse(l)),
			json.expression,
			(json.states || []).map((s: State) => State.parse(s)),
		)
	}
}

export class Launcher {
	name: string
	triggerer: Trigger
	shouldPassValue: boolean
	constructor(name: string, triggerer: Trigger, shouldPassValue: boolean) {
		this.name = name
		this.triggerer = triggerer
		this.shouldPassValue = shouldPassValue
	}
	static parse(json: { name: string; triggerer: Trigger; shouldPassValue: boolean }): Launcher {
		return new Launcher(json.name, json.triggerer, json.shouldPassValue)
	}
}

export enum Trigger {
	INIT = 'INIT',
	CHANGE = 'CHANGE',
	CLICK = 'CLICK',
	VISIBLE = 'VISIBLE',
	ERROR = 'ERROR',
	VALID = 'VALID',
	EVENT = 'EVENT',
}

export class State {
	name: string
	stateToUpdate: StateToUpdate
	canLaunchLauncher: boolean
	constructor(name: string, stateToUpdate: StateToUpdate, canLaunchLauncher: boolean) {
		this.name = name
		this.stateToUpdate = stateToUpdate
		this.canLaunchLauncher = canLaunchLauncher
	}
	static parse(json: { name: string; stateToUpdate: StateToUpdate; canLaunchLauncher: boolean }): State {
		return new State(json.name, json.stateToUpdate, json.canLaunchLauncher)
	}
}

export enum StateToUpdate {
	VALUE = 'VALUE',
	VISIBLE = 'VISIBLE',
	READONLY = 'READONLY',
	CLAZZ = 'CLAZZ',
	REQUIRED = 'REQUIRED',
}
