import { Form } from '../model'
import { TemplateResult } from 'lit'
import { FormValuesContainer } from '../../iqr-form-loader'

export type Renderer = (form: Form, props: { [key: string]: unknown }, formsValueContainer?: FormValuesContainer) => TemplateResult
