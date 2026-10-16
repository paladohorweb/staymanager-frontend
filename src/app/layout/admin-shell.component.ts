import { Component, signal } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from '../core/services/auth.service';
import { AlertService } from '../core/services/alert.service';
import { StayManagerApiService } from '../core/services/staymanager-api.service';
import { FloatingWhatsappComponent } from '../shared/components/floating-whatsapp.component';

@Component({
  selector: 'app-admin-shell',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, RouterOutlet, FloatingWhatsappComponent],
  template: `
    <div class="admin-shell" [class.sidebar-open]="sidebarOpen()">
      <aside class="sidebar">
        <a routerLink="/admin" class="brand brand-light sidebar-brand">
          <span class="brand-mark">S</span><span><strong>Stay</strong>Manager<small>OPERACIONES</small></span>
        </a>
        <div class="workspace-card">
          <span class="workspace-logo">RB</span>
          <div><strong>Refugios del Bosque</strong><small>Plan Profesional</small></div>
        </div>
        @if (store.isDemoMode) { <div class="sidebar-demo-badge"><i class="bi bi-database"></i> Datos de demostración</div> }
        <nav class="side-nav" (click)="sidebarOpen.set(false)">
          <span class="nav-caption">GESTIÓN</span>
          <a routerLink="/admin" routerLinkActive="active" [routerLinkActiveOptions]="{exact:true}"><span>⌂</span> Resumen</a>
          <a routerLink="/admin/reservas" routerLinkActive="active"><span>▣</span> Reservas</a>
          <a routerLink="/admin/alojamientos" routerLinkActive="active"><span>⌁</span> Alojamientos</a>
          <a routerLink="/admin/pagos" routerLinkActive="active"><span>$</span> Pagos</a>
          <span class="nav-caption">OPERACIÓN</span>
          <a class="disabled"><span>✓</span> Check-in</a>
          <a class="disabled"><span>✦</span> Limpieza</a>
          <a class="disabled"><span>⚙</span> Configuración</a>
        </nav>
        <a routerLink="/" class="back-public">← Ver portal público</a>
      </aside>
      <div class="sidebar-overlay" (click)="sidebarOpen.set(false)"></div>
      <section class="admin-main">
        <header class="admin-topbar">
          <button class="icon-button mobile-only" type="button" (click)="sidebarOpen.set(true)">☰</button>
          <div><strong>Centro de operaciones</strong><small>{{ currentDate }}</small></div>
          <div class="top-actions">
            <button class="icon-button" type="button" aria-label="Notificaciones">♢<i></i></button>
            <div class="user-menu"><span class="avatar">VG</span><div><strong>{{ auth.currentUser()?.fullName }}</strong><small>Propietaria</small></div></div>
            <button class="text-button" type="button" (click)="logout()"><i class="bi bi-box-arrow-right me-1"></i>Salir</button>
          </div>
        </header>
        <main class="admin-content"><router-outlet /></main>
      </section>
    </div>
    <app-floating-whatsapp />
  `
})
export class AdminShellComponent {
  readonly sidebarOpen = signal(false);
  readonly currentDate = new Intl.DateTimeFormat('es-CO', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
  }).format(new Date());
  constructor(
    readonly auth: AuthService,
    readonly store: StayManagerApiService,
    private readonly alerts: AlertService,
    private readonly router: Router
  ) {
    void this.store.loadAdminData().catch(() => this.alerts.error('No pudimos cargar el panel', this.store.error()));
  }

  logout(): void {
    this.auth.logout();
    void this.alerts.toast('Sesión cerrada', 'info');
    void this.router.navigate(['/login']);
  }
}

