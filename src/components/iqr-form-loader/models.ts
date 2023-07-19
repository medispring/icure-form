import { Contact, Form, Service } from '@icure/api'
import { FormValuesContainer } from './formValuesContainer'
// @ts-ignore
import { ActionManager } from './actionManager'

export type ServicesHistory = {
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
