import { Form } from '../model'
import { TemplateResult } from 'lit'
import { FormValuesContainer } from '../../iqr-form-loader'
import { CodeStub, HealthcareParty } from '@icure/api'
import { ActionManager } from '../../iqr-form-loader'
import { OptionCode } from '../../common'

export type Renderer = (
	form: Form,
	props: { [p: string]: unknown },
	formsValueContainer?: FormValuesContainer,
	formValuesContainerChanged?: (newValue: FormValuesContainer) => void,
	translationProvider?: (text: string) => string,
	ownersProvider?: (speciality: string[]) => HealthcareParty[],
	codesProvider?: (codifications: string[], searchTerm: string) => Promise<CodeStub[]>,
	optionsProvider?: (codifications: string[], searchTerm?: string) => Promise<OptionCode[]>,
	actionManager?: ActionManager,
	editable?: boolean,
) => TemplateResult
