import { Component, computed, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Payment, PaymentMethod, PaymentStatus } from '../../core/models/domain.models';
import { AlertService } from '../../core/services/alert.service';
import { ApiErrorService } from '../../core/services/api-error.service';
import { StayManagerApiService } from '../../core/services/staymanager-api.service';
import { currency } from '../../shared/utils/format.utils';

@Component({
  selector: 'app-payments-page',
  standalone: true,
  imports: [FormsModule],
  template: `
    <section class="admin-heading payments-heading">
      <div><span class="eyebrow">FINANZAS · CONTROL TRANSACCIONAL</span><h1>Centro de pagos</h1><p>Recibe comprobantes, valida movimientos y protege cada operación contra duplicados.</p></div>
      <button class="btn btn-primary" type="button" (click)="openPaymentForm()"><span class="bi bi-plus-lg"></span> Registrar pago</button>
    </section>

    <section class="payment-flow-banner">
      <div class="flow-icon"><span class="bi bi-shield-check"></span></div>
      <div><strong>Flujo de verificación activo</strong><p>Nequi, transferencias y pagos manuales se registran como pendientes. El saldo cambia únicamente después de su aprobación.</p></div>
      <span class="flow-badge">IDEMPOTENTE</span>
    </section>

    <section class="metric-grid payment-metrics payment-metrics-v2">
      <article class="metric-card"><span class="metric-icon teal bi bi-cash-stack"></span><div><small>Total aprobado</small><strong>{{ money(store.confirmedRevenue()) }}</strong><span>Ingresos conciliados</span></div></article>
      <article class="metric-card"><span class="metric-icon gold bi bi-hourglass-split"></span><div><small>Por verificar</small><strong>{{ money(pendingVerification()) }}</strong><span>{{ pendingCount() }} movimiento(s)</span></div></article>
      <article class="metric-card"><span class="metric-icon coral bi bi-wallet2"></span><div><small>Cartera pendiente</small><strong>{{ money(pendingBalance()) }}</strong><span>Saldo de reservas activas</span></div></article>
      <article class="metric-card"><span class="metric-icon blue bi bi-receipt"></span><div><small>Movimientos</small><strong>{{ store.payments().length }}</strong><span>Trazabilidad completa</span></div></article>
    </section>

    <section class="panel table-panel payments-panel">
      <div class="payments-toolbar">
        <div><h2>Movimientos</h2><p>El registro y la aprobación son operaciones independientes.</p></div>
        <label class="status-filter"><span>Filtrar estado</span><select [ngModel]="statusFilter()" (ngModelChange)="statusFilter.set($event)"><option value="ALL">Todos</option><option value="PENDING">Pendientes</option><option value="APPROVED">Aprobados</option><option value="REJECTED">Rechazados</option><option value="REFUNDED">Reembolsados</option></select></label>
      </div>
      <div class="table-scroll">
        <table class="payments-table">
          <thead><tr><th>Movimiento</th><th>Reserva / huésped</th><th>Método</th><th>Registro</th><th>Estado</th><th class="text-end">Valor</th><th>Acciones</th></tr></thead>
          <tbody>
            @for (payment of filteredPayments(); track payment.id) {
              <tr>
                <td><strong>{{ payment.reference }}</strong><small>#{{ payment.id.slice(0, 8).toUpperCase() }}</small></td>
                <td><strong>{{ payment.reservationCode || reservationCode(payment.reservationId) }}</strong><small>{{ payment.guestName || guestName(payment.reservationId) }}</small></td>
                <td><span class="method-chip"><span [class]="methodIcon(payment.method)"></span>{{ methodLabel(payment.method) }}</span></td>
                <td><strong>{{ dateLabel(payment) }}</strong><small>@if (payment.reviewedAt) { Revisado {{ payment.reviewedAt.slice(0, 10) }} } @else { Esperando revisión }</small></td>
                <td><span class="status" [class.pending]="payment.status === 'PENDING'" [class.approved]="payment.status === 'APPROVED'" [class.rejected]="payment.status === 'REJECTED'" [class.refunded]="payment.status === 'REFUNDED'">{{ statusLabel(payment.status) }}</span>@if (payment.rejectionReason) { <small class="rejection-copy">{{ payment.rejectionReason }}</small> }</td>
                <td class="text-end"><strong>{{ money(payment.amount) }}</strong></td>
                <td>
                  @if (payment.status === 'PENDING') {
                    <div class="payment-actions"><button class="action-button approve" type="button" [disabled]="reviewingId() === payment.id" (click)="approve(payment)" title="Aprobar"><span class="bi bi-check-lg"></span></button><button class="action-button reject" type="button" [disabled]="reviewingId() === payment.id" (click)="openReject(payment)" title="Rechazar"><span class="bi bi-x-lg"></span></button></div>
                  } @else { <span class="reviewed-label"><span class="bi bi-shield-check"></span> Revisado</span> }
                </td>
              </tr>
            } @empty { <tr><td colspan="7"><div class="empty-inline">No hay movimientos para el filtro seleccionado.</div></td></tr> }
          </tbody>
        </table>
      </div>
      <div class="table-footer"><span>{{ filteredPayments().length }} movimiento(s)</span><span>Los pagos pendientes no afectan los ingresos ni el saldo abonado.</span></div>
    </section>

    @if (paymentOpen()) {
      <div class="modal-backdrop"><form class="simple-modal payment-modal" #form="ngForm" (ngSubmit)="savePayment()"><button type="button" class="modal-close" (click)="paymentOpen.set(false)">×</button><span class="eyebrow">NUEVO MOVIMIENTO</span><h2>Registrar para verificación</h2><p>El movimiento quedará pendiente hasta que un usuario autorizado lo apruebe.</p><label>Reserva<select name="reservation" [(ngModel)]="reservationId" required (ngModelChange)="suggestBalance()"><option value="">Selecciona una reserva</option>@for (reservation of payableReservations(); track reservation.id) { <option [value]="reservation.id">{{ reservation.code }} · {{ reservation.guest.fullName }} · saldo {{ money(reservation.price.total - reservation.amountPaid) }}</option> }</select></label><div class="form-grid two"><label>Valor<input type="number" name="amount" [(ngModel)]="amount" min="1" required></label><label>Método<select name="method" [(ngModel)]="method"><option value="NEQUI">Nequi</option><option value="BANK_TRANSFER">Transferencia bancaria</option><option value="CASH">Efectivo</option><option value="CARD">Tarjeta</option><option value="MANUAL">Registro manual</option></select></label></div><label>Referencia o comprobante<input name="reference" [(ngModel)]="reference" maxlength="100" required placeholder="Ej. NQ-123456 o TR-90871"></label><div class="idempotency-note"><span class="bi bi-fingerprint"></span><div><strong>Operación protegida</strong><small>Si hay doble clic o un reintento de red, StayManager reutiliza la misma transacción.</small></div></div>@if (error()) { <div class="alert alert-danger py-2">{{ error() }}</div> }<button class="btn btn-primary btn-block" [disabled]="form.invalid || submitting()">@if (submitting()) { <span class="spinner-border spinner-border-sm me-2"></span> }Registrar movimiento</button></form></div>
    }

    @if (rejectingPayment()) {
      <div class="modal-backdrop"><form class="simple-modal rejection-modal" #rejectForm="ngForm" (ngSubmit)="reject()"><button type="button" class="modal-close" (click)="closeReject()">×</button><span class="eyebrow">CONTROL DE PAGOS</span><h2>Rechazar movimiento</h2><p>Referencia <strong>{{ rejectingPayment()?.reference }}</strong> por {{ money(rejectingPayment()?.amount || 0) }}. El saldo de la reserva no será modificado.</p><label>Motivo del rechazo<textarea name="rejectionReason" [(ngModel)]="rejectionReason" required maxlength="500" rows="4" placeholder="Ej. No fue posible validar el comprobante."></textarea></label><div class="modal-actions"><button type="button" class="btn btn-outline-secondary" (click)="closeReject()">Cancelar</button><button class="btn btn-danger" [disabled]="rejectForm.invalid || reviewingId() === rejectingPayment()?.id">Rechazar pago</button></div></form></div>
    }
  `,
  styles: [`
    .payments-heading { align-items: center; }
    .payment-flow-banner { display: grid; grid-template-columns: 46px 1fr auto; gap: 15px; align-items: center; padding: 17px 20px; margin-bottom: 20px; border: 1px solid #cfe5df; border-radius: 14px; background: linear-gradient(110deg,#eef9f5,#f9fcfb); }
    .flow-icon { width: 44px; height: 44px; display: grid; place-items: center; border-radius: 12px; background: #dcefe9; color: var(--primary); font-size: 1.2rem; }
    .payment-flow-banner strong { font-size: .82rem; } .payment-flow-banner p { margin: 4px 0 0; font-size: .69rem; }
    .flow-badge { padding: 7px 10px; border-radius: 99px; background: #fff; color: var(--primary); border: 1px solid #cfe5df; font-size: .58rem; font-weight: 850; letter-spacing: .08em; }
    .payment-metrics-v2 { grid-template-columns: repeat(4,minmax(0,1fr)); }
    .payments-panel { border-radius: 16px; }
    .payments-toolbar { display: flex; align-items: end; justify-content: space-between; gap: 18px; padding: 20px; border-bottom: 1px solid var(--line); }
    .payments-toolbar h2 { margin: 0 0 5px; font-size: 1rem; } .payments-toolbar p { margin: 0; font-size: .7rem; }
    .status-filter { width: 190px; margin: 0; } .status-filter span { display: block; margin-bottom: 5px; color: var(--muted); font-size: .6rem; font-weight: 750; text-transform: uppercase; }
    .status-filter select { margin: 0; padding: 8px 10px; font-size: .7rem; }
    .payments-table { min-width: 1080px; }
    .method-chip { display: inline-flex; align-items: center; gap: 7px; padding: 6px 9px; border-radius: 8px; background: #f4f7f5; font-size: .65rem; font-weight: 700; }
    .status.pending { background: #fff3d9; color: #8f6208; } .status.rejected { background: #ffecea; color: #b44438; } .status.refunded { background: #eceff4; color: #536172; }
    .rejection-copy { display: block; max-width: 170px; margin-top: 5px; color: #a24d43; }
    .payment-actions { display: flex; gap: 7px; } .action-button { width: 31px; height: 31px; border-radius: 8px; border: 1px solid var(--line); background: #fff; cursor: pointer; }
    .action-button.approve { color: #177052; background: #edf8f3; border-color: #cce9dd; } .action-button.reject { color: #b44438; background: #fff3f1; border-color: #f2d4d0; }
    .action-button:disabled { opacity: .55; cursor: wait; } .reviewed-label { color: var(--muted); font-size: .62rem; white-space: nowrap; }
    .payment-modal > p, .rejection-modal > p { margin: -4px 0 22px; font-size: .74rem; }
    .idempotency-note { display: flex; gap: 11px; align-items: center; margin: 17px 0; padding: 11px 12px; border-radius: 10px; background: #f3f8f6; color: var(--primary); }
    .idempotency-note > span { font-size: 1.25rem; } .idempotency-note div { display: flex; flex-direction: column; } .idempotency-note strong { font-size: .68rem; } .idempotency-note small { margin-top: 3px; color: var(--muted); font-size: .61rem; }
    .modal-actions { display: flex; justify-content: flex-end; gap: 10px; margin-top: 20px; }
    @media (max-width: 1100px) { .payment-metrics-v2 { grid-template-columns: repeat(2,1fr); } }
    @media (max-width: 600px) { .payment-flow-banner { grid-template-columns: 42px 1fr; } .flow-badge { grid-column: 1/-1; width: max-content; } .payment-metrics-v2 { grid-template-columns: 1fr; } .payments-toolbar { align-items: stretch; flex-direction: column; } .status-filter { width: 100%; } }
  `]
})
export class PaymentsPageComponent {
  readonly money = currency;
  readonly paymentOpen = signal(false);
  readonly error = signal('');
  readonly submitting = signal(false);
  readonly reviewingId = signal('');
  readonly rejectingPayment = signal<Payment | null>(null);
  readonly statusFilter = signal<PaymentStatus | 'ALL'>('ALL');
  reservationId = '';
  amount = 0;
  method: PaymentMethod = 'NEQUI';
  reference = '';
  rejectionReason = '';
  private paymentAttempt: { fingerprint: string; key: string } | null = null;

  readonly payableReservations = computed(() => this.store.reservations().filter((r) => r.price.total > r.amountPaid && !['CANCELLED', 'EXPIRED'].includes(r.status)));
  readonly pendingBalance = computed(() => this.payableReservations().reduce((total, r) => total + r.price.total - r.amountPaid, 0));
  readonly pendingVerification = computed(() => this.store.payments().filter((p) => p.status === 'PENDING').reduce((sum, p) => sum + Number(p.amount), 0));
  readonly pendingCount = computed(() => this.store.payments().filter((p) => p.status === 'PENDING').length);
  readonly filteredPayments = computed(() => this.statusFilter() === 'ALL' ? this.store.payments() : this.store.payments().filter((p) => p.status === this.statusFilter()));

  constructor(readonly store: StayManagerApiService, private readonly alerts: AlertService, private readonly errors: ApiErrorService) {}

  reservationCode(id: string): string { return this.store.reservations().find((r) => r.id === id)?.code ?? '—'; }
  guestName(id: string): string { return this.store.reservations().find((r) => r.id === id)?.guest.fullName ?? '—'; }
  methodLabel(method: PaymentMethod): string { return ({ NEQUI: 'Nequi', BANK_TRANSFER: 'Transferencia', CASH: 'Efectivo', CARD: 'Tarjeta', MANUAL: 'Manual' })[method]; }
  methodIcon(method: PaymentMethod): string { return ({ NEQUI: 'bi bi-phone', BANK_TRANSFER: 'bi bi-bank', CASH: 'bi bi-cash', CARD: 'bi bi-credit-card', MANUAL: 'bi bi-pencil-square' })[method]; }
  statusLabel(status: PaymentStatus): string { return ({ PENDING: 'Por verificar', APPROVED: 'Aprobado', REJECTED: 'Rechazado', REFUNDED: 'Reembolsado' })[status]; }
  dateLabel(payment: Payment): string { return (payment.submittedAt || payment.paidAt || '').slice(0, 10) || '—'; }

  openPaymentForm(): void { this.error.set(''); this.paymentAttempt = null; this.paymentOpen.set(true); }
  suggestBalance(): void { const r = this.store.reservations().find((item) => item.id === this.reservationId); this.amount = r ? r.price.total - r.amountPaid : 0; this.paymentAttempt = null; }

  async savePayment(): Promise<void> {
    this.error.set('');
    this.submitting.set(true);
    const fingerprint = JSON.stringify([this.reservationId, Number(this.amount), this.method, this.reference.trim()]);
    if (!this.paymentAttempt || this.paymentAttempt.fingerprint !== fingerprint) this.paymentAttempt = { fingerprint, key: crypto.randomUUID() };
    try {
      await this.store.registerPayment(this.reservationId, this.amount, this.method, this.reference, this.paymentAttempt.key);
      this.paymentOpen.set(false);
      this.reservationId = ''; this.amount = 0; this.reference = ''; this.paymentAttempt = null;
      await this.alerts.toast('Movimiento registrado para verificación');
    } catch (error) {
      const message = this.errors.message(error, 'No fue posible registrar el movimiento.');
      this.error.set(message);
      await this.alerts.error('No se pudo registrar el pago', message);
    } finally { this.submitting.set(false); }
  }

  async approve(payment: Payment): Promise<void> {
    if (!await this.alerts.confirm('¿Aprobar este pago?', `Se abonarán ${this.money(payment.amount)} a la reserva ${payment.reservationCode}.`, 'Aprobar pago')) return;
    this.reviewingId.set(payment.id);
    try { await this.store.approvePayment(payment.id); await this.alerts.toast('Pago aprobado y saldo actualizado'); }
    catch (error) { await this.alerts.error('No se pudo aprobar', this.errors.message(error, 'El movimiento no pudo aprobarse.')); }
    finally { this.reviewingId.set(''); }
  }

  openReject(payment: Payment): void { this.rejectionReason = ''; this.rejectingPayment.set(payment); }
  closeReject(): void { this.rejectingPayment.set(null); this.rejectionReason = ''; }
  async reject(): Promise<void> {
    const payment = this.rejectingPayment(); if (!payment) return;
    this.reviewingId.set(payment.id);
    try { await this.store.rejectPayment(payment.id, this.rejectionReason); this.closeReject(); await this.alerts.toast('Pago rechazado', 'info'); }
    catch (error) { await this.alerts.error('No se pudo rechazar', this.errors.message(error, 'El movimiento no pudo rechazarse.')); }
    finally { this.reviewingId.set(''); }
  }
}
