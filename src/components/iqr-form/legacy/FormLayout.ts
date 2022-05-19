/**
 * iCure Cloud API Documentation
 * Spring shop sample application
 *
 * OpenAPI spec version: v0.0.1
 *
 *
 * NOTE: This class is auto generated by the swagger code generator program.
 * https://github.com/swagger-api/swagger-codegen.git
 * Do not edit the class manually.
 */
import { FormSection } from './FormSection'
import { Tag } from './Tag'

export class FormLayout {
	name?: string
	width?: number
	height?: number
	descr?: string
	tag?: Tag
	guid?: string
	group?: string
	sections?: Array<FormSection>
	importedServiceXPaths?: Array<string>

	constructor(json: JSON | any) {
		Object.assign(this as FormLayout, json)
	}
}