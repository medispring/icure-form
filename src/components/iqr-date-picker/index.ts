import { ValuedField } from "../common/valuedField";
import { VersionedValue } from "../iqr-text-field";
import { html, TemplateResult } from "lit";
import {generateLabel} from "../iqr-label/utils";
import {state} from "lit/development/decorators";
import {dropdownPicto} from "../iqr-text-field/styles/paths";

class IqrDatePickerField extends ValuedField<string,VersionedValue>{

	@state() protected displayDatePicker = false
	@state() protected inputValue = ''
	render(): TemplateResult {
		return html`
			<div id="root" class="iqr-text-field ${this.inputValue != '' ? 'has-content' : ''}" data-placeholder=${this.placeholder}>
				${generateLabel(this.label ?? '', this.labelPosition ?? 'float', this.translationProvider)}
				<div class="iqr-input" @click="${this.togglePopup}" id="test">
					<div id="editor">${this.inputValue}</div>
					<div id="extra" class=${'extra forced'}>
						<button class="btn select-arrow">${dropdownPicto}</button>
						${this.displayDatePicker
							? html`
							  `
							: ''}
					</div>
				</div>
			</div>
		`
	}

	public togglePopup(): void {
		this.displayDatePicker = !this.displayDatePicker
	}
}

customElements.define('iqr-date-picker-field', IqrDatePickerField)
