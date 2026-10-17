import { Component, DestroyRef, ElementRef, HostListener, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { filter } from 'rxjs';
import { AuthService } from '../core/services/auth.service';
import { AlertService } from '../core/services/alert.service';
import { StayManagerApiService } from '../core/services/staymanager-api.service';
import { FloatingWhatsappComponent } from '../shared/components/floating-whatsapp.component';

@Component({
  selector: 'app-admin-shell', standalone: true,
  imports: [RouterLink, RouterLinkActive, RouterOutlet, FloatingWhatsappComponent],
  template: `
    <div class="admin-shell" [class.sidebar-open]="sidebarOpen()" [class.sidebar-collapsed]="sidebarCollapsed()">
      <aside class="sidebar" id="admin-sidebar">
        <div class="sidebar-brand-row"><a routerLink="/admin" class="brand brand-light sidebar-brand"><span class="brand-mark">S</span><span class="sidebar-detail"><strong>Stay</strong>Manager<small>OPERACIONES</small></span></a><button class="sidebar-collapse-button" type="button" (click)="toggleSidebarCollapse()" [attr.aria-label]="sidebarCollapsed()?'Expandir menú':'Contraer menú'" [title]="sidebarCollapsed()?'Expandir menú':'Contraer menú'"><i [class]="sidebarCollapsed()?'bi bi-chevron-double-right':'bi bi-chevron-double-left'"></i></button></div>
        <div class="workspace-card"><span class="workspace-logo">RB</span><div class="sidebar-detail"><strong>{{store.settings()?.organizationName||'Refugios del Bosque'}}</strong><small>Plan Profesional</small></div></div>
        @if (store.isDemoMode) { <div class="sidebar-demo-badge"><i class="bi bi-database"></i><span class="sidebar-detail"> Datos de demostración</span></div> }
        <nav class="side-nav" (click)="closePanels()">
          <span class="nav-caption">GESTIÓN</span>
          <a routerLink="/admin/bienvenida" routerLinkActive="active" title="Primeros pasos"><span><i class="bi bi-rocket-takeoff"></i></span><b class="sidebar-detail">Primeros pasos</b></a>
          <a routerLink="/admin" routerLinkActive="active" [routerLinkActiveOptions]="{exact:true}" title="Resumen"><span><i class="bi bi-grid"></i></span><b class="sidebar-detail">Resumen</b></a>
          <a routerLink="/admin/reservas" routerLinkActive="active" title="Reservas"><span><i class="bi bi-calendar3"></i></span><b class="sidebar-detail">Reservas</b></a>
          <a routerLink="/admin/alojamientos" routerLinkActive="active" title="Alojamientos"><span><i class="bi bi-houses"></i></span><b class="sidebar-detail">Alojamientos</b></a>
          <a routerLink="/admin/pagos" routerLinkActive="active" title="Pagos"><span><i class="bi bi-cash-coin"></i></span><b class="sidebar-detail">Pagos</b></a>
          <span class="nav-caption">OPERACIÓN</span>
          <a routerLink="/admin/operacion" routerLinkActive="active" title="Check-in y check-out"><span><i class="bi bi-box-arrow-in-right"></i></span><b class="sidebar-detail">Check-in / out</b></a>
          <a routerLink="/admin/limpieza" routerLinkActive="active" title="Limpieza"><span><i class="bi bi-stars"></i></span><b class="sidebar-detail">Limpieza</b></a>
          <a routerLink="/admin/configuracion" routerLinkActive="active" title="Configuración"><span><i class="bi bi-gear"></i></span><b class="sidebar-detail">Configuración</b></a>
          <a routerLink="/admin/perfil" routerLinkActive="active" title="Mi perfil"><span><i class="bi bi-person-circle"></i></span><b class="sidebar-detail">Mi perfil</b></a>
          <a routerLink="/admin/seguridad" routerLinkActive="active" title="Cuenta y seguridad"><span><i class="bi bi-shield-lock"></i></span><b class="sidebar-detail">Cuenta y seguridad</b></a>
        </nav>
        <a routerLink="/" class="back-public" (click)="closePanels()" title="Ver portal público"><i class="bi bi-arrow-left"></i><span class="sidebar-detail"> Ver portal público</span></a>
      </aside>
      <button class="sidebar-overlay" type="button" aria-label="Cerrar menú" (click)="closePanels()"></button>
      <section class="admin-main">
        <header class="admin-topbar">
          <button class="icon-button mobile-only" type="button" (click)="toggleSidebar()" [attr.aria-expanded]="sidebarOpen()" aria-controls="admin-sidebar" [attr.aria-label]="sidebarOpen() ? 'Cerrar menú' : 'Abrir menú'"><i [class]="sidebarOpen() ? 'bi bi-x-lg' : 'bi bi-list'"></i></button>
          <div><strong>Centro de operaciones</strong><small>{{ currentDate }}</small></div>
          <div class="top-actions">
            <div class="notification-wrap">
              <button class="icon-button" type="button" aria-label="Notificaciones" (click)="toggleNotifications($event)"><i class="bi bi-bell"></i>@if (store.unreadNotifications()) { <span class="notification-count">{{ store.unreadNotifications() }}</span> }</button>
              @if (notificationsOpen()) { <div class="notification-panel"><div class="notification-header"><strong>Notificaciones</strong><small>{{ store.unreadNotifications() }} sin leer</small></div>@for (item of store.notifications(); track item.id) { <a [routerLink]="item.link || '/admin'" class="notification-item" [class.unread]="!item.readAt" (click)="openNotification(item.id)"><span class="notification-icon"><i [class]="notificationIcon(item.type)"></i></span><span><strong>{{ item.title }}</strong><small>{{ item.message }}</small></span></a> } @empty { <p class="notification-empty">No hay novedades por ahora.</p> }</div> }
            </div>
            <div class="user-menu"><span class="avatar">VG</span><div><strong>{{ auth.currentUser()?.fullName }}</strong><small>Propietaria</small></div></div>
            <button class="text-button" type="button" (click)="logout()"><i class="bi bi-box-arrow-right me-1"></i>Salir</button>
          </div>
        </header>
        <main class="admin-content"><router-outlet /></main>
      </section>
    </div><app-floating-whatsapp />
  `
})
export class AdminShellComponent {
  readonly sidebarOpen = signal(false);
  readonly sidebarCollapsed = signal(this.readSidebarPreference());
  readonly notificationsOpen = signal(false);
  readonly currentDate = new Intl.DateTimeFormat('es-CO', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).format(new Date());
  constructor(
    readonly auth: AuthService, readonly store: StayManagerApiService,
    private readonly alerts: AlertService, private readonly router: Router,
    destroyRef: DestroyRef, private readonly host: ElementRef<HTMLElement>
  ) {
    void this.store.loadAdminData().catch(() => this.alerts.error('No pudimos cargar el panel', this.store.error()));
    router.events.pipe(filter((event) => event instanceof NavigationEnd), takeUntilDestroyed(destroyRef))
      .subscribe(() => this.closePanels());
  }
  toggleSidebar(): void { this.sidebarOpen.update((open) => !open); }
  toggleSidebarCollapse(): void {
    this.sidebarCollapsed.update((collapsed) => !collapsed);
    localStorage.setItem('staymanager.admin.sidebar-collapsed', String(this.sidebarCollapsed()));
  }
  closePanels(): void { this.sidebarOpen.set(false); this.notificationsOpen.set(false); }
  toggleNotifications(event: Event): void { event.stopPropagation(); this.notificationsOpen.update((open) => !open); }
  @HostListener('document:keydown.escape') onEscape(): void { this.closePanels(); }
  @HostListener('document:click', ['$event']) onDocumentClick(event: Event): void {
    if (!this.notificationsOpen()) return;
    const target = event.target;
    const panel = this.host.nativeElement.querySelector('.notification-wrap');
    if (target instanceof Node && !panel?.contains(target)) this.notificationsOpen.set(false);
  }
  logout(): void { this.auth.logout(); void this.alerts.toast('Sesión cerrada', 'info'); void this.router.navigate(['/login']); }
  openNotification(id: string): void { this.notificationsOpen.set(false); void this.store.markNotificationRead(id); }
  notificationIcon(type: string): string { return type === 'PAYMENT' ? 'bi bi-cash-coin' : type === 'STAY' ? 'bi bi-calendar-check' : 'bi bi-calendar-plus'; }
  private readSidebarPreference(): boolean {
    try { return localStorage.getItem('staymanager.admin.sidebar-collapsed') === 'true'; }
    catch { return false; }
  }
}
