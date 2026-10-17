import { Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { AlertService } from '../../core/services/alert.service';
import { ApiErrorService } from '../../core/services/api-error.service';
import { environment } from '../../../environments/environment';

@Component({
  selector:'app-register-page',standalone:true,imports:[FormsModule,RouterLink],
  styles:[`
    .auth-shell{min-height:100vh;display:grid;place-items:center;padding:7rem 1rem 3rem;background:radial-gradient(circle at 15% 10%,#dcefe9,transparent 35%),#f7faf9}.auth-card{width:min(720px,100%);padding:2rem}.auth-header{text-align:center;max-width:520px;margin:0 auto 1.5rem}.auth-header h1{font:400 clamp(2rem,5vw,3.2rem) Georgia,serif}.benefits{display:grid;grid-template-columns:repeat(3,1fr);gap:.7rem;margin:1rem 0 1.4rem}.benefits div{padding:.8rem;border-radius:10px;background:#f2f7f5;font-size:.67rem;color:var(--muted)}.benefits i{display:block;color:var(--primary);font-size:1rem;margin-bottom:.3rem}.password-hint{font-size:.62rem;color:var(--muted);margin-top:.35rem}.legal-check{display:flex;gap:.6rem;align-items:flex-start;font-size:.7rem}.legal-check input{width:auto;margin-top:.18rem}.demo-lock{text-align:center;padding:1.2rem;background:#fff8e8;border-radius:12px}@media(max-width:620px){.benefits,.form-grid.two{grid-template-columns:1fr}.auth-card{padding:1.3rem}}
  `],
  template:`<main class="auth-shell"><section class="card-panel auth-card"><div class="auth-header"><a routerLink="/" class="brand justify-content-center mb-4"><span class="brand-mark">S</span><span><strong>Stay</strong>Manager</span></a><span class="eyebrow">EMPIEZA TU OPERACIÓN DIGITAL</span><h1>Crea el espacio de tu alojamiento</h1><p>Obtén una cuenta propietaria y configura cabañas, reservas, pagos y equipo desde un solo lugar.</p></div>
    @if(demoMode){<div class="demo-lock"><strong>Registro no disponible en la demo pública</strong><p>Ejecuta el entorno local conectado a Spring Boot para probar este flujo.</p><a class="btn btn-primary" routerLink="/login">Volver al acceso demo</a></div>}@else{
    <div class="benefits"><div><i class="bi bi-building-check"></i>Organización separada y segura</div><div><i class="bi bi-shield-check"></i>Contraseña robusta y 2FA</div><div><i class="bi bi-rocket-takeoff"></i>Plan de prueba listo para configurar</div></div>
    <form #form="ngForm" (ngSubmit)="submit()"><div class="form-grid two"><label>Tu nombre completo<input name="fullName" [(ngModel)]="fullName" required maxlength="120" autocomplete="name"></label><label>Nombre del alojamiento<input name="organizationName" [(ngModel)]="organizationName" required maxlength="120" placeholder="Cabañas La Montaña"></label><label class="span-two">Correo administrativo<input type="email" name="email" [(ngModel)]="email" required email maxlength="180" autocomplete="email"></label><label>Contraseña<input type="password" name="password" [(ngModel)]="password" required minlength="10" maxlength="72" autocomplete="new-password"><small class="password-hint">Mínimo 10 caracteres, mayúscula, minúscula, número y símbolo.</small></label><label>Confirmar contraseña<input type="password" name="confirmation" [(ngModel)]="confirmation" required autocomplete="new-password"></label></div>
    <label class="legal-check"><input type="checkbox" name="acceptedTerms" [(ngModel)]="acceptedTerms" required><span>Acepto los <a routerLink="/aviso-legal" target="_blank">términos</a> y la <a routerLink="/politica-privacidad" target="_blank">política de privacidad</a>.</span></label>
    @if(error()){<div class="alert alert-danger mt-3">{{error()}}</div>}<button class="btn btn-primary btn-block mt-3" type="submit" [disabled]="form.invalid||!passwordsMatch()||loading()">@if(loading()){<span class="spinner-border spinner-border-sm me-2"></span>}Crear mi cuenta</button><p class="text-center mt-3 mb-0"><a routerLink="/login">Ya tengo una cuenta</a></p></form>}
  </section></main>`
})
export class RegisterPageComponent{
  readonly demoMode=environment.demoMode;fullName='';organizationName='';email='';password='';confirmation='';acceptedTerms=false;
  readonly loading=signal(false);readonly error=signal('');
  constructor(private readonly auth:AuthService,private readonly alerts:AlertService,private readonly errors:ApiErrorService,private readonly router:Router){}
  passwordsMatch():boolean{return this.password===this.confirmation;}
  async submit():Promise<void>{if(!this.passwordsMatch()){this.error.set('Las contraseñas no coinciden.');return;}this.loading.set(true);this.error.set('');try{await this.auth.register({fullName:this.fullName,organizationName:this.organizationName,email:this.email,password:this.password,acceptedTerms:this.acceptedTerms});await this.alerts.success('Cuenta creada','Tu espacio de StayManager está listo para configurar.');await this.router.navigateByUrl('/admin/configuracion');}catch(error){this.error.set(this.errors.message(error,'No fue posible crear la cuenta.'));}finally{this.loading.set(false);}}
}
