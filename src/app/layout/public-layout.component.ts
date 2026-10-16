import { Component, DestroyRef, ElementRef, HostListener, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { filter } from 'rxjs';
import { StayManagerApiService } from '../core/services/staymanager-api.service';
import { environment } from '../../environments/environment';
import { FloatingWhatsappComponent } from '../shared/components/floating-whatsapp.component';

@Component({
  selector: 'app-public-layout',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, RouterOutlet, FloatingWhatsappComponent],
  styles: [`
    .public-menu-backdrop { display: none; }
    @media (max-width: 820px) {
      .public-menu-backdrop { display: block; position: fixed; z-index: 45; inset: 0; width: 100%; border: 0; background: rgba(5,22,19,.55); backdrop-filter: blur(3px); }
      .public-header nav { z-index: 2; max-height: calc(100vh - 92px); overflow-y: auto; }
      .menu-toggle { position: relative; z-index: 3; width: 42px; height: 42px; border-radius: 10px; display: grid; place-items: center; }
      .menu-toggle[aria-expanded="true"] { background: rgba(255,255,255,.16); }
    }
  `],
  template: `
    <header class="public-header" [class.scrolled]="scrolled()">
      <div class="container nav-wrap">
        <a routerLink="/" class="brand" aria-label="StayManager inicio">
          <span class="brand-mark">S</span>
          <span><strong>Stay</strong>Manager<small>by JGMSOLUTIONS</small></span>
        </a>
        @if (demoMode) { <span class="mode-badge"><i class="bi bi-stars"></i> Demo Netlify</span> }
        <button class="menu-toggle" type="button" (click)="toggleMenu($event)" [attr.aria-expanded]="menuOpen()" aria-controls="public-navigation" [attr.aria-label]="menuOpen() ? 'Cerrar menú' : 'Abrir menú'"><i [class]="menuOpen() ? 'bi bi-x-lg' : 'bi bi-list'"></i></button>
        <nav id="public-navigation" [class.open]="menuOpen()" aria-label="Navegación principal">
          <a routerLink="/" routerLinkActive="active" [routerLinkActiveOptions]="{exact:true}" (click)="closeMenu()">Inicio</a>
          <a routerLink="/alojamientos" routerLinkActive="active" (click)="closeMenu()">Alojamientos</a>
          <a routerLink="/mis-reservas" routerLinkActive="active" (click)="closeMenu()">Mis reservas</a>
          <a routerLink="/experiencias" routerLinkActive="active" (click)="closeMenu()">Experiencias</a>
          <a routerLink="/login" class="btn btn-outline btn-small" (click)="closeMenu()">Panel administrativo</a>
        </nav>
      </div>
    </header>
    @if (menuOpen()) { <button class="public-menu-backdrop" type="button" aria-label="Cerrar menú" (click)="closeMenu()"></button> }
    <main><router-outlet /></main>
    <footer class="public-footer">
      <div class="container footer-grid">
        <div><a routerLink="/" class="brand brand-light"><span class="brand-mark">S</span><span><strong>Stay</strong>Manager</span></a><p>Tecnología para alojamientos memorables y operaciones rentables.</p></div>
        <div><h4>Explora</h4><a routerLink="/alojamientos">Alojamientos</a><a routerLink="/experiencias">Experiencias</a><a routerLink="/mis-reservas">Mis reservas</a><a routerLink="/login">Acceso administrativo</a></div>
        <div><h4>Información</h4><a routerLink="/aviso-legal">Aviso legal</a><a routerLink="/politica-privacidad">Privacidad</a><a routerLink="/politica-cookies">Cookies</a></div>
        <div><h4>Contacto</h4><span>Colombia</span><a [href]="whatsappUrl" target="_blank" rel="noopener noreferrer">+57 323 309 8671</a><span>Atención por WhatsApp</span></div>
      </div>
      <div class="container footer-bottom"><span>© 2026 StayManager</span><span>Producto de JGMSOLUTIONS</span></div>
    </footer>
    <app-floating-whatsapp />
  `
})
export class PublicLayoutComponent {
  readonly demoMode = environment.demoMode;
  readonly whatsappUrl = `https://wa.me/${environment.whatsappNumber}?text=${encodeURIComponent(environment.whatsappMessage)}`;
  readonly menuOpen = signal(false);
  readonly scrolled = signal(false);

  constructor(
    store: StayManagerApiService,
    router: Router,
    destroyRef: DestroyRef,
    private readonly host: ElementRef<HTMLElement>
  ) {
    void store.loadPublicCatalog().catch(() => undefined);
    router.events.pipe(filter((event) => event instanceof NavigationEnd), takeUntilDestroyed(destroyRef))
      .subscribe(() => this.closeMenu());
  }

  toggleMenu(event: Event): void { event.stopPropagation(); this.menuOpen.update((open) => !open); }
  closeMenu(): void { this.menuOpen.set(false); }

  @HostListener('window:scroll') onScroll(): void { this.scrolled.set(window.scrollY > 20); }
  @HostListener('document:keydown.escape') onEscape(): void { this.closeMenu(); }
  @HostListener('document:click', ['$event']) onDocumentClick(event: Event): void {
    if (!this.menuOpen()) return;
    const target = event.target;
    if (target instanceof Node && !this.host.nativeElement.querySelector('nav')?.contains(target)) this.closeMenu();
  }
}
