import { Component, computed, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Reservation, ReservationStatus } from '../../core/models/domain.models';
import { AlertService } from '../../core/services/alert.service';
import { ApiErrorService } from '../../core/services/api-error.service';
import { StayManagerApiService } from '../../core/services/staymanager-api.service';
import { currency, shortDate } from '../../shared/utils/format.utils';

@Component({
  selector: 'app-reservations-page',
  standalone: true,
  imports: [FormsModule],
  template: `
    <section class="admin-heading"><div><span class="eyebrow">OPERACIÓN</span><h1>Reservas</h1><p>Consulta, filtra y actualiza el ciclo de cada estadía.</p></div><button class="btn btn-primary" type="button" (click)="showHelp.set(true)">＋ Nueva reserva</button></section>
    <section class="panel table-panel">
      <div class="table-toolbar"><div class="search-input"><span>⌕</span><input [(ngModel)]="search" (ngModelChange)="touch()" placeholder="Buscar por huésped, código o alojamiento"></div><select [(ngModel)]="status" (ngModelChange)="touch()"><option value="ALL">Todos los estados</option><option value="PENDING_PAYMENT">Pendientes de pago</option><option value="CONFIRMED">Confirmadas</option><option value="CHECKED_IN">Check-in</option><option value="CHECKED_OUT">Finalizadas</option><option value="CANCELLED">Canceladas</option></select><div class="view-switch"><button class="active">Lista</button><button disabled>Calendario</button></div></div>
      <div class="table-scroll"><table><thead><tr><th>Reserva</th><th>Huésped</th><th>Alojamiento</th><th>Estadía</th><th>Estado</th><th>Total / saldo</th><th>Acciones</th></tr></thead><tbody>
        @for (reservation of filtered(); track reservation.id) {
          <tr><td><strong>{{ reservation.code }}</strong><small>Creada {{ date(reservation.createdAt.slice(0,10)) }}</small></td><td><strong>{{ reservation.guest.fullName }}</strong><small>{{ reservation.guest.phone }}</small></td><td><strong>{{ accommodationName(reservation.accommodationId) }}</strong><small>{{ reservation.adults + reservation.children }} huéspedes</small></td><td><strong>{{ date(reservation.checkIn) }}</strong><small>hasta {{ date(reservation.checkOut) }}</small></td><td><span class="status" [class]="reservation.status.toLowerCase()">{{ statusLabel(reservation.status) }}</span></td><td><strong>{{ money(reservation.price.total) }}</strong><small>Saldo: {{ money(reservation.price.total - reservation.amountPaid) }}</small></td><td><select class="action-select" [ngModel]="reservation.status" (ngModelChange)="changeStatus(reservation, $event)"><option value="PENDING_PAYMENT">Pendiente</option><option value="CONFIRMED">Confirmar</option><option value="CHECKED_IN">Check-in</option><option value="CHECKED_OUT">Check-out</option><option value="CANCELLED">Cancelar</option></select></td></tr>
        } @empty { <tr><td colspan="7"><div class="empty-inline">No hay reservas que coincidan con los filtros.</div></td></tr> }
      </tbody></table></div>
      <div class="table-footer"><span>{{ filtered().length }} de {{ store.reservations().length }} reservas</span><span>Datos sincronizados con Spring Boot.</span></div>
    </section>
    @if (showHelp()) { <div class="modal-backdrop" (click)="showHelp.set(false)"><div class="simple-modal" (click)="$event.stopPropagation()"><button class="modal-close" (click)="showHelp.set(false)">×</button><span class="eyebrow">RESERVA MANUAL</span><h2>Flujo disponible</h2><p>En V1 puedes crear una reserva desde el portal público para probar exactamente el mismo motor de disponibilidad y precios.</p><a href="/alojamientos" class="btn btn-primary">Ir al portal de reservas</a></div></div> }
  `
})
export class ReservationsPageComponent {
  search = '';
  status = 'ALL';
  readonly filterToken = signal(0);
  readonly showHelp = signal(false);
  readonly money = currency;
  readonly date = shortDate;
  readonly filtered = computed(() => {
    this.filterToken();
    const term = this.search.trim().toLowerCase();
    return this.store.reservations().filter((reservation) => {
      const accommodation = this.accommodationName(reservation.accommodationId).toLowerCase();
      const matchesTerm = !term || reservation.code.toLowerCase().includes(term) || reservation.guest.fullName.toLowerCase().includes(term) || accommodation.includes(term);
      return matchesTerm && (this.status === 'ALL' || reservation.status === this.status);
    });
  });
  constructor(readonly store: StayManagerApiService, private readonly alerts: AlertService, private readonly errors: ApiErrorService) {}
  touch(): void { this.filterToken.update((v) => v + 1); }
  accommodationName(id: string): string { return this.store.accommodationById(id)?.name ?? 'Alojamiento'; }
  statusLabel(status: ReservationStatus): string { return ({ PENDING_PAYMENT: 'Pendiente', CONFIRMED: 'Confirmada', CHECKED_IN: 'Check-in', CHECKED_OUT: 'Finalizada', CANCELLED: 'Cancelada', QUOTED: 'Cotizada', EXPIRED: 'Expirada', NO_SHOW: 'No llegó' })[status]; }
  async changeStatus(reservation: Reservation, status: ReservationStatus): Promise<void> {
    if (status === reservation.status) return;
    const confirmed = await this.alerts.confirm(
      'Actualizar estado',
      `${reservation.code} cambiará de ${this.statusLabel(reservation.status)} a ${this.statusLabel(status)}.`,
      'Actualizar'
    );
    if (!confirmed) { this.touch(); return; }
    try {
      await this.store.updateReservationStatus(reservation.id, status);
      await this.alerts.toast(`${reservation.code} actualizada`);
    } catch (error) {
      await this.alerts.error('No se pudo actualizar la reserva', this.errors.message(error));
    }
  }
}
