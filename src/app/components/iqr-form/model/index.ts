import { IqrTextFieldSchema } from "../../iqr-text-field";
type FieldType = 'textfield' | 'measure-field' | 'number-field' | 'date-picker' | 'time-picker' | 'date-time-picker' | 'multiple-choice';

export abstract class Field {
	field: string
	type: FieldType
	shortLabel?: string
	rows?: number
	columns?: number
	grows?: boolean
	schema?: IqrTextFieldSchema
	tags?: string[]
	codifications?: string[]
	options?: { [key:string]: any}

	protected constructor(type: FieldType, label: string, shortLabel?: string, rows?: number, columns?: number, grows?: boolean, schema?: IqrTextFieldSchema, tags?: string[] , codifications?: string[] , options?: { [key: string]: any }) {
		this.field = label;
		this.type = type;
		this.shortLabel = shortLabel;
		this.rows = rows;
		this.columns = columns;
		this.grows = grows;
		this.schema = schema;
		this.tags = tags;
		this.codifications = codifications;
		this.options = options;
	}

	static parse(json: any) {
		switch (json.type) {
			case 'textfield':
				return new TextField(
					json.field,
					json.shortLabel,
					json.rows,
					json.grows,
					json.schema,
					json.tags,
					json.codifications,
					json.options
				)
			case 'measure-field':
				return new MeasureField(
					json.field,
					json.shortLabel,
					json.tags,
					json.codifications,
					json.options
				)
			case 'number-field':
				return new NumberField(
					json.field,
					json.shortLabel,
					json.tags,
					json.codifications,
					json.options
				)
			case 'date-picker':
				return new DatePicker(
					json.field,
					json.shortLabel,
					json.tags,
					json.codifications,
					json.options
				)
			case 'time-picker':
				return new TimePicker(
					json.field,
					json.shortLabel,
					json.tags,
					json.codifications,
					json.options
				)
			case 'date-time-picker':
				return new DateTimePicker(
					json.field,
					json.shortLabel,
					json.tags,
					json.codifications,
					json.options
				)
			case 'multiple-choice':
				return new MultipleChoice(
					json.field,
					json.shortLabel,
					json.rows,
					json.columns,
					json.tags,
					json.codifications,
					json.options
				)
			default:
				throw Error("Invalid field type "+json.type)
		}
	}

}

export class TextField extends Field {
	constructor(label: string, shortLabel?: string, rows?: number, grows?: boolean, schema?: IqrTextFieldSchema, tags?: string[], codifications?: string[], options?: { [key: string]: any }) {
		super('textfield', label, shortLabel, rows, undefined, grows, schema || 'styled-text-with-codes', tags, codifications, options);
	}
}

export class MeasureField extends Field {
	constructor(label: string, shortLabel?: string, tags?: string[], codifications?: string[], options?: { [key: string]: any }) {
		super('measure-field', label, shortLabel, undefined, undefined, undefined, undefined, tags, codifications, options);
	}
}

export class NumberField extends Field {
	constructor(label: string, shortLabel?: string, tags?: string[], codifications?: string[], options?: { [key: string]: any }) {
		super('number-field', label, shortLabel, undefined, undefined, undefined, undefined, tags, codifications, options);
	}
}

export class DatePicker extends Field {
	constructor(label: string, shortLabel?: string, tags?: string[], codifications?: string[], options?: { [key: string]: any }) {
		super('date-picker', label, shortLabel, undefined, undefined, undefined, undefined, tags, codifications, options);
	}
}

export class TimePicker extends Field {
	constructor(label: string, shortLabel?: string, tags?: string[], codifications?: string[], options?: { [key: string]: any }) {
		super('time-picker', label, shortLabel, undefined, undefined, undefined, undefined, tags, codifications, options);
	}
}

export class DateTimePicker extends Field {
	constructor(label: string, shortLabel?: string, tags?: string[], codifications?: string[], options?: { [key: string]: any }) {
		super('date-time-picker', label, shortLabel, undefined, undefined, undefined, undefined, tags, codifications, options);
	}
}

export class MultipleChoice extends Field {
	constructor(label: string, shortLabel?: string,  rows?: number, columns?: number, tags?: string[], codifications?: string[], options?: { [key: string]: any }) {
		super('multiple-choice', label, shortLabel, rows, columns, undefined, undefined, tags, codifications, options);
	}
}

export class Group {
	group: string
	fields?: Array<Field|Group>

	constructor(title: string, fields: Array<Field | Group>) {
		this.group = title;
		this.fields = fields;
	}

	static parse(json: any) {
		return new Group(
			json.group,
			json.fields.map((s:any) => s.group ? Group.parse(s) : Field.parse(s))
		)
	}
}

export class Section {
	section: string
	fields: Array<Field|Group>
	description?: string
	keywords?: String[]

	constructor(title: string, fields: Array<Field | Group>, description?: string, keywords?: String[] ) {
		this.section = title;
		this.fields = fields;
		this.description = description;
		this.keywords = keywords;
	}

	static parse(json: any) {
		return new Section(
		json.section,
		json.fields.map((s:any) => s.group ? Group.parse(s) : Field.parse(s)),
		json.description,
		json.keywords
	)
	}
}

export class Form {
	form: string
	sections: Section[]
	description?: string
	keywords?: String[]

	constructor(title: string, sections: Section[], description?: string, keywords?: String[] ) {
		this.form = title;
		this.description = description;
		this.keywords = keywords;
		this.sections = sections;
	}

	static parse(json: any) {
		return new Form(json.form, json.sections.map((s:any) => Section.parse(s)), json.description, json.keywords)
	}
}
