import {
	CheckBox,
	DatePicker,
	DateTimePicker,
	DropdownField,
	ItemsListField,
	Label,
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
import { IcureTextField } from '../../icure-text-field'

customElements.define('icure-form-checkbox', CheckBox)
customElements.define('icure-form-date-picker', DatePicker)
customElements.define('icure-form-date-time-picker', DateTimePicker)
customElements.define('icure-form-dropdown-field', DropdownField)
customElements.define('icure-button-group', IcureButtonGroup)
customElements.define('icure-date-picker-field', IcureDatePickerField)
customElements.define('icure-dropdown-field', IcureDropdownField)
customElements.define('icure-form', IcureForm)
customElements.define('icure-label', IcureLabel)
customElements.define('icure-text-field', IcureTextField)
customElements.define('icure-form-items-list-field', ItemsListField)
customElements.define('icure-form-label', Label)
customElements.define('icure-form-measure-field', MeasureField)
customElements.define('icure-form-number-field', NumberField)
customElements.define('icure-form-radio-button', RadioButton)
customElements.define('icure-form-textfield', TextField)
customElements.define('icure-form-time-picker', TimePicker)
customElements.define('icure-form-token-field', TokenField)
