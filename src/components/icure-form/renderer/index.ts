import { TemplateResult } from 'lit'
import { FormValuesContainer, Suggestion } from '../../../generic'
import { FieldMetadata, FieldValue, Form } from '../../model'

export interface RendererProps {
	language?: string
	labelPosition?: 'top' | 'left' | 'right' | 'bottom' | 'float'
	defaultOwner?: string
}

export type Renderer = (
	form: Form,
	props: RendererProps,
	formsValueContainer?: FormValuesContainer<FieldValue, FieldMetadata>,
	translationProvider?: (language: string, text: string) => string,
	ownersProvider?: (terms: string[], ids?: string[], specialties?: string[]) => Promise<Suggestion[]>,
	codesProvider?: (codifications: string[], terms: string[]) => Promise<Suggestion[]>,
	optionsProvider?: (language: string, codifications: string[], terms?: string[]) => Promise<Suggestion[]>,
	readonly?: boolean,
	displayMetadata?: boolean,
) => TemplateResult
