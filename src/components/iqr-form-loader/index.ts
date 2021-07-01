import { Contact, Content, Form, Service } from '@icure/api'
import { groupBy, sortBy } from '../../utils/no-lodash'
import { fuzzyDate, isServiceContentEqual } from '../../utils/icure-utils'

type ServicesHistory = {
	[id: string]: ServiceWithContact[] //All services in a service history have the same id as id
}

export interface FormHierarchy {
	form: Form
	formValuesContainer: FormValuesContainer
	children: FormHierarchy[] //All services in a service history have the same id as id
}

export interface ServiceWithContact {
	service: Service
	contact: Contact
}

export const withLabel = (label: string) => (svc: Service) => svc.label === label
export const setServices = (ctc: Contact, newServices: Service[], modifiedServices: Service[]) =>
	new Contact({ ...ctc, services: newServices.concat(ctc.services?.map((s) => modifiedServices.find((r) => r.id === s.id) || s) || []) })

export class FormValuesContainer {
	currentContact: Contact //The contact of the day, used to record modifications
	contact: Contact //The displayed contact (may be in the past). === to currentContact if the contact is the contact of the day
	contactsHistory: Contact[] //Must be sorted (most recent first), does not include currentContent but must include contact (except if contact is currentContact)

	serviceFactory: (language: string, content: Content) => Service

	constructor(currentContact: Contact, contact: Contact, contactsHistory: Contact[], serviceFactory: (language: string, content: Content) => Service) {
		if (!contactsHistory.includes(contact)) {
			throw new Error('Illegal argument, the history must contain the contact')
		}
		if (contactsHistory.includes(currentContact)) {
			throw new Error('Illegal argument, the history must not contain the currentContact')
		}
		this.currentContact = currentContact
		this.contact = contact
		this.contactsHistory = sortBy(contactsHistory, 'created', 'desc')
		this.serviceFactory = serviceFactory
	}

	getVersions(selector: (svc: Service) => boolean): ServicesHistory {
		return groupBy(
			this.getServicesInHistory(selector).filter((swc) => +(fuzzyDate(swc.contact.created) || 0) <= +(fuzzyDate(this.contact.created) || 0)),
			(swc) => swc.service.id || '',
		)
	}

	setValue(serviceId: string, language: string, content: Content): FormValuesContainer {
		const swcs = this.getServicesInHistory((s) => s.id === serviceId)
		if (swcs.length) {
			const previousContent = swcs[0].service.content

			if (!previousContent || !isServiceContentEqual({ [language]: content }, previousContent)) {
				// Omit end of life
				// eslint-disable-next-line @typescript-eslint/no-unused-vars
				const { endOfLife, ...modifiedServiceValues } = {
					...swcs[0].service,
					content: { ...previousContent, [language]: content },
					modified: +new Date(),
				}
				return new FormValuesContainer(setServices(this.currentContact, [], [new Service(modifiedServiceValues)]), this.contact, this.contactsHistory, this.serviceFactory)
			} else {
				return this
			}
		} else {
			return new FormValuesContainer(setServices(this.currentContact, [this.serviceFactory(language, content)], []), this.contact, this.contactsHistory, this.serviceFactory)
		}
	}

	deleteValue(serviceId: string): FormValuesContainer {
		const swcs = this.getServicesInHistory((s) => s.id === serviceId)
		if (swcs.length) {
			//Omit end of life
			const now = +new Date()
			return new FormValuesContainer(
				setServices(
					this.currentContact,
					[],
					[
						new Service({
							...swcs[0].service,
							content: {},
							modified: now,
							endOfLife: now,
						}),
					],
				),
				this.contact,
				this.contactsHistory,
				this.serviceFactory,
			)
		} else {
			return this
		}
	}

	/** returns all services in history that match a selector
	 *
	 * @param selector a function used to select the services of interest, usually : withLabel("someLabel")
	 * @private
	 */
	private getServicesInHistory(selector: (svc: Service) => boolean): ServiceWithContact[] {
		return [this.currentContact].concat(this.contactsHistory).flatMap((ctc) => ctc.services?.filter(selector)?.map((s) => ({ service: s, contact: ctc })) || [])
	}
}
