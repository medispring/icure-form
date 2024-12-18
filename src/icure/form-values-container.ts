import { Contact, Form, Form as ICureForm, Service } from '@icure/api'
import { sortedBy } from '../utils/no-lodash'
import { FormValuesContainer, Version, VersionedData } from '../generic'
import { ServiceMetadata } from './model'
import { FieldMetadata, FieldValue, PrimitiveType, Validator } from '../components/model'
import { areCodesEqual, codeStubToCode, contentToPrimitiveType, isContentEqual, primitiveTypeToContent } from './icure-utils'
import { parsePrimitive } from '../utils/primitive'
import { anyDateToDate } from '../utils/dates'
import { v4 as uuidv4 } from 'uuid'
import { normalizeCodes } from '../utils/code-utils'

function notify<Value, Metadata>(l: (fvc: FormValuesContainer<Value, Metadata>) => void, fvc: FormValuesContainer<Value, Metadata>) {
	//console.log('Notifying', l, fvc.toString())
	l(fvc)
}

/** This class is a bridge between the ICure API and the generic FormValuesContainer interface.
 * It wraps around a ContactFormValuesContainer and provides a series of services:
 * - It computes dependent values when the form is created
 * - It broadcasts changes from the wrapped ContactFormValuesContainer to its listeners
 * - It provides a way to compute formulas in a sandboxed environment
 * - It bridges the setValues and setMetadata methods with the wrapped ContactFormValuesContainer by
 * 		- converting the FieldValue to a Service
 * 		- converting the FieldMetadata to a ServiceMetadata
 * - It bridges the getValues and getMetadata methods with the wrapped ContactFormValuesContainer by
 * 		- converting the Service to a FieldValue
 * 		- converting the ServiceMetadata to a FieldMetadata
 * - It lazily creates bridges the children by
 *    - lazily creating BridgedFormValuesContainer when the children of the wrapped ContactFormValuesContainer are accessed
 *    - creating a new ContactFormValuesContainer and wrapping it in a BridgedFormValuesContainer when a child is added
 *
 * The icure-form typically accepts a BridgedFormValuesContainer as a prop and uses it to interact with the form.
 *
 * This class is fairly generic and can be used as an inspiration or subclassed for other bridges
 */
export class BridgedFormValuesContainer implements FormValuesContainer<FieldValue, FieldMetadata> {
	private contact: Contact
	private contactFormValuesContainer: ContactFormValuesContainer
	private _id: string = uuidv4()
	private mutateAndNotify: (newContactFormValuesContainer: ContactFormValuesContainer) => BridgedFormValuesContainer

	toString(): string {
		return `Bridged(${this.contactFormValuesContainer.rootForm.formTemplateId}[${this.contactFormValuesContainer.rootForm.id}]) - ${this._id}`
	}

	/**
	 * Creates an instance of BridgedFormValuesContainer.
	 * @param responsible The id of the data owner responsible for the creation of the values
	 * @param contact The displayed contact (may be in the past). === to currentContact if the contact is the contact of the day
	 * @param contactFormValuesContainer The wrapped ContactFormValuesContainer
	 * @param interpreter A function that can interpret formulas
	 * @param dependentValuesProvider A function that provides the dependent values (computed on the basis of other values) for a given anchorId and templateId
	 * @param validatorsProvider A function that provides the validators for a given anchorId and templateId
	 * @param language The language in which the values are displayed
	 * @param changeListeners The listeners that will be notified when the values change
	 * @param initialValuesProvider A lambda that provides the initial values of the form
	 */
	constructor(
		private responsible: string,
		contactFormValuesContainer: ContactFormValuesContainer,
		private interpreter?: <
			T,
			S extends {
				[key: string | symbol]: unknown
			},
		>(
			formula: string,
			sandbox: S,
		) => T | undefined,
		contact?: Contact,
		private initialValuesProvider: (
			anchorId?: string,
			templateId?: string,
		) => {
			metadata: FieldMetadata
			revisionsFilter: (id: string, history: Version<FieldMetadata>[]) => (string | null)[]
			formula: string
		}[] = () => [],
		private dependentValuesProvider: (
			anchorId: string | undefined,
			templateId: string | undefined,
		) => {
			metadata: FieldMetadata
			revisionsFilter: (id: string, history: Version<FieldMetadata>[]) => (string | null)[]
			formula: string
		}[] = () => [],
		private validatorsProvider: (
			anchorId: string | undefined,
			templateId: string,
		) => {
			metadata: FieldMetadata
			validators: Validator[]
		}[] = () => [],
		private language = 'en',
		private changeListeners: ((newValue: BridgedFormValuesContainer) => void)[] = [],
	) {
		console.log(`Creating bridge FVC (${contactFormValuesContainer.rootForm.formTemplateId}) with ${contactFormValuesContainer.children.length} children [${this._id}]`)
		//Before start to broadcast changes, we need to fill in the contactFormValuesContainer with the dependent values
		this.contactFormValuesContainer = contactFormValuesContainer
		this.mutateAndNotify = (newContactFormValuesContainer: ContactFormValuesContainer) => {
			newContactFormValuesContainer.unregisterChangeListener(this.mutateAndNotify)
			const newBridgedFormValueContainer = new BridgedFormValuesContainer(
				this.responsible,
				newContactFormValuesContainer,
				this.interpreter,
				this.contact === this.contactFormValuesContainer.currentContact ? newContactFormValuesContainer.currentContact : this.contact,
				this.initialValuesProvider,
				this.dependentValuesProvider,
				this.validatorsProvider,
				this.language,
				this.changeListeners,
			)
			this.changeListeners.forEach((l) => notify(l, newBridgedFormValueContainer))
			return newBridgedFormValueContainer
		}
		this.contactFormValuesContainer.registerChangeListener(this.mutateAndNotify)
		this.contact = contact ?? contactFormValuesContainer.currentContact
		if (this.contactFormValuesContainer.mustBeInitialised()) {
			this.computeInitialValues()
		}
		this.computeDependentValues()
	}

	getLabel(): string {
		return this.contactFormValuesContainer.getLabel()
	}

	getFormId(): string | undefined {
		return this.contactFormValuesContainer.getFormId()
	}

	getContactFormValuesContainer() {
		return this.contactFormValuesContainer
	}

	registerChangeListener(listener: (newValue: BridgedFormValuesContainer) => void): void {
		this.changeListeners.push(listener)
	}

	unregisterChangeListener(listener: (newValue: BridgedFormValuesContainer) => void): void {
		this.changeListeners = this.changeListeners.filter((l) => l !== listener)
	}

	getValues(revisionsFilter: (id: string, history: Version<FieldMetadata>[]) => (string | null)[]): VersionedData<FieldValue> {
		return Object.entries(
			this.contactFormValuesContainer.getValues((id, history) =>
				revisionsFilter(
					id,
					history
						.filter(({ modified }) => !this.contact.created || !modified || modified <= this.contact.created)
						.map(({ revision, modified, value: sm }) => ({
							revision,
							modified,
							value: {
								label: sm.label,
								owner: sm.responsible,
								tags: sm.tags?.map(codeStubToCode),
								valueDate: sm.valueDate,
							},
						})),
				),
			),
		).reduce((acc, [id, history]) => {
			return {
				...acc,
				[id]: history.map(({ revision, modified, value: s }) => ({
					revision,
					modified,
					value: {
						content: Object.entries(s.content ?? {}).reduce((acc, [lng, cnt]) => {
							const converted = contentToPrimitiveType(lng, cnt)
							return converted ? { ...acc, [lng]: converted } : acc
						}, {}),
						codes: s.codes?.map(codeStubToCode),
					},
				})),
			}
		}, {} as VersionedData<FieldValue>)
	}

	getMetadata(id: string, revisions: (string | null)[]): VersionedData<FieldMetadata> {
		return Object.entries(this.contactFormValuesContainer.getMetadata(id, revisions)).reduce(
			(acc, [id, history]) => ({
				...acc,
				[id]: history.map(({ revision, modified, value: s }) => ({
					revision,
					modified,
					value: {
						label: s.label,
						owner: s.responsible,
						valueDate: s.valueDate,
						tags: s.tags,
						discordantMetadata: () => ({
							...(s.responsible !== this.responsible ? { owner: this.responsible } : {}),
							...(Math.abs(+(anyDateToDate(s.valueDate) ?? 0) - +(anyDateToDate(this.contact.created) ?? 0)) > 24 * 3600000 ? { valueDate: s.valueDate } : {}),
						}),
					},
				})),
			}),
			{},
		)
	}

	//This method mutates the BridgedFormValuesContainer but can only be called from the constructor
	private computeInitialValues() {
		if (this.contactFormValuesContainer.rootForm.formTemplateId) {
			this.initialValuesProvider(this.contactFormValuesContainer.rootForm.descr, this.contactFormValuesContainer.rootForm.formTemplateId).forEach(({ metadata, revisionsFilter, formula }) => {
				try {
					const currentValue = this.getValues(revisionsFilter)
					if (!currentValue || !Object.keys(currentValue).length) {
						const newValue = this.compute(formula) as FieldValue | undefined
						if (newValue !== undefined) {
							const lng = this.language ?? 'en'
							if (newValue && !newValue.content[lng] && newValue.content['*']) {
								newValue.content[lng] = newValue.content['*']
							}
							if (newValue) {
								delete newValue.content['*']
							}
							setValueOnContactFormValuesContainer(this.contactFormValuesContainer, metadata.label, lng, newValue, undefined, metadata, (fvc: ContactFormValuesContainer) => {
								const currentContact = this.contactFormValuesContainer.currentContact
								this.contactFormValuesContainer = fvc
								if (this.contact === currentContact) {
									this.contact = fvc.currentContact
								}
							})
						}
					}
				} catch (e) {
					console.log(`Error while computing formula : ${formula}`, e)
				}
			})
		}
	}

	//This method mutates the BridgedFormValuesContainer but can only be called from the constructor
	private computeDependentValues() {
		if (this.contactFormValuesContainer.rootForm.formTemplateId) {
			this.dependentValuesProvider(this.contactFormValuesContainer.rootForm.descr, this.contactFormValuesContainer.rootForm.formTemplateId).forEach(({ metadata, revisionsFilter, formula }) => {
				try {
					const currentValue = this.getValues(revisionsFilter)
					const newValue = this.compute(formula) as FieldValue | undefined
					if (newValue !== undefined || currentValue != undefined) {
						const lng = this.language ?? 'en'
						if (newValue && !newValue.content[lng] && newValue.content['*']) {
							newValue.content[lng] = newValue.content['*']
						}
						if (newValue) {
							delete newValue.content['*']
						}
						const interceptor = (fvc: ContactFormValuesContainer) => {
							const currentContact = this.contactFormValuesContainer.currentContact
							this.contactFormValuesContainer = fvc
							if (this.contact === currentContact) {
								this.contact = fvc.currentContact
							}
						}
						setValueOnContactFormValuesContainer(this.contactFormValuesContainer, metadata.label, lng, newValue, Object.keys(currentValue ?? {})[0], metadata, interceptor)
					}
				} catch (e) {
					console.log(`Error while computing formula : ${formula}`, e)
				}
			})
		}
	}

	setValue(label: string, language: string, fv?: FieldValue, id?: string, metadata?: FieldMetadata): void {
		setValueOnContactFormValuesContainer(this.contactFormValuesContainer, label, language, fv, id, metadata)
	}

	setMetadata(meta: FieldMetadata, id?: string | undefined): void {
		this.contactFormValuesContainer.setMetadata(
			{
				label: meta.label,
				responsible: meta.owner,
				valueDate: meta.valueDate,
				tags: meta.tags,
			},
			id,
		)
	}

	delete(serviceId: string): void {
		this.contactFormValuesContainer.delete(serviceId)
	}

	private getVersionedValuesForKey(key: string | symbol) {
		return this.getValues((id, history) => (history?.[0]?.value?.label && key === history[0].value.label ? [history?.[0]?.revision] : []))
	}

	compute<T, S extends { [key: string | symbol]: unknown }>(formula: string, sandbox?: S): T | undefined {
		// noinspection JSUnusedGlobalSymbols
		const parseContent = (content?: { [key: string]: PrimitiveType }) => {
			if (!content) {
				return undefined
			}
			const primitive = content[this.language] ?? content['*'] ?? content[Object.keys(content)[0]]
			return primitive && parsePrimitive(primitive)
		}
		const log = console.log
		const native = {
			parseInt: parseInt,
			parseFloat: parseFloat,
			Date: Date,
			Math: Math,
			Number: Number,
			String: String,
			Boolean: Boolean,
			Array: Array,
			Object: Object,
			parseContent,
			validate: {
				notBlank: (self: any, label: string) => {
					const value = parseContent((self[label as any] as any)?.[0]?.content)
					return !!(value as any)?.trim()?.length
				},
			},
			log,
		} as { [key: string]: any }
		const proxy: S = new Proxy({} as S, {
			has: (target: S, key: string | symbol) => !!native[key as string] || key === 'self' || Object.keys(this.getVersionedValuesForKey(key) ?? {}).length > 0,
			get: (target: S, key: string | symbol) => {
				if (key === 'undefined') {
					return undefined
				}
				const nativeValue = native[key as string]
				if (!!nativeValue) {
					return nativeValue
				}
				return key === 'self' ? proxy : Object.values(this.getVersionedValuesForKey(key)).map((v) => v[0]?.value)
			},
		})
		return this.interpreter?.(formula, sandbox ?? proxy)
	}

	getChildren(): FormValuesContainer<FieldValue, FieldMetadata>[] {
		const children = this.contactFormValuesContainer
			.getChildren()
			.map(
				(fvc) =>
					new BridgedFormValuesContainer(this.responsible, fvc, this.interpreter, this.contact, this.initialValuesProvider, this.dependentValuesProvider, this.validatorsProvider, this.language, []),
			)
		console.log(`${children.length} children found in ${this.contactFormValuesContainer.rootForm.formTemplateId} initialised with `, this.initialValuesProvider)
		return children
	}

	getValidationErrors(): [FieldMetadata, string][] {
		if (this.contactFormValuesContainer.rootForm.formTemplateId) {
			return this.validatorsProvider(this.contactFormValuesContainer.rootForm.descr, this.contactFormValuesContainer.rootForm.formTemplateId).flatMap(
				({ metadata, validators }) =>
					validators
						.map(({ validation, message }) => {
							try {
								return this.compute(validation) ? undefined : [metadata, message]
							} catch (e) {
								console.log(`Error while computing validation : ${validation}`, e)
								return undefined
							}
						})
						.filter((x) => !!x) as [FieldMetadata, string][],
			)
		} else {
			return []
		}
	}

	async addChild(anchorId: string, templateId: string, label: string): Promise<void> {
		await this.contactFormValuesContainer.addChild(anchorId, templateId, label)
	}

	async removeChild(container: BridgedFormValuesContainer): Promise<void> {
		await this.contactFormValuesContainer.removeChild(container.contactFormValuesContainer)
	}

	synchronise() {
		this.contactFormValuesContainer.synchronise()
		return this
	}
}

/**
 * This class is a form values container that uses a hierarchy of forms as a data source. The actual values are extracted from the services of the contacts.
 * The `currentContact` is the contact that has been selected by the user, any later contact should be ignored.
 * The `contactsHistory` is used to provide the full history of the services.
 * The hierarchy of ContactFormValuesContainer has to be maintained by the manager of the instances of this class (typically the BridgedFormValuesContainer).
 * Each ContactFormValuesContainer has a reference to its `rootForm`.
 * The `serviceFactory` and `formFactory` are used to create new services and add sub-forms.
 */
export class ContactFormValuesContainer implements FormValuesContainer<Service, ServiceMetadata> {
	rootForm: ICureForm
	currentContact: Contact //The contact of the moment, used to record new modifications
	contactsHistory: Contact[] //Must be sorted (most recent first), contains all the contacts linked to this form
	children: ContactFormValuesContainer[] //Direct children of the ContactFormValuesContainer
	serviceFactory: (label: string, serviceId?: string) => Service
	formFactory: (parentId: string, anchorId: string, formTemplateId: string, label: string) => Promise<ICureForm>
	formRecycler: (formId: string) => Promise<void>

	changeListeners: ((newValue: ContactFormValuesContainer) => void)[]
	private _id: string = uuidv4()
	private _initialised = false

	toString(): string {
		return `Contact(${this.rootForm.formTemplateId}[${this.rootForm.id}]) - ${this._id}`
	}

	mustBeInitialised() {
		return !this._initialised
	}

	/**
	 * Returns a contact that combines the content of the contact in this form with the content of all contents stored in the children
	 */
	coordinatedContact(): Contact {
		const childrenContacts = this.children.map((c) => c.coordinatedContact())
		const thisKeptServiceIds = (this.currentContact.subContacts ?? []).filter((sc) => sc.formId === this.rootForm.id).flatMap((sc) => (sc.services ?? []).map((s) => s.serviceId))
		return {
			...this.currentContact,
			services: childrenContacts.reduce((acc: Service[], c: Contact) => acc.concat(c.services ?? []), []).concat((this.currentContact.services ?? []).filter((s) => thisKeptServiceIds.includes(s.id))),
			subContacts: childrenContacts
				.reduce((acc: Service[], c: Contact) => acc.concat(c.subContacts ?? []), [])
				.concat((this.currentContact.subContacts ?? []).filter((s) => s.formId === this.rootForm.id)),
		}
	}

	/**
	 * Returns a contact that combines the content of the contact in this form with the content of all contents stored in the children
	 */
	allForms(): Form[] {
		return [this.rootForm].concat(this.children.flatMap((c) => c.allForms()))
	}

	constructor(
		rootForm: ICureForm,
		currentContact: Contact,
		contactsHistory: Contact[],
		serviceFactory: (label: string, serviceId?: string) => Service,
		children: ContactFormValuesContainer[],
		formFactory: (parentId: string, anchorId: string, formTemplateId: string, label: string) => Promise<ICureForm>,
		formRecycler: (formId: string) => Promise<void>,
		changeListeners: ((newValue: ContactFormValuesContainer) => void)[] = [],
		initialised = true,
	) {
		console.log(`Creating contact FVC (${rootForm.formTemplateId}) with ${children.length} children [${this._id}]`)

		if (contactsHistory.includes(currentContact)) {
			throw new Error('Illegal argument, the history must not contain the currentContact')
		}
		this.rootForm = rootForm
		this.currentContact = currentContact
		this.contactsHistory = sortedBy(contactsHistory, 'created', 'desc')
		this.children = children
		this.serviceFactory = serviceFactory
		this.formFactory = formFactory
		this.formRecycler = formRecycler
		this.changeListeners = changeListeners
		this._initialised = initialised

		this.synchronise()
	}

	synchronise() {
		this.children.forEach((childFVC) => {
			this.registerChildFormValuesContainer(childFVC.synchronise())
		})
		return this
	}

	//Make sure that when a child is changed, a new version of this is created with the updated child
	registerChildFormValuesContainer(childFormValueContainer: ContactFormValuesContainer) {
		childFormValueContainer.changeListeners = [
			(newValue) => {
				console.log(`Child ${newValue._id} ${childFormValueContainer.rootForm.formTemplateId} changed, updating parent ${this._id} ${this.rootForm.formTemplateId}`)
				const newContactFormValuesContainer = new ContactFormValuesContainer(
					this.rootForm,
					this.currentContact,
					this.contactsHistory,
					this.serviceFactory,
					this.children.map((c) => {
						return c.rootForm.id === childFormValueContainer.rootForm.id ? newValue : c
					}),
					this.formFactory,
					this.formRecycler,
				)
				this.changeListeners.forEach((l) => notify(l, newContactFormValuesContainer))
			},
		]
	}

	static async fromFormsHierarchy(
		rootForm: ICureForm,
		currentContact: Contact,
		contactsHistory: Contact[],
		serviceFactory: (label: string, serviceId?: string) => Service,
		formChildrenProvider: (parentId: string | undefined) => Promise<ICureForm[]>,
		formFactory: (parentId: string, anchorId: string, formTemplateId: string, label: string) => Promise<ICureForm>,
		formRecycler: (formId: string) => Promise<void>,
		changeListeners: ((newValue: ContactFormValuesContainer) => void)[] = [],
	): Promise<ContactFormValuesContainer> {
		const contactFormValuesContainer = new ContactFormValuesContainer(
			rootForm,
			currentContact,
			contactsHistory,
			serviceFactory,
			rootForm.id
				? await Promise.all(
						(
							await formChildrenProvider(rootForm.id)
						).map(
							async (f) =>
								// eslint-disable-next-line max-len
								await ContactFormValuesContainer.fromFormsHierarchy(f, currentContact, contactsHistory, serviceFactory, formChildrenProvider, formFactory, formRecycler),
						),
				  )
				: [],
			formFactory,
			formRecycler,
			changeListeners,
			false,
		)
		contactFormValuesContainer.children.forEach((childFVC) => contactFormValuesContainer.registerChildFormValuesContainer(childFVC))

		return contactFormValuesContainer
	}

	getLabel(): string {
		return this.rootForm.descr ?? ''
	}

	getFormId(): string | undefined {
		return this.rootForm?.formTemplateId
	}

	registerChangeListener(listener: (newValue: ContactFormValuesContainer) => void): void {
		this.changeListeners.push(listener)
	}

	unregisterChangeListener(listener: (newValue: ContactFormValuesContainer) => void): void {
		this.changeListeners = this.changeListeners.filter((l) => l !== listener)
	}

	getChildren(): ContactFormValuesContainer[] {
		return this.children
	}

	getValidationErrors(): [FieldMetadata, string][] {
		throw new Error('Validation not supported at contact level')
	}

	getValues(revisionsFilter: (id: string, history: Version<ServiceMetadata>[]) => (string | null)[]): VersionedData<Service> {
		return Object.entries(this.getServicesInHistory(revisionsFilter)).reduce(
			(acc, [id, history]) =>
				history.length
					? {
							...acc,
							[id]: [...history].sort((a, b) => (b?.modified || +new Date()) - (a?.modified || +new Date())),
					  }
					: acc,
			{},
		)
	}

	getMetadata(id: string, revisions: (string | null)[]): VersionedData<ServiceMetadata> {
		return [this.currentContact]
			.concat(this.contactsHistory)
			.filter((ctc) => ctc.rev !== undefined && revisions.includes(ctc.rev))
			.reduce(
				(acc, ctc) =>
					(ctc.services ?? [])
						.filter((s) => s.id === id)
						.reduce(
							(acc, s) =>
								s.id
									? {
											...acc,
											[s.id]: (acc[s.id] ?? (acc[s.id] = [])).concat({
												revision: ctc.rev ?? null,
												modified: s.modified,
												value: {
													label: s.label ?? s.id,
													responsible: s.responsible,
													valueDate: s.valueDate,
													tags: s.tags,
												},
											}),
									  }
									: acc,
							acc,
						) ?? acc,
				{} as { [id: string]: Version<ServiceMetadata>[] },
			) //index services in history by id
	}

	setMetadata(meta: ServiceMetadata, id?: string): void {
		const service = (id && this.getServiceInCurrentContact(id)) || this.serviceFactory(meta.label, id)
		if (!service.id) {
			throw new Error('Service id must be defined')
		}
		if (
			(meta.responsible && service.responsible !== meta.responsible) ||
			(meta.valueDate && service.valueDate !== meta.valueDate) ||
			(meta.codes && service.codes !== meta.codes) ||
			(meta.tags && service.tags !== meta.tags)
		) {
			const newService = new Service({ ...service, modified: Date.now() })
			meta.responsible && (newService.responsible = meta.responsible)
			meta.valueDate && (newService.valueDate = meta.valueDate)
			meta.codes && (newService.codes = normalizeCodes(meta.codes))
			meta.tags && (newService.tags = normalizeCodes(meta.tags))

			const newFormValuesContainer = new ContactFormValuesContainer(
				this.rootForm,
				{
					...this.currentContact,
					services: this.currentContact.services?.map((s) => (s.id === service.id ? newService : s)),
				},
				this.contactsHistory,
				this.serviceFactory,
				this.children,
				this.formFactory,
				this.formRecycler,
				this.changeListeners,
			)

			this.changeListeners.forEach((l) => notify(l, newFormValuesContainer))
		}
	}

	setValue(label: string, language: string, value?: Service, id?: string, metadata?: ServiceMetadata, changeListenersOverrider?: (fvc: ContactFormValuesContainer) => void): void {
		const service = (id && this.getServicesInHistory((sid: string, history) => (sid === id ? history.map((x) => x.revision) : []))[id]?.[0]?.value) || this.serviceFactory(label, id)
		if (!service.id) {
			throw new Error('Service id must be defined')
		}
		console.log('Setting value of service', service.id, 'with', value, 'and metadata', metadata)
		const newContent = value?.content?.[language]
		const newCodes = value?.codes ? normalizeCodes(value.codes) : []
		if (!isContentEqual(service.content?.[language], newContent) || (newCodes && !areCodesEqual(newCodes, service.codes ?? []))) {
			const newService = new Service({ ...service, modified: Date.now() })
			const newContents = newContent
				? {
						...(service.content || {}),
						[language]: newContent,
				  }
				: { ...(service.content || {}) }
			if (!newContent) {
				delete newContents[language]
			}

			let newCurrentContact: Contact
			if (!Object.entries(newContents).filter(([, cnt]) => cnt !== undefined).length) {
				newCurrentContact = {
					...this.currentContact,
					subContacts: (this.currentContact.subContacts ?? []).some((sc) => sc.formId === this.rootForm.id)
						? (this.currentContact.subContacts ?? []).map((sc) => {
								if (sc.formId === this.rootForm.id) {
									return { ...sc, services: (sc.services ?? []).filter((s) => s.serviceId !== service.id).concat([{ serviceId: service.id }]) }
								} else {
									return sc
								}
						  })
						: (this.currentContact.subContacts ?? []).concat({ formId: this.rootForm.id, services: [{ serviceId: service.id }] }),
					services: (this.currentContact.services ?? []).some((s) => s.id === service.id)
						? (this.currentContact.services ?? []).filter((s) => s.id !== service.id)
						: [...(this.currentContact.services ?? [])],
				}
			} else {
				newService.content = newContents
				newService.codes = newCodes

				if (metadata) {
					newService.responsible = metadata.responsible ?? newService.responsible
					newService.valueDate = metadata.valueDate ?? newService.valueDate
					newService.tags = metadata.tags ? normalizeCodes(metadata.tags) : newService.tags
					newService.label = metadata.label ?? newService.label
				}

				newCurrentContact = {
					...this.currentContact,
					subContacts: (this.currentContact.subContacts ?? []).some((sc) => sc.formId === this.rootForm.id)
						? (this.currentContact.subContacts ?? []).map((sc) => {
								if (sc.formId === this.rootForm.id) {
									return { ...sc, services: (sc.services ?? []).filter((s) => s.serviceId !== service.id).concat([{ serviceId: service.id }]) }
								} else {
									return sc
								}
						  })
						: (this.currentContact.subContacts ?? []).concat({ formId: this.rootForm.id, services: [{ serviceId: service.id }] }),
					services: (this.currentContact.services ?? []).some((s) => s.id === service.id)
						? (this.currentContact.services ?? []).map((s) => (s.id === service.id ? newService : s))
						: [...(this.currentContact.services ?? []), newService],
				}
			}
			const newFormValuesContainer = new ContactFormValuesContainer(
				this.rootForm,
				newCurrentContact,
				this.contactsHistory.map((c) => (c === this.currentContact ? newCurrentContact : c)),
				this.serviceFactory,
				this.children,
				this.formFactory,
				this.formRecycler,
				this.changeListeners,
			)

			changeListenersOverrider ? changeListenersOverrider(newFormValuesContainer) : this.changeListeners.forEach((l) => notify(l, newFormValuesContainer))
		}
	}

	delete(serviceId: string): void {
		const service = this.getServiceInCurrentContact(serviceId)
		if (service) {
			const newFormValuesContainer = new ContactFormValuesContainer(
				this.rootForm,
				{
					...this.currentContact,
					services: this.currentContact.services?.map((s) =>
						s.id === serviceId
							? new Service({
									...service,
									endOfLife: Date.now(),
							  })
							: s,
					),
				},
				this.contactsHistory,
				this.serviceFactory,
				this.children,
				this.formFactory,
				this.formRecycler,
				this.changeListeners,
			)

			this.changeListeners.forEach((l) => notify(l, newFormValuesContainer))
		}
	}

	compute<T>(): T | undefined {
		throw new Error('Compute not supported at contact level')
	}

	/** returns all services in history that match a selector
	 *
	 * @private
	 * @param revisionsFilter
	 */
	private getServicesInHistory(revisionsFilter: (id: string, history: Version<ServiceMetadata>[]) => (string | null)[]): VersionedData<Service> {
		const indexedServices = [this.currentContact].concat(this.contactsHistory).reduce((acc, ctc) => {
			const services =
				ctc.services
					?.filter((s) => ctc.subContacts?.some((sc) => sc.formId === this.rootForm.id && sc.services?.some((sss) => sss.serviceId === s.id)))
					?.reduce(
						(acc, s) =>
							s.id
								? {
										...acc,
										[s.id]: (acc[s.id] ?? (acc[s.id] = [])).concat({
											revision: ctc.rev ?? null,
											modified: ctc.created,
											value: s,
										}),
								  }
								: acc,
						acc,
					) ?? acc
			return services
		}, {} as VersionedData<Service>) //index services in history by id
		return Object.entries(indexedServices)
			.map(([id, history]) => {
				const keptRevisions = revisionsFilter(
					id,
					history.map(({ revision, modified, value: s }) => ({
						revision,
						modified,
						value: {
							label: s.label ?? s.id ?? '',
							owner: s.responsible,
							valueDate: s.valueDate,
							codes: s.codes,
							tags: s.tags,
						},
					})),
				)
				return [id, history.filter(({ revision }) => keptRevisions.includes(revision))] as [string, Version<Service>[]]
			})
			.reduce((acc, [id, history]) => ({ ...acc, [id]: history }), {})
	}

	async addChild(anchorId: string, templateId: string, label: string): Promise<void> {
		const parentId = this.rootForm.id
		if (!parentId) return

		const newForm = await this.formFactory(parentId, anchorId, templateId, label)
		const childFVC = new ContactFormValuesContainer(newForm, this.currentContact, this.contactsHistory, this.serviceFactory, [], this.formFactory, this.formRecycler, [], false)

		const newContactFormValuesContainer = new ContactFormValuesContainer(
			this.rootForm,
			this.currentContact,
			this.contactsHistory,
			this.serviceFactory,
			[...this.children, childFVC],
			this.formFactory,
			this.formRecycler,
			this.changeListeners,
		)
		newContactFormValuesContainer.registerChildFormValuesContainer(childFVC)
		this.changeListeners.forEach((l) => notify(l, newContactFormValuesContainer))
	}

	private getServiceInCurrentContact(id: string): Service | undefined {
		const service = (this.currentContact.services || [])?.find((s) => s.id === id)
		return service ?? undefined
	}

	async removeChild(container: ContactFormValuesContainer): Promise<void> {
		const newContactFormValuesContainer = new ContactFormValuesContainer(
			this.rootForm,
			this.currentContact,
			this.contactsHistory,
			this.serviceFactory,
			this.children.filter((c) => c.rootForm.id !== container.rootForm.id),
			this.formFactory,
			this.formRecycler,
			this.changeListeners,
		)
		this.changeListeners.forEach((l) => notify(l, newContactFormValuesContainer))
	}
}

const setValueOnContactFormValuesContainer = (
	cfvc: ContactFormValuesContainer,
	label: string,
	language: string,
	fv?: FieldValue,
	id?: string,
	metadata?: FieldMetadata,
	changeListenersOverrider?: (fvc: ContactFormValuesContainer) => void,
) => {
	const value = fv?.content[language]
	cfvc.setValue(
		label,
		language,
		{
			id: id,
			codes: fv?.codes ?? [],
			content: value
				? {
						[language]: primitiveTypeToContent(language, value),
				  }
				: undefined,
		},
		id,
		metadata
			? {
					label: metadata?.label ?? label,
					responsible: metadata?.owner,
					valueDate: metadata?.valueDate,
					tags: metadata?.tags,
			  }
			: undefined,
		changeListenersOverrider,
	)
}
