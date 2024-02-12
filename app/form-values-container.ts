import { ContactFormValuesContainer } from '../src/icure'
import { v4 as uuid } from 'uuid'
import { Contact, Service } from '@icure/api'
export const makeFormValuesContainer = () => {
	const cc = new Contact({
		id: 'c2',
		rev: null,
		services: [
			{
				id: 's1',
				label: 'history',
				valueDate: 20181012,
				tags: [{ id: 'MS-ABORTION-PSYCHOSOCIAL-INTERVIEW-ITEM|HISTORY|1' }],
				content: { en: { stringValue: 'commentaire' } },
			},
			{
				id: 's2',
				label: 'inTakeDate',
				tags: [{ id: 'MS-ABORTION-DATE|intake|1' }, { id: 'MS-ABORTION-ITEM|date|1' }, { id: 'MS-ABORTION-PSYCHOSOCIAL-INTERVIEW-ITEM|IN-TAKE-DATE|1' }],
				content: { en: { fuzzyDateValue: '19960823' } },
			},
		],
	})
	const ctc = new Contact({
		id: 'c1',
		rev: '12345',
		services: [
			{ id: 's1', label: 'abortion-forms.field-labels.HISTORY', tags: [{ id: 'MS-ABORTION-PSYCHOSOCIAL-INTERVIEW-ITEM|HISTORY|1' }], content: { en: { stringValue: 'test' } } },
			{
				id: 's2',
				label: 'abortion-forms.field-labels.IN-TAKE-DATE',
				tags: [{ id: 'MS-ABORTION-DATE|intake|1' }, { id: 'MS-ABORTION-ITEM|date|1' }, { id: 'MS-ABORTION-PSYCHOSOCIAL-INTERVIEW-ITEM|IN-TAKE-DATE|1' }],
				content: { en: { fuzzyDateValue: '20220404' } },
			},
		],
	})

	const rootForm = {
		id: 'f1',
		rev: '12345',
		formTemplateId: 'abortion',
	}

	const now = +new Date()
	return ContactFormValuesContainer.fromFormsHierarchy(
		rootForm,
		cc,
		[ctc],
		(label, serviceId) => new Service({ label, id: serviceId ?? uuid(), created: now, modified: now }),
		async () => [],
		async (anchorId: string, fti, label) => ({
			id: uuid(),
			created: +new Date(),
			modified: +new Date(),
			formTemplateId: fti,
			parent: rootForm.id,
			descr: anchorId /* TODO, this hack is used to anchor a form inside a form template. Fix it by introducing an anchorId in Form */,
		}),
	)
}
