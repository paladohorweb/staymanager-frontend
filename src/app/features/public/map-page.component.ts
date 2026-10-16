import { Component, computed, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Accommodation } from '../../core/models/domain.models';
import { StayManagerApiService } from '../../core/services/staymanager-api.service';
import { GoogleMapComponent } from '../../shared/components/google-map.component';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-map-page',
  standalone: true,
  imports: [GoogleMapComponent],
  template: `
    <section class="map-hero"><div class="container"><span class="eyebrow light">TU RUTA EMPIEZA AQUÍ</span><h1>Cómo llegar</h1><p>Selecciona tu cabaña, consulta el punto exacto y abre la navegación en Google Maps.</p></div></section>
    <section class="section"><div class="container">
      @if(store.loading() && !store.activeAccommodations().length){<div class="card-panel map-loading"><span class="spinner-border text-primary"></span><p>Cargando ubicaciones…</p></div>}
      @else if(store.activeAccommodations().length){
        <div class="cabin-picker-heading"><div><span class="eyebrow">ELIGE TU DESTINO</span><h2>¿A cuál alojamiento vas?</h2></div><span>{{store.activeAccommodations().length}} ubicaciones disponibles</span></div>
        <div class="cabin-picker" role="list" aria-label="Alojamientos disponibles">
          @for(item of store.activeAccommodations();track item.id){<button type="button" role="listitem" class="cabin-option" [class.active]="selected().id===item.id" (click)="select(item)"><span class="cabin-thumb" [style.background-image]="'url('+item.imageUrl+')'"></span><span><strong>{{item.name}}</strong><small><i class="bi bi-geo-alt"></i>{{item.mapAddress||item.propertyLocation}}</small></span><i class="bi bi-chevron-right"></i></button>}
        </div>

        @if(selected();as cabin){@if(store.settings();as settings){
          <div class="selected-banner"><span><i class="bi bi-signpost-split"></i></span><div><small>RUTA SELECCIONADA</small><strong>{{cabin.name}}</strong><p>{{cabin.propertyName}} · {{cabin.mapAddress||cabin.propertyLocation}}</p></div></div>
          <div class="map-layout">
            <div><app-google-map [label]="cabin.name" [address]="address(cabin)" [latitude]="latitude(cabin)" [longitude]="longitude(cabin)"/><div class="map-actions"><a class="btn btn-primary" [href]="directionsUrl()" target="_blank" rel="noopener noreferrer"><i class="bi bi-sign-turn-right me-1"></i>Iniciar ruta en Google Maps</a><a class="btn btn-outline" [href]="whatsappUrl()" target="_blank" rel="noopener noreferrer"><i class="bi bi-whatsapp me-1"></i>Confirmar llegada</a></div></div>
            <aside class="arrival-card"><span class="eyebrow">INFORMACIÓN DE LLEGADA</span><h2>{{cabin.name}}</h2><p class="address"><i class="bi bi-geo-alt-fill"></i>{{address(cabin)}}</p><div class="schedule"><div><small>Check-in</small><strong>{{settings.checkInTime}}</strong></div><div><small>Check-out</small><strong>{{settings.checkOutTime}}</strong></div></div><div class="instructions"><h3><i class="bi bi-info-circle me-1"></i>Indicaciones específicas</h3><p>{{instructions(cabin)}}</p></div><ol><li>Verifica que seleccionaste la cabaña de tu reserva.</li><li>Abre la ruta antes de salir y evita destinos similares.</li><li>Confirma por WhatsApp tu hora aproximada de llegada.</li><li>Conserva tu código de reserva para el ingreso.</li></ol>@if(cabin.googleMapsUrl){<a class="official-point" [href]="cabin.googleMapsUrl" target="_blank" rel="noopener noreferrer"><i class="bi bi-box-arrow-up-right"></i>Ver punto compartido por el alojamiento</a>}</aside>
          </div>
        }}
      } @else {<div class="card-panel map-loading"><i class="bi bi-geo-alt"></i><h2>No hay rutas publicadas</h2><p>El alojamiento todavía no ha configurado ubicaciones activas.</p></div>}
    </div></section>
  `,
  styles: [`
    .map-hero{padding:9rem 0 5rem;color:#fff;background:linear-gradient(90deg,rgba(5,36,30,.94),rgba(5,36,30,.35)),url('https://images.unsplash.com/photo-1501785888041-af3ef285b470?auto=format&fit=crop&fm=webp&w=1800&q=68') center/cover}.map-hero h1{font:400 clamp(3rem,7vw,6rem) Georgia,serif}.map-hero p{max-width:650px;color:#d7e7e2}.cabin-picker-heading{display:flex;justify-content:space-between;align-items:end;gap:1rem;margin-bottom:1rem}.cabin-picker-heading h2{font:400 2rem Georgia,serif;margin:.2rem 0 0}.cabin-picker-heading>span{font-size:.65rem;color:var(--muted)}.cabin-picker{display:grid;grid-template-columns:repeat(3,1fr);gap:.8rem;margin-bottom:1.2rem}.cabin-option{display:grid;grid-template-columns:64px 1fr auto;gap:.7rem;align-items:center;padding:.55rem;border:1px solid var(--line);border-radius:14px;background:#fff;text-align:left;transition:.2s ease}.cabin-option:hover,.cabin-option.active{border-color:var(--primary);box-shadow:0 8px 24px rgba(15,85,70,.12);transform:translateY(-2px)}.cabin-option.active{background:#eff8f4}.cabin-thumb{width:64px;height:58px;border-radius:10px;background:#dce8e3 center/cover}.cabin-option strong,.cabin-option small{display:block}.cabin-option strong{font-size:.72rem}.cabin-option small{margin-top:.25rem;color:var(--muted);font-size:.58rem;line-height:1.3}.cabin-option small i{margin-right:.25rem}.cabin-option>i{color:var(--primary)}.selected-banner{display:flex;gap:.8rem;align-items:center;padding:1rem;margin-bottom:1rem;border-radius:14px;color:#fff;background:linear-gradient(110deg,#0d5c4d,#173f37)}.selected-banner>span{width:42px;height:42px;display:grid;place-items:center;border-radius:12px;background:rgba(255,255,255,.12);font-size:1.2rem}.selected-banner small,.selected-banner strong,.selected-banner p{display:block}.selected-banner small{font-size:.55rem;color:#b9d8cf}.selected-banner strong{font:400 1.35rem Georgia,serif}.selected-banner p{margin:0;color:#d7e7e2;font-size:.65rem}.map-layout{display:grid;grid-template-columns:1.4fr .6fr;gap:1.3rem;align-items:start}.map-actions{display:flex;gap:.7rem;margin-top:1rem;flex-wrap:wrap}.arrival-card{padding:1.5rem;border:1px solid var(--line);border-radius:18px;background:#fff;box-shadow:var(--shadow)}.arrival-card h2{font:400 1.8rem Georgia,serif}.address{display:flex;gap:.4rem;align-items:flex-start}.address i{color:var(--primary)}.schedule{display:grid;grid-template-columns:1fr 1fr;gap:.7rem;margin:1.25rem 0}.schedule div{padding:1rem;background:#f1f7f4;border-radius:12px}.schedule small,.schedule strong{display:block}.schedule strong{font-size:1.2rem;color:var(--primary)}.instructions{padding:1rem;border-left:3px solid #d7b96d;background:#fff9e9}.instructions h3{font-size:.78rem}.instructions p{margin:0;font-size:.7rem}.arrival-card ol{margin:1.2rem 0;padding-left:1.2rem;color:var(--muted);font-size:.68rem;line-height:1.8}.official-point{display:flex;gap:.4rem;align-items:center;padding:.75rem;border-radius:10px;background:#f2f6f4;color:var(--primary);font-size:.65rem;font-weight:800;text-decoration:none}.map-loading{text-align:center;padding:5rem}.map-loading>i{font-size:2.5rem;color:var(--primary)}@media(max-width:950px){.cabin-picker{grid-template-columns:repeat(2,1fr)}.map-layout{grid-template-columns:1fr}}@media(max-width:620px){.cabin-picker-heading{align-items:flex-start;flex-direction:column}.cabin-picker{display:flex;overflow:auto;scroll-snap-type:x mandatory;padding-bottom:.5rem}.cabin-option{min-width:82vw;scroll-snap-align:start}.map-actions{display:grid}.map-actions .btn{width:100%}.map-hero{padding:7.5rem 0 3.5rem}.selected-banner{align-items:flex-start}}
  `]
})
export class MapPageComponent {
  private readonly selectedId = signal<string | null>(null);
  readonly selected = computed(() => {
    const items = this.store.activeAccommodations();
    return items.find((item) => item.id === this.selectedId()) ?? items.find((item) => this.hasOwnLocation(item)) ?? items[0] ?? null;
  });
  readonly directionsUrl = computed(() => {
    const cabin = this.selected();
    if (!cabin) return 'https://www.google.com/maps';
    const destination = this.destination(cabin);
    return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(destination)}`;
  });
  readonly whatsappUrl = computed(() => {
    const cabin = this.selected();
    const settings = this.store.settings();
    const number = settings?.whatsappNumber || environment.whatsappNumber;
    return `https://wa.me/${number}?text=${encodeURIComponent(`Hola, quiero confirmar mi hora de llegada a ${cabin?.name || 'el alojamiento'}. ¿Me confirman que este es el punto correcto? ${this.directionsUrl()}`)}`;
  });

  constructor(readonly store: StayManagerApiService, private readonly route: ActivatedRoute, private readonly router: Router) {
    this.selectedId.set(route.snapshot.queryParamMap.get('alojamiento'));
    void store.loadPublicCatalog().catch(() => undefined);
  }

  select(item: Accommodation): void {
    this.selectedId.set(item.id);
    void this.router.navigate([], { relativeTo: this.route, queryParams: { alojamiento: item.id }, queryParamsHandling: 'merge', replaceUrl: true });
  }

  address(item: Accommodation): string { return item.mapAddress || this.store.settings()?.mapAddress || item.propertyLocation || 'Colombia'; }
  latitude(item: Accommodation): number | null { return item.mapLatitude ?? this.store.settings()?.mapLatitude ?? null; }
  longitude(item: Accommodation): number | null { return item.mapLongitude ?? this.store.settings()?.mapLongitude ?? null; }
  instructions(item: Accommodation): string { return item.arrivalInstructions || this.store.settings()?.arrivalInstructions || 'Confirma tu hora aproximada por WhatsApp antes de iniciar el recorrido.'; }

  private hasOwnLocation(item: Accommodation): boolean { return Boolean(item.mapAddress && item.mapLatitude != null && item.mapLongitude != null); }
  private destination(item: Accommodation): string {
    const latitude = this.latitude(item); const longitude = this.longitude(item);
    return latitude != null && longitude != null ? `${latitude},${longitude}` : this.address(item);
  }
}
