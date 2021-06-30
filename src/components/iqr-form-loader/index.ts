import { Contact, Content, Form, Service } from '@icure/api'

interface ServiceHistory {
	id: string
	services: Service[] //All services in a service history have the same id as id
}

interface FormHierarchy {
	form: Form
	children: Form[] //All services in a service history have the same id as id
}

export const LabelledField = (label: string) => (svc: Service) => svc.label === label
export const setServices = (ctc: Contact, svcs: Service[]) => new Contact({ ...ctc, services: ctc.services?.map((s) => svcs.find((r) => r.id === s.id) || s) })
export class FormValuesContainer {
	currentContact: Contact
	contactsHistory: Contact[]
	formHierarchy: FormHierarchy

	constructor(currentContact: Contact, contactsHistory: Contact[], formHierarchy: FormHierarchy) {
		this.currentContact = currentContact
		this.contactsHistory = contactsHistory
		this.formHierarchy = formHierarchy
	}

	getVersions(selector: (svc: Service) => boolean): ServiceHistory[] {
		return []
	}

	setValue(selector: (svc: Service) => boolean, language: string, content: Content): FormValuesContainer {
		return new FormValuesContainer(
			setServices(this.currentContact, this.currentContact.services?.filter(selector)?.map((s) => new Service({ ...s, content: { ...s.content, [language]: content } })) || []),
			this.contactsHistory,
			this.formHierarchy,
		)
	}
}
