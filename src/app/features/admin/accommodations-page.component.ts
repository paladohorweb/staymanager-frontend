import { Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Accommodation } from '../../core/models/domain.models';
import { AlertService } from '../../core/services/alert.service';
import { ApiErrorService } from '../../core/services/api-error.service';
import { StayManagerApiService } from '../../core/services/staymanager-api.service';
import { currency } from '../../shared/utils/format.utils';

@Component({
  selector: 'app-accommodations-page', standalone: true, imports: [FormsModule],
  template: `
    <section class="admin-heading"><div><span class="eyebrow">INVENTARIO</span><h1>Alojamientos</h1><p>Administra capacidad, tarifas, comodidades y estado operativo.</p></div><button class="btn btn-primary" type="button" (click)="openForm()">＋ Nuevo alojamiento</button></section>
    <section class="admin-accommodation-grid">
      @for (item of store.accommodations(); track item.id) {
        <article class="admin-stay-card"><div class="admin-stay-image" [style.background-image]="'url(' + item.imageUrl + ')'" ><span class="status" [class.active]="item.status === 'ACTIVE'">{{ item.status === 'ACTIVE' ? 'Activo' : item.status }}</span></div><div class="admin-stay-body"><div><span class="type-label">{{ typeLabel(item.type) }}</span><h2>{{ item.name }}</h2><p>{{ propertyName(item.propertyId) }}</p></div><div class="mini-stats"><span><strong>{{ item.capacity }}</strong> huéspedes</span><span><strong>{{ item.bedrooms }}</strong> habitaciones</span><span><strong>{{ money(item.baseNightPrice) }}</strong> base</span></div><div class="admin-card-footer"><div class="amenities-mini">{{ item.amenities.slice(0,3).join(' · ') }}</div><button type="button" class="btn btn-outline btn-small" (click)="selected.set(item)">Ver detalle</button></div></div></article>
      }
    </section>
    @if (formOpen()) { <div class="modal-backdrop"><form class="simple-modal wide-modal" #form="ngForm" (ngSubmit)="save()"><button type="button" class="modal-close" (click)="formOpen.set(false)">×</button><span class="eyebrow">NUEVO INVENTARIO</span><h2>Agregar alojamiento</h2><div class="form-grid two"><label>Nombre<input name="name" [(ngModel)]="draft.name" required></label><label>Propiedad<select name="propertyId" [(ngModel)]="draft.propertyId" required>@for (property of store.properties(); track property.id) { <option [value]="property.id">{{ property.name }}</option> }</select></label><label>Tipo<select name="type" [(ngModel)]="draft.type"><option value="CABIN">Cabaña</option><option value="GLAMPING">Glamping</option><option value="COUNTRY_HOUSE">Finca</option><option value="APARTMENT">Apartamento</option></select></label><label>Capacidad<input type="number" name="capacity" [(ngModel)]="draft.capacity" min="1" required></label><label>Precio semana<input type="number" name="basePrice" [(ngModel)]="draft.baseNightPrice" min="1" required></label><label>Precio fin de semana<input type="number" name="weekendPrice" [(ngModel)]="draft.weekendNightPrice" min="1" required></label></div><label>Descripción<textarea name="description" [(ngModel)]="draft.description" required></textarea></label><button class="btn btn-primary btn-block" [disabled]="form.invalid || submitting()">@if (submitting()) { <span class="spinner-border spinner-border-sm me-2"></span> }Guardar alojamiento</button></form></div> }
    @if (selected(); as item) { <div class="modal-backdrop" (click)="selected.set(null)"><div class="simple-modal" (click)="$event.stopPropagation()"><button class="modal-close" (click)="selected.set(null)">×</button><span class="eyebrow">DETALLE</span><h2>{{ item.name }}</h2><p>{{ item.description }}</p><div class="detail-list"><span>Capacidad <strong>{{ item.capacity }} huéspedes</strong></span><span>Tarifa base <strong>{{ money(item.baseNightPrice) }}</strong></span><span>Fin de semana <strong>{{ money(item.weekendNightPrice) }}</strong></span><span>Limpieza <strong>{{ money(item.cleaningFee) }}</strong></span></div></div></div> }
  `
})
export class AccommodationsPageComponent {
  readonly money = currency; readonly formOpen = signal(false); readonly selected = signal<Accommodation | null>(null); readonly submitting = signal(false);
  draft: Omit<Accommodation, 'id' | 'propertyName' | 'propertyLocation'>;
  constructor(readonly store: StayManagerApiService, private readonly alerts: AlertService, private readonly errors: ApiErrorService) { this.draft = this.emptyDraft(); }
  typeLabel(type: Accommodation['type']): string { return ({ CABIN: 'Cabaña', GLAMPING: 'Glamping', COUNTRY_HOUSE: 'Casa campestre', APARTMENT: 'Apartamento' })[type]; }
  propertyName(id: string): string { return this.store.propertyById(id)?.name ?? ''; }
  openForm(): void { this.draft = this.emptyDraft(); this.formOpen.set(true); }
  async save(): Promise<void> {
    this.submitting.set(true);
    try {
      await this.store.addAccommodation({ ...this.draft, bedrooms: 1, bathrooms: 1, cleaningFee: 60000, status: 'ACTIVE', amenities: ['Wi-Fi', 'Parqueadero'], imageUrl: 'https://images.unsplash.com/photo-1482192505345-5655af888cc4?auto=format&fit=crop&w=1400&q=85' });
      this.formOpen.set(false);
      await this.alerts.toast('Alojamiento creado correctamente');
    } catch (error) {
      await this.alerts.error('No se pudo crear el alojamiento', this.errors.message(error));
    } finally {
      this.submitting.set(false);
    }
  }
  private emptyDraft(): Omit<Accommodation, 'id' | 'propertyName' | 'propertyLocation'> { return { propertyId: this.store?.properties()?.[0]?.id ?? '', name: '', type: 'CABIN', description: '', capacity: 2, bedrooms: 1, bathrooms: 1, baseNightPrice: 300000, weekendNightPrice: 380000, cleaningFee: 60000, status: 'ACTIVE', amenities: [], imageUrl: '' }; }
}
