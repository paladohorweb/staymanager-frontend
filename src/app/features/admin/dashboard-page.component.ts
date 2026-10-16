import { Component, computed } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Reservation } from '../../core/models/domain.models';
import { AlertService } from '../../core/services/alert.service';
import { ApiErrorService } from '../../core/services/api-error.service';
import { AuthService } from '../../core/services/auth.service';
import { StayManagerApiService } from '../../core/services/staymanager-api.service';
import { currency, shortDate } from '../../shared/utils/format.utils';

@Component({
  selector: 'app-dashboard-page',
  standalone: true,
  imports: [RouterLink],
  template: `
    <section class="admin-heading">
      <div>
        <span class="eyebrow">RESUMEN GENERAL</span>
        <h1>{{ greeting() }}, {{ firstName() }}</h1>
        <p>Indicadores operativos calculados con los datos reales de tu organización.</p>
      </div>
      <a routerLink="/admin/reservas" class="btn btn-primary">＋ Nueva reserva</a>
    </section>

    <section class="metric-grid">
      <article class="metric-card">
        <span class="metric-icon teal">▣</span>
        <div><small>Reservas activas</small><strong>{{ activeReservations() }}</strong><span>{{ pendingReservations() }} pendientes de pago</span></div>
      </article>
      <article class="metric-card">
        <span class="metric-icon gold">$</span>
        <div><small>Ingresos del mes</small><strong>{{ money(monthlyRevenue()) }}</strong><span>{{ money(totalRevenue()) }} históricos aprobados</span></div>
      </article>
      <article class="metric-card">
        <span class="metric-icon blue">⌁</span>
        <div><small>Ocupación de hoy</small><strong>{{ occupancy() }} %</strong><span>{{ occupiedAccommodations() }} de {{ activeAccommodations() }} alojamientos</span></div>
      </article>
      <article class="metric-card">
        <span class="metric-icon coral">!</span>
        <div><small>Saldo por cobrar</small><strong>{{ money(pendingBalance()) }}</strong><span>Reservas vigentes con saldo</span></div>
      </article>
    </section>

    <section class="dashboard-grid">
      <article class="panel large-panel">
        <div class="panel-heading">
          <div><h2>Próximas llegadas</h2><p>Huéspedes esperados durante los próximos días.</p></div>
          <a routerLink="/admin/reservas" class="text-link">Ver todas →</a>
        </div>
        <div class="arrival-list">
          @for (reservation of upcoming(); track reservation.id) {
            <div class="arrival-item">
              <div class="date-tile"><strong>{{ day(reservation.checkIn) }}</strong><small>{{ month(reservation.checkIn) }}</small></div>
              <div class="arrival-main"><strong>{{ reservation.guest.fullName }}</strong><span>{{ accommodationName(reservation.accommodationId) }} · {{ reservation.adults + reservation.children }} huéspedes</span></div>
              <span class="status" [class]="reservation.status.toLowerCase()">{{ statusLabel(reservation.status) }}</span>
              <div class="arrival-value"><strong>{{ money(reservation.price.total) }}</strong><span>Saldo {{ money(reservation.balance) }}</span></div>
            </div>
          } @empty {
            <div class="empty-inline">No hay llegadas próximas.</div>
          }
        </div>
      </article>

      <aside class="panel activity-panel">
        <div class="panel-heading"><div><h2>Operación de hoy</h2><p>Estado en tiempo real</p></div></div>
        <div class="timeline">
          <div><i class="dot teal"></i><strong>{{ arrivalsToday() }} llegadas</strong><span>Reservas con entrada programada para hoy.</span></div>
          <div><i class="dot blue"></i><strong>{{ departuresToday() }} salidas</strong><span>Reservas con check-out programado.</span></div>
          <div><i class="dot gold"></i><strong>{{ guestsInHouse() }} huéspedes alojados</strong><span>Personas asociadas a reservas en check-in.</span></div>
        </div>
      </aside>
    </section>

    <section class="dashboard-grid bottom-grid">
      <article class="panel">
        <div class="panel-heading"><div><h2>Ocupación por alojamiento</h2><p>Proyección calculada para los próximos 30 días.</p></div></div>
        <div class="occupancy-list">
          @for (item of store.accommodations(); track item.id) {
            <div>
              <div><strong>{{ item.name }}</strong><span>{{ accommodationOccupancy(item.id) }} %</span></div>
              <progress max="100" [value]="accommodationOccupancy(item.id)"></progress>
            </div>
          } @empty {
            <div class="empty-inline">Registra un alojamiento para comenzar.</div>
          }
        </div>
      </article>

      <article class="panel quick-panel">
        <div class="panel-heading"><div><h2>Acciones rápidas</h2><p>Atajos para la operación diaria.</p></div></div>
        <div class="quick-grid">
          <a routerLink="/admin/operacion"><span class="bi bi-box-arrow-in-right"></span>Gestionar llegadas</a>
          <a routerLink="/admin/limpieza"><span class="bi bi-stars"></span>Coordinar limpieza</a>
          <a routerLink="/admin/configuracion"><span class="bi bi-geo-alt"></span>Configurar ubicación</a>
          @if (store.isDemoMode) {
            <button type="button" (click)="resetDemo()"><span class="bi bi-arrow-counterclockwise"></span>Restaurar demo</button>
          } @else {
            <button type="button" (click)="refreshData()" [disabled]="store.loading()"><span class="bi bi-arrow-clockwise"></span>Actualizar datos</button>
          }
        </div>
      </article>
    </section>
  `
})
export class DashboardPageComponent {
  readonly money = currency;
  readonly activeReservations = computed(() => this.store.dashboard()?.activeReservations ?? 0);
  readonly pendingReservations = computed(() => this.store.dashboard()?.pendingReservations ?? 0);
  readonly monthlyRevenue = computed(() => this.store.dashboard()?.monthlyRevenue ?? 0);
  readonly totalRevenue = computed(() => this.store.dashboard()?.approvedRevenue ?? 0);
  readonly occupancy = computed(() => this.store.dashboard()?.occupancyRate ?? 0);
  readonly occupiedAccommodations = computed(() => this.store.dashboard()?.occupiedAccommodations ?? 0);
  readonly activeAccommodations = computed(() => this.store.dashboard()?.activeAccommodations ?? 0);
  readonly pendingBalance = computed(() => this.store.dashboard()?.pendingBalance ?? 0);
  readonly arrivalsToday = computed(() => this.store.dashboard()?.arrivalsToday ?? 0);
  readonly departuresToday = computed(() => this.store.dashboard()?.departuresToday ?? 0);
  readonly guestsInHouse = computed(() => this.store.dashboard()?.guestsInHouse ?? 0);
  readonly upcoming = computed(() => this.store.reservations()
    .filter((reservation) => reservation.checkIn >= this.localDate(new Date()) && !['CANCELLED', 'EXPIRED', 'NO_SHOW'].includes(reservation.status))
    .sort((a, b) => a.checkIn.localeCompare(b.checkIn))
    .slice(0, 4));

  constructor(
    readonly store: StayManagerApiService,
    private readonly auth: AuthService,
    private readonly alerts: AlertService,
    private readonly errors: ApiErrorService
  ) {}

  greeting(): string {
    const hour = new Date().getHours();
    if (hour < 12) return 'Buenos días';
    if (hour < 18) return 'Buenas tardes';
    return 'Buenas noches';
  }

  firstName(): string {
    return this.auth.currentUser()?.fullName.trim().split(/\s+/)[0] || 'Administrador';
  }

  accommodationName(id: string): string {
    return this.store.accommodationById(id)?.name ?? 'Alojamiento';
  }

  accommodationOccupancy(accommodationId: string): number {
    const start = this.atMidday(new Date());
    const end = new Date(start);
    end.setDate(end.getDate() + 30);
    const blockedNights = this.store.reservations()
      .filter((item) => item.accommodationId === accommodationId && !['CANCELLED', 'EXPIRED', 'NO_SHOW'].includes(item.status))
      .reduce((total, item) => {
        const checkIn = this.parseDate(item.checkIn);
        const checkOut = this.parseDate(item.checkOut);
        const overlapStart = checkIn > start ? checkIn : start;
        const overlapEnd = checkOut < end ? checkOut : end;
        return total + Math.max(0, Math.round((overlapEnd.getTime() - overlapStart.getTime()) / 86_400_000));
      }, 0);
    return Math.min(100, Math.round(blockedNights * 100 / 30));
  }

  day(value: string): string { return value.slice(8, 10); }
  month(value: string): string { return shortDate(value).split(' ')[1]?.replace('.', '') ?? ''; }
  statusLabel(status: Reservation['status']): string {
    return ({
      PENDING_PAYMENT: 'Pendiente', CONFIRMED: 'Confirmada', CHECKED_IN: 'Hospedado', CHECKED_OUT: 'Finalizada',
      CANCELLED: 'Cancelada', QUOTED: 'Cotizada', EXPIRED: 'Expirada', NO_SHOW: 'No llegó'
    })[status];
  }

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

  private parseDate(value: string): Date {
    const [year, month, day] = value.split('-').map(Number);
    return new Date(year, month - 1, day, 12);
  }

  private atMidday(value: Date): Date {
    return new Date(value.getFullYear(), value.getMonth(), value.getDate(), 12);
  }

  private localDate(value: Date): string {
    const year = value.getFullYear();
    const month = String(value.getMonth() + 1).padStart(2, '0');
    const day = String(value.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
}
