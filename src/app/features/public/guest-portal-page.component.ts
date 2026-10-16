import { Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { GuestPortalReservation, ReservationStatus } from '../../core/models/domain.models';
import { AlertService } from '../../core/services/alert.service';
import { ApiErrorService } from '../../core/services/api-error.service';
import { StayManagerApiService } from '../../core/services/staymanager-api.service';
import { currency, shortDate } from '../../shared/utils/format.utils';

@Component({
  selector: 'app-guest-portal-page',
  standalone: true,
  imports: [FormsModule, RouterLink],
  styles: [`
    .portal-hero{padding:7rem 0 3rem;background:linear-gradient(135deg,#eef5ff,#fff)}
    .portal-shell{max-width:980px;margin:auto}.access-card{max-width:620px;margin:0 auto}
    .portal-grid{display:grid;grid-template-columns:1.35fr .65fr;gap:1.25rem;align-items:start}
    .stay-card,.payment-card{padding:1.5rem}.portal-heading{display:flex;justify-content:space-between;gap:1rem;align-items:start}
    .status-pill{border-radius:999px;padding:.45rem .8rem;background:#e8f0ff;color:#1d4ed8;font-weight:700;font-size:.78rem}
    .facts{display:grid;grid-template-columns:repeat(2,1fr);gap:1rem;margin:1.5rem 0}.fact{padding:1rem;background:#f8fafc;border-radius:12px}
    .fact small{display:block;color:#64748b}.fact strong{display:block;margin-top:.2rem}.payment-line{display:flex;justify-content:space-between;margin:.7rem 0}
    .balance{padding-top:1rem;border-top:1px solid #e2e8f0;font-size:1.08rem}.portal-actions{display:flex;gap:.75rem;flex-wrap:wrap;margin-top:1.25rem}
    @media(max-width:760px){.portal-grid{grid-template-columns:1fr}.facts{grid-template-columns:1fr}.portal-heading{display:block}.status-pill{display:inline-block;margin-top:.5rem}}
  `],
  template: `
    <section class="portal-hero">
      <div class="container portal-shell">
        <span class="eyebrow">PORTAL DEL HUÉSPED</span>
        <h1>Tu estadía, siempre a la mano</h1>
        <p>Consulta fechas, pagos y estado de tu reserva con el código enviado al confirmar.</p>
      </div>
    </section>
    <section class="section">
      <div class="container portal-shell">
        @if (!reservation()) {
          <form class="card-panel access-card" #accessForm="ngForm" (ngSubmit)="access()">
            <h2>Consultar mi reserva</h2><p>Usa el mismo correo registrado durante la reserva.</p>
            <div class="form-grid two">
              <label>Código de reserva<input name="code" [(ngModel)]="code" required maxlength="20" placeholder="ST-2601234"></label>
              <label>Correo electrónico<input type="email" name="email" [(ngModel)]="email" required email placeholder="correo@ejemplo.com"></label>
            </div>
            @if (error()) { <div class="alert alert-danger py-2" role="alert">{{ error() }}</div> }
            <button class="btn btn-primary btn-block" type="submit" [disabled]="accessForm.invalid || loading()">
              @if (loading()) { <span class="spinner-border spinner-border-sm me-2"></span> } Ver mi estadía
            </button>
          </form>
        } @else if (reservation(); as item) {
          <div class="portal-heading mb-4"><div><button class="text-button p-0 mb-2" type="button" (click)="reset()">← Consultar otra</button><h2>Hola, {{ firstName(item.guestName) }}</h2><p>{{ item.propertyName }} · {{ item.propertyLocation }}</p></div><span class="status-pill">{{ statusLabel(item.status) }}</span></div>
          <div class="portal-grid">
            <article class="card-panel stay-card">
              <span class="eyebrow">RESERVA {{ item.code }}</span><h3>{{ item.accommodationName }}</h3>
              <div class="facts">
                <div class="fact"><small>Entrada</small><strong>{{ date(item.checkIn) }}</strong></div>
                <div class="fact"><small>Salida</small><strong>{{ date(item.checkOut) }}</strong></div>
                <div class="fact"><small>Huéspedes</small><strong>{{ item.adults }} adultos · {{ item.children }} niños</strong></div>
                <div class="fact"><small>Noches</small><strong>{{ item.price.nights }}</strong></div>
              </div>
              @if (item.notes) { <div class="alert alert-light"><strong>Solicitud:</strong> {{ item.notes }}</div> }
              <div class="portal-actions"><a class="btn btn-primary" [href]="whatsapp(item)" target="_blank" rel="noopener">Hablar por WhatsApp</a>@if (item.cancellable) { <button class="btn btn-outline" type="button" (click)="cancel()" [disabled]="loading()">Cancelar reserva</button> }</div>
            </article>
            <aside class="card-panel payment-card"><span class="eyebrow">PAGOS</span><div class="payment-line"><span>Total</span><strong>{{ money(item.price.total) }}</strong></div><div class="payment-line"><span>Pagado</span><strong>{{ money(item.amountPaid) }}</strong></div><div class="payment-line balance"><span>Saldo pendiente</span><strong>{{ money(item.balance) }}</strong></div><small>Los pagos son validados por el alojamiento. Conserva siempre tu referencia.</small></aside>
          </div>
        }
      </div>
    </section>
  `
})
export class GuestPortalPageComponent {
  code = '';
  email = '';
  readonly reservation = signal<GuestPortalReservation | null>(null);
  readonly loading = signal(false);
  readonly error = signal('');
  readonly money = currency;
  readonly date = shortDate;

  constructor(
    route: ActivatedRoute,
    private readonly store: StayManagerApiService,
    private readonly errors: ApiErrorService,
    private readonly alerts: AlertService
  ) {
    this.code = route.snapshot.queryParamMap.get('code') ?? '';
    this.email = route.snapshot.queryParamMap.get('email') ?? '';
    if (this.code && this.email) void this.access();
  }

  async access(): Promise<void> {
    this.loading.set(true); this.error.set('');
    try { this.reservation.set(await this.store.accessGuestReservation(this.code, this.email)); }
    catch (error) { this.error.set(this.errors.message(error, 'No fue posible consultar la reserva.')); }
    finally { this.loading.set(false); }
  }

  async cancel(): Promise<void> {
    const confirmed = await this.alerts.confirm('¿Cancelar la reserva?', 'Esta acción liberará las fechas seleccionadas.');
    if (!confirmed) return;
    this.loading.set(true);
    try {
      this.reservation.set(await this.store.cancelGuestReservation(this.code, this.email));
      await this.alerts.success('Reserva cancelada', 'El alojamiento recibió la actualización.');
    } catch (error) { await this.alerts.error('No se pudo cancelar', this.errors.message(error)); }
    finally { this.loading.set(false); }
  }

  reset(): void { this.reservation.set(null); this.error.set(''); }
  firstName(name: string): string { return name.trim().split(/\s+/)[0]; }
  statusLabel(status: ReservationStatus): string { return ({ PENDING_PAYMENT:'Pendiente de pago', CONFIRMED:'Confirmada', CHECKED_IN:'En estadía', CHECKED_OUT:'Finalizada', CANCELLED:'Cancelada', EXPIRED:'Expirada', NO_SHOW:'No se presentó', QUOTED:'Cotización' } as Record<ReservationStatus,string>)[status]; }
  whatsapp(item: GuestPortalReservation): string { return `https://wa.me/573233098671?text=${encodeURIComponent(`Hola, necesito ayuda con mi reserva ${item.code}.`)}`; }
}
