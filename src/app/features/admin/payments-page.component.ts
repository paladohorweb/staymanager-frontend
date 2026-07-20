import { SlicePipe } from '@angular/common';
import { Component, computed, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { PaymentMethod } from '../../core/models/domain.models';
import { AlertService } from '../../core/services/alert.service';
import { ApiErrorService } from '../../core/services/api-error.service';
import { StayManagerApiService } from '../../core/services/staymanager-api.service';
import { currency } from '../../shared/utils/format.utils';

@Component({
  selector: 'app-payments-page', standalone: true, imports: [FormsModule, SlicePipe],
  template: `
    <section class="admin-heading"><div><span class="eyebrow">FINANZAS</span><h1>Pagos</h1><p>Registra anticipos, controla saldos y consulta movimientos.</p></div><button class="btn btn-primary" type="button" (click)="paymentOpen.set(true)">＋ Registrar pago</button></section>
    <section class="metric-grid payment-metrics"><article class="metric-card"><span class="metric-icon teal">$</span><div><small>Total recibido</small><strong>{{ money(store.confirmedRevenue()) }}</strong><span>Pagos aprobados</span></div></article><article class="metric-card"><span class="metric-icon coral">↗</span><div><small>Cartera pendiente</small><strong>{{ money(pendingBalance()) }}</strong><span>Reservas activas</span></div></article><article class="metric-card"><span class="metric-icon blue">#</span><div><small>Transacciones</small><strong>{{ store.payments().length }}</strong><span>Registradas en la demo</span></div></article></section>
    <section class="panel table-panel"><div class="panel-heading"><div><h2>Historial de movimientos</h2><p>Pagos manuales y transferencias confirmadas.</p></div></div><div class="table-scroll"><table><thead><tr><th>Referencia</th><th>Reserva</th><th>Huésped</th><th>Método</th><th>Fecha</th><th>Estado</th><th>Valor</th></tr></thead><tbody>@for (payment of store.payments(); track payment.id) { <tr><td><strong>{{ payment.reference }}</strong><small>{{ payment.id.slice(0,8) }}</small></td><td><strong>{{ reservationCode(payment.reservationId) }}</strong></td><td><strong>{{ guestName(payment.reservationId) }}</strong></td><td>{{ methodLabel(payment.method) }}</td><td>{{ payment.paidAt | slice:0:10 }}</td><td><span class="status approved">Aprobado</span></td><td><strong>{{ money(payment.amount) }}</strong></td></tr> }</tbody></table></div></section>
    @if (paymentOpen()) { <div class="modal-backdrop"><form class="simple-modal" #form="ngForm" (ngSubmit)="savePayment()"><button type="button" class="modal-close" (click)="paymentOpen.set(false)">×</button><span class="eyebrow">NUEVO MOVIMIENTO</span><h2>Registrar pago</h2><label>Reserva<select name="reservation" [(ngModel)]="reservationId" required (ngModelChange)="suggestBalance()"><option value="">Selecciona una reserva</option>@for (reservation of payableReservations(); track reservation.id) { <option [value]="reservation.id">{{ reservation.code }} · {{ reservation.guest.fullName }} · saldo {{ money(reservation.price.total - reservation.amountPaid) }}</option> }</select></label><div class="form-grid two"><label>Valor<input type="number" name="amount" [(ngModel)]="amount" min="1" required></label><label>Método<select name="method" [(ngModel)]="method"><option value="NEQUI">Nequi</option><option value="BANK_TRANSFER">Transferencia</option><option value="CASH">Efectivo</option><option value="CARD">Tarjeta</option></select></label></div><label>Referencia<input name="reference" [(ngModel)]="reference" required placeholder="Ej. NQ-123456"></label>@if (error()) { <div class="alert alert-danger py-2">{{ error() }}</div> }<button class="btn btn-primary btn-block" [disabled]="form.invalid || submitting()">@if (submitting()) { <span class="spinner-border spinner-border-sm me-2"></span> }Confirmar pago</button></form></div> }
  `
})
export class PaymentsPageComponent {
  readonly money = currency; readonly paymentOpen = signal(false); readonly error = signal(''); readonly submitting = signal(false);
  reservationId = ''; amount = 0; method: PaymentMethod = 'NEQUI'; reference = '';
  readonly payableReservations = computed(() => this.store.reservations().filter((r) => r.price.total > r.amountPaid && !['CANCELLED', 'EXPIRED'].includes(r.status)));
  readonly pendingBalance = computed(() => this.payableReservations().reduce((total, r) => total + r.price.total - r.amountPaid, 0));
  constructor(readonly store: StayManagerApiService, private readonly alerts: AlertService, private readonly errors: ApiErrorService) {}
  reservationCode(id: string): string { return this.store.reservations().find((r) => r.id === id)?.code ?? '—'; }
  guestName(id: string): string { return this.store.reservations().find((r) => r.id === id)?.guest.fullName ?? '—'; }
  methodLabel(method: PaymentMethod): string { return ({ NEQUI: 'Nequi', BANK_TRANSFER: 'Transferencia', CASH: 'Efectivo', CARD: 'Tarjeta' })[method]; }
  suggestBalance(): void { const r = this.store.reservations().find((item) => item.id === this.reservationId); this.amount = r ? r.price.total - r.amountPaid : 0; }
  async savePayment(): Promise<void> {
    this.error.set('');
    this.submitting.set(true);
    try {
      await this.store.registerPayment(this.reservationId, this.amount, this.method, this.reference);
      this.paymentOpen.set(false);
      this.reservationId = ''; this.amount = 0; this.reference = '';
      await this.alerts.toast('Pago registrado correctamente');
    } catch (error) {
      const message = this.errors.message(error, 'No fue posible registrar el pago.');
      this.error.set(message);
      await this.alerts.error('No se pudo registrar el pago', message);
    } finally {
      this.submitting.set(false);
    }
  }
}
