import { HttpErrorResponse } from '@angular/common/http';
import { Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { AlertService } from '../../core/services/alert.service';
import { ApiErrorService } from '../../core/services/api-error.service';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-login-page',
  standalone: true,
  imports: [FormsModule, RouterLink],
  template: `
    <div class="login-page">
      <div class="login-visual"><a routerLink="/" class="brand brand-light"><span class="brand-mark">S</span><span><strong>Stay</strong>Manager</span></a><div><span class="eyebrow light">OPERACIONES SIN FRICCIÓN</span><h1>Tu alojamiento,<br>bajo control.</h1><p>Reservas, huéspedes, pagos y ocupación en una experiencia clara.</p></div><small>Producto SaaS de JGMSOLUTIONS</small></div>
      <div class="login-panel">
        <form class="login-form" (ngSubmit)="submit()">
          <a routerLink="/" class="mobile-login-brand brand"><span class="brand-mark">S</span><span><strong>Stay</strong>Manager</span></a>
          <span class="eyebrow">BIENVENIDO DE NUEVO</span><h2>Accede a tu espacio</h2><p>Gestiona la operación desde cualquier lugar.</p>
          <div class="demo-credentials"><strong>Cuenta de demostración</strong><span>owner&#64;demo.com</span><span>Demo123*</span><button type="button" (click)="fillDemo()">Usar credenciales</button></div>
          <label>Correo electrónico<input type="email" name="email" [(ngModel)]="email" required autocomplete="email" placeholder="nombre@empresa.com"></label>
          <label>Contraseña<input type="password" name="password" [(ngModel)]="password" required autocomplete="current-password" placeholder="••••••••"></label>
          @if (error()) { <div class="alert alert-danger py-2" role="alert">{{ error() }}</div> }
          <button class="btn btn-primary btn-block" type="submit" [disabled]="loading()">@if (loading()) { <span class="spinner-border spinner-border-sm me-2" aria-hidden="true"></span> }Ingresar al panel →</button>
          <div class="login-links"><a href="#">¿Olvidaste tu contraseña?</a><a routerLink="/">Volver al portal</a></div>
          <small class="demo-warning">{{ demoMode ? 'Modo demo: los datos se guardan sólo en este navegador.' : 'Entorno local conectado al backend Java 17.' }} No uses credenciales reales.</small>
        </form>
      </div>
    </div>
  `
})
export class LoginPageComponent {
  readonly demoMode = environment.demoMode;
  email = '';
  password = '';
  readonly error = signal('');
  readonly loading = signal(false);

  constructor(
    private readonly auth: AuthService,
    private readonly alerts: AlertService,
    private readonly errors: ApiErrorService,
    private readonly router: Router,
    private readonly route: ActivatedRoute
  ) {}
  fillDemo(): void { this.email = 'owner@demo.com'; this.password = 'Demo123*'; this.error.set(''); }
  async submit(): Promise<void> {
    this.error.set('');
    this.loading.set(true);
    try {
      await this.auth.login(this.email, this.password);
      await this.alerts.toast('Bienvenido a StayManager');
      await this.router.navigateByUrl(this.route.snapshot.queryParamMap.get('returnUrl') ?? '/admin');
    } catch (error) {
      const message = error instanceof HttpErrorResponse && error.status === 401
        ? 'Correo o contraseña incorrectos.'
        : this.errors.message(error, 'No fue posible iniciar sesión. Intenta nuevamente.');
      this.error.set(message);
      await this.alerts.error('No fue posible iniciar sesión', message);
    } finally {
      this.loading.set(false);
    }
  }
}
