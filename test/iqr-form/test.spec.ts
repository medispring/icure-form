import { strictEqual } from 'assert'
import YAML from 'yaml'
import { Form, Section, Group, TextField, NumberField, DatePicker, TimePicker, DateTimePicker, MultipleChoice, MeasureField } from '../../src/components/iqr-form/model'

describe('Form parsing tests', () => {
	it('should Render simple form', () => {
		const text = YAML.stringify(
			JSON.parse(
				JSON.stringify(
					new Form(
						'Waiting room GP',
						[
							new Section('The reason of your visit', [
								new TextField('What symptoms, or more generally what reason motivated your visit'),
								new MultipleChoice('What is the level of pain that you are experiencing'),
							]),
							new Section('The reason of your visit', [
								new Group('If you have measured your blood pressure. Please introduce it below', [
									new MeasureField('Systolic blood pressure'),
									new MeasureField('Diastolic blood pressure'),
								]),
							]),
						],
						'Fill in the patient information inside the waiting room',
					),
				),
			),
		)
		console.log(text)
		strictEqual(
			text,
			'form: Waiting room GP\n' +
				'description: Fill in the patient information inside the waiting room\n' +
				'sections:\n' +
				'  - section: The reason of your visit\n' +
				'    fields:\n' +
				'      - field: What symptoms, or more generally what reason motivated your visit\n' +
				'        type: textfield\n' +
				'        schema: styled-text-with-codes\n' +
				'      - field: What is the level of pain that you are experiencing\n' +
				'        type: multiple-choice\n' +
				'  - section: The reason of your visit\n' +
				'    fields:\n' +
				'      - group: If you have measured your blood pressure. Please introduce it below\n' +
				'        fields:\n' +
				'          - field: Systolic blood pressure\n' +
				'            type: measure-field\n' +
				'          - field: Diastolic blood pressure\n' +
				'            type: measure-field\n',
		)
	})
	it('should Parse simple form', () => {
		const original =
			'form: Waiting room GP\n' +
			'description: Fill in the patient information inside the waiting room\n' +
			'sections:\n' +
			'  - section: The reason of your visit\n' +
			'    fields:\n' +
			'      - field: What symptoms, or more generally what reason motivated your visit\n' +
			'        type: textfield\n' +
			'        schema: styled-text-with-codes\n' +
			'      - field: What is the level of pain that you are experiencing\n' +
			'        type: multiple-choice\n' +
			'  - section: The reason of your visit\n' +
			'    fields:\n' +
			'      - group: If you have measured your blood pressure. Please introduce it below\n' +
			'        fields:\n' +
			'          - field: Systolic blood pressure\n' +
			'            type: measure-field\n' +
			'          - field: Diastolic blood pressure\n' +
			'            type: measure-field\n'
		const form = Form.parse(YAML.parse(original))
		const text = YAML.stringify(JSON.parse(JSON.stringify(form)))
		console.log(text)
		strictEqual(text, original)
	})
	it('should Render complex form', () => {
		const text = YAML.stringify(
			JSON.parse(
				JSON.stringify(
					new Form(
						'Waiting room GP',
						[
							new Section('All fields', [
								new TextField('This field is a TextField', 'TextField'),
								new NumberField('This field is a NumberField', 'NumberField'),
								new MeasureField('This field is a MeasureField', 'MeasureField'),
								new DatePicker('This field is a DatePicker', 'DatePicker'),
								new TimePicker('This field is a TimePicker', 'TimePicker'),
								new DateTimePicker('This field is a DateTimePicker', 'DateTimePicker'),
								new MultipleChoice('This field is a MultipleChoice', 'MultipleChoice'),
							]),
							new Section('Grouped fields', [
								new Group('You can group fields together', [
									new TextField('This field is a TextField', 'TextField'),
									new NumberField('This field is a NumberField', 'NumberField'),
									new MeasureField('This field is a MeasureField', 'MeasureField'),
									new DatePicker('This field is a DatePicker', 'DatePicker'),
									new TimePicker('This field is a TimePicker', 'TimePicker'),
									new DateTimePicker('This field is a DateTimePicker', 'DateTimePicker'),
									new MultipleChoice('This field is a MultipleChoice', 'MultipleChoice'),
								]),
								new Group('And you can add tags and codes', [
									new TextField('This field is a TextField', 'TextField', 3, 1, 'text-document', ['CD-ITEM|diagnosis|1'], ['BE-THESAURUS', 'ICD10'], { option: 'blink' }),
									new NumberField('This field is a NumberField', 'NumberField', 3, 1, ['CD-ITEM|parameter|1', 'CD-PARAMETER|bmi|1'], [], { option: 'bang' }),
									new MeasureField('This field is a MeasureField', 'MeasureField', 3, 1, ['CD-ITEM|parameter|1', 'CD-PARAMETER|heartbeat|1'], [], { unit: 'bpm' }),
									new MultipleChoice('This field is a MultipleChoice', 'MultipleChoice', 4, 4, [], ['KATZ'], { many: 'no' }),
								]),
							]),
						],
						'Fill in the patient information inside the waiting room',
					),
				),
			),
		)
		console.log(text)
		strictEqual(
			text,
			`form: Waiting room GP
description: Fill in the patient information inside the waiting room
sections:
  - section: All fields
    fields:
      - field: This field is a TextField
        type: textfield
        shortLabel: TextField
        schema: styled-text-with-codes
      - field: This field is a NumberField
        type: number-field
        shortLabel: NumberField
      - field: This field is a MeasureField
        type: measure-field
        shortLabel: MeasureField
      - field: This field is a DatePicker
        type: date-picker
        shortLabel: DatePicker
      - field: This field is a TimePicker
        type: time-picker
        shortLabel: TimePicker
      - field: This field is a DateTimePicker
        type: date-time-picker
        shortLabel: DateTimePicker
      - field: This field is a MultipleChoice
        type: multiple-choice
        shortLabel: MultipleChoice
  - section: Grouped fields
    fields:
      - group: You can group fields together
        fields:
          - field: This field is a TextField
            type: textfield
            shortLabel: TextField
            schema: styled-text-with-codes
          - field: This field is a NumberField
            type: number-field
            shortLabel: NumberField
          - field: This field is a MeasureField
            type: measure-field
            shortLabel: MeasureField
          - field: This field is a DatePicker
            type: date-picker
            shortLabel: DatePicker
          - field: This field is a TimePicker
            type: time-picker
            shortLabel: TimePicker
          - field: This field is a DateTimePicker
            type: date-time-picker
            shortLabel: DateTimePicker
          - field: This field is a MultipleChoice
            type: multiple-choice
            shortLabel: MultipleChoice
      - group: And you can add tags and codes
        fields:
          - field: This field is a TextField
            type: textfield
            shortLabel: TextField
            rows: 3
            grows: true
            schema: text-document
            tags:
              - CD-ITEM|diagnosis|1
            codifications:
              - BE-THESAURUS
              - ICD10
            options:
              option: blink
          - field: This field is a NumberField
            type: number-field
            shortLabel: NumberField
            tags:
              - CD-ITEM|parameter|1
              - CD-PARAMETER|bmi|1
            codifications: []
            options:
              option: bang
          - field: This field is a MeasureField
            type: measure-field
            shortLabel: MeasureField
            tags:
              - CD-ITEM|parameter|1
              - CD-PARAMETER|heartbeat|1
            codifications: []
            options:
              unit: bpm
          - field: This field is a MultipleChoice
            type: multiple-choice
            shortLabel: MultipleChoice
            rows: 4
            columns: 4
            tags: []
            codifications:
              - KATZ
            options:
              many: no
`,
		)
	})
	it('should Parse complex form', () => {
		const original =
			'form: Waiting room GP\n' +
			'description: Fill in the patient information inside the waiting room\n' +
			'sections:\n' +
			'  - section: All fields\n' +
			'    fields:\n' +
			'      - field: This field is a TextField\n' +
			'        type: textfield\n' +
			'        shortLabel: TextField\n' +
			'        schema: styled-text-with-codes\n' +
			'      - field: This field is a NumberField\n' +
			'        type: number-field\n' +
			'        shortLabel: NumberField\n' +
			'      - field: This field is a MeasureField\n' +
			'        type: measure-field\n' +
			'        shortLabel: MeasureField\n' +
			'      - field: This field is a DatePicker\n' +
			'        type: date-picker\n' +
			'        shortLabel: DatePicker\n' +
			'      - field: This field is a TimePicker\n' +
			'        type: time-picker\n' +
			'        shortLabel: TimePicker\n' +
			'      - field: This field is a DateTimePicker\n' +
			'        type: date-time-picker\n' +
			'        shortLabel: DateTimePicker\n' +
			'      - field: This field is a MultipleChoice\n' +
			'        type: multiple-choice\n' +
			'        shortLabel: MultipleChoice\n' +
			'  - section: Grouped fields\n' +
			'    fields:\n' +
			'      - group: You can group fields together\n' +
			'        fields:\n' +
			'          - field: This field is a TextField\n' +
			'            type: textfield\n' +
			'            shortLabel: TextField\n' +
			'            schema: styled-text-with-codes\n' +
			'          - field: This field is a NumberField\n' +
			'            type: number-field\n' +
			'            shortLabel: NumberField\n' +
			'          - field: This field is a MeasureField\n' +
			'            type: measure-field\n' +
			'            shortLabel: MeasureField\n' +
			'          - field: This field is a DatePicker\n' +
			'            type: date-picker\n' +
			'            shortLabel: DatePicker\n' +
			'          - field: This field is a TimePicker\n' +
			'            type: time-picker\n' +
			'            shortLabel: TimePicker\n' +
			'          - field: This field is a DateTimePicker\n' +
			'            type: date-time-picker\n' +
			'            shortLabel: DateTimePicker\n' +
			'          - field: This field is a MultipleChoice\n' +
			'            type: multiple-choice\n' +
			'            shortLabel: MultipleChoice\n' +
			'      - group: And you can add tags and codes\n' +
			'        fields:\n' +
			'          - field: This field is a TextField\n' +
			'            type: textfield\n' +
			'            shortLabel: TextField\n' +
			'            rows: 3\n' +
			'            grows: true\n' +
			'            schema: text-document\n' +
			'            tags:\n' +
			'              - CD-ITEM|diagnosis|1\n' +
			'            codifications:\n' +
			'              - BE-THESAURUS\n' +
			'              - ICD10\n' +
			'            options:\n' +
			'              option: blink\n' +
			'          - field: This field is a NumberField\n' +
			'            type: number-field\n' +
			'            shortLabel: NumberField\n' +
			'            tags:\n' +
			'              - CD-ITEM|parameter|1\n' +
			'              - CD-PARAMETER|bmi|1\n' +
			'            codifications: []\n' +
			'            options:\n' +
			'              option: bang\n' +
			'          - field: This field is a MeasureField\n' +
			'            type: measure-field\n' +
			'            shortLabel: MeasureField\n' +
			'            tags:\n' +
			'              - CD-ITEM|parameter|1\n' +
			'              - CD-PARAMETER|heartbeat|1\n' +
			'            codifications: []\n' +
			'            options:\n' +
			'              unit: bpm\n' +
			'          - field: This field is a MultipleChoice\n' +
			'            type: multiple-choice\n' +
			'            shortLabel: MultipleChoice\n' +
			'            rows: 4\n' +
			'            columns: 4\n' +
			'            tags: []\n' +
			'            codifications:\n' +
			'              - KATZ\n' +
			'            options:\n' +
			'              many: no\n'
		const form = Form.parse(YAML.parse(original))
		const text = YAML.stringify(JSON.parse(JSON.stringify(form)))
		console.log(text)
		strictEqual(text, original)
	})
	it('Should parse a form from a graph of POJOs', () => {
		const toParse = JSON.parse(`{
  "form": "Entretien préliminaire Psycho Social",
  "sections": [
    {
      "fields": [
        {
          "field": "Type de consultation",
          "shortLabel": "contactType",
          "rows": 1,
          "columns": 1,
          "tags": [
            "MS-IVG|CONTACT-TYPE|1"
          ],
          "codifications": [
            "MS-IVG-CONTACT-TYPE"
          ],
          "options": {
            "home": "Sur place",
            "visio": "Visioconférence",
            "call": "Téléphone"
          },
          "required": true,
          "type": "dropdown"
        },
        {
          "field": "waitingRoomFollowersNumber",
          "shortLabel": "waitingRoomFollowersNumber",
          "tags": [
            "CD-CUSTOM-IVG|WAITING-ROOM-FOLLOWERS-NUMBER|1"
          ],
          "rows": 2,
          "columns": 1,
          "required": true,
          "value": "0",
          "type": "number-field"
        },
        {
          "field": "consultationFollowersNumber",
          "shortLabel": "consultationFollowersNumber",
          "tags": [
            "CD-CUSTOM-IVG|CONSULTATION-FOLLOWERS-NUMBER|1"
          ],
          "rows": 2,
          "columns": 1,
          "required": true,
          "value": "0",
          "type": "number-field"
        },
        {
          "field": "Personnes Accompagnants",
          "shortLabel": "PersonFollowerType",
          "rows": 3,
          "columns": 1,
          "tags": [
            "CD-CUSTOM-IVG|PERSON-FOLLOWER-TYPE|1"
          ],
          "options": {
            "option1": "Partenaire",
            "option2": "Mère",
            "option3": "Amie",
            "option4": "Éducateur",
            "option5": "Père"
          },
          "required": false,
          "type": "checkbox"
        },
        {
          "field": "Profession de la patiente",
          "shortLabel": "PatientProfession",
          "rows": 4,
          "columns": 1,
          "tags": [
            "CD-CUSTOM-IVG|PATIENT-PROFESSION|1"
          ],
          "options": {
            "option1": "Employé",
            "option2": "Ouvrier",
            "option3": "Indépendant",
            "option4": "Sans travail",
            "option5": "Ne veut pas dire"
          },
          "required": false,
          "type": "radio-button"
        },
        {
          "field": "Nombre d’enfants",
          "shortLabel": "ChildNumber",
          "tags": [
            "CD-CUSTOM-IVG|CHILD-NUMBER|1"
          ],
          "rows": 5,
          "columns": 1,
          "required": true,
          "value": "0",
          "type": "number-field"
        },
        {
          "field": "Nombre d’enfants à charge",
          "shortLabel": "ChildInChargeNumber",
          "tags": [
            "CD-CUSTOM-IVG|CHILD-IN-CHARGE-NUMBER|1"
          ],
          "rows": 5,
          "columns": 1,
          "required": true,
          "value": "0",
          "type": "number-field"
        },
        {
          "field": "Nombre de minutes de suivi",
          "shortLabel": "minutesTrackingNumber",
          "tags": [
            "CD-CUSTOM-IVG|MINUTES-TRACKING-NUMBER|1"
          ],
          "rows": 6,
          "columns": 1,
          "required": true,
          "value": "50",
          "type": "measure-field"
        },
        {
          "field": "Nombre de minutes de contraception",
          "shortLabel": "minutesContraceptionNumber",
          "tags": [
            "CD-CUSTOM-IVG|MINUTES-CONTRACEPTION-NUMBER|1"
          ],
          "rows": 6,
          "columns": 1,
          "required": true,
          "value": "10",
          "type": "measure-field"
        },
        {
          "field": "Historique/Situation",
          "shortLabel": "History",
          "rows": 7,
          "tags": [
            "CD-CUSTOM-IVG|HISTORY|1"
          ],
          "columns": 1,
          "required": false,
          "type": "textfield"
        },
        {
          "field": "Position du partenaire pendant la grossesse",
          "shortLabel": "SexualPosition",
          "rows": 8,
          "tags": [
            "CD-CUSTOM-IVG|SEXUAL-POSITION|1"
          ],
          "columns": 1,
          "required": false,
          "type": "textfield"
        },
        {
          "field": "Processus de prise de décision / choix / attitude par rapport à l'avortement (le cas échéant)",
          "shortLabel": "decisionProcessus",
          "rows": 9,
          "tags": [
            "CD-CUSTOM-IVG|DECISION-PROCESSUS|1"
          ],
          "columns": 1,
          "required": false,
          "type": "textfield"
        },
        {
          "field": "Première décision de la patiente",
          "shortLabel": "firstChoice",
          "rows": 9,
          "columns": 1,
          "tags": [
            "CD-CUSTOM-IVG|FIRST-CHOICE|1"
          ],
          "options": {
            "option1": "Oui par curretage",
            "option2": "Ne sait pas",
            "option3": "Oui par médication",
            "option4": "Non"
          },
          "required": true,
          "type": "radio-button"
        },
        {
          "field": "Notes",
          "shortLabel": "notes",
          "rows": 10,
          "tags": [
            "CD-CUSTOM-IVG|NOTES|1"
          ],
          "columns": 1,
          "required": false,
          "type": "textfield"
        }
      ]
    }
  ],
  "description": "Entretien préliminaire Psycho Social"
}`)
		const form = Form.parse(toParse)
		strictEqual(form.sections[0].fields[0].clazz, 'field')
	})
})
