import { Component, computed, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { StayManagerApiService } from '../../core/services/staymanager-api.service';
import { currency, optimizedImageUrl } from '../../shared/utils/format.utils';

@Component({
  selector: 'app-home-page',
  standalone: true,
  imports: [FormsModule, RouterLink],
  template: `
    <section class="hero">
      <div class="hero-overlay"></div>
      <div class="container hero-content">
        <span class="eyebrow light">RESPIRA · DESCONECTA · RECUERDA</span>
        <h1>El descanso que estabas<br><em>buscando.</em></h1>
        <p>Refugios extraordinarios en medio de la naturaleza, seleccionados para vivir sin prisa.</p>
        <form class="search-panel" (ngSubmit)="search()">
          <label><span>Entrada</span><input type="date" name="checkIn" [(ngModel)]="checkIn" [min]="today"></label>
          <label><span>Salida</span><input type="date" name="checkOut" [(ngModel)]="checkOut" [min]="checkIn || today"></label>
          <label><span>Huéspedes</span><select name="guests" [(ngModel)]="guests"><option [ngValue]="1">1 huésped</option><option [ngValue]="2">2 huéspedes</option><option [ngValue]="4">4 huéspedes</option><option [ngValue]="6">6 huéspedes</option></select></label>
          <button class="btn btn-primary btn-search" type="submit">Consultar disponibilidad →</button>
        </form>
      </div>
      <div class="hero-trust container"><span>★ 4.9 · Experiencias excepcionales</span><span>Pago seguro</span><span>Atención personalizada</span></div>
    </section>

    <section class="section featured-section">
      <div class="container">
        <div class="section-heading"><div><span class="eyebrow">ALOJAMIENTOS DESTACADOS</span><h2>Encuentra tu próximo refugio</h2></div><a routerLink="/alojamientos" class="text-link">Ver todos →</a></div>
        @if (store.loading()) { <div class="d-flex justify-content-center py-5"><div class="spinner-border text-primary" role="status"><span class="visually-hidden">Cargando</span></div></div> }
        @if (store.error()) { <div class="alert alert-warning" role="alert"><i class="bi bi-exclamation-triangle me-2"></i>{{ store.error() }}</div> }
        <div class="accommodation-grid">
          @for (item of featured(); track item.id) {
            <article class="stay-card">
              <div class="stay-image" [style.background-image]="'url(' + image(item.imageUrl, 760) + ')'">
                <span class="card-badge">{{ item.type === 'GLAMPING' ? 'Glamping' : 'Cabaña' }}</span>
                <button class="favorite" type="button" aria-label="Guardar">♡</button>
              </div>
              <div class="stay-body">
                <div class="stay-location">⌖ {{ propertyName(item.propertyId) }}</div>
                <h3>{{ item.name }}</h3>
                <p>{{ item.description }}</p>
                <div class="amenity-row"><span>♙ {{ item.capacity }}</span><span>⌂ {{ item.bedrooms }} hab.</span><span>◉ {{ item.bathrooms }} baño</span></div>
                <div class="stay-footer"><div><small>Desde</small><strong>{{ money(item.baseNightPrice) }} <small>/ noche</small></strong></div><a [routerLink]="['/reservar', item.id]" class="btn btn-dark btn-small">Reservar</a></div>
              </div>
            </article>
          }
        </div>
      </div>
    </section>

    <section id="experiencia" class="experience-section">
      <div class="experience-image"></div>
      <div class="experience-copy">
        <span class="eyebrow light">MÁS QUE UNA ESTADÍA</span>
        <h2>Momentos que permanecen</h2>
        <p>Cada detalle ha sido pensado para que vuelvas a lo esencial: la conversación, el paisaje y el tiempo compartido.</p>
        <div class="experience-list"><span><b>01</b> Hospitalidad cercana</span><span><b>02</b> Naturaleza auténtica</span><span><b>03</b> Privacidad real</span></div>
        <a routerLink="/alojamientos" class="btn btn-light">Explorar refugios</a>
      </div>
    </section>

    <section class="section stats-section">
      <div class="container stats-grid"><div><strong>4.9</strong><span>Calificación promedio</span></div><div><strong>+1.200</strong><span>Huéspedes felices</span></div><div><strong>3</strong><span>Refugios únicos</span></div><div><strong>24/7</strong><span>Acompañamiento</span></div></div>
    </section>
  `
})
export class HomePageComponent {
  readonly today = new Date().toISOString().slice(0, 10);
  checkIn = '';
  checkOut = '';
  guests = 2;
  readonly featured = computed(() => this.store.activeAccommodations().slice(0, 3));
  readonly searchTouched = signal(false);
  readonly money = currency;
  readonly image = optimizedImageUrl;

  constructor(readonly store: StayManagerApiService, private readonly router: Router) {}

  propertyName(propertyId: string): string {
    const property = this.store.propertyById(propertyId);
    return property ? `${property.location}` : 'Colombia';
  }

  search(): void {
    const queryParams: Record<string, string | number> = { guests: this.guests };
    if (this.checkIn) queryParams['checkIn'] = this.checkIn;
    if (this.checkOut) queryParams['checkOut'] = this.checkOut;
    void this.router.navigate(['/alojamientos'], { queryParams });
  }
}
