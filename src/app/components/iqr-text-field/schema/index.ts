import {Schema} from 'prosemirror-model';
import {DocumentSchema, getMarkdownSpec, InlineSchema, StyledSchema} from "./markdown-schema";
import {DateSchema, DateTimeSchema, getDateSpec, getDateTimeSpec} from "./date-time-schema";
import {getTokensSpec, TokensSchema} from "./token-schema";

export type IqrTextFieldSchema = DocumentSchema | TokensSchema | StyledSchema | InlineSchema | DateSchema | DateTimeSchema

export function createSchema(type: IqrTextFieldSchema, colorProvider: (type:string, code:string, isCode: boolean) => string, contentProvider: (codes: {type: string, code: string}[]) => string) {
	return new Schema(
		type === 'date' ? getDateSpec() :
			type === 'date-time' ? getDateTimeSpec() :
			type ==='tokens-list' || type ==='styled-tokens-list' || type ==='tokens-list-with-codes' || type === 'styled-tokens-list-with-codes' ? getTokensSpec(type, contentProvider, colorProvider) : getMarkdownSpec(type, contentProvider, colorProvider))
}
