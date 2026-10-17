import { Component } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from '../core/services/auth.service';

@Component({
  selector: 'app-client-shell', standalone: true, imports: [RouterLink, RouterLinkActive, RouterOutlet],
  template: `
    <div class="client-shell"><header><a routerLink="/" class="brand"><span class="brand-mark">S</span><span><strong>Stay</strong>Manager</span></a><nav><a routerLink="/cliente" routerLinkActive="active" [routerLinkActiveOptions]="{exact:true}"><i class="bi bi-calendar2-check"></i> Mis reservas</a><a routerLink="/cliente/perfil" routerLinkActive="active"><i class="bi bi-person"></i> Mi perfil</a><a routerLink="/cliente/seguridad" routerLinkActive="active"><i class="bi bi-shield-lock"></i> Seguridad</a></nav><div class="client-user"><span>{{initials()}}</span><div><strong>{{auth.currentUser()?.fullName}}</strong><small>Huésped</small></div><button type="button" (click)="logout()" aria-label="Cerrar sesión" title="Cerrar sesión"><i class="bi bi-box-arrow-right"></i></button></div></header><main><router-outlet /></main></div>
  `,
  styles: [`
    :host{display:block;min-height:100vh;background:#f4f7f6}.client-shell>header{min-height:74px;display:grid;grid-template-columns:auto 1fr auto;align-items:center;gap:2rem;padding:.8rem clamp(1rem,4vw,4rem);background:#fff;border-bottom:1px solid var(--line);position:sticky;top:0;z-index:30}.client-shell nav{display:flex;justify-content:center;gap:.3rem}.client-shell nav a{display:flex;gap:.4rem;align-items:center;padding:.65rem .8rem;border-radius:9px;color:var(--muted);font-size:.68rem;font-weight:800}.client-shell nav a.active{background:var(--primary-soft);color:var(--primary)}.client-user{display:flex;align-items:center;gap:.55rem}.client-user>span{width:36px;height:36px;display:grid;place-items:center;border-radius:50%;background:var(--primary);color:#fff;font-size:.65rem;font-weight:900}.client-user div{display:flex;flex-direction:column;max-width:150px}.client-user strong{font-size:.68rem;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.client-user small{font-size:.56rem;color:var(--muted)}.client-user button{border:0;background:transparent;color:var(--muted);font-size:1rem}.client-shell main{width:min(1180px,calc(100% - 2rem));margin:0 auto;padding:2rem 0 4rem}@media(max-width:850px){.client-shell>header{grid-template-columns:1fr auto;gap:.8rem}.client-shell nav{grid-column:1/-1;grid-row:2;justify-content:stretch;overflow:auto}.client-shell nav a{flex:1;justify-content:center;white-space:nowrap}.client-user div{display:none}}@media(max-width:520px){.client-shell nav a{font-size:0}.client-shell nav i{font-size:1.1rem}.client-shell main{padding-top:1.2rem}}
  `]
})
export class ClientShellComponent {
  constructor(readonly auth: AuthService, private readonly router: Router) {}
  initials(): string { return (this.auth.currentUser()?.fullName ?? 'SM').split(/\s+/).slice(0, 2).map((part) => part[0]).join('').toUpperCase(); }
  logout(): void { this.auth.logout(); void this.router.navigateByUrl('/login'); }
}
