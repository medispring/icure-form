import { FormValuesContainer } from '../src/components/iqr-form-loader'
import { Contact, Service } from '@icure/api'
import { Api } from '@icure/api'

const { cryptoApi } = Api('https://kraken.svc.icure.cloud/rest/v1', 'user', 'password')

export const makeFormValuesContainer = () => {
	const cc = new Contact({ id: 'c2', services: [{ id: 's1', tags: [{ id: 'CD-ITEM|diagnosis|1' }], content: { fr: { stringValue: 'Hello field modified' } } }] })
	const ctc = new Contact({
		id: 'c1',
		services: [
			{ id: 's1', tags: [{ id: 'CD-ITEM|diagnosis|1' }], content: { fr: { stringValue: 'Hello field' } } },
			{ id: 's2', tags: [], content: { fr: { fuzzyDateValue: 19920307 } } },
		],
	})
	const now = +new Date()
	return new FormValuesContainer(cc, ctc, [ctc], (language, content) => new Service({ id: cryptoApi.randomUuid(), created: now, modified: now, content: { [language]: content } }))
}
