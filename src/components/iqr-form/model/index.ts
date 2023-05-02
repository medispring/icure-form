import { IqrTextFieldSchema, Labels } from '../../iqr-text-field'
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

	label(): string {
		return this.field
	}

	protected constructor(
		type: FieldType,
		label: string,
		shortLabel?: string,
		rows?: number,
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
	) {
		this.field = label
		this.type = type
		this.shortLabel = shortLabel
		this.rows = rows || 1
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
		this.translate = translate || true
	}

	static parse(json: Field): Field {
		switch (json.type as string) {
			case 'textfield':
				return new TextField(
					json.field,
					json.shortLabel,
					json.rows,
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
				)
			case 'measure-field':
				return new MeasureField(
					json.field,
					json.shortLabel,
					json.rows,
					json.columns,
					json.tags,
					json.codifications,
					json.options,
					json.labels,
					json.value,
					json.unit,
					json.hideCondition,
					json.translate,
				)
			case 'number-field':
				return new NumberField(
					json.field,
					json.shortLabel,
					json.rows,
					json.columns,
					json.tags,
					json.codifications,
					json.options,
					json.labels,
					json.value,
					undefined,
					json.hideCondition,
					json.translate,
				)
			case 'date-picker':
				return new DatePicker(
					json.field,
					json.shortLabel,
					json.rows,
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
				)
			case 'time-picker':
				return new TimePicker(
					json.field,
					json.shortLabel,
					json.rows,
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
				)
			case 'date-time-picker':
				return new DateTimePicker(
					json.field,
					json.shortLabel,
					json.rows,
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
				)
			case 'multiple-choice':
				return new MultipleChoice(
					json.field,
					json.shortLabel,
					json.rows,
					json.columns,
					json.tags,
					json.codifications,
					json.options,
					json.labels,
					json.value,
					undefined,
					json.hideCondition,
					json.translate,
				)
			case 'dropdown':
				return new DropdownField(json.field, json.shortLabel, json.rows, json.columns, json.tags, json.codifications, json.options, json.labels, json.value, json.hideCondition)
			case 'radio-button':
				return new RadioButton(json.field, json.shortLabel, json.rows, json.columns, json.tags, json.codifications, json.options, json.value, json.hideCondition)
			case 'checkbox':
				return new CheckBox(json.field, json.shortLabel, json.rows, json.columns, json.tags, json.codifications, json.options, json.value, json.hideCondition)
			case 'label':
				return new Label(json.field, json.shortLabel, json.rows, json.columns)
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
	) {
		super(
			'textfield',
			label,
			shortLabel,
			rows,
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
		)
	}
}

export class MeasureField extends Field {
	constructor(
		label: string,
		shortLabel?: string,
		rows?: number,
		columns?: number,
		tags?: string[],
		codifications?: string[],
		options?: { [key: string]: unknown },
		labels?: Labels,
		value?: string,
		unit?: string,
		hideCondition?: string,
		translate?: boolean,
	) {
		super('measure-field', label, shortLabel, rows, columns, undefined, tags, codifications, options, labels, value, unit, false, hideCondition, false, translate)
	}
}

export class NumberField extends Field {
	constructor(
		label: string,
		shortLabel?: string,
		rows?: number,
		columns?: number,
		tags?: string[],
		codifications?: string[],
		options?: { [key: string]: unknown },
		labels?: Labels,
		value?: string,
		unit?: string,
		hideCondition?: string,
		translate?: boolean,
	) {
		super('number-field', label, shortLabel, rows, columns, undefined, tags, codifications, options, labels, value, unit, false, hideCondition, false, translate)
	}
}

export class DatePicker extends Field {
	constructor(
		label: string,
		shortLabel?: string,
		rows?: number,
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
	) {
		super('date-picker', label, shortLabel, rows, columns, undefined, tags, codifications, options, labels, value, unit, false, hideCondition, now, translate)
	}
}

export class TimePicker extends Field {
	constructor(
		label: string,
		shortLabel?: string,
		rows?: number,
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
	) {
		super('time-picker', label, shortLabel, rows, columns, undefined, tags, codifications, options, labels, value, unit, false, hideCondition, now, translate)
	}
}

export class DateTimePicker extends Field {
	constructor(
		label: string,
		shortLabel?: string,
		rows?: number,
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
	) {
		super('date-time-picker', label, shortLabel, rows, columns, undefined, tags, codifications, options, labels, value, unit, false, hideCondition, now, translate)
	}
}

export class MultipleChoice extends Field {
	constructor(
		label: string,
		shortLabel?: string,
		rows?: number,
		columns?: number,
		tags?: string[],
		codifications?: string[],
		options?: { [key: string]: unknown },
		labels?: Labels,
		value?: string,
		unit?: string,
		hideCondition?: string,
		translate?: boolean,
	) {
		super('multiple-choice', label, shortLabel, rows, columns, undefined, tags, codifications, options, labels, value, unit, false, hideCondition, false, translate)
	}
}

export class DropdownField extends Field {
	constructor(
		label: string,
		shortLabel?: string,
		rows?: number,
		columns?: number,
		tags?: string[],
		codifications?: string[],
		options?: { [key: string]: unknown },
		labels?: Labels,
		value?: string,
		hideCondition?: string,
		translate?: boolean,
	) {
		super('dropdown-field', label, shortLabel, rows, columns, undefined, tags, codifications, options, labels, value, undefined, false, hideCondition, false, translate)
	}
}

export class RadioButton extends Field {
	constructor(
		label: string,
		shortLabel?: string,
		rows?: number,
		columns?: number,
		tags?: string[],
		codifications?: string[],
		options?: { [key: string]: unknown },
		value?: string,
		hideCondition?: string,
		translate?: boolean,
	) {
		super('radio-button', label, shortLabel, rows, columns, undefined, tags, codifications, options, undefined, value, undefined, false, hideCondition, false, translate)
	}
}

export class CheckBox extends Field {
	constructor(
		label: string,
		shortLabel?: string,
		rows?: number,
		columns?: number,
		tags?: string[],
		codifications?: string[],
		options?: { [key: string]: unknown },
		value?: string,
		hideCondition?: string,
		translate?: boolean,
	) {
		super('checkbox', label, shortLabel, rows, columns, undefined, tags, codifications, options, undefined, value, undefined, false, hideCondition, false, translate)
	}
}
export class Label extends Field {
	constructor(label: string, shortLabel?: string, rows?: number, columns?: number) {
		super('label', label, shortLabel, rows, columns)
	}
}
export class Group {
	clazz = 'group' as const
	group: string
	fields?: Array<Field | Group>
	rows?: number
	columns?: number
	hideCondition?: string

	constructor(title: string, fields: Array<Field | Group>, rows?: number, columns?: number, hideCondition?: string) {
		this.group = title
		this.fields = fields
		this.rows = rows
		this.columns = columns
		this.hideCondition = hideCondition
	}

	static parse(json: { group: string; fields?: Array<Field | Group>; rows?: number; columns?: number; hideCondition?: string }): Group {
		return new Group(
			json.group,
			(json.fields || []).map((s: Field | Group) => (s['group'] ? Group.parse(s as Group) : Field.parse(s as Field))),
			json.rows,
			json.columns,
			json.hideCondition,
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

	constructor(title: string, sections: Section[], description?: string, keywords?: string[]) {
		this.form = title
		this.description = description
		this.keywords = keywords
		this.sections = sections
	}

	static parse(json: { form: string; sections: Section[]; description?: string; keywords?: string[] }): Form {
		return new Form(
			json.form,
			(json.sections || []).map((s: Section) => Section.parse(s)),
			json.description,
			json.keywords,
		)
	}
}
