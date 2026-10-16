import { Component, HostListener, signal } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { StayManagerApiService } from '../core/services/staymanager-api.service';
import { environment } from '../../environments/environment';
import { FloatingWhatsappComponent } from '../shared/components/floating-whatsapp.component';

@Component({
  selector: 'app-public-layout',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, RouterOutlet, FloatingWhatsappComponent],
  template: `
    <header class="public-header" [class.scrolled]="scrolled()">
      <div class="container nav-wrap">
        <a routerLink="/" class="brand" aria-label="StayManager inicio">
          <span class="brand-mark">S</span>
          <span><strong>Stay</strong>Manager<small>by JGMSOLUTIONS</small></span>
        </a>
        @if (demoMode) { <span class="mode-badge"><i class="bi bi-stars"></i> Demo Netlify</span> }
        <button class="menu-toggle" type="button" (click)="menuOpen.set(!menuOpen())" aria-label="Abrir menú">☰</button>
        <nav [class.open]="menuOpen()">
          <a routerLink="/" routerLinkActive="active" [routerLinkActiveOptions]="{exact:true}" (click)="menuOpen.set(false)">Inicio</a>
          <a routerLink="/alojamientos" routerLinkActive="active" (click)="menuOpen.set(false)">Alojamientos</a>
          <a href="#experiencia" (click)="menuOpen.set(false)">Experiencia</a>
          <a routerLink="/login" class="btn btn-outline btn-small" (click)="menuOpen.set(false)">Panel administrativo</a>
        </nav>
      </div>
    </header>
    <main><router-outlet /></main>
    <footer class="public-footer">
      <div class="container footer-grid">
        <div>
          <a routerLink="/" class="brand brand-light"><span class="brand-mark">S</span><span><strong>Stay</strong>Manager</span></a>
          <p>Tecnología para alojamientos memorables y operaciones rentables.</p>
        </div>
        <div><h4>Explora</h4><a routerLink="/alojamientos">Alojamientos</a><a routerLink="/login">Acceso administrativo</a></div>
        <div><h4>Información</h4><a href="#">Términos</a><a href="#">Privacidad</a><a href="#">Cancelaciones</a></div>
        <div><h4>Contacto</h4><span>Guatapé, Colombia</span><span>+57 300 555 0101</span><span>reservas&#64;refugios.co</span></div>
      </div>
      <div class="container footer-bottom"><span>© 2026 StayManager</span><span>Producto demo de JGMSOLUTIONS</span></div>
    </footer>
    <app-floating-whatsapp />
  `
})
export class PublicLayoutComponent {
  readonly demoMode = environment.demoMode;
  readonly menuOpen = signal(false);
  readonly scrolled = signal(false);

  constructor(store: StayManagerApiService) {
    void store.loadPublicCatalog().catch(() => undefined);
  }

  @HostListener('window:scroll') onScroll(): void {
    this.scrolled.set(window.scrollY > 20);
  }
}

