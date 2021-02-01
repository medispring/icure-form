import {css, html, LitElement, property} from 'lit-element';
import '../../iqr-text-field';

class Textfield extends LitElement {
	@property() label: string = '';
	@property() multiline: boolean = false;
	@property() rows: number = 1;
	@property() grows: boolean = false;
	@property() labelPosition?: string = undefined
	@property() suggestionStopWords: Set<string> = new Set<string>()
	@property() linksProvider: (sug:{ id: string, code: string, text: string, terms: string[] }) => Promise<{ href: string, title: string } | undefined> = () => Promise.resolve(undefined)
	@property() suggestionProvider: (terms:string[]) => any[] = () => []
	@property() codeColorProvider: (type:string, code:string) => string = () => 'XI'
	@property() linkColorProvider: (type:string, code:string) => string = () => 'cat1'
	@property() codeContentProvider: (codes: {type: string, code: string}[]) => string = (codes) => codes.map(c=>c.code).join(',')

	static get styles() {
		return [ css`
:host {
}
` ];
	}

	render() {
		return html`
		<iqr-text-field labelPosition=${this.labelPosition} ?multiline="${this.multiline}" label="${this.label}" ?suggestions=${!!this.suggestionProvider} ?links=${!!this.linksProvider}
			.linksProvider=${this.linksProvider} .suggestionProvider=${this.suggestionProvider} .codeColorProvider=${this.codeColorProvider} .linkColorProvider=${this.linkColorProvider} .codeContentProvider=${this.codeContentProvider}></iqr-text-field>
`
	}
}

customElements.define('iqr-form-textfield', Textfield);
