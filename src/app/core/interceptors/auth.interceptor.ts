import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, switchMap, throwError } from 'rxjs';
import { SessionRefreshService } from '../services/session-refresh.service';
import { TokenStorageService } from '../services/token-storage.service';

export const authInterceptor: HttpInterceptorFn = (request, next) => {
  const storage = inject(TokenStorageService);
  const refresh = inject(SessionRefreshService);
  const isAuthRequest = request.url.includes('/auth/login') || request.url.includes('/auth/refresh');
  const authenticatedRequest = storage.accessToken && !isAuthRequest
    ? request.clone({ setHeaders: { Authorization: `Bearer ${storage.accessToken}` } })
    : request;

  return next(authenticatedRequest).pipe(
    catchError((error: unknown) => {
      if (!(error instanceof HttpErrorResponse) || error.status !== 401 || isAuthRequest || !storage.refreshToken) {
        return throwError(() => error);
      }
      return refresh.refreshAccessToken().pipe(
        switchMap((accessToken) => next(request.clone({ setHeaders: { Authorization: `Bearer ${accessToken}` } }))),
        catchError((refreshError: unknown) => {
          storage.clear();
          return throwError(() => refreshError);
        })
      );
    })
  );
};
