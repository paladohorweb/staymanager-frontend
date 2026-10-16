import { Component, computed, effect, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { AlertService } from '../../core/services/alert.service';
import { StayManagerApiService } from '../../core/services/staymanager-api.service';
import { currency, optimizedImageUrl } from '../../shared/utils/format.utils';

@Component({
  selector: 'app-explore-page',
  standalone: true,
  imports: [FormsModule, RouterLink],
  template: `
    <section class="page-hero compact-hero"><div class="container"><span class="eyebrow light">REFUGIOS SELECCIONADOS</span><h1>Tu lugar en la naturaleza</h1><p>Compara disponibilidad, capacidad y experiencias.</p></div></section>
    <section class="section explore-section">
      <div class="container">
        <div class="filter-bar">
          <label><span>Entrada</span><input type="date" [(ngModel)]="checkIn" (ngModelChange)="refresh()"></label>
          <label><span>Salida</span><input type="date" [(ngModel)]="checkOut" (ngModelChange)="refresh()"></label>
          <label><span>Huéspedes</span><select [(ngModel)]="guests" (ngModelChange)="refresh()"><option [ngValue]="1">1</option><option [ngValue]="2">2</option><option [ngValue]="3">3</option><option [ngValue]="4">4</option><option [ngValue]="5">5</option><option [ngValue]="6">6</option></select></label>
          <span class="results-count">@if (checking()) { <span class="spinner-border spinner-border-sm me-2" aria-hidden="true"></span> }<strong>{{ results().length }}</strong> alojamientos disponibles</span>
        </div>
        <div class="explore-grid">
          @for (item of results(); track item.id) {
            <article class="horizontal-stay-card">
              <div class="horizontal-image" [style.background-image]="'url(' + image(item.imageUrl, 900) + ')'">
                @if (checkIn && checkOut) { <span class="availability-badge">✓ Disponible</span> }
              </div>
              <div class="horizontal-body">
                <span class="stay-location">⌖ {{ propertyLabel(item.propertyId) }}</span><h2>{{ item.name }}</h2><p>{{ item.description }}</p>
                <div class="amenities-list">@for (amenity of item.amenities.slice(0, 4); track amenity) { <span>{{ amenity }}</span> }</div>
                <div class="stay-footer"><div><small>Por noche desde</small><strong>{{ money(item.baseNightPrice) }}</strong></div><a [routerLink]="['/reservar', item.id]" [queryParams]="{checkIn, checkOut, guests}" class="btn btn-primary">Ver disponibilidad</a></div>
              </div>
            </article>
          } @empty {
            <div class="empty-state"><span>⌁</span><h3>No encontramos disponibilidad</h3><p>Prueba otras fechas o reduce la cantidad de huéspedes.</p><button class="btn btn-outline" type="button" (click)="clearFilters()">Limpiar búsqueda</button></div>
          }
        </div>
      </div>
    </section>
  `
})
export class ExplorePageComponent {
  checkIn = '';
  checkOut = '';
  guests = 2;
  readonly refreshToken = signal(0);
  readonly unavailableIds = signal(new Set<string>());
  readonly checking = signal(false);
  readonly money = currency;
  readonly image = optimizedImageUrl;
  readonly results = computed(() => {
    this.refreshToken();
    return this.store.activeAccommodations().filter((item) =>
      item.capacity >= Number(this.guests) && !this.unavailableIds().has(item.id)
    );
  });

  private availabilityRequest = 0;

  constructor(readonly store: StayManagerApiService, route: ActivatedRoute, private readonly alerts: AlertService) {
    this.checkIn = route.snapshot.queryParamMap.get('checkIn') ?? '';
    this.checkOut = route.snapshot.queryParamMap.get('checkOut') ?? '';
    this.guests = Number(route.snapshot.queryParamMap.get('guests') ?? 2);
    effect(() => {
      if (this.store.activeAccommodations().length) void this.refresh();
    }, { allowSignalWrites: true });
  }

  async refresh(): Promise<void> {
    const request = ++this.availabilityRequest;
    this.refreshToken.update((value) => value + 1);
    if (!this.checkIn || !this.checkOut || this.checkIn >= this.checkOut) {
      this.unavailableIds.set(new Set());
      return;
    }
    this.checking.set(true);
    try {
      const candidates = this.store.activeAccommodations().filter((item) => item.capacity >= Number(this.guests));
      const availability = await Promise.all(candidates.map(async (item) => ({
        id: item.id,
        available: await this.store.isAvailable(item.id, this.checkIn, this.checkOut)
      })));
      if (request !== this.availabilityRequest) return;
      this.unavailableIds.set(new Set(availability.filter((item) => !item.available).map((item) => item.id)));
    } catch {
      if (request === this.availabilityRequest) void this.alerts.toast('No fue posible consultar la disponibilidad.', 'error');
    } finally {
      if (request === this.availabilityRequest) this.checking.set(false);
    }
  }
  propertyLabel(id: string): string { return this.store.propertyById(id)?.location ?? 'Colombia'; }
  clearFilters(): void { this.checkIn = ''; this.checkOut = ''; this.guests = 2; void this.refresh(); }
}
