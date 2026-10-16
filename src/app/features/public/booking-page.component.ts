import { Component, computed, effect, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { BookingRequest, PriceBreakdown } from '../../core/models/domain.models';
import { AlertService } from '../../core/services/alert.service';
import { ApiErrorService } from '../../core/services/api-error.service';
import { StayManagerApiService } from '../../core/services/staymanager-api.service';
import { currency, optimizedImageUrl } from '../../shared/utils/format.utils';

@Component({
  selector: 'app-booking-page',
  standalone: true,
  imports: [FormsModule, RouterLink],
  template: `
    <section class="booking-page section">
      <div class="container">
        <a routerLink="/alojamientos" class="back-link">← Volver a alojamientos</a>
        @if (accommodation(); as item) {
          <div class="booking-heading"><div><span class="eyebrow">RESERVA SEGURA</span><h1>{{ item.name }}</h1><p>⌖ {{ propertyLocation() }}</p></div><span class="step-chip">1 Fechas · 2 Datos · 3 Confirmación</span></div>
          <div class="booking-grid">
            <form class="booking-form card-panel" #bookingForm="ngForm" (ngSubmit)="submit()">
              <h2>Planea tu estadía</h2>
              <div class="honeypot" aria-hidden="true"><label>No completar<input name="website" [(ngModel)]="website" tabindex="-1" autocomplete="off"></label></div>
              <div class="form-grid two">
                <label>Fecha de entrada<input type="date" name="checkIn" [(ngModel)]="request.checkIn" [min]="today" required (ngModelChange)="calculate()"></label>
                <label>Fecha de salida<input type="date" name="checkOut" [(ngModel)]="request.checkOut" [min]="request.checkIn || today" required (ngModelChange)="calculate()"></label>
                <label>Adultos<select name="adults" [(ngModel)]="request.adults" required (ngModelChange)="calculate()"><option [ngValue]="1">1 adulto</option><option [ngValue]="2">2 adultos</option><option [ngValue]="3">3 adultos</option><option [ngValue]="4">4 adultos</option><option [ngValue]="5">5 adultos</option></select></label>
                <label>Niños<select name="children" [(ngModel)]="request.children" (ngModelChange)="calculate()"><option [ngValue]="0">Sin niños</option><option [ngValue]="1">1 niño</option><option [ngValue]="2">2 niños</option><option [ngValue]="3">3 niños</option></select></label>
              </div>
              <hr><h2>Datos del huésped</h2>
              <div class="form-grid two">
                <label>Nombre completo<input name="fullName" [(ngModel)]="request.guest.fullName" required minlength="3" placeholder="Tu nombre"></label>
                <label>Documento<input name="document" [(ngModel)]="request.guest.documentNumber" required placeholder="Número de documento"></label>
                <label>Correo electrónico<input type="email" name="email" [(ngModel)]="request.guest.email" required email placeholder="correo@ejemplo.com"></label>
                <label>Teléfono<input name="phone" [(ngModel)]="request.guest.phone" required placeholder="300 000 0000"></label>
              </div>
              <label>Solicitudes especiales<textarea name="notes" [(ngModel)]="request.notes" rows="3" placeholder="Cuéntanos cómo podemos preparar tu llegada"></textarea></label>
              <label class="check-label"><input type="checkbox" name="terms" [(ngModel)]="termsAccepted" required> Acepto el <a routerLink="/aviso-legal" target="_blank">aviso legal</a>, la <a routerLink="/politica-privacidad" target="_blank">política de privacidad</a> y las condiciones de cancelación del alojamiento.</label>
              @if (error()) { <div class="alert alert-danger py-2" role="alert">{{ error() }}</div> }
              <button class="btn btn-primary btn-block" type="submit" [disabled]="bookingForm.invalid || !quote() || submitting()">
                @if (submitting()) { <span class="spinner-border spinner-border-sm me-2" aria-hidden="true"></span> } Solicitar reserva →
              </button>
            </form>
            <aside class="booking-summary card-panel">
              <div class="summary-image" [style.background-image]="'url(' + image(item.imageUrl, 760) + ')'" ></div>
              <h3>{{ item.name }}</h3><p>{{ item.description }}</p>
              <div class="amenity-row"><span>♙ {{ item.capacity }} huéspedes</span><span>⌂ {{ item.bedrooms }} habitación</span></div>
              @if (quote(); as price) {
                <div class="price-breakdown"><h4>Resumen del precio</h4><div><span>{{ price.weekdayNights }} noches entre semana</span><span>{{ money(price.weekdayNights * item.baseNightPrice) }}</span></div><div><span>{{ price.weekendNights }} noches fin de semana</span><span>{{ money(price.weekendNights * item.weekendNightPrice) }}</span></div><div><span>Limpieza</span><span>{{ money(price.cleaningFee) }}</span></div><div><span>Servicio</span><span>{{ money(price.serviceFee) }}</span></div><div class="price-total"><span>Total</span><strong>{{ money(price.total) }}</strong></div><small>Podrás confirmar con un anticipo del 50 %.</small></div>
              } @else { <div class="summary-placeholder">@if (calculating()) { <span class="spinner-border text-primary" aria-hidden="true"></span> } @else { <span>◫</span> }<p>Selecciona fechas válidas para calcular tu estadía.</p></div> }
            </aside>
          </div>
        } @else { <div class="empty-state"><h2>Alojamiento no encontrado</h2><a routerLink="/alojamientos" class="btn btn-primary">Ver alojamientos</a></div> }
      </div>
    </section>
  `
})
export class BookingPageComponent {
  readonly today = new Date().toISOString().slice(0, 10);
  readonly money = currency;
  readonly image = optimizedImageUrl;
  readonly accommodationId: string;
  readonly accommodation = computed(() => this.store.accommodationById(this.accommodationId));
  readonly quote = signal<PriceBreakdown | null>(null);
  readonly error = signal('');
  readonly calculating = signal(false);
  readonly submitting = signal(false);
  termsAccepted = false;
  website = '';
  request: BookingRequest;
  private quoteRequest = 0;
  private readonly formStartedAt = Date.now();

  constructor(
    readonly store: StayManagerApiService,
    route: ActivatedRoute,
    private readonly alerts: AlertService,
    private readonly errors: ApiErrorService,
    private readonly router: Router
  ) {
    this.accommodationId = route.snapshot.paramMap.get('id') ?? '';
    const defaultGuests = Number(route.snapshot.queryParamMap.get('guests') ?? 2);
    this.request = {
      accommodationId: this.accommodationId,
      checkIn: route.snapshot.queryParamMap.get('checkIn') ?? '',
      checkOut: route.snapshot.queryParamMap.get('checkOut') ?? '',
      adults: defaultGuests,
      children: 0,
      guest: { fullName: '', email: '', phone: '', documentNumber: '' },
      notes: ''
    };
    effect(() => {
      if (this.accommodation()) void this.calculate();
    });
  }

  propertyLocation(): string {
    const item = this.accommodation();
    return item ? item.propertyLocation || this.store.propertyById(item.propertyId)?.location || '' : '';
  }

  async calculate(): Promise<void> {
    const requestId = ++this.quoteRequest;
    const item = this.accommodation();
    this.error.set('');
    if (!item || !this.request.checkIn || !this.request.checkOut) { this.quote.set(null); return; }
    if (this.request.checkIn >= this.request.checkOut) { this.quote.set(null); this.error.set('La salida debe ser posterior a la entrada.'); return; }
    this.calculating.set(true);
    try {
      const price = await this.store.quote(item.id, this.request.checkIn, this.request.checkOut, this.request.adults + this.request.children);
      if (requestId === this.quoteRequest) this.quote.set(price);
    } catch (error) {
      if (requestId === this.quoteRequest) { this.quote.set(null); this.error.set(this.errors.message(error, 'No fue posible calcular la reserva.')); }
    } finally {
      if (requestId === this.quoteRequest) this.calculating.set(false);
    }
  }

  async submit(): Promise<void> {
    this.error.set('');
    this.submitting.set(true);
    try {
      if (!this.termsAccepted) throw new Error('Debes aceptar las políticas para continuar.');
      if (this.website.trim() || Date.now() - this.formStartedAt < 1500) throw new Error('No fue posible validar el formulario. Intenta nuevamente.');
      const reservation = await this.store.createReservation(this.request);
      await this.alerts.success('Reserva solicitada', `Tu código es ${reservation.code}. Consérvalo para identificar tu solicitud.`);
      await this.router.navigate(['/mis-reservas'], { queryParams: { code: reservation.code, email: reservation.guest.email } });
    } catch (error) {
      const message = this.errors.message(error, 'No fue posible crear la reserva.');
      this.error.set(message);
      await this.alerts.error('No se pudo crear la reserva', message);
    } finally {
      this.submitting.set(false);
    }
  }
}

