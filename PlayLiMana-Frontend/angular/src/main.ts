import { initializeApp } from "firebase/app";
import { getAuth }       from "firebase/auth";

import { bootstrapApplication } from "@angular/platform-browser";
import { AppComponent }          from "./app/app.component";

import {
  provideHttpClient,
  HTTP_INTERCEPTORS
} from "@angular/common/http";

import { AuthInterceptor } from "./app/interceptors/auth.interceptor";
import { appConfig }      from "./app/app.config";
import { provideRouter }  from "@angular/router";
import { routes }         from "./app/app.routes";

import { firebaseConfig } from "./app/firebase-config";


initializeApp(firebaseConfig);


bootstrapApplication(AppComponent, {
  providers: [
    ...appConfig.providers,
    provideRouter(routes),

    // ─── HTTP Client + AuthInterceptor ─────────────────────────────────────
    provideHttpClient(),
    {
      provide: HTTP_INTERCEPTORS,
      useClass: AuthInterceptor,
      multi: true
    }
    // If you had other global providers, leave them here as well.
  ]
}).catch((err) => console.error(err));
