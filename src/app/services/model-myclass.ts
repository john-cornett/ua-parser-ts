import {Injectable} from "@angular/core";
import {UAParser} from "./ua-parser";


@Injectable()
export class MyClass {

	Table: MyTable= {
		UAInfo: null
	};
	
	constructor(private uaParser: UAParser) {
		this.Table.UAInfo= uaParser.getResult();
		console.log('USERAGENT',this.Table.UAInfo);
	}
}
