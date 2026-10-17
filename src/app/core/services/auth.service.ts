import { HttpClient } from '@angular/common/http';
import { computed, Injectable, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { AuthMessage, AuthTokens, LoginResponse, MfaSetup, SessionUser } from '../models/domain.models';
import { TokenStorageService } from './token-storage.service';
import { environment } from '../../../environments/environment';

export interface LoginResult {
  mfaRequired: boolean;
  challengeToken: string | null;
  user: SessionUser | null;
}

export interface RegistrationPayload {
  fullName: string;
  organizationName: string;
  email: string;
  password: string;
  acceptedTerms: boolean;
}

export interface ClientRegistrationPayload {
  fullName: string;
  email: string;
  password: string;
  acceptedTerms: boolean;
}

export interface ProfilePayload {
  fullName: string;
  phone: string;
  documentNumber: string;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  readonly currentUser = signal<SessionUser | null>(this.storage.readUser());
  readonly isAuthenticated = computed(() => this.storage.hasAccessToken() && Boolean(this.currentUser()));

  constructor(private readonly http: HttpClient, private readonly storage: TokenStorageService) {}

  async login(email: string, password: string): Promise<LoginResult> {
    if (environment.demoMode) {
      if (email.trim().toLowerCase() !== 'owner@demo.com' || password !== 'Demo123*') {
        throw new Error('Correo o contraseña incorrectos. Usa la cuenta de demostración.');
      }
      const user: SessionUser = {
        id: 'user-demo', organizationId: 'org-demo', fullName: 'Valentina Gómez',
        email: 'owner@demo.com', phone: '3001234567', documentNumber: '1030123456', role: 'OWNER', mfaEnabled: false
      };
      this.persist({ accessToken: 'demo-access-token', refreshToken: 'demo-refresh-token', tokenType: 'Bearer', expiresIn: 3600, user });
      return { mfaRequired: false, challengeToken: null, user };
    }
    const response = await firstValueFrom(this.http.post<LoginResponse>(`${environment.apiUrl}/auth/login`, { email: email.trim(), password }));
    if (response.mfaRequired) return { mfaRequired: true, challengeToken: response.challengeToken ?? null, user: null };
    const session = this.requireTokens(response);
    this.persist(session);
    return { mfaRequired: false, challengeToken: null, user: session.user };
  }

  async verifyMfa(challengeToken: string, code: string): Promise<SessionUser> {
    const session = await firstValueFrom(this.http.post<AuthTokens>(`${environment.apiUrl}/auth/mfa/verify`, { challengeToken, code: code.trim() }));
    this.persist(session);
    return session.user;
  }

  async register(payload: RegistrationPayload): Promise<SessionUser> {
    if (environment.demoMode) throw new Error('El registro está desactivado dentro de la demo pública.');
    const session = await firstValueFrom(this.http.post<AuthTokens>(`${environment.apiUrl}/auth/register`, {
      ...payload, fullName: payload.fullName.trim(), organizationName: payload.organizationName.trim(), email: payload.email.trim()
    }));
    this.persist(session);
    return session.user;
  }

  async registerClient(payload: ClientRegistrationPayload): Promise<SessionUser> {
    if (environment.demoMode) throw new Error('El registro está desactivado dentro de la demo pública.');
    const session = await firstValueFrom(this.http.post<AuthTokens>(`${environment.apiUrl}/auth/register/client`, {
      ...payload, fullName: payload.fullName.trim(), email: payload.email.trim()
    }));
    this.persist(session);
    return session.user;
  }

  async updateProfile(payload: ProfilePayload): Promise<SessionUser> {
    if (environment.demoMode) {
      const user = this.currentUser();
      if (!user) throw new Error('Inicia sesión para actualizar tu perfil.');
      const updated = { ...user, fullName: payload.fullName.trim(), phone: payload.phone.trim() || null,
        documentNumber: payload.documentNumber.trim() || null };
      this.currentUser.set(updated);
      this.storage.updateUser(updated);
      return updated;
    }
    const updated = await firstValueFrom(this.http.put<SessionUser>(`${environment.apiUrl}/account/profile`, payload));
    this.currentUser.set(updated);
    this.storage.updateUser(updated);
    return updated;
  }

  landingRoute(user: SessionUser | null = this.currentUser()): string {
    return user?.role === 'CLIENT' ? '/cliente' : '/admin';
  }

  requestPasswordReset(email: string): Promise<AuthMessage> {
    return firstValueFrom(this.http.post<AuthMessage>(`${environment.apiUrl}/auth/password/forgot`, { email: email.trim() }));
  }

  resetPassword(token: string, newPassword: string): Promise<AuthMessage> {
    return firstValueFrom(this.http.post<AuthMessage>(`${environment.apiUrl}/auth/password/reset`, { token, newPassword }));
  }

  changePassword(currentPassword: string, newPassword: string): Promise<AuthMessage> {
    return firstValueFrom(this.http.post<AuthMessage>(`${environment.apiUrl}/auth/password/change`, { currentPassword, newPassword }));
  }

  setupMfa(): Promise<MfaSetup> {
    return firstValueFrom(this.http.post<MfaSetup>(`${environment.apiUrl}/auth/mfa/setup`, {}));
  }

  async confirmMfa(code: string): Promise<string[]> {
    const response = await firstValueFrom(this.http.post<{ recoveryCodes: string[] }>(`${environment.apiUrl}/auth/mfa/confirm`, { code: code.trim() }));
    this.currentUser.update((user) => user ? { ...user, mfaEnabled: true } : user);
    this.storage.updateUser(this.currentUser());
    return response.recoveryCodes;
  }

  async disableMfa(password: string, code: string): Promise<AuthMessage> {
    const response = await firstValueFrom(this.http.post<AuthMessage>(`${environment.apiUrl}/auth/mfa/disable`, { password, code: code.trim() }));
    this.currentUser.update((user) => user ? { ...user, mfaEnabled: false } : user);
    this.storage.updateUser(this.currentUser());
    return response;
  }

  async refresh(): Promise<void> {
    if (environment.demoMode) return;
    const refreshToken = this.storage.refreshToken;
    if (!refreshToken) throw new Error('La sesión no tiene token de renovación.');
    const session = await firstValueFrom(this.http.post<AuthTokens>(`${environment.apiUrl}/auth/refresh`, { refreshToken }));
    this.persist(session);
  }

  async loadProfile(): Promise<void> {
    if (environment.demoMode || !this.storage.accessToken) return;
    const user = await firstValueFrom(this.http.get<SessionUser>(`${environment.apiUrl}/auth/me`));
    this.currentUser.set(user);
    this.storage.updateUser(user);
  }

  logout(): void {
    this.storage.clear();
    this.currentUser.set(null);
  }

  private persist(session: AuthTokens): void {
    this.storage.save(session);
    this.currentUser.set(session.user);
  }

  private requireTokens(response: LoginResponse): AuthTokens {
    if (!response.accessToken || !response.refreshToken || !response.tokenType || !response.user) {
      throw new Error('La respuesta de autenticación está incompleta.');
    }
    return { accessToken: response.accessToken, refreshToken: response.refreshToken, tokenType: response.tokenType,
      expiresIn: response.expiresIn ?? 0, user: response.user };
  }
}
