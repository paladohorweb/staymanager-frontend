import { Component, computed } from '@angular/core';
import { StayManagerApiService } from '../../core/services/staymanager-api.service';
import { GoogleMapComponent } from '../../shared/components/google-map.component';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-map-page', standalone: true, imports: [GoogleMapComponent],
  template: `
    <section class="map-hero"><div class="container"><span class="eyebrow light">TU RUTA EMPIEZA AQUÍ</span><h1>Cómo llegar</h1><p>Consulta la ubicación, abre la navegación y confirma tu hora de llegada con el alojamiento.</p></div></section>
    <section class="section"><div class="container map-layout">
      @if(store.settings();as settings){
        <div><app-google-map [label]="settings.mapLabel" [address]="settings.mapAddress" [latitude]="settings.mapLatitude" [longitude]="settings.mapLongitude"/><div class="map-actions"><a class="btn btn-primary" [href]="directionsUrl()" target="_blank" rel="noopener noreferrer"><i class="bi bi-sign-turn-right me-1"></i>Abrir ruta en Google Maps</a><a class="btn btn-outline" [href]="whatsappUrl()" target="_blank" rel="noopener noreferrer"><i class="bi bi-whatsapp me-1"></i>Confirmar llegada</a></div></div>
        <aside class="arrival-card"><span class="eyebrow">INFORMACIÓN DE LLEGADA</span><h2>{{settings.mapLabel}}</h2><p><i class="bi bi-geo-alt me-1"></i>{{settings.mapAddress}}</p><div class="schedule"><div><small>Check-in</small><strong>{{settings.checkInTime}}</strong></div><div><small>Check-out</small><strong>{{settings.checkOutTime}}</strong></div></div><div class="instructions"><h3>Antes de salir</h3><p>{{settings.arrivalInstructions}}</p></div><ol><li>Abre la ruta en Google Maps.</li><li>Confirma por WhatsApp tu hora aproximada.</li><li>Conserva tu código de reserva para el ingreso.</li></ol></aside>
      } @else {<div class="card-panel map-loading"><span class="spinner-border text-primary"></span><p>Cargando ubicación…</p></div>}
    </div></section>
  `,
  styles: [`
    .map-hero{padding:9rem 0 5rem;color:#fff;background:linear-gradient(90deg,rgba(5,36,30,.94),rgba(5,36,30,.35)),url('https://images.unsplash.com/photo-1501785888041-af3ef285b470?auto=format&fit=crop&fm=webp&w=1800&q=68') center/cover}.map-hero h1{font:400 clamp(3rem,7vw,6rem) Georgia,serif}.map-hero p{max-width:650px;color:#d7e7e2}.map-layout{display:grid;grid-template-columns:1.4fr .6fr;gap:1.3rem;align-items:start}.map-actions{display:flex;gap:.7rem;margin-top:1rem;flex-wrap:wrap}.arrival-card{padding:1.5rem;border:1px solid var(--line);border-radius:18px;background:#fff;box-shadow:var(--shadow)}.arrival-card h2{font:400 1.8rem Georgia,serif}.schedule{display:grid;grid-template-columns:1fr 1fr;gap:.7rem;margin:1.25rem 0}.schedule div{padding:1rem;background:#f1f7f4;border-radius:12px}.schedule small,.schedule strong{display:block}.schedule strong{font-size:1.2rem;color:var(--primary)}.instructions{padding:1rem;border-left:3px solid #d7b96d;background:#fff9e9}.instructions h3{font-size:.78rem}.instructions p{margin:0;font-size:.7rem}.arrival-card ol{margin:1.2rem 0 0;padding-left:1.2rem;color:var(--muted);font-size:.72rem;line-height:1.8}.map-loading{grid-column:1/-1;text-align:center;padding:5rem}@media(max-width:850px){.map-layout{grid-template-columns:1fr}}@media(max-width:520px){.map-actions{display:grid}.map-actions .btn{width:100%}}
  `]
})
export class MapPageComponent {
  readonly directionsUrl = computed(() => {
    const settings=this.store.settings();
    const hasCoordinates=settings?.mapLatitude!=null&&settings.mapLongitude!=null;
    const destination=hasCoordinates?`${settings.mapLatitude},${settings.mapLongitude}`:settings?.mapAddress||'Colombia';
    return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(destination)}`;
  });
  readonly whatsappUrl = computed(() => {
    const settings=this.store.settings();const number=settings?.whatsappNumber||environment.whatsappNumber;
    return `https://wa.me/${number}?text=${encodeURIComponent(`Hola, quiero confirmar mi hora de llegada a ${settings?.mapLabel||'el alojamiento'}.`)}`;
  });
  constructor(readonly store:StayManagerApiService){void store.loadPublicCatalog().catch(()=>undefined);}
}
