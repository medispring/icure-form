import { Contact, Content, Form as ICureForm, Service } from '@icure/api'
import { sortedBy } from '../utils/no-lodash'
import { FormValuesContainer, FormValuesContainerMutation, ID, Version, VersionedData } from '../generic'
import { ServiceMetadata } from '../icure'
import { BooleanType, CompoundType, DateTimeType, FieldMetadata, FieldValue, MeasureType, NumberType, PrimitiveType, StringType, TimestampType } from '../components/model'
import { areCodesEqual, isContentEqual } from '../utils/icure-utils'
import { codeStubToCode } from '../utils/code-utils'

export class BridgedFormValuesContainer implements FormValuesContainer<FieldValue, FieldMetadata> {
	private contact: Contact
	private contactFormValuesContainer: ContactFormValuesContainer
	private _children: BridgedFormValuesContainer[] | undefined
	get children(): BridgedFormValuesContainer[] {
		return (
			this._children ??
			(this._children = this.contactFormValuesContainer
				.getChildren()
				.map((fvc) => new BridgedFormValuesContainer(this.responsible, fvc, this.interpreter, this.contact, this.dependentValues, this.changeListeners)))
		)
	}

	/**
	 * Creates an instance of BridgedFormValuesContainer.
	 * @param responsible
	 * @param contact The displayed contact (may be in the past). === to currentContact if the contact is the contact of the day
	 * @param contactFormValuesContainer
	 * @param interpreter
	 * @param dependentValues
	 * @param changeListeners
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
		private dependentValues: { metadate: FieldMetadata; formula: string }[] = [],
		changeListeners: ((newValue: BridgedFormValuesContainer) => void)[] = [],
	) {
		this.contactFormValuesContainer = contactFormValuesContainer
		this.contact = contact ?? contactFormValuesContainer.currentContact

		//Before start to broadcast changes, we need to fill in the contactFormValuesContainer with the dependent values
		this.dependentValues.forEach(({ metadate, formula }) => {
			const value = this.compute(formula) as FieldValue | undefined
			if (value !== undefined) {
				this.setValue(metadate.label, 'en', value, undefined, metadate)
			}
		})

		this.changeListeners = changeListeners
	}

	private changeListeners: ((newValue: BridgedFormValuesContainer) => void)[]

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

	private primitiveTypeToContent(language: string, value: PrimitiveType): Content {
		return {
			...(value.type === 'number' ? { numberValue: (value as NumberType).value } : {}),
			...(value.type === 'measure'
				? {
						measureValue: {
							value: (value as MeasureType).value,
							unit: (value as MeasureType).unit,
						},
				  }
				: {}),
			...(value.type === 'string' ? { stringValue: (value as StringType).value } : {}),
			...(value.type === 'datetime' ? { fuzzyDateValue: (value as DateTimeType).value } : {}),
			...(value.type === 'boolean' ? { booleanValue: (value as BooleanType).value } : {}),
			...(value.type === 'timestamp' ? { instantValue: (value as TimestampType).value } : {}),
			...(value.type === 'compound'
				? {
						compoundValue: Object.entries((value as CompoundType).value).map(([label, value]) => ({
							label,
							content: {
								[language]: this.primitiveTypeToContent(language, value),
							},
						})),
				  }
				: {}),
		}
	}

	contentToPrimitiveType(language: string, content: Content | undefined): PrimitiveType | undefined {
		if (!content) {
			return undefined
		}
		if (content.numberValue || content.numberValue === 0) {
			return { type: 'number', value: content.numberValue }
		}
		if (content.measureValue?.value || content.measureValue?.value === 0) {
			return { type: 'measure', value: content.measureValue?.value, unit: content.measureValue?.unit }
		}
		if (content.stringValue) {
			return { type: 'string', value: content.stringValue }
		}
		if (content.fuzzyDateValue) {
			return { type: 'datetime', value: content.fuzzyDateValue }
		}
		if (content.booleanValue) {
			return { type: 'boolean', value: content.booleanValue }
		}
		if (content.instantValue) {
			return { type: 'timestamp', value: content.instantValue }
		}
		if (content.compoundValue) {
			return {
				type: 'compound',
				value: content.compoundValue.reduce((acc: { [label: string]: PrimitiveType }, { label, content }) => {
					const primitiveValue = this.contentToPrimitiveType(language, content?.[language])
					return label && primitiveValue ? { ...acc, [label]: primitiveValue } : acc
				}, {}),
			}
		}

		return undefined
	}

	getValues(revisionsFilter: (id: string, history: Version<FieldMetadata>[]) => (string | null)[]): VersionedData<FieldValue> {
		return Object.entries(
			this.contactFormValuesContainer.getValues((id, history) => {
				return revisionsFilter(
					id,
					history
						.filter(({ modified }) => !this.contact.created || !modified || modified <= this.contact.created)
						.map(({ revision, modified, value: sm }) => ({
							revision,
							modified,
							value: {
								label: sm.label,
								owner: sm.owner,
								tags: sm.tags?.map(codeStubToCode),
								valueDate: sm.valueDate,
							},
						})),
				)
			}),
		).reduce((acc, [id, history]) => {
			return {
				...acc,
				[id]: history.map(({ revision, modified, value: s }) => ({
					revision,
					modified,
					value: {
						content: Object.entries(s.content ?? {}).reduce((acc, [lng, cnt]) => {
							const converted = this.contentToPrimitiveType(lng, cnt)
							return converted ? { ...acc, [lng]: converted } : acc
						}, {}),
						codes: s.codes?.map(codeStubToCode),
					},
				})),
			}
		}, {} as VersionedData<FieldValue>)
	}

	getMetadata(id: string, revisions: string[]): VersionedData<FieldMetadata> {
		return Object.entries(this.contactFormValuesContainer.getMetadata(id, revisions)).reduce(
			(acc, [id, history]) => ({
				...acc,
				[id]: history.map(({ revision, modified, value: s }) => ({
					revision,
					modified,
					value: {
						label: s.label,
						owner: s.owner,
						valueDate: s.valueDate,
						tags: s.tags,
					},
				})),
			}),
			{},
		)
	}

	private mutateAndNotify(newContactFormValuesContainer: ContactFormValuesContainer) {
		const newBridgedFormValueContainer = new BridgedFormValuesContainer(
			this.responsible,
			newContactFormValuesContainer,
			this.interpreter,
			this.contact === this.contactFormValuesContainer.currentContact ? newContactFormValuesContainer.currentContact : this.contact,
			this.dependentValues,
			this.changeListeners,
		)
		this.changeListeners.forEach((l) => l(newBridgedFormValueContainer))
		return newBridgedFormValueContainer
	}

	setValue(
		label: string,
		language: string,
		fv: FieldValue,
		id?: string,
		metadata?: FieldMetadata,
	): FormValuesContainerMutation<FieldValue, FieldMetadata, BridgedFormValuesContainer, ID> {
		const value = fv.content[language]
		const mutation = this.contactFormValuesContainer.setValue(
			label,
			language,
			{
				id: id,
				codes: fv.codes,
				content: {
					[language]: this.primitiveTypeToContent(language, value),
				},
			},
			id,
			metadata,
		)
		return { result: mutation.result, formValuesContainer: this.mutateAndNotify(mutation.formValuesContainer) }
	}

	setMetadata(label: string, meta: FieldMetadata, id?: string | undefined): FormValuesContainerMutation<FieldValue, FieldMetadata, BridgedFormValuesContainer, ID> {
		const mutation = this.contactFormValuesContainer.setMetadata(
			label,
			{
				label: meta.label,
				responsible: this.responsible,
				owner: meta.owner,
				valueDate: meta.valueDate,
				tags: meta.tags,
			},
			id,
		)
		return { result: mutation.result, formValuesContainer: this.mutateAndNotify(mutation.formValuesContainer) }
	}

	delete(serviceId: string): FormValuesContainerMutation<FieldValue, FieldMetadata, BridgedFormValuesContainer, void> {
		const mutation = this.contactFormValuesContainer.delete(serviceId)
		return { result: undefined, formValuesContainer: this.mutateAndNotify(mutation.formValuesContainer) }
	}

	private getVersionedValuesForKey(key: string | symbol) {
		return this.getValues((id, history) => (history?.[0]?.value?.label && key === history[0].value.label ? [history?.[0]?.revision] : []))
	}

	compute<T, S extends { [key: string | symbol]: unknown }>(formula: string, sandbox?: S): T | undefined {
		const native = { parseInt: parseInt, parseFloat: parseFloat, Date: Date, Math: Math, Number: Number, String: String, Boolean: Boolean, Array: Array, Object: Object }
		const proxy: S = new Proxy({} as S, {
			has: (target: S, key: string | symbol) => !!native[key] || key === 'self' || Object.keys(this.getVersionedValuesForKey(key) ?? {}).length > 0,
			get: (target: S, key: string | symbol) => {
				const nativeValue = native[key]
				if (!!nativeValue) {
					return nativeValue
				}
				return key === 'self' ? proxy : Object.values(this.getVersionedValuesForKey(key)).map((v) => v[0]?.value)
			},
		})
		return this.interpreter?.(formula, sandbox ?? proxy)
	}

	getChildren(): FormValuesContainer<FieldValue, FieldMetadata>[] {
		return this.contactFormValuesContainer.getChildren().map((fvc) => new BridgedFormValuesContainer(this.responsible, fvc, this.interpreter, this.contact))
	}

	async addChild(
		parentId: string,
		templateId: string,
		label: string,
	): Promise<FormValuesContainerMutation<FieldValue, FieldMetadata, BridgedFormValuesContainer, BridgedFormValuesContainer>> {
		const mutation = await this.contactFormValuesContainer.addChild(parentId, templateId, label)
		const newBridgedFormValueContainer = this.mutateAndNotify(mutation.formValuesContainer)
		const newChild = newBridgedFormValueContainer.children.find((c) => c.contactFormValuesContainer === mutation.result)
		if (!newChild) {
			throw new Error('Illegal state, the new child must be found')
		}
		return { result: newChild, formValuesContainer: newBridgedFormValueContainer }
	}

	async removeChild(container: BridgedFormValuesContainer): Promise<FormValuesContainerMutation<FieldValue, FieldMetadata, BridgedFormValuesContainer, void>> {
		const mutation = await this.contactFormValuesContainer.removeChild(container.contactFormValuesContainer)
		return { result: undefined, formValuesContainer: this.mutateAndNotify(mutation.formValuesContainer) }
	}
}

export class ContactFormValuesContainer implements FormValuesContainer<Service, ServiceMetadata> {
	rootForm: ICureForm
	currentContact: Contact //The contact of the moment, used to record new modifications
	contactsHistory: Contact[] //Must be sorted (most recent first), contains all the contacts linked to this form
	children: ContactFormValuesContainer[] //Direct children of the ContactFormValuesContainer
	serviceFactory: (label: string, serviceId?: string) => Service
	formFactory: (formTemplateId: string, label: string) => Promise<ICureForm>

	changeListeners: ((newValue: ContactFormValuesContainer) => void)[]

	constructor(
		rootForm: ICureForm,
		currentContact: Contact,
		contactsHistory: Contact[],
		serviceFactory: (label: string, serviceId?: string) => Service,
		children: ContactFormValuesContainer[],
		formFactory: (formTemplateId: string, label: string) => Promise<ICureForm>,
		changeListeners: ((newValue: ContactFormValuesContainer) => void)[] = [],
	) {
		if (contactsHistory.includes(currentContact)) {
			throw new Error('Illegal argument, the history must not contain the currentContact')
		}
		this.rootForm = rootForm
		this.currentContact = currentContact
		this.contactsHistory = sortedBy(contactsHistory, 'created', 'desc')
		this.children = children
		this.serviceFactory = serviceFactory
		this.formFactory = formFactory
		this.changeListeners = changeListeners
	}

	registerChildFormValuesContainer(childFVC: ContactFormValuesContainer) {
		childFVC.registerChangeListener((newValue) => {
			const newContactFormValuesContainer = new ContactFormValuesContainer(
				this.rootForm,
				this.currentContact,
				this.contactsHistory,
				this.serviceFactory,
				this.children.map((c) => (c === childFVC ? newValue : c)),
				this.formFactory,

				this.changeListeners,
			)
			this.changeListeners.forEach((l) => l(newContactFormValuesContainer))
		})
	}

	static async fromFormsHierarchy(
		rootForm: ICureForm,
		currentContact: Contact,
		contactsHistory: Contact[],
		serviceFactory: (label: string, serviceId?: string) => Service,
		formChildrenProvider: (parentId: string) => Promise<ICureForm[]>,
		formFactory: (formTemplateId: string, label: string) => Promise<ICureForm>,
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
								await ContactFormValuesContainer.fromFormsHierarchy(f, currentContact, contactsHistory, serviceFactory, formChildrenProvider, formFactory),
						),
				  )
				: [],
			formFactory,

			changeListeners,
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

	getMetadata(id: string, revisions: string[]): VersionedData<ServiceMetadata> {
		return [this.currentContact]
			.concat(this.contactsHistory)
			.filter((ctc) => ctc.rev && revisions.includes(ctc.rev))
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
													owner: s.author,
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

	setMetadata(label: string, meta: ServiceMetadata, id?: string): FormValuesContainerMutation<Service, ServiceMetadata, ContactFormValuesContainer, ID> {
		const service = (id && this.getServiceInCurrentContact(id)) || this.serviceFactory(label, id)
		if (!service.id) {
			throw new Error('Service id must be defined')
		}
		if (
			(meta.responsible && service.responsible !== meta.responsible) ||
			(meta.owner && service.author !== meta.owner) ||
			(meta.valueDate && service.valueDate !== meta.valueDate) ||
			(meta.codes && service.codes !== meta.codes) ||
			(meta.tags && service.tags !== meta.tags)
		) {
			const newService = new Service({ ...service, modified: Date.now() })
			meta.responsible && (newService.responsible = meta.responsible)
			meta.owner && (newService.author = meta.owner)
			meta.valueDate && (newService.valueDate = meta.valueDate)
			meta.codes && (newService.codes = meta.codes)
			meta.tags && (newService.tags = meta.tags)

			const newFormValuesContainer = new ContactFormValuesContainer(
				this.rootForm,
				{ ...this.currentContact, services: this.currentContact.services?.map((s) => (s.id === service.id ? newService : s)) },
				this.contactsHistory,
				this.serviceFactory,
				this.children,
				this.formFactory,

				this.changeListeners,
			)

			this.changeListeners.forEach((l) => l(newFormValuesContainer))
			return { result: service.id, formValuesContainer: newFormValuesContainer }
		}

		return { result: service.id, formValuesContainer: this }
	}

	setValue(
		label: string,
		language: string,
		value: Service,
		id?: string,
		metadata?: ServiceMetadata,
	): FormValuesContainerMutation<Service, ServiceMetadata, ContactFormValuesContainer, ID> {
		const service = (id && this.getServiceInCurrentContact(id)) || this.serviceFactory(label, id)
		if (!service.id) {
			throw new Error('Service id must be defined')
		}
		const newContent = value.content?.[language]
		const newCodes = value.codes ?? []
		if ((newContent && !isContentEqual(service.content?.[language], newContent)) || (newCodes && !areCodesEqual(newCodes, service.codes ?? []))) {
			const newService = new Service({ ...service, modified: Date.now() })
			const newContents = newContent ? { ...(service.content || {}), [language]: newContent } : { ...(service.content || {}) }
			if (!newContent) {
				delete newContents[language]
			}
			newService.content = newContents
			newService.codes = newCodes

			if (metadata) {
				newService.responsible = metadata.responsible ?? newService.responsible
				newService.author = metadata.owner ?? newService.author
				newService.valueDate = metadata.valueDate ?? newService.valueDate
				newService.tags = metadata.tags ?? newService.tags
				newService.label = metadata.label ?? newService.label
			}

			const newCurrentContact = {
				...this.currentContact,
				services: (this.currentContact.services ?? []).some((s) => s.id === service.id)
					? (this.currentContact.services ?? []).map((s) => (s.id === service.id ? newService : s))
					: [...(this.currentContact.services ?? []), newService],
			}
			const newFormValuesContainer = new ContactFormValuesContainer(
				this.rootForm,
				newCurrentContact,
				this.contactsHistory.map((c) => (c === this.currentContact ? newCurrentContact : c)),
				this.serviceFactory,
				this.children,
				this.formFactory,

				this.changeListeners,
			)

			this.changeListeners.forEach((l) => l(newFormValuesContainer))

			return { result: service.id!, formValuesContainer: newFormValuesContainer }
		}

		return { result: service.id, formValuesContainer: this }
	}

	delete(serviceId: string): FormValuesContainerMutation<Service, ServiceMetadata, ContactFormValuesContainer, void> {
		const service = this.getServiceInCurrentContact(serviceId)
		if (service) {
			const newFormValuesContainer = new ContactFormValuesContainer(
				this.rootForm,
				{ ...this.currentContact, services: this.currentContact.services?.map((s) => (s.id === serviceId ? new Service({ ...service, endOfLife: Date.now() }) : s)) },
				this.contactsHistory,
				this.serviceFactory,
				this.children,
				this.formFactory,

				this.changeListeners,
			)

			this.changeListeners.forEach((l) => l(newFormValuesContainer))
			return { result: undefined, formValuesContainer: newFormValuesContainer }
		}
		return { result: undefined, formValuesContainer: this }
	}

	compute<T, S extends { [key: string | symbol]: unknown }>(): T | undefined {
		throw new Error('Compute not supported at contact level')
	}

	/** returns all services in history that match a selector
	 *
	 * @private
	 * @param revisionsFilter
	 */
	private getServicesInHistory(revisionsFilter: (id: string, history: Version<ServiceMetadata>[]) => (string | null)[]): VersionedData<Service> {
		const indexedServices = [this.currentContact]
			.concat(this.contactsHistory)
			.reduce(
				(acc, ctc) =>
					ctc.services?.reduce(
						(acc, s) => (s.id ? { ...acc, [s.id]: (acc[s.id] ?? (acc[s.id] = [])).concat({ revision: ctc.rev ?? null, modified: ctc.created, value: s }) } : acc),
						acc,
					) ?? acc,
				{} as VersionedData<Service>,
			) //index services in history by id
		return Object.entries(indexedServices)
			.map(([id, history]) => {
				const keptRevisions = revisionsFilter(
					id,
					history.map(({ revision, modified, value: s }) => ({
						revision,
						modified,
						value: {
							label: s.label ?? s.id ?? '',
							owner: s.author,
							responsible: s.responsible,
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

	async addChild(
		parentId: string,
		templateId: string,
		label: string,
	): Promise<FormValuesContainerMutation<Service, ServiceMetadata, ContactFormValuesContainer, ContactFormValuesContainer>> {
		const newForm = await this.formFactory(templateId, label)
		const childFVC = new ContactFormValuesContainer(newForm, this.currentContact, this.contactsHistory, this.serviceFactory, [], this.formFactory)
		const newContactFormValuesContainer = new ContactFormValuesContainer(
			this.rootForm,
			this.currentContact,
			this.contactsHistory,
			this.serviceFactory,
			[...this.children, childFVC],
			this.formFactory,
		)
		newContactFormValuesContainer.registerChildFormValuesContainer(childFVC)
		this.changeListeners.forEach((l) => l(newContactFormValuesContainer))
		return { result: childFVC, formValuesContainer: newContactFormValuesContainer }
	}

	private getServiceInCurrentContact(id: string): Service {
		const service = (this.currentContact.services || [])?.find((s) => s.id === id)
		if (!service) {
			throw new Error('Service not found')
		}
		return service
	}

	async removeChild(container: ContactFormValuesContainer): Promise<FormValuesContainerMutation<Service, ServiceMetadata, ContactFormValuesContainer, void>> {
		const newContactFormValuesContainer = new ContactFormValuesContainer(
			this.rootForm,
			this.currentContact,
			this.contactsHistory,
			this.serviceFactory,
			this.children.filter((c) => c !== container),
			this.formFactory,
		)
		this.changeListeners.forEach((l) => l(newContactFormValuesContainer))
		return { result: undefined, formValuesContainer: newContactFormValuesContainer }
	}
}
