import { Component, computed } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AlertService } from '../../core/services/alert.service';
import { ApiErrorService } from '../../core/services/api-error.service';
import { StayManagerApiService } from '../../core/services/staymanager-api.service';
import { Reservation } from '../../core/models/domain.models';
import { currency, shortDate } from '../../shared/utils/format.utils';

@Component({
  selector: 'app-dashboard-page',
  standalone: true,
  imports: [RouterLink],
  template: `
    <section class="admin-heading"><div><span class="eyebrow">RESUMEN GENERAL</span><h1>Buenos días, Valentina</h1><p>Esto es lo que está pasando hoy en tus alojamientos.</p></div><a routerLink="/admin/reservas" class="btn btn-primary">＋ Nueva reserva</a></section>
    <section class="metric-grid">
      <article class="metric-card"><span class="metric-icon teal">▣</span><div><small>Reservas activas</small><strong>{{ activeReservations() }}</strong><span class="positive">↑ 12 % este mes</span></div></article>
      <article class="metric-card"><span class="metric-icon gold">$</span><div><small>Ingresos registrados</small><strong>{{ money(store.confirmedRevenue()) }}</strong><span>Pagos aprobados</span></div></article>
      <article class="metric-card"><span class="metric-icon blue">⌁</span><div><small>Ocupación estimada</small><strong>{{ occupancy() }} %</strong><span class="positive">↑ 8 % vs. periodo anterior</span></div></article>
      <article class="metric-card"><span class="metric-icon coral">!</span><div><small>Saldo por cobrar</small><strong>{{ money(pendingBalance()) }}</strong><span>{{ pendingPayments() }} reservas pendientes</span></div></article>
    </section>

    <section class="dashboard-grid">
      <article class="panel large-panel">
        <div class="panel-heading"><div><h2>Próximas llegadas</h2><p>Huéspedes esperados durante los próximos días.</p></div><a routerLink="/admin/reservas" class="text-link">Ver todas →</a></div>
        <div class="arrival-list">
          @for (reservation of upcoming(); track reservation.id) {
            <div class="arrival-item"><div class="date-tile"><strong>{{ day(reservation.checkIn) }}</strong><small>{{ month(reservation.checkIn) }}</small></div><div class="arrival-main"><strong>{{ reservation.guest.fullName }}</strong><span>{{ accommodationName(reservation.accommodationId) }} · {{ reservation.adults + reservation.children }} huéspedes</span></div><span class="status" [class]="reservation.status.toLowerCase()">{{ statusLabel(reservation.status) }}</span><div class="arrival-value"><strong>{{ money(reservation.price.total) }}</strong><span>Saldo {{ money(reservation.price.total - reservation.amountPaid) }}</span></div></div>
          } @empty { <div class="empty-inline">No hay llegadas próximas.</div> }
        </div>
      </article>
      <aside class="panel activity-panel"><div class="panel-heading"><div><h2>Actividad reciente</h2><p>Últimos movimientos</p></div></div><div class="timeline"><div><i class="dot teal"></i><strong>Pago confirmado</strong><span>Laura pagó un anticipo por Nequi.</span><small>Hace 18 minutos</small></div><div><i class="dot blue"></i><strong>Nueva solicitud</strong><span>Reserva familiar creada desde el portal.</span><small>Hace 2 horas</small></div><div><i class="dot gold"></i><strong>Check-out completado</strong><span>Domo Aurora quedó disponible.</span><small>Ayer</small></div></div></aside>
    </section>

    <section class="dashboard-grid bottom-grid">
      <article class="panel"><div class="panel-heading"><div><h2>Ocupación por alojamiento</h2><p>Proyección demostrativa de 30 días.</p></div></div><div class="occupancy-list">@for (item of store.accommodations(); track item.id; let index = $index) { <div><div><strong>{{ item.name }}</strong><span>{{ [82, 64, 71][index] || 55 }} %</span></div><progress max="100" [value]="[82, 64, 71][index] || 55"></progress></div> }</div></article>
      <article class="panel quick-panel"><div class="panel-heading"><div><h2>Acciones rápidas</h2><p>Atajos para la operación diaria.</p></div></div><div class="quick-grid"><a routerLink="/admin/reservas"><span>＋</span>Crear reserva</a><a routerLink="/admin/pagos"><span>$</span>Registrar pago</a><a routerLink="/admin/alojamientos"><span>⌁</span>Nuevo alojamiento</a>@if (store.isDemoMode) { <button type="button" (click)="resetDemo()"><span class="bi bi-arrow-counterclockwise"></span>Restaurar demo</button> } @else { <button type="button" (click)="refreshData()" [disabled]="store.loading()"><span class="bi bi-arrow-clockwise"></span>Actualizar datos</button> }</div></article>
    </section>
  `
})
export class DashboardPageComponent {
  readonly money = currency;
  readonly activeReservations = computed(() => this.store.reservations().filter((r) => ['PENDING_PAYMENT', 'CONFIRMED', 'CHECKED_IN'].includes(r.status)).length);
  readonly pendingPayments = computed(() => this.store.reservations().filter((r) => r.price.total > r.amountPaid && !['CANCELLED', 'EXPIRED'].includes(r.status)).length);
  readonly pendingBalance = computed(() => this.store.reservations().filter((r) => !['CANCELLED', 'EXPIRED'].includes(r.status)).reduce((total, r) => total + r.price.total - r.amountPaid, 0));
  readonly occupancy = computed(() => Math.min(96, Math.round(this.activeReservations() / Math.max(1, this.store.accommodations().length * 0.7) * 100)));
  readonly upcoming = computed(() => this.store.reservations().filter((r) => r.checkIn >= new Date().toISOString().slice(0, 10) && !['CANCELLED', 'EXPIRED'].includes(r.status)).sort((a, b) => a.checkIn.localeCompare(b.checkIn)).slice(0, 4));

  constructor(readonly store: StayManagerApiService, private readonly alerts: AlertService, private readonly errors: ApiErrorService) {}
  accommodationName(id: string): string { return this.store.accommodationById(id)?.name ?? 'Alojamiento'; }
  day(value: string): string { return value.slice(8, 10); }
  month(value: string): string { return shortDate(value).split(' ')[1]?.replace('.', '') ?? ''; }
  statusLabel(status: Reservation['status']): string { return ({ PENDING_PAYMENT: 'Pendiente', CONFIRMED: 'Confirmada', CHECKED_IN: 'Hospedado', CHECKED_OUT: 'Finalizada', CANCELLED: 'Cancelada', QUOTED: 'Cotizada', EXPIRED: 'Expirada', NO_SHOW: 'No llegó' })[status]; }
  async refreshData(): Promise<void> {
    try {
      await this.store.loadAdminData();
      await this.alerts.toast('Datos actualizados');
    } catch (error) {
      await this.alerts.error('No fue posible actualizar', this.errors.message(error));
    }
  }

  async resetDemo(): Promise<void> {
    const confirmed = await this.alerts.confirm('Restaurar demostración', 'Se eliminarán los cambios guardados en este navegador.', 'Restaurar');
    if (!confirmed) return;
    this.store.resetDemoData();
    await this.alerts.toast('Datos de demostración restaurados');
  }
}
