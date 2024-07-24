# iCure Form System

## Description

This is a form system for the iCure project. It is a web application that allows users to create forms, fill them out, and view the results. The system is built using Lit framework to make it as light as possible and easy to integrate in any higher level framework.

## How to use

```bash
yarn add @icure/form
```

```javascript
import '@icure/form';
```

Inside your HTML file, add the following tag:

```html
<icure-form
	.form="${this.form}"
	labelPosition="above"
	renderer="form"
	displayedLanguage="en"
	.formValuesContainer="${this.formValuesContainer}"
	.codesProvider="${this.codesProvider}"
	.optionsProvider="${this.optionsProvider}"
></icure-form>
```
