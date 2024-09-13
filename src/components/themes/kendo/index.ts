import {
	CheckBox,
	DatePicker,
	DateTimePicker,
	DropdownField,
	ItemsListField,
	Label,
	Button,
	MeasureField,
	NumberField,
	RadioButton,
	TextField,
	TimePicker,
	TokenField,
} from '../../icure-form/fields'
import { IcureButtonGroup } from '../../icure-button-group'
import { IcureDatePickerField } from '../../icure-date-picker'
import { IcureDropdownField } from '../../icure-dropdown-field'
import { IcureForm } from '../../icure-form'
import { IcureLabel } from '../../icure-label'
import { IcureTextField, MetadataButtonBarWrapper } from '../../icure-text-field'

// @ts-ignore
import kendoCss from './kendo.scss'
import { MetadataButtonBar } from '../../common/metadata-buttons-bar'
import { IcureButton } from '../../icure-button'

class KendoIcureButtonGroup extends IcureButtonGroup {
	static get styles() {
		return [...IcureButtonGroup.styles, kendoCss]
	}
}
class KendoIcureDatePickerField extends IcureDatePickerField {
	static get styles() {
		return [...IcureDatePickerField.styles, kendoCss]
	}
}
class KendoIcureDropdownField extends IcureDropdownField {
	static get styles() {
		return [...IcureDropdownField.styles, kendoCss]
	}
}
class KendoIcureForm extends IcureForm {
	static get styles() {
		return [...IcureForm.styles, kendoCss]
	}
}
class KendoIcureLabel extends IcureLabel {
	static get styles() {
		return [...IcureLabel.styles, kendoCss]
	}
}
class KendoIcureButton extends IcureButton {
	static get styles() {
		return [...IcureButton.styles, kendoCss]
	}
}
class KendoIcureTextField extends IcureTextField {
	static get styles() {
		return [...IcureTextField.styles, kendoCss]
	}
}
class KendoLabel extends Label {
	static get styles() {
		return [...Label.styles, kendoCss]
	}
}
class KendoMetadataButtonBar extends MetadataButtonBar {
	static get styles() {
		return [...MetadataButtonBar.styles, kendoCss]
	}
}
class KendoButton extends Button {
	static get styles() {
		return [...Button.styles, kendoCss]
	}
}

customElements.define('icure-metadata-buttons-bar', KendoMetadataButtonBar)
customElements.define('icure-metadata-buttons-bar-wrapper', MetadataButtonBarWrapper)

customElements.define('icure-form-checkbox', CheckBox)
customElements.define('icure-form-date-picker', DatePicker)
customElements.define('icure-form-date-time-picker', DateTimePicker)
customElements.define('icure-form-dropdown-field', DropdownField)
customElements.define('icure-button-group', KendoIcureButtonGroup)
customElements.define('icure-date-picker-field', KendoIcureDatePickerField)
customElements.define('icure-dropdown-field', KendoIcureDropdownField)
customElements.define('icure-form', KendoIcureForm)
customElements.define('icure-label', KendoIcureLabel)
customElements.define('icure-button', KendoIcureButton)
customElements.define('icure-text-field', KendoIcureTextField)
customElements.define('icure-form-items-list-field', ItemsListField)
customElements.define('icure-form-label', KendoLabel)
customElements.define('icure-form-button', KendoButton)
customElements.define('icure-form-measure-field', MeasureField)
customElements.define('icure-form-number-field', NumberField)
customElements.define('icure-form-radio-button', RadioButton)
customElements.define('icure-form-text-field', TextField)
customElements.define('icure-form-time-picker', TimePicker)
customElements.define('icure-form-token-field', TokenField)
