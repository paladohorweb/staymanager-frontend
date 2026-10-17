import { Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { AlertService } from '../../core/services/alert.service';
import { ApiErrorService } from '../../core/services/api-error.service';

@Component({
  selector: 'app-profile-page', standalone: true, imports: [FormsModule, RouterLink],
  template: `
    <section class="profile-heading"><div><span class="eyebrow">MI CUENTA</span><h1>Perfil personal</h1><p>Estos datos identifican tu cuenta y ayudan a completar {{isClient()?'tus reservas':'la gestión de tu negocio'}}.</p></div><span class="role-badge"><i class="bi" [class.bi-suitcase2]="isClient()" [class.bi-building]="!isClient()"></i>{{isClient()?'Huésped':'Propietario'}}</span></section>
    <div class="profile-grid">
      <form class="panel profile-card" #form="ngForm" (ngSubmit)="save()">
        <div class="profile-avatar">{{initials()}}</div><div class="profile-title"><h2>Información personal</h2><p>Actualiza los datos que StayManager usará para contactarte.</p></div>
        <div class="form-grid two"><label>Nombre completo<input name="fullName" [(ngModel)]="fullName" required maxlength="120" autocomplete="name"></label><label>Correo de acceso<input [value]="auth.currentUser()?.email" disabled><small>El correo identifica tu sesión y no se cambia desde aquí.</small></label><label>Teléfono<input name="phone" [(ngModel)]="phone" maxlength="40" autocomplete="tel" placeholder="300 000 0000"></label><label>Documento<input name="documentNumber" [(ngModel)]="documentNumber" maxlength="40" placeholder="Cédula o pasaporte"></label></div>
        <div class="profile-actions"><span><i class="bi bi-shield-check"></i> Tus datos se guardan de forma privada.</span><button class="btn btn-primary" [disabled]="form.invalid||saving()">@if(saving()){<span class="spinner-border spinner-border-sm me-2"></span>}Guardar perfil</button></div>
      </form>
      <aside class="panel account-summary"><span class="summary-icon"><i class="bi bi-person-check"></i></span><h2>Cuenta y seguridad</h2><p>Usa una contraseña única y activa la verificación en dos pasos para proteger el acceso.</p><dl><div><dt>Tipo de cuenta</dt><dd>{{isClient()?'Huésped':'Equipo del alojamiento'}}</dd></div><div><dt>2FA</dt><dd [class.ready]="auth.currentUser()?.mfaEnabled">{{auth.currentUser()?.mfaEnabled?'Activado':'Pendiente'}}</dd></div></dl><a class="btn btn-outline btn-block" [routerLink]="securityRoute()">Administrar seguridad</a></aside>
    </div>
  `,
  styles: [`
    .profile-heading{display:flex;justify-content:space-between;gap:1rem;align-items:flex-start;margin-bottom:1.25rem}.profile-heading h1{margin:.25rem 0}.role-badge{display:flex;gap:.4rem;align-items:center;padding:.55rem .8rem;border-radius:999px;background:var(--primary-soft);color:var(--primary);font-size:.68rem;font-weight:800}.profile-grid{display:grid;grid-template-columns:minmax(0,1.65fr) minmax(260px,.7fr);gap:1rem}.profile-card,.account-summary{padding:1.5rem}.profile-avatar{width:62px;height:62px;display:grid;place-items:center;border-radius:18px;background:var(--primary);color:#fff;font-size:1.15rem;font-weight:900}.profile-title{margin:.8rem 0 1.2rem}.profile-title h2,.account-summary h2{font-size:1rem;margin:0}.profile-title p,.account-summary p{font-size:.7rem;margin:.3rem 0}.profile-card label small{display:block;margin-top:.25rem;color:var(--muted);font-size:.58rem}.profile-actions{display:flex;justify-content:space-between;align-items:center;gap:1rem;margin-top:1.2rem;padding-top:1rem;border-top:1px solid var(--line)}.profile-actions span{font-size:.64rem;color:var(--muted)}.summary-icon{width:48px;height:48px;display:grid;place-items:center;border-radius:14px;background:#e6f3ef;color:var(--primary);font-size:1.25rem}.account-summary dl{margin:1.2rem 0}.account-summary dl div{display:flex;justify-content:space-between;padding:.7rem 0;border-bottom:1px solid var(--line);font-size:.68rem}.account-summary dd{margin:0;font-weight:800;color:#a76a00}.account-summary dd.ready{color:#157347}@media(max-width:850px){.profile-grid{grid-template-columns:1fr}}@media(max-width:600px){.profile-heading,.profile-actions{align-items:stretch;flex-direction:column}.form-grid.two{grid-template-columns:1fr}.profile-actions .btn{width:100%}}
  `]
})
export class ProfilePageComponent {
  fullName = this.auth.currentUser()?.fullName ?? '';
  phone = this.auth.currentUser()?.phone ?? '';
  documentNumber = this.auth.currentUser()?.documentNumber ?? '';
  readonly saving = signal(false);
  constructor(readonly auth: AuthService, private readonly alerts: AlertService, private readonly errors: ApiErrorService) {}
  isClient(): boolean { return this.auth.currentUser()?.role === 'CLIENT'; }
  securityRoute(): string { return this.isClient() ? '/cliente/seguridad' : '/admin/seguridad'; }
  initials(): string { return this.fullName.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]).join('').toUpperCase() || 'SM'; }
  async save(): Promise<void> {
    this.saving.set(true);
    try { await this.auth.updateProfile({ fullName: this.fullName, phone: this.phone, documentNumber: this.documentNumber }); await this.alerts.toast('Perfil actualizado'); }
    catch (error) { await this.alerts.error('No se pudo guardar', this.errors.message(error)); }
    finally { this.saving.set(false); }
  }
}
