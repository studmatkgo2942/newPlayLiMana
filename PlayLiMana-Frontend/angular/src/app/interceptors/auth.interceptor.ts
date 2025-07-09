import { Injectable } from "@angular/core";
import {
  HttpInterceptor,
  HttpRequest,
  HttpHandler,
  HttpEvent
} from "@angular/common/http";

import { from, Observable, switchMap } from "rxjs";
import { getAuth }                     from "firebase/auth";

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  intercept(
    req: HttpRequest<any>,
    next: HttpHandler
  ): Observable<HttpEvent<any>> {
    const auth = getAuth();
    const user = auth.currentUser;

    if (user) {
      // getIdToken() returns a Promise<string>
      return from(user.getIdToken()).pipe(
        switchMap((token) => {
          const cloned = req.clone({
            setHeaders: {
              Authorization: `Bearer ${token}`
            }
          });
          return next.handle(cloned);
        })
      );
    } else {
      return next.handle(req);
    }
  }
}
