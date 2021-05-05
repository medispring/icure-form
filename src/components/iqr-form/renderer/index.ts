import { Form } from '../model'
import { TemplateResult } from 'lit-element'

export type Renderer = (form: Form, props: any, state: any, setState: (newState: any) => void) => TemplateResult
