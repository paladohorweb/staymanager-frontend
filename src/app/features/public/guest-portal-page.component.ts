import { Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { GuestPortalReservation, PaymentMethod, ReservationStatus } from '../../core/models/domain.models';
import { AlertService } from '../../core/services/alert.service';
import { ApiErrorService } from '../../core/services/api-error.service';
import { StayManagerApiService } from '../../core/services/staymanager-api.service';
import { currency, shortDate } from '../../shared/utils/format.utils';
import { environment } from '../../../environments/environment';

type PortalTab = 'reservations' | 'experiences';

@Component({
  selector: 'app-guest-portal-page', standalone: true, imports: [FormsModule, RouterLink],
  styles: [`
    .portal-hero{padding:8rem 0 3.5rem;background:linear-gradient(135deg,#eaf5f1,#fff)}.portal-shell{max-width:1080px;margin:auto}.access-card{max-width:650px;margin:0 auto}.access-help{display:flex;gap:.7rem;align-items:flex-start;margin:1rem 0;padding:.8rem;background:#f3f8f6;border-radius:10px;color:var(--muted);font-size:.7rem}.demo-access{display:flex;justify-content:space-between;gap:1rem;align-items:center;margin:1rem 0;padding:1rem;border:1px solid #d8e7e1;border-radius:12px;background:#eef7f4}.demo-access span,.demo-access strong{display:block}.demo-access span{margin-top:.2rem;color:var(--muted);font-size:.67rem}
    .portal-tabs{display:flex;gap:.5rem;margin-bottom:1.25rem;padding:.35rem;width:max-content;max-width:100%;background:#e9f0ed;border-radius:12px}.portal-tabs button{border:0;background:transparent;border-radius:9px;padding:.7rem 1rem;font-size:.7rem;font-weight:800;color:var(--muted)}.portal-tabs button.active{color:#fff;background:var(--primary);box-shadow:0 6px 16px rgba(15,118,110,.2)}
    .portal-grid{display:grid;grid-template-columns:1.35fr .65fr;gap:1.25rem;align-items:start}.stay-card,.payment-card{padding:1.5rem}.portal-heading{display:flex;justify-content:space-between;gap:1rem;align-items:start}.status-pill{border-radius:999px;padding:.45rem .8rem;background:#e8f0ff;color:#1d4ed8;font-weight:700;font-size:.78rem}
    .reservation-summary{display:flex;justify-content:space-between;align-items:center;gap:1rem;margin-bottom:1rem;padding:.85rem 1rem;background:#f4f8f6;border-radius:12px}.reservation-summary small,.reservation-summary strong{display:block}.reservation-summary small{color:var(--muted)}.facts{display:grid;grid-template-columns:repeat(2,1fr);gap:1rem;margin:1.5rem 0}.fact{padding:1rem;background:#f8fafc;border-radius:12px}.fact small{display:block;color:#64748b}.fact strong{display:block;margin-top:.2rem}.payment-line{display:flex;justify-content:space-between;gap:1rem;margin:.7rem 0}.payment-line.pending{color:#98670b}.balance{padding-top:1rem;border-top:1px solid #e2e8f0;font-size:1.08rem}.portal-actions{display:flex;gap:.75rem;flex-wrap:wrap;margin-top:1.25rem}
    .payment-instructions{margin-top:1.25rem;padding-top:1.1rem;border-top:1px solid #e2e8f0}.payment-instructions h4{font-size:.8rem;margin-bottom:.8rem}.pay-option{padding:.8rem;border-radius:10px;background:#f5f8f7;margin:.6rem 0}.pay-option strong,.pay-option small{display:block}.pay-option small{color:#64748b;margin-top:.25rem;line-height:1.5}.copy-button{border:0;background:transparent;color:var(--primary);font-size:.65rem;font-weight:800;padding:.35rem 0;cursor:pointer}.pending-notice{display:flex;gap:.7rem;align-items:flex-start;padding:.8rem;margin:.9rem 0;background:#fff8e8;color:#885d09;border-radius:10px;font-size:.68rem}
    .experience-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:1rem}.guest-experience{padding:1.25rem;background:#fff;border:1px solid var(--line);border-radius:15px}.experience-icon{width:45px;height:45px;display:grid;place-items:center;border-radius:12px;background:var(--primary-soft);color:var(--primary);font-size:1.15rem}.guest-experience h3{font:400 1.25rem Georgia,serif;margin:1rem 0 .45rem}.guest-experience p{font-size:.72rem}.experience-intro{padding:1.35rem;margin-bottom:1rem;display:flex;justify-content:space-between;gap:1.5rem;align-items:center}.experience-intro p{margin:0}
    .payment-modal>p{margin:-.25rem 0 1.25rem}.secure-note{display:flex;gap:.7rem;align-items:flex-start;margin:1rem 0;padding:.8rem;background:#eef7f4;border-radius:10px;color:var(--primary);font-size:.67rem}.method-choice{display:grid;grid-template-columns:1fr 1fr;gap:.6rem;margin:.5rem 0 1rem}.method-choice button{border:1px solid #dbe4df;background:#fff;border-radius:10px;padding:.8rem;font-weight:700}.method-choice button.active{border-color:var(--primary);background:var(--primary-soft);color:var(--primary)}.honeypot{position:absolute!important;left:-10000px!important;width:1px!important;height:1px!important;overflow:hidden!important}
    @media(max-width:760px){.portal-grid,.experience-grid{grid-template-columns:1fr}.facts{grid-template-columns:1fr 1fr}.portal-heading{display:block}.status-pill{display:inline-block;margin-top:.5rem}.portal-actions .btn{flex:1 1 100%}.experience-intro{align-items:flex-start;flex-direction:column}.portal-tabs{width:100%}.portal-tabs button{flex:1}}
    @media(max-width:460px){.facts{grid-template-columns:1fr}.stay-card,.payment-card{padding:1.1rem}.method-choice{grid-template-columns:1fr}.portal-hero h1{font-size:2rem}.reservation-summary,.demo-access{align-items:flex-start;flex-direction:column}.demo-access .btn{width:100%}}
  `],
  template: `
    <section class="portal-hero"><div class="container portal-shell"><span class="eyebrow">PORTAL DEL HUÉSPED</span><h1>Mis reservas y experiencias</h1><p>Consulta tu estadía, revisa pagos y lleva tus solicitudes listas a WhatsApp.</p></div></section>
    <section class="section"><div class="container portal-shell">
      @if (!reservation()) {
        <form class="card-panel access-card" #accessForm="ngForm" (ngSubmit)="access()">
          <h2>Consultar mis reservas</h2><p>Ingresa el código y el mismo correo usado al solicitar la reserva.</p>
          @if(demoMode){<div class="demo-access"><div><strong><i class="bi bi-stars me-1"></i>Prueba del portal del huésped</strong><span>ST-26001 · laura&#64;example.com</span></div><button class="btn btn-outline btn-small" type="button" (click)="useDemoReservation()">Usar reserva demo</button></div>}
          <div class="honeypot" aria-hidden="true"><label>No completar<input name="website" [(ngModel)]="website" tabindex="-1" autocomplete="off"></label></div>
          <div class="form-grid two"><label>Código de reserva<input name="code" [(ngModel)]="code" required maxlength="20" autocomplete="off" placeholder="ST-2601234"></label><label>Correo electrónico<input type="email" name="email" [(ngModel)]="email" required email autocomplete="email" placeholder="correo@ejemplo.com"></label></div>
          <div class="access-help"><i class="bi bi-shield-lock"></i><span>Combinamos ambos datos para evitar que otras personas consulten tu información.</span></div>
          @if(error()){<div class="alert alert-danger py-2" role="alert">{{error()}}</div>}
          <button class="btn btn-primary btn-block" type="submit" [disabled]="accessForm.invalid||loading()">@if(loading()){<span class="spinner-border spinner-border-sm me-2"></span>} Ver mis reservas</button>
        </form>
      } @else {
        @if (reservation(); as item) {
          <div class="portal-heading mb-3"><div><button class="text-button p-0 mb-2" type="button" (click)="reset()">← Consultar otra reserva</button><h2>Hola, {{firstName(item.guestName)}}</h2><p>{{item.propertyName}} · {{item.propertyLocation}}</p></div><span class="status-pill">{{statusLabel(item.status)}}</span></div>
          <nav class="portal-tabs" aria-label="Secciones del portal"><button type="button" [class.active]="activeTab()==='reservations'" (click)="activeTab.set('reservations')"><i class="bi bi-calendar-check me-1"></i> Mis reservas</button><button type="button" [class.active]="activeTab()==='experiences'" (click)="activeTab.set('experiences')"><i class="bi bi-stars me-1"></i> Mis experiencias</button></nav>
          @if(activeTab()==='reservations'){
            <div class="reservation-summary"><div><small>Reserva consultada</small><strong>{{item.code}} · {{item.accommodationName}}</strong></div><span class="status-pill">{{statusLabel(item.status)}}</span></div>
            <div class="portal-grid">
              <article class="card-panel stay-card"><span class="eyebrow">DETALLE DE LA ESTADÍA</span><h3>{{item.accommodationName}}</h3><div class="facts"><div class="fact"><small>Entrada · {{store.settings()?.checkInTime||'15:00'}}</small><strong>{{date(item.checkIn)}}</strong></div><div class="fact"><small>Salida · {{store.settings()?.checkOutTime||'11:00'}}</small><strong>{{date(item.checkOut)}}</strong></div><div class="fact"><small>Huéspedes</small><strong>{{item.adults}} adultos · {{item.children}} niños</strong></div><div class="fact"><small>Noches</small><strong>{{item.price.nights}}</strong></div></div>@if(item.notes){<div class="alert alert-light"><strong>Solicitud:</strong> {{item.notes}}</div>}<div class="portal-actions"><a class="btn btn-primary" [href]="whatsapp(item)" target="_blank" rel="noopener noreferrer"><i class="bi bi-whatsapp me-1"></i> Hablar con el alojamiento</a><a class="btn btn-outline" routerLink="/como-llegar" [queryParams]="{alojamiento:item.accommodationId}"><i class="bi bi-geo-alt me-1"></i>Cómo llegar a mi cabaña</a>@if(item.cancellable){<button class="btn btn-outline" type="button" (click)="cancel()" [disabled]="loading()">Cancelar reserva</button>}</div></article>
              <aside class="card-panel payment-card"><span class="eyebrow">PAGOS</span><div class="payment-line"><span>Total</span><strong>{{money(item.price.total)}}</strong></div><div class="payment-line"><span>Pagado y aprobado</span><strong>{{money(item.amountPaid)}}</strong></div>@if(item.pendingPaymentCount){<div class="payment-line pending"><span>En verificación</span><strong>{{money(item.pendingPaymentAmount)}}</strong></div><div class="pending-notice"><i class="bi bi-hourglass-split"></i><span>{{item.pendingPaymentCount}} pago(s) esperando revisión administrativa.</span></div>}<div class="payment-line balance"><span>Saldo pendiente</span><strong>{{money(item.balance)}}</strong></div>
                @if(item.balance>0 && item.paymentInstructions.enabled){<div class="payment-instructions"><h4>Medios disponibles</h4>@if(item.paymentInstructions.acceptedMethods.includes('NEQUI')){<div class="pay-option"><strong><i class="bi bi-phone me-1"></i> Nequi</strong><small>{{item.paymentInstructions.nequiNumber}} · {{item.paymentInstructions.accountHolder}}</small><button class="copy-button" type="button" (click)="copy(item.paymentInstructions.nequiNumber)">Copiar número</button></div>}@if(item.paymentInstructions.acceptedMethods.includes('BANK_TRANSFER')){<div class="pay-option"><strong><i class="bi bi-bank me-1"></i> Transferencia bancaria</strong><small>{{item.paymentInstructions.bankInstructions}}</small></div>}<button class="btn btn-primary btn-block mt-3" type="button" (click)="openPayment(item)"><i class="bi bi-whatsapp me-1"></i> Enviar comprobante</button></div>} @else if(item.balance>0){<small>El alojamiento aún no ha configurado medios de pago. Puedes consultarlo por WhatsApp.</small>}
              </aside>
            </div>
          } @else {
            <div class="card-panel experience-intro"><div><span class="eyebrow">MEJORA TU ESTADÍA</span><h3>Experiencias para esta reserva</h3><p>Selecciona una idea y envía la solicitud con tu código ya incluido.</p></div><a routerLink="/experiencias" class="text-link">Ver catálogo completo →</a></div>
            <div class="experience-grid">@for(experience of experiences;track experience.title){<article class="guest-experience"><span class="experience-icon"><i [class]="experience.icon"></i></span><h3>{{experience.title}}</h3><p>{{experience.description}}</p><a class="btn btn-outline btn-block" [href]="experienceWhatsapp(item,experience.title)" target="_blank" rel="noopener noreferrer">Solicitar por WhatsApp</a></article>}</div>
          }
        }
      }
    </div></section>
    @if(paymentOpen()){@if(reservation();as item){<div class="modal-backdrop"><form class="simple-modal payment-modal" #paymentForm="ngForm" (ngSubmit)="sendPaymentProof(item)"><button class="modal-close" type="button" aria-label="Cerrar" (click)="closePayment()">×</button><span class="eyebrow">COMPROBANTE POR WHATSAPP</span><h2>Preparar mensaje de pago</h2><p>Completaremos el mensaje con tu reserva. Cuando se abra WhatsApp, adjunta allí la foto o PDF del comprobante.</p><div class="method-choice">@if(item.paymentInstructions.acceptedMethods.includes('NEQUI')){<button type="button" [class.active]="paymentMethod==='NEQUI'" (click)="paymentMethod='NEQUI'"><i class="bi bi-phone me-1"></i>Nequi</button>}@if(item.paymentInstructions.acceptedMethods.includes('BANK_TRANSFER')){<button type="button" [class.active]="paymentMethod==='BANK_TRANSFER'" (click)="paymentMethod='BANK_TRANSFER'"><i class="bi bi-bank me-1"></i>Transferencia</button>}</div><label>Valor pagado<input type="number" name="paymentAmount" [(ngModel)]="paymentAmount" min="1" [max]="item.balance" required></label><label>Referencia del comprobante<input name="paymentReference" [(ngModel)]="paymentReference" minlength="3" maxlength="100" required placeholder="Número de aprobación o comprobante"></label><div class="secure-note"><i class="bi bi-info-circle"></i><span>Enviar el comprobante no modifica automáticamente el saldo. El alojamiento debe verificarlo y aprobarlo desde StayManager.</span></div><button class="btn btn-primary btn-block" type="submit" [disabled]="paymentForm.invalid"><i class="bi bi-whatsapp me-1"></i>Abrir WhatsApp y adjuntar comprobante</button></form></div>}}
  `
})
export class GuestPortalPageComponent {
  code=''; email=''; website=''; paymentAmount=0; paymentMethod:PaymentMethod='NEQUI'; paymentReference='';
  readonly reservation=signal<GuestPortalReservation|null>(null); readonly loading=signal(false); readonly error=signal('');
  readonly paymentOpen=signal(false); readonly activeTab=signal<PortalTab>('reservations');
  readonly money=currency; readonly date=shortDate; private formStartedAt=Date.now();
  readonly demoMode=environment.demoMode;
  readonly experiences=[
    {title:'Desayuno especial',description:'Prepara una mañana tranquila con sabores locales.',icon:'bi bi-cup-hot'},
    {title:'Decoración romántica',description:'Solicita un detalle especial antes de tu llegada.',icon:'bi bi-heart'},
    {title:'Ruta de naturaleza',description:'Consulta senderos y planes recomendados en la zona.',icon:'bi bi-tree'}
  ];

  constructor(route:ActivatedRoute,readonly store:StayManagerApiService,private readonly errors:ApiErrorService,private readonly alerts:AlertService){this.code=route.snapshot.queryParamMap.get('code')??'';this.email=route.snapshot.queryParamMap.get('email')??'';if(this.code&&this.email)void this.access(true);}

  async access(trustedNavigation=false):Promise<void>{
    if(!trustedNavigation&&(this.website.trim()||Date.now()-this.formStartedAt<1200)){this.error.set('No fue posible procesar la solicitud. Intenta nuevamente.');return;}
    this.loading.set(true);this.error.set('');
    try{this.reservation.set(await this.store.accessGuestReservation(this.code,this.email));}
    catch(error){this.error.set(this.errors.message(error,'No fue posible consultar la reserva.'));}
    finally{this.loading.set(false);}
  }
  async useDemoReservation():Promise<void>{this.code='ST-26001';this.email='laura@example.com';await this.access(true);}
  async cancel():Promise<void>{if(!await this.alerts.confirm('¿Cancelar la reserva?','Esta acción liberará las fechas seleccionadas.'))return;this.loading.set(true);try{this.reservation.set(await this.store.cancelGuestReservation(this.code,this.email));await this.alerts.success('Reserva cancelada','El alojamiento recibió la actualización.');}catch(error){await this.alerts.error('No se pudo cancelar',this.errors.message(error));}finally{this.loading.set(false);}}
  openPayment(item:GuestPortalReservation):void{this.paymentAmount=item.balance;this.paymentReference='';this.paymentMethod=item.paymentInstructions.acceptedMethods[0]??'NEQUI';this.paymentOpen.set(true);}
  closePayment():void{this.paymentOpen.set(false);}
  sendPaymentProof(item:GuestPortalReservation):void{
    const method=this.paymentMethod==='BANK_TRANSFER'?'Transferencia bancaria':'Nequi';
    const message=[`Hola, envío el comprobante de pago de mi reserva ${item.code}.`,`Huésped: ${item.guestName}`,`Alojamiento: ${item.accommodationName}`,`Medio: ${method}`,`Valor: ${this.money(Number(this.paymentAmount))}`,`Referencia: ${this.paymentReference.trim()}`,'Adjunto el comprobante en este chat. Por favor confirmar cuando sea verificado.'].join('\n');
    window.open(`https://wa.me/${this.whatsappNumber()}?text=${encodeURIComponent(message)}`,'_blank','noopener,noreferrer');
    this.closePayment();void this.alerts.toast('WhatsApp abierto. No olvides adjuntar el comprobante.','info');
  }
  async copy(value:string):Promise<void>{try{await navigator.clipboard.writeText(value);await this.alerts.toast('Número copiado');}catch{await this.alerts.info('Número Nequi',value);}}
  reset():void{this.reservation.set(null);this.error.set('');this.website='';this.formStartedAt=Date.now();this.activeTab.set('reservations');this.closePayment();}
  firstName(name:string):string{return name.trim().split(/\s+/)[0];}
  statusLabel(status:ReservationStatus):string{return({PENDING_PAYMENT:'Pendiente de pago',CONFIRMED:'Confirmada',CHECKED_IN:'En estadía',CHECKED_OUT:'Finalizada',CANCELLED:'Cancelada',EXPIRED:'Expirada',NO_SHOW:'No se presentó',QUOTED:'Cotización'}as Record<ReservationStatus,string>)[status];}
  whatsapp(item:GuestPortalReservation):string{return`https://wa.me/${this.whatsappNumber()}?text=${encodeURIComponent(`Hola, necesito ayuda con mi reserva ${item.code}.`)}`;}
  experienceWhatsapp(item:GuestPortalReservation,experience:string):string{return`https://wa.me/${this.whatsappNumber()}?text=${encodeURIComponent(`Hola, quiero solicitar “${experience}” para mi reserva ${item.code}, del ${item.checkIn} al ${item.checkOut}.`)}`;}
  private whatsappNumber():string{return this.store.settings()?.whatsappNumber||environment.whatsappNumber;}
}
