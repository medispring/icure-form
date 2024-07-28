import { Contact, Form as ICureForm, Service } from '@icure/api'
import { sortedBy } from '../utils/no-lodash'
import { FormValuesContainer, FormValuesContainerMutation, ID, Version, VersionedData } from '../generic'
import { ServiceMetadata } from './model'
import { FieldMetadata, FieldValue, PrimitiveType, Validator } from '../components/model'
import { areCodesEqual, codeStubToCode, contentToPrimitiveType, isContentEqual, primitiveTypeToContent } from './icure-utils'
import { parsePrimitive } from '../utils/primitive'
import { anyDateToDate } from '../utils/dates'

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
	private _children: BridgedFormValuesContainer[] | undefined
	get children(): BridgedFormValuesContainer[] {
		return (
			this._children ??
			(this._children = this.contactFormValuesContainer
				.getChildren()
				.map(
					(fvc) =>
						new BridgedFormValuesContainer(
							this.responsible,
							fvc,
							this.interpreter,
							this.contact,
							this.dependentValuesProvider,
							this.validatorsProvider,
							this.language,
							this.changeListeners,
						),
				))
		)
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
		private dependentValuesProvider: (anchorId: string | undefined, templateId: string) => { metadata: FieldMetadata; formula: string }[] = () => [],
		private validatorsProvider: (anchorId: string | undefined, templateId: string) => { metadata: FieldMetadata; validators: Validator[] }[] = () => [],
		private language = 'en',
		private changeListeners: ((newValue: BridgedFormValuesContainer) => void)[] = [],
	) {
		//Before start to broadcast changes, we need to fill in the contactFormValuesContainer with the dependent values
		this.contactFormValuesContainer = contactFormValuesContainer
		this.contact = contact ?? contactFormValuesContainer.currentContact
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
							...(Math.abs(+(anyDateToDate(s.valueDate) ?? 0) - +(anyDateToDate(this.contact.created) ?? 0)) > 24 * 3600000 ? { valueDate: this.contact.created } : {}),
						}),
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
			this.dependentValuesProvider,
			this.validatorsProvider,
			this.language,
			this.changeListeners,
		)
		this.changeListeners.forEach((l) => l(newBridgedFormValueContainer))
		return newBridgedFormValueContainer
	}

	//This method mutates the BridgedFormValuesContainer but can only be called from the constructor
	private computeDependentValues() {
		if (this.contactFormValuesContainer.rootForm.formTemplateId) {
			this.dependentValuesProvider(this.contactFormValuesContainer.rootForm.descr, this.contactFormValuesContainer.rootForm.formTemplateId).forEach(({ metadata, formula }) => {
				try {
					const currentValue = this.getVersionedValuesForKey(metadata.label)
					const newValue = this.compute(formula) as FieldValue | undefined
					if (newValue !== undefined || currentValue != undefined) {
						const lng = this.language ?? 'en'
						if (newValue && !newValue.content[lng] && newValue.content['*']) {
							newValue.content[lng] = newValue.content['*']
						}
						if (newValue) {
							delete newValue.content['*']
						}
						const currentContact = this.contactFormValuesContainer.currentContact
						this.contactFormValuesContainer = setValueOnContactFormValuesContainer(
							this.contactFormValuesContainer,
							metadata.label,
							lng,
							newValue,
							Object.keys(currentValue ?? {})[0],
							metadata,
						).formValuesContainer
						if (this.contact === currentContact) {
							this.contact = this.contactFormValuesContainer.currentContact
						}
					}
				} catch (e) {
					console.log(`Error while computing formula : ${formula}`, e)
				}
			})
		}
	}

	setValue(
		label: string,
		language: string,
		fv?: FieldValue,
		id?: string,
		metadata?: FieldMetadata,
	): FormValuesContainerMutation<FieldValue, FieldMetadata, BridgedFormValuesContainer, ID> {
		const mutation = setValueOnContactFormValuesContainer(this.contactFormValuesContainer, label, language, fv, id, metadata)
		return { result: mutation.result, formValuesContainer: this.mutateAndNotify(mutation.formValuesContainer) }
	}

	setMetadata(meta: FieldMetadata, id?: string | undefined): FormValuesContainerMutation<FieldValue, FieldMetadata, BridgedFormValuesContainer, ID> {
		const mutation = this.contactFormValuesContainer.setMetadata(
			{
				label: meta.label,
				responsible: meta.owner,
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
		// noinspection JSUnusedGlobalSymbols
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
			parseContent: (content?: { [key: string]: PrimitiveType }) => {
				if (!content) {
					return undefined
				}
				const primitive = content[this.language] ?? content['*'] ?? content[Object.keys(content)[0]]
				return primitive && parsePrimitive(primitive)
			},
			log: console.log,
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
		return this.contactFormValuesContainer.getChildren().map((fvc) => new BridgedFormValuesContainer(this.responsible, fvc, this.interpreter, this.contact))
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

	async addChild(
		anchorId: string,
		templateId: string,
		label: string,
	): Promise<FormValuesContainerMutation<FieldValue, FieldMetadata, BridgedFormValuesContainer, BridgedFormValuesContainer>> {
		const mutation = await this.contactFormValuesContainer.addChild(anchorId, templateId, label)
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
	formFactory: (anchorId: string, formTemplateId: string, label: string) => Promise<ICureForm>

	changeListeners: ((newValue: ContactFormValuesContainer) => void)[]

	constructor(
		rootForm: ICureForm,
		currentContact: Contact,
		contactsHistory: Contact[],
		serviceFactory: (label: string, serviceId?: string) => Service,
		children: ContactFormValuesContainer[],
		formFactory: (anchorId: string, formTemplateId: string, label: string) => Promise<ICureForm>,
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
		formFactory: (anchorId: string, formTemplateId: string, label: string) => Promise<ICureForm>,
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

	setMetadata(meta: ServiceMetadata, id?: string): FormValuesContainerMutation<Service, ServiceMetadata, ContactFormValuesContainer, ID> {
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
		value?: Service,
		id?: string,
		metadata?: ServiceMetadata,
	): FormValuesContainerMutation<Service, ServiceMetadata, ContactFormValuesContainer, ID> {
		const service = (id && this.getServiceInCurrentContact(id)) || this.serviceFactory(label, id)
		if (!service.id) {
			throw new Error('Service id must be defined')
		}
		console.log('Setting value of service', service.id, 'with', value, 'and metadata', metadata)
		const newContent = value?.content?.[language]
		const newCodes = value?.codes ?? []
		if (!isContentEqual(service.content?.[language], newContent) || (newCodes && !areCodesEqual(newCodes, service.codes ?? []))) {
			const newService = new Service({ ...service, modified: Date.now() })
			const newContents = newContent ? { ...(service.content || {}), [language]: newContent } : { ...(service.content || {}) }
			if (!newContent) {
				delete newContents[language]
			}

			let newCurrentContact: Contact
			if (!Object.entries(newContents).filter(([, cnt]) => cnt !== undefined).length) {
				newCurrentContact = {
					...this.currentContact,
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
					newService.tags = metadata.tags ?? newService.tags
					newService.label = metadata.label ?? newService.label
				}

				newCurrentContact = {
					...this.currentContact,
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

	compute<T>(): T | undefined {
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

	async addChild(
		anchorId: string,
		templateId: string,
		label: string,
	): Promise<FormValuesContainerMutation<Service, ServiceMetadata, ContactFormValuesContainer, ContactFormValuesContainer>> {
		const newForm = await this.formFactory(anchorId, templateId, label)
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

	private getServiceInCurrentContact(id: string): Service | undefined {
		const service = (this.currentContact.services || [])?.find((s) => s.id === id)
		return service ?? undefined
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

const setValueOnContactFormValuesContainer = (cfvc: ContactFormValuesContainer, label: string, language: string, fv?: FieldValue, id?: string, metadata?: FieldMetadata) => {
	const value = fv?.content[language]
	const mutation = cfvc.setValue(
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
		{
			label: metadata?.label ?? label,
			responsible: metadata?.owner,
			valueDate: metadata?.valueDate,
			tags: metadata?.tags,
		},
	)
	return mutation
}
