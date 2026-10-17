import { HttpErrorResponse } from '@angular/common/http';
import { Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { AlertService } from '../../core/services/alert.service';
import { ApiErrorService } from '../../core/services/api-error.service';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-login-page', standalone: true, imports: [FormsModule, RouterLink],
  styles: [`
    .password-field{position:relative}.password-field input{padding-right:3rem}.password-toggle{position:absolute;right:.55rem;bottom:.55rem;width:2.15rem;height:2.15rem;border:0;border-radius:8px;background:#edf5f2;color:var(--primary)}
    .security-note{display:flex;gap:.7rem;align-items:flex-start;margin:1rem 0;padding:.8rem;border-radius:11px;background:#eef7f4;color:#285f53;font-size:.68rem}.mfa-back{margin-bottom:1rem}.login-divider{display:flex;align-items:center;gap:.8rem;margin:1.1rem 0;color:var(--muted);font-size:.65rem}.login-divider:before,.login-divider:after{content:'';height:1px;flex:1;background:var(--line)}
  `],
  template: `
    <div class="login-page">
      <div class="login-visual"><a routerLink="/" class="brand brand-light"><span class="brand-mark">S</span><span><strong>Stay</strong>Manager</span></a><div><span class="eyebrow light">OPERACIONES SIN FRICCIÓN</span><h1>Tu alojamiento,<br>bajo control.</h1><p>Reservas, huéspedes, pagos y seguridad en una experiencia clara.</p></div><small>Producto SaaS de JGMSOLUTIONS</small></div>
      <div class="login-panel"><form class="login-form" (ngSubmit)="submit()">
        <a routerLink="/" class="mobile-login-brand brand"><span class="brand-mark">S</span><span><strong>Stay</strong>Manager</span></a>
        @if(!mfaChallenge()){
          <span class="eyebrow">BIENVENIDO DE NUEVO</span><h2>Accede a tu espacio</h2><p>Gestiona la operación desde cualquier lugar.</p>
          @if(demoMode){<div class="demo-credentials"><strong>Cuenta de demostración</strong><span>owner&#64;demo.com</span><span>Demo123*</span><button type="button" (click)="enterDemo()" [disabled]="loading()">Entrar ahora</button></div>}
          <label>Correo electrónico<input type="email" name="email" [(ngModel)]="email" required autocomplete="email" placeholder="nombre@empresa.com"></label>
          <label class="password-field">Contraseña<input [type]="showPassword()?'text':'password'" name="password" [(ngModel)]="password" required autocomplete="current-password" placeholder="••••••••"><button class="password-toggle" type="button" (click)="togglePassword()" [attr.aria-label]="showPassword()?'Ocultar contraseña':'Ver contraseña'"><i [class]="showPassword()?'bi bi-eye-slash':'bi bi-eye'"></i></button></label>
          <div class="login-links"><a routerLink="/recuperar-contrasena">¿Olvidaste tu contraseña?</a><a routerLink="/">Volver al portal</a></div>
        } @else {
          <button class="text-button mfa-back" type="button" (click)="cancelMfa()">← Volver al acceso</button><span class="eyebrow">VERIFICACIÓN EN DOS PASOS</span><h2>Confirma que eres tú</h2><p>Ingresa el código de seis dígitos de tu aplicación autenticadora o un código de recuperación.</p>
          <label>Código de seguridad<input name="mfaCode" [(ngModel)]="mfaCode" required autocomplete="one-time-code" inputmode="numeric" maxlength="20" placeholder="000000"></label>
          <div class="security-note"><i class="bi bi-shield-check"></i><span>El desafío vence en cinco minutos y los códigos de recuperación solo se pueden usar una vez.</span></div>
        }
        @if(error()){<div class="alert alert-danger py-2" role="alert">{{error()}}</div>}
        <button class="btn btn-primary btn-block" type="submit" [disabled]="loading()">@if(loading()){<span class="spinner-border spinner-border-sm me-2" aria-hidden="true"></span>}{{mfaChallenge()?'Verificar e ingresar':'Ingresar a mi cuenta'}} →</button>
        @if(!mfaChallenge()){<div class="login-divider">o</div><a class="btn btn-outline btn-block" routerLink="/registro">Crear cuenta de propietario o huésped</a>}
        <small class="demo-warning">{{demoMode?'Modo demo: los datos se guardan sólo en este navegador.':'Conexión cifrada al backend Java.'}} No compartas tu contraseña ni códigos 2FA.</small>
      </form></div>
    </div>
  `
})
export class LoginPageComponent {
  readonly demoMode=environment.demoMode; email=''; password=''; mfaCode='';
  readonly error=signal(''); readonly loading=signal(false); readonly showPassword=signal(false); readonly mfaChallenge=signal<string|null>(null);
  constructor(private readonly auth:AuthService,private readonly alerts:AlertService,private readonly errors:ApiErrorService,private readonly router:Router,private readonly route:ActivatedRoute){}
  fillDemo():void{this.email='owner@demo.com';this.password='Demo123*';this.error.set('');}
  togglePassword():void{this.showPassword.update(value=>!value);}
  async enterDemo():Promise<void>{this.fillDemo();await this.submit();}
  cancelMfa():void{this.mfaChallenge.set(null);this.mfaCode='';this.error.set('');}
  async submit():Promise<void>{
    this.error.set('');this.loading.set(true);
    try{
      if(this.mfaChallenge()) await this.auth.verifyMfa(this.mfaChallenge()!,this.mfaCode);
      else { const result=await this.auth.login(this.email,this.password); if(result.mfaRequired){this.mfaChallenge.set(result.challengeToken);return;} }
      await this.alerts.toast('Bienvenido a StayManager');
      const requested=this.route.snapshot.queryParamMap.get('returnUrl');
      const role=this.auth.currentUser()?.role;
      const compatible=requested&&((role==='CLIENT'&&requested.startsWith('/cliente'))||(role!=='CLIENT'&&requested.startsWith('/admin')));
      await this.router.navigateByUrl(compatible?requested!:this.auth.landingRoute());
    }catch(error){const message=error instanceof HttpErrorResponse&&error.status===401?'Verifica tus credenciales o el código de seguridad.':this.errors.message(error,'No fue posible iniciar sesión. Intenta nuevamente.');this.error.set(message);await this.alerts.error('No fue posible iniciar sesión',message);}
    finally{this.loading.set(false);}
  }
}
