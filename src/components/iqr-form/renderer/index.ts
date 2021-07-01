import { Form } from '../model'
import { TemplateResult } from 'lit'

export type Renderer = (form: Form, props: { [key: string]: unknown }) => TemplateResult
