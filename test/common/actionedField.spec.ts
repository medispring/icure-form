import { equal } from 'assert'
import { IqrTextField } from '../../src/components/iqr-text-field'

describe('actionedField main test', () => {
	it('should create new instance', () => {
		const mockActionField = new IqrTextField('', '', 1, false, 1, 'text-document', ['CD-ITEM|diagnosis|1'])
		equal(mockActionField?.actionManager, undefined)
		equal(mockActionField?.editable, true)
		equal(mockActionField?.display, true)
	})
})
