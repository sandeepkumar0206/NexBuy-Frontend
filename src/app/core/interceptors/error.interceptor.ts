import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';

/** Send expired sessions to login, and forbidden users back home. */
export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  const router = inject(Router);

  return next(req).pipe(
    catchError((error: unknown) => {
      if (error instanceof HttpErrorResponse && !req.url.includes('/api/auth/')) {
        if (error.status === 401) {
          auth.logout();
          const returnUrl = router.url;
          if (!returnUrl.startsWith('/login')) {
            router.navigate(['/login'], {
              queryParams: returnUrl.startsWith('/') ? { returnUrl } : {},
            });
          }
        } else if (error.status === 403 && !router.url.startsWith('/login')) {
          router.navigate(['/']);
        }
      }
      return throwError(() => error);
    }),
  );
};
