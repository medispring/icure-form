import { Contact, Service } from '@icure/api'
import { Api } from '@icure/api'
import { ICureFormValuesContainer } from '../src/components/iqr-form-loader/formValuesContainer'

const { cryptoApi } = Api('https://kraken.svc.icure.cloud/rest/v1', 'user', 'password')

export const makeFormValuesContainer = () => {
	const cc = new Contact({ id: 'c2', services: [{ id: 's1', tags: [{ id: 'CD-ITEM|diagnosis|1' }], content: { fr: { stringValue: 'Hello field modified' } } }] })
	const ctc = new Contact({
		id: 'c1',
		services: [
			{ id: 's1', tags: [{ id: 'CD-ITEM|diagnosis|1' }], content: { fr: { stringValue: 'Hello field' } } },
			{ id: 's2', label: 'The Date', tags: [], content: { fr: { fuzzyDateValue: 19920307 } } },
			{ id: 's3', label: 'DateTime', tags: [], content: { fr: { fuzzyDateValue: 19920307102000 } } },
			{ id: 's4', label: 'A TimePicker', tags: [], content: { fr: { fuzzyDateValue: 102000 } } },
		],
	})
	const now = +new Date()
	return new ICureFormValuesContainer(
		cc,
		ctc,
		[ctc],
		(language, content) => new Service({ id: cryptoApi.randomUuid(), created: now, modified: now, content: { [language]: content } }),
	)
}
