import { Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Accommodation } from '../../core/models/domain.models';
import { AlertService } from '../../core/services/alert.service';
import { ApiErrorService } from '../../core/services/api-error.service';
import { StayManagerApiService } from '../../core/services/staymanager-api.service';
import { GoogleMapComponent } from '../../shared/components/google-map.component';
import { currency } from '../../shared/utils/format.utils';

type AccommodationDraft = Omit<Accommodation, 'id' | 'propertyName' | 'propertyLocation'>;

@Component({
  selector: 'app-accommodations-page',
  standalone: true,
  imports: [FormsModule, RouterLink, GoogleMapComponent],
  template: `
    <section class="admin-heading">
      <div><span class="eyebrow">INVENTARIO Y UBICACIONES</span><h1>Alojamientos</h1><p>Administra tarifas, capacidad y una ruta de llegada independiente para cada cabaña.</p></div>
      <button class="btn btn-primary" type="button" (click)="openForm()">＋ Nuevo alojamiento</button>
    </section>

    <div class="location-note"><i class="bi bi-geo-alt-fill"></i><div><strong>Cada alojamiento tiene su propio destino</strong><span>El mapa, las indicaciones y los mensajes de check-in usarán la ubicación de la cabaña seleccionada.</span></div></div>

    <section class="admin-accommodation-grid">
      @for (item of store.accommodations(); track item.id) {
        <article class="admin-stay-card">
          <div class="admin-stay-image" [style.background-image]="'url(' + item.imageUrl + ')'">
            <span class="status" [class.active]="item.status === 'ACTIVE'">{{ item.status === 'ACTIVE' ? 'Activo' : item.status }}</span>
            <span class="map-state" [class.ready]="hasLocation(item)"><i class="bi" [class.bi-geo-alt-fill]="hasLocation(item)" [class.bi-exclamation-triangle]="!hasLocation(item)"></i>{{hasLocation(item)?'Ruta configurada':'Falta ubicación'}}</span>
          </div>
          <div class="admin-stay-body">
            <div><span class="type-label">{{ typeLabel(item.type) }}</span><h2>{{ item.name }}</h2><p>{{ propertyName(item.propertyId) }}</p></div>
            <div class="cabin-address"><i class="bi bi-pin-map"></i><span>{{item.mapAddress || 'Ubicación pendiente de configurar'}}</span></div>
            <div class="mini-stats"><span><strong>{{ item.capacity }}</strong> huéspedes</span><span><strong>{{ item.bedrooms }}</strong> habitaciones</span><span><strong>{{ money(item.baseNightPrice) }}</strong> base</span></div>
            <div class="admin-card-footer"><a class="text-link" [routerLink]="['/como-llegar']" [queryParams]="{alojamiento:item.id}" target="_blank">Ver mapa público →</a><button type="button" class="btn btn-outline btn-small" (click)="openForm(item)">Editar</button></div>
          </div>
        </article>
      } @empty {
        <div class="empty-inventory"><i class="bi bi-houses"></i><h2>Aún no hay alojamientos</h2><p>Agrega la primera cabaña y configura su ubicación para publicarla.</p><button class="btn btn-primary" type="button" (click)="openForm()">Crear alojamiento</button></div>
      }
    </section>

    @if (formOpen()) {
      <div class="modal-backdrop" (click)="closeForm()">
        <form class="simple-modal cabin-modal" #form="ngForm" (ngSubmit)="save()" (click)="$event.stopPropagation()">
          <button type="button" class="modal-close" aria-label="Cerrar" (click)="closeForm()">×</button>
          <span class="eyebrow">{{editingId()?'EDITAR ALOJAMIENTO':'NUEVO INVENTARIO'}}</span>
          <h2>{{editingId()?'Actualizar '+draft.name:'Agregar alojamiento'}}</h2>
          <p class="modal-intro">La información de llegada se mostrará únicamente para esta cabaña.</p>

          <div class="form-section"><div class="section-title"><span>1</span><div><h3>Información principal</h3><p>Datos comerciales y operativos del alojamiento.</p></div></div>
            <div class="form-grid two">
              <label>Nombre<input name="name" [(ngModel)]="draft.name" maxlength="140" required></label>
              <label>Propiedad<select name="propertyId" [(ngModel)]="draft.propertyId" required>@for (property of store.properties(); track property.id) {<option [value]="property.id">{{ property.name }}</option>}</select></label>
              <label>Tipo<select name="type" [(ngModel)]="draft.type"><option value="CABIN">Cabaña</option><option value="GLAMPING">Glamping</option><option value="COUNTRY_HOUSE">Finca</option><option value="APARTMENT">Apartamento</option></select></label>
              <label>Estado<select name="status" [(ngModel)]="draft.status"><option value="ACTIVE">Activo</option><option value="INACTIVE">Inactivo</option><option value="MAINTENANCE">Mantenimiento</option></select></label>
              <label>Capacidad<input type="number" name="capacity" [(ngModel)]="draft.capacity" min="1" max="100" required></label>
              <label>Habitaciones<input type="number" name="bedrooms" [(ngModel)]="draft.bedrooms" min="0" max="50" required></label>
              <label>Baños<input type="number" name="bathrooms" [(ngModel)]="draft.bathrooms" min="1" max="50" required></label>
              <label>Imagen (URL)<input type="url" name="imageUrl" [(ngModel)]="draft.imageUrl" maxlength="1000"></label>
              <label class="span-two">Descripción<textarea name="description" [(ngModel)]="draft.description" maxlength="1200" rows="3" required></textarea></label>
              <label class="span-two">Comodidades separadas por coma<input name="amenities" [(ngModel)]="amenitiesText" placeholder="Wi-Fi, Jacuzzi, Parqueadero"></label>
            </div>
          </div>

          <div class="form-section"><div class="section-title"><span>2</span><div><h3>Tarifas</h3><p>Valores utilizados en la cotización de reservas.</p></div></div>
            <div class="form-grid three"><label>Precio entre semana<input type="number" name="basePrice" [(ngModel)]="draft.baseNightPrice" min="1" required></label><label>Precio fin de semana<input type="number" name="weekendPrice" [(ngModel)]="draft.weekendNightPrice" min="1" required></label><label>Tarifa de limpieza<input type="number" name="cleaningFee" [(ngModel)]="draft.cleaningFee" min="0" required></label></div>
          </div>

          <div class="form-section location-section"><div class="section-title"><span>3</span><div><h3>Cómo llegar a esta cabaña</h3><p>Destino independiente utilizado por Google Maps, el huésped y WhatsApp.</p></div></div>
            <div class="form-grid two">
              <label class="span-two">Dirección o punto de referencia<input name="mapAddress" [(ngModel)]="draft.mapAddress" maxlength="300" required placeholder="Vereda, sector, municipio y departamento"></label>
              <label>Latitud<input type="number" name="mapLatitude" [(ngModel)]="draft.mapLatitude" step="0.0000001" min="-90" max="90" required></label>
              <label>Longitud<input type="number" name="mapLongitude" [(ngModel)]="draft.mapLongitude" step="0.0000001" min="-180" max="180" required></label>
              <label class="span-two">Enlace compartido de Google Maps <small>Opcional; si queda vacío, StayManager lo genera con las coordenadas.</small><input type="url" name="googleMapsUrl" [(ngModel)]="draft.googleMapsUrl" maxlength="1000" placeholder="https://maps.app.goo.gl/..."></label>
              <label class="span-two">Instrucciones de llegada<textarea name="arrivalInstructions" [(ngModel)]="draft.arrivalInstructions" maxlength="1500" rows="4" required placeholder="Acceso, portería, estado de la vía y puntos de referencia"></textarea></label>
            </div>
            <div class="location-tools"><button class="btn btn-outline btn-small" type="button" (click)="useGeneralLocation()"><i class="bi bi-copy me-1"></i>Usar ubicación general como base</button><a class="text-link" [href]="searchMapUrl()" target="_blank" rel="noopener noreferrer">Buscar en Google Maps →</a></div>
            @if(draft.mapAddress){<div class="map-preview"><app-google-map [label]="draft.name||'Alojamiento'" [address]="draft.mapAddress" [latitude]="draft.mapLatitude" [longitude]="draft.mapLongitude"/></div>}
          </div>

          <div class="modal-actions"><button type="button" class="btn btn-outline" (click)="closeForm()">Cancelar</button><button class="btn btn-primary" type="submit" [disabled]="form.invalid||submitting()">@if(submitting()){<span class="spinner-border spinner-border-sm me-2"></span>}{{editingId()?'Guardar cambios':'Crear alojamiento'}}</button></div>
        </form>
      </div>
    }
  `,
  styles: [`
    .location-note{display:flex;gap:.8rem;align-items:center;padding:1rem 1.15rem;margin-bottom:1.2rem;border:1px solid #cfe7df;border-radius:14px;background:#edf8f4;color:#155f4d}.location-note>i{font-size:1.35rem}.location-note div{display:flex;flex-direction:column}.location-note span{font-size:.68rem;color:#527369}.admin-stay-image{position:relative}.map-state{position:absolute;right:.7rem;bottom:.7rem;display:flex;gap:.3rem;align-items:center;padding:.35rem .55rem;border-radius:999px;background:#fff4dc;color:#8a5d00;font-size:.58rem;font-weight:800;box-shadow:0 4px 12px rgba(0,0,0,.15)}.map-state.ready{background:#e4f7ed;color:#157347}.cabin-address{display:flex;gap:.45rem;align-items:flex-start;margin:.8rem 0;padding:.65rem .75rem;border-radius:10px;background:#f5f8f7;color:var(--muted);font-size:.65rem}.cabin-address i{color:var(--primary)}.admin-card-footer{align-items:center}.empty-inventory{grid-column:1/-1;padding:4rem 1rem;text-align:center;border:1px dashed var(--line);border-radius:16px;background:#fff}.empty-inventory>i{font-size:2.5rem;color:var(--primary)}.cabin-modal{width:min(920px,calc(100vw - 2rem));max-height:92vh;overflow:auto}.modal-intro{margin-top:-.4rem}.form-section{padding:1.15rem;margin:1rem 0;border:1px solid var(--line);border-radius:14px;background:#fbfcfc}.section-title{display:flex;gap:.75rem;align-items:flex-start;margin-bottom:1rem}.section-title>span{width:30px;height:30px;display:grid;place-items:center;flex:0 0 auto;border-radius:9px;background:var(--primary);color:#fff;font-size:.68rem;font-weight:900}.section-title h3{margin:0;font-size:.82rem}.section-title p{margin:.2rem 0 0;font-size:.63rem}.form-grid.three{grid-template-columns:repeat(3,1fr)}label small{display:block;margin:.2rem 0 .4rem;color:var(--muted);font-size:.58rem}.location-section{background:#f7fbf9}.location-tools{display:flex;justify-content:space-between;align-items:center;gap:1rem;margin-top:.8rem}.map-preview{margin-top:1rem}.map-preview app-google-map{display:block}.modal-actions{position:sticky;bottom:-1px;display:flex;justify-content:flex-end;gap:.6rem;padding:1rem 0 .1rem;background:#fff}@media(max-width:720px){.form-grid.three{grid-template-columns:1fr}.cabin-modal{padding:1rem}.location-note{align-items:flex-start}.location-tools,.modal-actions{align-items:stretch;flex-direction:column}.modal-actions .btn{width:100%}}@media(max-width:560px){.form-grid.two{grid-template-columns:1fr}.span-two{grid-column:auto}.admin-card-footer{align-items:stretch;flex-direction:column}.admin-card-footer .btn,.admin-card-footer .text-link{text-align:center;width:100%}}
  `]
})
export class AccommodationsPageComponent {
  readonly money = currency;
  readonly formOpen = signal(false);
  readonly editingId = signal<string | null>(null);
  readonly submitting = signal(false);
  draft: AccommodationDraft;
  amenitiesText = '';

  constructor(readonly store: StayManagerApiService, private readonly alerts: AlertService, private readonly errors: ApiErrorService) {
    this.draft = this.emptyDraft();
  }

  typeLabel(type: Accommodation['type']): string {
    return ({ CABIN: 'Cabaña', GLAMPING: 'Glamping', COUNTRY_HOUSE: 'Casa campestre', APARTMENT: 'Apartamento' })[type];
  }

  propertyName(id: string): string { return this.store.propertyById(id)?.name ?? ''; }
  hasLocation(item: Accommodation): boolean { return Boolean(item.mapAddress && item.mapLatitude != null && item.mapLongitude != null); }

  openForm(item?: Accommodation): void {
    this.editingId.set(item?.id ?? null);
    this.draft = item ? this.toDraft(item) : this.emptyDraft();
    this.amenitiesText = this.draft.amenities.join(', ');
    this.formOpen.set(true);
  }

  closeForm(): void { if (!this.submitting()) this.formOpen.set(false); }

  useGeneralLocation(): void {
    const settings = this.store.settings();
    if (!settings) return;
    this.draft.mapAddress = settings.mapAddress;
    this.draft.mapLatitude = settings.mapLatitude;
    this.draft.mapLongitude = settings.mapLongitude;
    this.draft.arrivalInstructions = settings.arrivalInstructions;
    this.draft.googleMapsUrl = '';
  }

  searchMapUrl(): string {
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(this.draft.mapAddress || this.draft.name || 'Colombia')}`;
  }

  async save(): Promise<void> {
    this.submitting.set(true);
    try {
      this.draft.amenities = this.amenitiesText.split(',').map((item) => item.trim()).filter(Boolean);
      this.draft.googleMapsUrl = this.draft.googleMapsUrl.trim();
      if (!this.draft.googleMapsUrl.trim() && this.draft.mapLatitude != null && this.draft.mapLongitude != null) {
        this.draft.googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${this.draft.mapLatitude},${this.draft.mapLongitude}`;
      }
      const id = this.editingId();
      if (id) await this.store.updateAccommodation(id, { ...this.draft });
      else await this.store.addAccommodation({ ...this.draft });
      this.formOpen.set(false);
      await this.alerts.toast(id ? 'Alojamiento actualizado correctamente' : 'Alojamiento creado correctamente');
    } catch (error) {
      await this.alerts.error('No se pudo guardar el alojamiento', this.errors.message(error));
    } finally {
      this.submitting.set(false);
    }
  }

  private toDraft(item: Accommodation): AccommodationDraft {
    const { id: _id, propertyName: _propertyName, propertyLocation: _propertyLocation, ...draft } = item;
    return { ...draft, amenities: [...item.amenities] };
  }

  private emptyDraft(): AccommodationDraft {
    const settings = this.store?.settings?.();
    return {
      propertyId: this.store?.properties?.()?.[0]?.id ?? '', name: '', type: 'CABIN', description: '',
      capacity: 2, bedrooms: 1, bathrooms: 1, baseNightPrice: 300000, weekendNightPrice: 380000,
      cleaningFee: 60000, status: 'ACTIVE', amenities: [], imageUrl: '',
      mapAddress: settings?.mapAddress ?? '', mapLatitude: settings?.mapLatitude ?? null,
      mapLongitude: settings?.mapLongitude ?? null, googleMapsUrl: '', arrivalInstructions: settings?.arrivalInstructions ?? ''
    };
  }
}
