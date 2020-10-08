import { LitElement, html, css } from 'lit-element';
import './components/iqr-text-field';

class MyApp extends LitElement {
	static get styles() {
		return css`
			iqr-text-field {
				display: block;
				margin-top:24px;
				margin-bottom:24px;
			}
		`;
	}

    render() {
        return html`
<h2>Simple text field</h2>
<iqr-text-field style="width: 320px" value="*Hello* **world**" owner="Antoine Duchâteau"></iqr-text-field>
<h2>Text field with codes, internal and external links</h2>
<iqr-text-field value="[Céphalée de tension](c-icpc2://N01,c-icd10://G05.8,i-he://1234) persistante avec [migraine ophtalmique](c-icpc2://N02) associée. [Grosse fatigue](c-icpc2://K56). A suivi un [protocole de relaxation](x-doc://5678)" owner="M. Mennechet"></iqr-text-field>
`;
    }
}

customElements.define('my-app', MyApp);
