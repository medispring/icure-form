import { Form } from '../model'
import { TemplateResult } from 'lit'
import { FormValuesContainer } from '../../iqr-form-loader'
import { CodeStub, HealthcareParty } from '@icure/api'
import { ActionManager } from '../../iqr-form-loader'

export type Renderer = (
	form: Form,
	props: { [p: string]: unknown },
	formsValueContainer?: FormValuesContainer,
	formValuesContainerChanged?: (newValue: FormValuesContainer) => void,
	translationProvider?: (text: string) => string,
	ownersProvider?: (speciality: string[]) => HealthcareParty[],
	codesProvider?: (codifications: string[], searchTerm: string) => Promise<CodeStub[]>,
	actionManager?: ActionManager,
) => TemplateResult
