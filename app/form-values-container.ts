import { Contact, Service } from '@icure/api'
import { ICureFormValuesContainer } from '../src/components/iqr-form-loader'

export const makeFormValuesContainer = () => {
	const cc = new Contact({
		id: 'c2',
		services: [
			{ id: 's1', valueDate: 20181012, tags: [{ id: 'MS-ABORTION-MEDICAL-ABORTION-SECOND-PART-ITEM|commentOrObservation|1' }], content: { en: { stringValue: 'commentaire' } } },
			{ id: 's2', tags: [{ id: 'MS-ABORTION-APPOINTMENT-TIME-ITEM|appointmentDate|1' }], content: { en: { fuzzyDateValue: '19960823' } } },
		],
	})
	const ctc = new Contact({
		id: 'c1',
		services: [
			{ id: 's1', tags: [{ id: 'MS-ABORTION-APPOINTMENT-TIME-ITEM|commentary|1' }], content: { en: { stringValue: 'test' } } },
			{ id: 's2', tags: [{ id: 'MS-ABORTION-APPOINTMENT-TIME-ITEM|contactVia|1' }], content: { en: { stringValue: 'Médecin' } } },
			{ id: 's3', label: 'DateTime', tags: [], content: { en: { fuzzyDateValue: 19920307102000 } } },
			{ id: 's4', label: 'A TimePicker', tags: [], content: { en: { fuzzyDateValue: 102000 } } },
		],
	})
	const now = +new Date()
	return new ICureFormValuesContainer(
		cc,
		ctc,
		[ctc],
		(label, serviceId, language, content, codes, tags) => new Service({ label, id: serviceId, created: now, modified: now, content: { [language]: content }, codes, tags }),
	)
}
