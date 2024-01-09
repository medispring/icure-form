import { BridgedFormValuesContainer, ContactFormValuesContainer } from '../src/icure'
import { Contact } from '@icure/api'
import { FieldMetadata, FieldValue } from '../src/components/model'
import { Version, VersionedData } from '../src/generic'

export class BridgedFormValuesContainerWithEntityRef extends BridgedFormValuesContainer {
	constructor(
		responsible: string,
		contactFormValuesContainer: ContactFormValuesContainer,
		interpreter:
			| (<
					T,
					S extends {
						[p: string]: unknown
						[p: symbol]: unknown
					},
			  >(
					formula: string,
					sandbox: S,
			  ) => T | undefined)
			| undefined,
		contact: Contact,
		changeListeners: ((newValue: BridgedFormValuesContainer) => void)[],
	) {
		super(responsible, contactFormValuesContainer, interpreter, contact, changeListeners)
	}

	getValues(revisionsFilter: (id: string, history: Version<FieldMetadata>[]) => (string | null)[]): VersionedData<FieldValue> {
		return super.getValues(revisionsFilter)
	}

	getMetadata(id: string, revisions: string[]): VersionedData<FieldMetadata> {
		return super.getMetadata(id, revisions)
	}
}
