import { Form } from '../model'
import { TemplateResult } from 'lit-element'

export type Renderer = (form: Form, props: { [key: string]: unknown }) => TemplateResult
