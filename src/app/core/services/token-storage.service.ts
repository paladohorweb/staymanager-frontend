import { computed, Injectable, signal } from '@angular/core';
import { AuthTokens, SessionUser } from '../models/domain.models';
import { environment } from '../../../environments/environment';

const PREFIX = environment.demoMode ? 'staymanager.demo' : 'staymanager.local';
const ACCESS_TOKEN_KEY = `${PREFIX}.accessToken`;
const REFRESH_TOKEN_KEY = `${PREFIX}.refreshToken`;
const USER_KEY = `${PREFIX}.user`;

@Injectable({ providedIn: 'root' })
export class TokenStorageService {
  private readonly accessTokenState = signal<string | null>(localStorage.getItem(ACCESS_TOKEN_KEY));
  readonly hasAccessToken = computed(() => Boolean(this.accessTokenState()));

  get accessToken(): string | null { return this.accessTokenState(); }
  get refreshToken(): string | null { return localStorage.getItem(REFRESH_TOKEN_KEY); }

  save(session: AuthTokens): void {
    localStorage.setItem(ACCESS_TOKEN_KEY, session.accessToken);
    localStorage.setItem(REFRESH_TOKEN_KEY, session.refreshToken);
    localStorage.setItem(USER_KEY, JSON.stringify(session.user));
    this.accessTokenState.set(session.accessToken);
  }

  readUser(): SessionUser | null {
    try {
      const raw = localStorage.getItem(USER_KEY);
      return raw ? JSON.parse(raw) as SessionUser : null;
    } catch {
      return null;
    }
  }

  clear(): void {
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    this.accessTokenState.set(null);
  }
}
