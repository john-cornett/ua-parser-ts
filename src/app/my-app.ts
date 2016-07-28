import {Component} from '@angular/core';
import {CORE_DIRECTIVES} from '@angular/common';

import './services/model-types.ts';
import {MyClass} from "./services/model-myclass";

let name = 'my-app';
@Component({
	selector: name,
	template: require(`./${name}.html`),
	directives: [CORE_DIRECTIVES],
	providers: []
})
export class MyApp {

	modelTable:MyTable;

	constructor(private modelClass:MyClass) {
	}

	ngOnInit() {
		this.modelTable = this.modelClass.Table;
	}
}
