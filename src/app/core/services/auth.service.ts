import { HttpClient } from '@angular/common/http';
import { computed, Injectable, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { AuthTokens, SessionUser } from '../models/domain.models';
import { TokenStorageService } from './token-storage.service';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class AuthService {
  readonly currentUser = signal<SessionUser | null>(this.storage.readUser());
  readonly isAuthenticated = computed(() => this.storage.hasAccessToken() && Boolean(this.currentUser()));

  constructor(private readonly http: HttpClient, private readonly storage: TokenStorageService) {}

  async login(email: string, password: string): Promise<SessionUser> {
    if (environment.demoMode) {
      if (email.trim().toLowerCase() !== 'owner@demo.com' || password !== 'Demo123*') {
        throw new Error('Correo o contraseña incorrectos. Usa la cuenta de demostración.');
      }
      const user: SessionUser = {
        id: 'user-demo', organizationId: 'org-demo', fullName: 'Valentina Gómez',
        email: 'owner@demo.com', role: 'OWNER'
      };
      this.storage.save({ accessToken: 'demo-access-token', refreshToken: 'demo-refresh-token', tokenType: 'Bearer', expiresIn: 3600, user });
      this.currentUser.set(user);
      return user;
    }
    const session = await firstValueFrom(this.http.post<AuthTokens>(`${environment.apiUrl}/auth/login`, { email: email.trim(), password }));
    this.storage.save(session);
    this.currentUser.set(session.user);
    return session.user;
  }

  async refresh(): Promise<void> {
    if (environment.demoMode) return;
    const refreshToken = this.storage.refreshToken;
    if (!refreshToken) throw new Error('La sesión no tiene token de renovación.');
    const session = await firstValueFrom(this.http.post<AuthTokens>(`${environment.apiUrl}/auth/refresh`, { refreshToken }));
    this.storage.save(session);
    this.currentUser.set(session.user);
  }

  async loadProfile(): Promise<void> {
    if (environment.demoMode) return;
    if (!this.storage.accessToken) return;
    const user = await firstValueFrom(this.http.get<SessionUser>(`${environment.apiUrl}/auth/me`));
    this.currentUser.set(user);
  }

  logout(): void {
    this.storage.clear();
    this.currentUser.set(null);
  }
}
