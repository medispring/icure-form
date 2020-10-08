import {css, html, LitElement} from 'lit-element';
import './components/iqr-text-field';

const icd10 = [
	['I', new RegExp('^[AB][0–9]')],
	['II', new RegExp('^C[0-9]–D[0-4]')],
	['III', new RegExp('^D[5–9]')],
	['IV', new RegExp('^E[0–9]')],
	['V', new RegExp('^F[0–9]')],
	['VI', new RegExp('^G[0–9]')],
	['VII', new RegExp('^H[0–5]')],
	['VIII', new RegExp('^H[6–9]')],
	['IX', new RegExp('^I[0–9]')],
	['X', new RegExp('^J[0–9]')],
	['XI', new RegExp('^K[0–9]')],
	['XII', new RegExp('^L[0–9]')],
	['XIII', new RegExp('^M[0–9]')],
	['XIV', new RegExp('^N[0–9]')],
	['XV', new RegExp('^O[0–9]')],
	['XVI', new RegExp('^P[0–9]')],
	['XVII', new RegExp('^Q[0–9]')],
	['XVIII', new RegExp('^R[0–9]')],
	['XIX', new RegExp('^[ST][0–9]')],
	['XX', new RegExp('^[VY][0–9]')],
	['XXI', new RegExp('^Z[0–9]')],
	['XXII', new RegExp('^U[0–9]')]
]

const icpc2 = {
	'B': 'XX',
	'D': 'XI',
	'F': 'VI',
	'H': 'VII',
	'K': 'IX',
	'L': 'XIII',
	'N': 'VI',
	'P': 'V',
	'R': 'X',
	'S': 'XII',
	'T': 'VI',
	'U': 'XIV',
	'W': 'XV',
	'X': 'XVI',
	'Y': 'XVIII',
	'Z': 'XXI'
}

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

	codeColorProvider(type, code) {
		return type === icd10 ? (icd10.find(x => code.match(x[1])) || [])[0] || 'XXII' : icpc2[code.substring(0,1)] || 'XXII'
	}

    render() {
        return html`
<h2>Simple text field</h2>
<iqr-text-field style="width: 320px" value="*Hello* **world**" owner="Antoine Duchâteau"></iqr-text-field>
<h2>Text field with codes, internal and external links</h2>
<iqr-text-field .codeColorProvider="${this.codeColorProvider}" value="[Céphalée de tension](c-icpc2://N01,c-icd10://G05.8,i-he://1234) persistante avec [migraine ophtalmique](c-icpc2://N02) associée. [Grosse fatigue](c-icpc2://K56). A suivi un [protocole de relaxation](x-doc://5678)" owner="M. Mennechet"></iqr-text-field>
`;
    }
}

customElements.define('my-app', MyApp);
