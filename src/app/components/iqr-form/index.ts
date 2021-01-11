// Import the LitElement base class and html helper function
import {html, LitElement, property, TemplateResult} from 'lit-element';
import {Field, Form, Group} from "./model";

import './fields/textfield'
import './fields/measureField'
import './fields/numberField'
import './fields/datePicker'
import './fields/timePicker'
import './fields/dateTimePicker'
import './fields/multipleChoice'
// @ts-ignore
import baseCss from './styles/style.scss';
// @ts-ignore
import kendoCss from './styles/kendo.scss';

// Extend the LitElement base class
class IqrForm extends LitElement {
	@property() form?: Form

	constructor() {
		super();
	}

	connectedCallback() {
		super.connectedCallback()
	}

	disconnectedCallback() {
		super.disconnectedCallback()
	}

	static get styles() {
		return [ baseCss, kendoCss ];
	}

	render() {
		const h = function (level:number, content:TemplateResult) : TemplateResult {
			return level === 1 ? html`<h1>${content}</h1>` :
				level === 2 ? html`<h2>${content}</h2>` :
					level === 3 ? html`<h3>${content}</h3>` :
						level === 4 ? html`<h4>${content}</h4>` :
							level === 5 ? html`<h5>${content}</h5>` :
								html`<h6>${content}</h6>`
		}
		const renderFieldOrGroup = function(fg: Field | Group, level: number) : TemplateResult {
			return fg instanceof Group ? html`
					${h(level, html`${fg.group}`)}
					${fg.fields?.map(f => renderFieldOrGroup(f, level+1))}` :
				html`${
						fg.type === 'textfield' ? html`<iqr-form-textfield label="${fg.field}"></iqr-form-textfield>` : 
							fg.type === 'measure-field' ? html`<iqr-form-measure-field label="${fg.field}"></iqr-form-measure-field>` : 
								fg.type === 'number-field' ? html`<iqr-form-number-field label="${fg.field}"></iqr-form-number-field>` : 
									fg.type === 'date-picker' ? html`<iqr-form-date-picker label="${fg.field}"></iqr-form-date-picker>` : 
										fg.type === 'time-picker' ? html`<iqr-form-time-picker label="${fg.field}"></iqr-form-time-picker>` : 
											fg.type === 'date-time-picker' ? html`<iqr-form-date-time-picker label="${fg.field}"></iqr-form-date-time-picker>` : 
												fg.type === 'multiple-choice' ? html`<iqr-form-multiple-choice label="${fg.field}"></iqr-form-multiple-choice>` : ''
					}`
		}

		return html`
<div class="iqr-form">
${
	this.form?.sections?.map(s =>
		html`
			<h2>${s.section}</h2>
			${s.description ? html`<p>${s.description}</p>` : ''}
			${s.fields?.map(f => renderFieldOrGroup(f, 3))}
		`
	)			
}
</div>
    `;
	}

	firstUpdated() {
	}

}

// Register the new element with the browser.
customElements.define('iqr-form', IqrForm);
