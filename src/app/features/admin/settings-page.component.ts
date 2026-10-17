import { Component, effect, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { OrganizationSettings } from '../../core/models/domain.models';
import { AlertService } from '../../core/services/alert.service';
import { ApiErrorService } from '../../core/services/api-error.service';
import { StayManagerApiService } from '../../core/services/staymanager-api.service';
import { GoogleMapComponent } from '../../shared/components/google-map.component';

@Component({
  selector:'app-settings-page',standalone:true,imports:[FormsModule,GoogleMapComponent],
  template:`
    <section class="admin-heading"><div><span class="eyebrow">CONFIGURACIÓN</span><h1>Alojamiento y operación</h1><p>Centraliza horarios, WhatsApp, ubicación e instrucciones que usan el portal y el equipo.</p></div><span class="settings-state"><i class="bi bi-cloud-check"></i>Configuración sincronizada</span></section>
    <form #settingsForm="ngForm" (ngSubmit)="save()" class="settings-layout">
      <div class="settings-column">
        <section class="panel settings-panel"><div class="settings-title"><span><i class="bi bi-building"></i></span><div><h2>Perfil del negocio</h2><p>Nombre visible de tu operación dentro del panel y el portal.</p></div></div><label>Nombre comercial<input name="organizationName" [(ngModel)]="draft.organizationName" maxlength="120" required></label><small class="slug-note">Dirección pública: /{{draft.organizationSlug}}</small></section>
        <section class="panel settings-panel"><div class="settings-title"><span><i class="bi bi-clock"></i></span><div><h2>Horarios operativos</h2><p>Se muestran en check-in, check-out y portal del huésped.</p></div></div><div class="form-grid two"><label>Hora de check-in<input type="time" name="checkInTime" [(ngModel)]="draft.checkInTime" required></label><label>Hora de check-out<input type="time" name="checkOutTime" [(ngModel)]="draft.checkOutTime" required></label></div></section>
        <section class="panel settings-panel"><div class="settings-title"><span><i class="bi bi-whatsapp"></i></span><div><h2>Canal de WhatsApp</h2><p>Número que recibe comprobantes y solicitudes generales.</p></div></div><label>Número con indicativo de país<input name="whatsappNumber" [(ngModel)]="draft.whatsappNumber" maxlength="30" required placeholder="573001234567"><small>Solo se guardarán dígitos. Para Colombia comienza por 57.</small></label></section>
        <section class="panel settings-panel"><div class="settings-title"><span><i class="bi bi-card-text"></i></span><div><h2>Instrucciones generales de respaldo</h2><p>Se usan únicamente cuando una cabaña todavía no tiene instrucciones propias.</p></div></div><label>Indicaciones generales<textarea name="arrivalInstructions" [(ngModel)]="draft.arrivalInstructions" maxlength="1500" rows="5" required placeholder="Puntos de referencia, acceso, portería y recomendaciones"></textarea></label></section>
      </div>
      <div class="settings-column">
        <section class="panel settings-panel"><div class="settings-title"><span><i class="bi bi-geo-alt"></i></span><div><h2>Ubicación general de respaldo</h2><p>Cada cabaña se configura en Alojamientos; este punto solo cubre registros antiguos o incompletos.</p></div></div><div class="form-grid two"><label class="span-two">Nombre del lugar<input name="mapLabel" [(ngModel)]="draft.mapLabel" maxlength="180" required></label><label class="span-two">Dirección<input name="mapAddress" [(ngModel)]="draft.mapAddress" maxlength="300" required></label><label>Latitud<input type="number" step="0.0000001" min="-90" max="90" name="mapLatitude" [(ngModel)]="draft.mapLatitude"></label><label>Longitud<input type="number" step="0.0000001" min="-180" max="180" name="mapLongitude" [(ngModel)]="draft.mapLongitude"></label></div><div class="map-preview"><app-google-map [label]="draft.mapLabel" [address]="draft.mapAddress" [latitude]="draft.mapLatitude" [longitude]="draft.mapLongitude"/></div><a [href]="searchMapUrl()" target="_blank" rel="noopener noreferrer" class="text-link">Buscar coordenadas en Google Maps →</a></section>
        <div class="save-bar"><div><strong>Los cambios afectan el portal público</strong><small>Revisa el mapa y los textos antes de guardar.</small></div><button class="btn btn-primary" type="submit" [disabled]="settingsForm.invalid||saving()">@if(saving()){<span class="spinner-border spinner-border-sm me-2"></span>}Guardar configuración</button></div>
      </div>
    </form>
  `,
  styles:[`
    .settings-state{display:flex;gap:.4rem;align-items:center;padding:.55rem .75rem;border-radius:999px;background:#e5f4ec;color:#176d50;font-size:.66rem;font-weight:800}.settings-layout{display:grid;grid-template-columns:1fr 1fr;gap:1rem;align-items:start}.settings-column{display:grid;gap:1rem}.settings-panel{padding:1.25rem}.settings-title{display:flex;gap:.8rem;align-items:flex-start;margin-bottom:1rem}.settings-title>span{width:40px;height:40px;display:grid;place-items:center;border-radius:10px;background:var(--primary-soft);color:var(--primary)}.settings-title h2{font-size:.9rem;margin:0}.settings-title p{font-size:.68rem;margin:.25rem 0 0}.settings-panel label small{display:block;color:var(--muted);font-size:.6rem;margin-top:.35rem}.slug-note{display:block;margin-top:.45rem;color:var(--muted);font-size:.6rem}.span-two{grid-column:1/-1}.map-preview{margin:1rem 0}.map-preview app-google-map{display:block}.save-bar{position:sticky;bottom:1rem;z-index:5;display:flex;justify-content:space-between;align-items:center;gap:1rem;padding:1rem;border-radius:14px;color:#fff;background:#123d35;box-shadow:0 16px 40px rgba(5,40,33,.25)}.save-bar div{display:flex;flex-direction:column}.save-bar small{color:#b9d2cb;font-size:.6rem;margin-top:.2rem}@media(max-width:1050px){.settings-layout{grid-template-columns:1fr}.save-bar{position:static}}@media(max-width:600px){.save-bar{align-items:stretch;flex-direction:column}.save-bar .btn{width:100%}.settings-state{display:none}}
  `]
})
export class SettingsPageComponent{
  readonly saving=signal(false);private initialized=false;
  draft:OrganizationSettings={organizationName:'',organizationSlug:'',whatsappNumber:'',checkInTime:'15:00',checkOutTime:'11:00',mapLabel:'',mapAddress:'',mapLatitude:null,mapLongitude:null,arrivalInstructions:''};
  constructor(readonly store:StayManagerApiService,private readonly alerts:AlertService,private readonly errors:ApiErrorService){effect(()=>{const settings=store.settings();if(settings&&!this.initialized){this.draft=structuredClone(settings);this.initialized=true;}});}
  async save():Promise<void>{this.saving.set(true);try{this.draft.whatsappNumber=this.draft.whatsappNumber.replace(/\D/g,'');this.draft=await this.store.updateSettings(this.draft);await this.alerts.success('Configuración guardada','El mapa, los horarios y los mensajes ya usan esta información.');}catch(error){await this.alerts.error('No se pudo guardar',this.errors.message(error));}finally{this.saving.set(false);}}
  searchMapUrl():string{return`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(this.draft.mapAddress||this.draft.mapLabel||'Colombia')}`;}
}
