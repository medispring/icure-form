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
	clazz: 'field' = 'field'
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
	}

	static parse(json: Field): Field {
		switch (json.type as string) {
			case 'textfield':
				return new TextField(json.field, json.shortLabel, json.rows, json.columns, json.schema, json.tags, json.codifications, json.options)
			case 'measure-field':
				return new MeasureField(json.field, json.shortLabel, json.rows, json.columns, json.tags, json.codifications, json.options)
			case 'number-field':
				return new NumberField(json.field, json.shortLabel, json.rows, json.columns, json.tags, json.codifications, json.options, json.labels)
			case 'date-picker':
				return new DatePicker(json.field, json.shortLabel, json.rows, json.columns, json.tags, json.codifications, json.options)
			case 'time-picker':
				return new TimePicker(json.field, json.shortLabel, json.rows, json.columns, json.tags, json.codifications, json.options)
			case 'date-time-picker':
				return new DateTimePicker(json.field, json.shortLabel, json.rows, json.columns, json.tags, json.codifications, json.options)
			case 'multiple-choice':
				return new MultipleChoice(json.field, json.shortLabel, json.rows, json.columns, json.tags, json.codifications, json.options)
			case 'dropdown':
				return new DropdownField(json.field, json.shortLabel, json.rows, json.columns, json.tags, json.codifications, json.options, json.labels)
			case 'radio-button':
				return new RadioButton(json.field, json.shortLabel, json.rows, json.columns, json.tags, json.codifications, json.options)
			case 'checkbox':
				return new CheckBox(json.field, json.shortLabel, json.rows, json.columns, json.tags, json.codifications, json.options)
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
	) {
		super('textfield', label, shortLabel, rows, columns, schema || 'styled-text-with-codes', tags, codifications, options)
	}
}

export class MeasureField extends Field {
	constructor(label: string, shortLabel?: string, rows?: number, columns?: number, tags?: string[], codifications?: string[], options?: { [key: string]: unknown }) {
		super('measure-field', label, shortLabel, rows, columns, undefined, tags, codifications, options)
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
	) {
		super('number-field', label, shortLabel, rows, columns, undefined, tags, codifications, options, labels)
	}
}

export class DatePicker extends Field {
	constructor(label: string, shortLabel?: string, rows?: number, columns?: number, tags?: string[], codifications?: string[], options?: { [key: string]: unknown }) {
		super('date-picker', label, shortLabel, rows, columns, undefined, tags, codifications, options)
	}
}

export class TimePicker extends Field {
	constructor(label: string, shortLabel?: string, rows?: number, columns?: number, tags?: string[], codifications?: string[], options?: { [key: string]: unknown }) {
		super('time-picker', label, shortLabel, rows, columns, undefined, tags, codifications, options)
	}
}

export class DateTimePicker extends Field {
	constructor(label: string, shortLabel?: string, rows?: number, columns?: number, tags?: string[], codifications?: string[], options?: { [key: string]: unknown }) {
		super('date-time-picker', label, shortLabel, rows, columns, undefined, tags, codifications, options)
	}
}

export class MultipleChoice extends Field {
	constructor(label: string, shortLabel?: string, rows?: number, columns?: number, tags?: string[], codifications?: string[], options?: { [key: string]: unknown }) {
		super('multiple-choice', label, shortLabel, rows, columns, undefined, tags, codifications, options)
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
	) {
		super('dropdown-field', label, shortLabel, rows, columns, undefined, tags, codifications, options, labels)
	}
}

export class RadioButton extends Field {
	constructor(label: string, shortLabel?: string, rows?: number, columns?: number, tags?: string[], codifications?: string[], options?: { [key: string]: unknown }) {
		super('radio-button', label, shortLabel, rows, columns, undefined, tags, codifications, options)
	}
}

export class CheckBox extends Field {
	constructor(label: string, shortLabel?: string, rows?: number, columns?: number, tags?: string[], codifications?: string[], options?: { [key: string]: unknown }) {
		super('checkbox', label, shortLabel, rows, columns, undefined, tags, codifications, options)
	}
}
export class Label extends Field {
	constructor(label: string, shortLabel?: string, rows?: number, columns?: number) {
		super('label', label, shortLabel, rows, columns)
	}
}
export class Group {
	clazz: 'group' = 'group'
	group: string
	fields?: Array<Field | Group>
	rows?: number
	columns?: number

	constructor(title: string, fields: Array<Field | Group>, rows?: number, columns?: number) {
		this.group = title
		this.fields = fields
		this.rows = rows
		this.columns = columns
	}

	static parse(json: { group: string; fields?: Array<Field | Group> }): Group {
		return new Group(
			json.group,
			(json.fields || []).map((s: Field | Group) => (s['group'] ? Group.parse(s as Group) : Field.parse(s as Field))),
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
