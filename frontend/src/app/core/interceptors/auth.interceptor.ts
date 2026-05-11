import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const token = authService.getToken();

  console.log(`[AuthInterceptor] ${req.method} ${req.url} – token: ${token ? 'present' : 'MISSING'}`);

  const authReq = token
    ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
    : req;

  return next(authReq).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401) {
        console.warn('[Auth] Token lejárt vagy érvénytelen – kijelentkezés');
        authService.logout();
        router.navigate(['/auth']);
      } else if (error.status === 403) {
        console.warn('[Auth] Hozzáférés megtagadva:', req.url);
      } else if (error.status >= 500) {
        console.error('[HTTP] Szerverhiba:', error.status, req.url);
      }
      return throwError(() => error);
    })
  );
};
