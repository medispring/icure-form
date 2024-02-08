export interface VersionedData<T> {
	[id: string]: Version<T>[]
}

export interface Version<T> {
	revision: string | null //null means that the version is not saved yet
	modified?: number
	value: T
}

export type ID = string
/**
 * FormValuesContainer is a readonly structure that provides and handle the values of a form.
 */
export interface FormValuesContainer<Value, Metadata> {
	//information retrieval
	compute<T, S extends { [key: string | symbol]: unknown }>(formula: string, sandbox?: S): T | undefined
	getLabel(): string
	getFormId(): string | undefined
	getValues(revisionsFilter: (id: string, history: Version<Metadata>[]) => (string | null)[]): VersionedData<Value>
	getMetadata(id: string, revisions: string[]): VersionedData<Metadata>
	getChildren(): FormValuesContainer<Value, Metadata>[]
	//modification
	setValue(label: string, language: string, data?: Value, id?: string, metadata?: Metadata): FormValuesContainerMutation<Value, Metadata, FormValuesContainer<Value, Metadata>, ID>
	setMetadata(label: string, metadata: Metadata, id?: string): FormValuesContainerMutation<Value, Metadata, FormValuesContainer<Value, Metadata>, ID>
	delete(serviceId: string): FormValuesContainerMutation<Value, Metadata, FormValuesContainer<Value, Metadata>, void>
	//hierarchy
	addChild(
		anchorId: string,
		templateId: string,
		label: string,
	): Promise<FormValuesContainerMutation<Value, Metadata, FormValuesContainer<Value, Metadata>, FormValuesContainer<Value, Metadata>>>
	removeChild(container: FormValuesContainer<Value, Metadata>): Promise<FormValuesContainerMutation<Value, Metadata, FormValuesContainer<Value, Metadata>, void>>
	//listeners
	registerChangeListener(listener: (newValue: FormValuesContainer<Value, Metadata>) => void): void
	unregisterChangeListener(listener: (newValue: FormValuesContainer<Value, Metadata>) => void): void
}

export interface FormValuesContainerMutation<Value, Metadata, FVC extends FormValuesContainer<Value, Metadata>, Result> {
	result: Result
	formValuesContainer: FVC
}

export type Suggestion = { id: string; code: string; text: string; terms: string[] }
