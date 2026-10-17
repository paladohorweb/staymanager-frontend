import { Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { AlertService } from '../../core/services/alert.service';
import { ApiErrorService } from '../../core/services/api-error.service';
import { environment } from '../../../environments/environment';

type AccountType = 'OWNER' | 'CLIENT';

@Component({
  selector: 'app-register-page', standalone: true, imports: [FormsModule, RouterLink],
  styles: [`
    .auth-shell{min-height:100vh;display:grid;place-items:center;padding:6rem 1rem 3rem;background:radial-gradient(circle at 15% 10%,#dcefe9,transparent 35%),#f7faf9}.auth-card{width:min(760px,100%);padding:2rem}.auth-header{text-align:center;max-width:570px;margin:0 auto 1.4rem}.auth-header h1{font:400 clamp(2rem,5vw,3.1rem) Georgia,serif}.account-types{display:grid;grid-template-columns:1fr 1fr;gap:.8rem;margin:1.2rem 0}.account-type{display:flex;gap:.8rem;text-align:left;padding:1rem;border:1px solid var(--line);border-radius:14px;background:#fff;color:var(--text)}.account-type.active{border-color:var(--primary);box-shadow:0 0 0 2px var(--primary-soft)}.account-type i{font-size:1.45rem;color:var(--primary)}.account-type span{display:flex;flex-direction:column}.account-type small{margin-top:.2rem;color:var(--muted);font-size:.62rem}.password-hint{font-size:.62rem;color:var(--muted);margin-top:.35rem}.legal-check{display:flex;gap:.6rem;align-items:flex-start;font-size:.7rem}.legal-check input{width:auto;margin-top:.18rem}.next-note{display:flex;gap:.55rem;align-items:flex-start;margin:1rem 0;padding:.75rem;border-radius:10px;background:#eef7f4;color:#285f53;font-size:.66rem}.demo-lock{text-align:center;padding:1.2rem;background:#fff8e8;border-radius:12px}@media(max-width:620px){.account-types,.form-grid.two{grid-template-columns:1fr}.auth-card{padding:1.3rem}}
  `],
  template: `<main class="auth-shell"><section class="card-panel auth-card">
    <div class="auth-header"><a routerLink="/" class="brand justify-content-center mb-4"><span class="brand-mark">S</span><span><strong>Stay</strong>Manager</span></a><span class="eyebrow">CREA TU CUENTA</span><h1>{{accountType==='OWNER'?'Gestiona tu alojamiento':'Organiza tus estadías'}}</h1><p>{{accountType==='OWNER'?'Configura propiedades, alojamientos, reservas y equipo desde un solo lugar.':'Guarda tus datos y consulta todas las reservas que vincules a tu perfil.'}}</p></div>
    @if(demoMode){<div class="demo-lock"><strong>Registro no disponible en la demo pública</strong><p>Ejecuta el entorno conectado al backend para probar este flujo.</p><a class="btn btn-primary" routerLink="/login">Volver al acceso demo</a></div>}@else{
      <div class="account-types" role="group" aria-label="Tipo de cuenta">
        <button type="button" class="account-type" [class.active]="accountType==='OWNER'" (click)="accountType='OWNER'"><i class="bi bi-buildings"></i><span><strong>Soy propietario</strong><small>Administraré propiedades, alojamientos y reservas.</small></span></button>
        <button type="button" class="account-type" [class.active]="accountType==='CLIENT'" (click)="accountType='CLIENT'"><i class="bi bi-suitcase2"></i><span><strong>Soy huésped</strong><small>Consultaré mis reservas y datos personales.</small></span></button>
      </div>
      <form #form="ngForm" (ngSubmit)="submit()"><div class="form-grid two">
        <label>Nombre completo<input name="fullName" [(ngModel)]="fullName" required maxlength="120" autocomplete="name"></label>
        @if(accountType==='OWNER'){<label>Nombre del negocio<input name="organizationName" [(ngModel)]="organizationName" required maxlength="120" placeholder="Cabañas La Montaña"></label>}
        <label [class.span-two]="accountType==='OWNER'">Correo electrónico<input type="email" name="email" [(ngModel)]="email" required email maxlength="180" autocomplete="email"></label>
        <label>Contraseña<input type="password" name="password" [(ngModel)]="password" required minlength="10" maxlength="72" autocomplete="new-password"><small class="password-hint">Mínimo 10 caracteres, mayúscula, minúscula, número y símbolo.</small></label>
        <label>Confirmar contraseña<input type="password" name="confirmation" [(ngModel)]="confirmation" required autocomplete="new-password"></label>
      </div>
      <div class="next-note"><i class="bi bi-arrow-right-circle"></i><span>{{accountType==='OWNER'?'Después completarás tu perfil, crearás tu primera propiedad y publicarás un alojamiento.':'Después podrás completar tu perfil y vincular una reserva usando su código.'}}</span></div>
      <label class="legal-check"><input type="checkbox" name="acceptedTerms" [(ngModel)]="acceptedTerms" required><span>Acepto los <a routerLink="/aviso-legal" target="_blank">términos</a> y la <a routerLink="/politica-privacidad" target="_blank">política de privacidad</a>.</span></label>
      @if(error()){<div class="alert alert-danger mt-3">{{error()}}</div>}<button class="btn btn-primary btn-block mt-3" type="submit" [disabled]="form.invalid||!passwordsMatch()||loading()">@if(loading()){<span class="spinner-border spinner-border-sm me-2"></span>}{{accountType==='OWNER'?'Crear cuenta de propietario':'Crear cuenta de huésped'}}</button><p class="text-center mt-3 mb-0"><a routerLink="/login">Ya tengo una cuenta</a></p></form>
    }
  </section></main>`
})
export class RegisterPageComponent {
  readonly demoMode = environment.demoMode;
  accountType: AccountType = 'OWNER';
  fullName = ''; organizationName = ''; email = ''; password = ''; confirmation = ''; acceptedTerms = false;
  readonly loading = signal(false); readonly error = signal('');
  constructor(private readonly auth: AuthService, private readonly alerts: AlertService,
    private readonly errors: ApiErrorService, private readonly router: Router) {}
  passwordsMatch(): boolean { return this.password === this.confirmation; }
  async submit(): Promise<void> {
    if (!this.passwordsMatch()) { this.error.set('Las contraseñas no coinciden.'); return; }
    this.loading.set(true); this.error.set('');
    try {
      if (this.accountType === 'OWNER') {
        await this.auth.register({ fullName: this.fullName, organizationName: this.organizationName,
          email: this.email, password: this.password, acceptedTerms: this.acceptedTerms });
        await this.alerts.success('Cuenta creada', 'Vamos a configurar tu negocio y el primer alojamiento.');
        await this.router.navigateByUrl('/admin/bienvenida');
      } else {
        await this.auth.registerClient({ fullName: this.fullName, email: this.email,
          password: this.password, acceptedTerms: this.acceptedTerms });
        await this.alerts.success('Cuenta creada', 'Tu perfil de huésped ya está listo.');
        await this.router.navigateByUrl('/cliente');
      }
    } catch (error) { this.error.set(this.errors.message(error, 'No fue posible crear la cuenta.')); }
    finally { this.loading.set(false); }
  }
}
