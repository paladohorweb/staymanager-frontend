import { HttpBackend, HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, finalize, map, shareReplay, tap, throwError } from 'rxjs';
import { AuthTokens } from '../models/domain.models';
import { TokenStorageService } from './token-storage.service';

@Injectable({ providedIn: 'root' })
export class SessionRefreshService {
  private readonly http: HttpClient;
  private inFlight: Observable<string> | null = null;

  constructor(backend: HttpBackend, private readonly storage: TokenStorageService) {
    this.http = new HttpClient(backend);
  }

  refreshAccessToken(): Observable<string> {
    if (this.inFlight) return this.inFlight;
    const refreshToken = this.storage.refreshToken;
    if (!refreshToken) return throwError(() => new Error('La sesión expiró. Inicia sesión nuevamente.'));

    this.inFlight = this.http.post<AuthTokens>('/api/v1/auth/refresh', { refreshToken }).pipe(
      tap((session) => this.storage.save(session)),
      map((session) => session.accessToken),
      finalize(() => { this.inFlight = null; }),
      shareReplay({ bufferSize: 1, refCount: false })
    );
    return this.inFlight;
  }
}
