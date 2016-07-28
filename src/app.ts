import {provide, enableProdMode} from '@angular/core';
import {Http, HTTP_PROVIDERS} from '@angular/http';

import {UAParser} from "./app/services/ua-parser";
import {MyApp} from "./app/my-app";
import {MyClass} from "./app/services/model-myclass";
import {bootstrap} from "@angular/platform-browser-dynamic";

enableProdMode();

bootstrap(MyApp, [
	HTTP_PROVIDERS,
	MyClass, UAParser
]).catch(err => console.error(err));