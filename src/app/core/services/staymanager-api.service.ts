import { HttpClient, HttpParams } from '@angular/common/http';
import { computed, Injectable, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import {
  Accommodation,
  AvailabilityResponse,
  BookingRequest,
  DashboardSummary,
  Payment,
  PaymentMethod,
  PriceBreakdown,
  Property,
  QuoteResponse,
  Reservation,
  ReservationStatus
} from '../models/domain.models';
import { ApiErrorService } from './api-error.service';
import { environment } from '../../../environments/environment';
import { DEMO_ACCOMMODATIONS, DEMO_PAYMENTS, DEMO_PROPERTIES, DEMO_RESERVATIONS } from '../data/demo.seed';

type AccommodationPayload = Omit<Accommodation, 'id' | 'propertyName' | 'propertyLocation'>;

@Injectable({ providedIn: 'root' })
export class StayManagerApiService {
  private readonly api = environment.apiUrl;
  private publicLoad?: Promise<void>;
  private readonly demoKeys = {
    properties: 'staymanager.demo.properties',
    accommodations: 'staymanager.demo.accommodations',
    reservations: 'staymanager.demo.reservations',
    payments: 'staymanager.demo.payments'
  };

  readonly isDemoMode = environment.demoMode;

  readonly properties = signal<Property[]>([]);
  readonly accommodations = signal<Accommodation[]>([]);
  readonly reservations = signal<Reservation[]>([]);
  readonly payments = signal<Payment[]>([]);
  readonly dashboard = signal<DashboardSummary | null>(null);
  readonly loading = signal(false);
  readonly error = signal('');

  readonly activeAccommodations = computed(() => this.accommodations().filter((item) => item.status === 'ACTIVE'));
  readonly confirmedRevenue = computed(() =>
    this.dashboard()?.approvedRevenue ??
    this.payments().filter((item) => item.status === 'APPROVED').reduce((total, item) => total + Number(item.amount), 0)
  );

  constructor(private readonly http: HttpClient, private readonly errors: ApiErrorService) {}

  loadPublicCatalog(force = false): Promise<void> {
    if (this.publicLoad && !force) return this.publicLoad;
    if (this.isDemoMode) {
      this.loadDemoState(force);
      this.publicLoad = Promise.resolve();
      return this.publicLoad;
    }
    this.loading.set(true);
    this.error.set('');
    this.publicLoad = firstValueFrom(
      this.http.get<Accommodation[]>(`${this.api}/public/organizations/refugios-del-bosque/accommodations`)
    ).then((items) => {
      this.accommodations.set(items.map((item) => this.normalizeAccommodation(item)));
      const inferred = new Map<string, Property>();
      for (const item of items) {
        if (!inferred.has(item.propertyId)) {
          inferred.set(item.propertyId, {
            id: item.propertyId,
            name: item.propertyName || 'Refugios del Bosque',
            slug: 'refugios-del-bosque',
            location: item.propertyLocation || 'Colombia',
            description: '', imageUrl: item.imageUrl || '', active: true
          });
        }
      }
      this.properties.set([...inferred.values()]);
    }).catch((error: unknown) => {
      this.publicLoad = undefined;
      this.error.set(this.errors.message(error, 'No fue posible cargar los alojamientos.'));
      throw error;
    }).finally(() => this.loading.set(false));
    return this.publicLoad;
  }

  async loadAdminData(): Promise<void> {
    if (this.isDemoMode) {
      this.loadDemoState();
      return;
    }
    this.loading.set(true);
    this.error.set('');
    try {
      const [properties, accommodations, reservations, payments, dashboard] = await Promise.all([
        firstValueFrom(this.http.get<Property[]>(`${this.api}/admin/properties`)),
        firstValueFrom(this.http.get<Accommodation[]>(`${this.api}/admin/accommodations`)),
        firstValueFrom(this.http.get<Reservation[]>(`${this.api}/admin/reservations`)),
        firstValueFrom(this.http.get<Payment[]>(`${this.api}/admin/payments`)),
        firstValueFrom(this.http.get<DashboardSummary>(`${this.api}/admin/dashboard`))
      ]);
      this.properties.set(properties);
      this.accommodations.set(accommodations.map((item) => this.normalizeAccommodation(item)));
      this.reservations.set(reservations.map((item) => this.normalizeReservation(item)));
      this.payments.set(payments);
      this.dashboard.set(dashboard);
    } catch (error) {
      this.error.set(this.errors.message(error, 'No fue posible cargar el panel administrativo.'));
      throw error;
    } finally {
      this.loading.set(false);
    }
  }

  propertyById(id: string): Property | undefined {
    return this.properties().find((property) => property.id === id);
  }

  accommodationById(id: string): Accommodation | undefined {
    return this.accommodations().find((accommodation) => accommodation.id === id);
  }

  async isAvailable(accommodationId: string, checkIn: string, checkOut: string): Promise<boolean> {
    if (this.isDemoMode) return this.demoAvailability(accommodationId, checkIn, checkOut);
    const params = new HttpParams().set('accommodationId', accommodationId).set('checkIn', checkIn).set('checkOut', checkOut);
    const response = await firstValueFrom(this.http.get<AvailabilityResponse>(`${this.api}/public/availability`, { params }));
    return response.available;
  }

  async quote(accommodationId: string, checkIn: string, checkOut: string, guests: number): Promise<PriceBreakdown> {
    if (this.isDemoMode) {
      const accommodation = this.accommodationById(accommodationId);
      if (!accommodation) throw new Error('El alojamiento no existe.');
      if (guests > accommodation.capacity) throw new Error('La cantidad de huéspedes supera la capacidad.');
      if (!this.demoAvailability(accommodationId, checkIn, checkOut)) throw new Error('Las fechas seleccionadas ya no están disponibles.');
      return this.demoQuote(accommodation, checkIn, checkOut);
    }
    const response = await firstValueFrom(this.http.post<QuoteResponse>(`${this.api}/public/quotations`, {
      accommodationId, checkIn, checkOut, guests
    }));
    if (!response.available || !response.price) throw new Error('Las fechas seleccionadas ya no están disponibles.');
    return response.price;
  }

  async createReservation(request: BookingRequest): Promise<Reservation> {
    if (this.isDemoMode) {
      const accommodation = this.accommodationById(request.accommodationId);
      if (!accommodation) throw new Error('El alojamiento no existe.');
      const price = await this.quote(request.accommodationId, request.checkIn, request.checkOut, request.adults + request.children);
      const reservation: Reservation = {
        id: crypto.randomUUID(),
        code: `ST-${new Date().getFullYear().toString().slice(-2)}${Math.floor(1000 + Math.random() * 9000)}`,
        accommodationId: accommodation.id, accommodationName: accommodation.name,
        guest: { ...request.guest }, checkIn: request.checkIn, checkOut: request.checkOut,
        adults: request.adults, children: request.children, status: 'PENDING_PAYMENT', price,
        amountPaid: 0, balance: price.total, notes: request.notes, createdAt: new Date().toISOString()
      };
      this.reservations.update((items) => [reservation, ...items]);
      this.persistDemo(this.demoKeys.reservations, this.reservations());
      this.updateDemoDashboard();
      return reservation;
    }
    const reservation = await firstValueFrom(this.http.post<Reservation>(`${this.api}/public/reservations`, request));
    const normalized = this.normalizeReservation(reservation);
    this.reservations.update((items) => [normalized, ...items]);
    return normalized;
  }

  async updateReservationStatus(id: string, status: ReservationStatus): Promise<Reservation> {
    if (this.isDemoMode) {
      const current = this.reservations().find((item) => item.id === id);
      if (!current) throw new Error('Reserva no encontrada.');
      const updated = { ...current, status };
      this.reservations.update((items) => items.map((item) => item.id === id ? updated : item));
      this.persistDemo(this.demoKeys.reservations, this.reservations());
      this.updateDemoDashboard();
      return updated;
    }
    const reservation = await firstValueFrom(
      this.http.patch<Reservation>(`${this.api}/admin/reservations/${id}/status`, { status })
    );
    const normalized = this.normalizeReservation(reservation);
    this.reservations.update((items) => items.map((item) => item.id === id ? normalized : item));
    await this.refreshDashboard();
    return normalized;
  }

  async registerPayment(reservationId: string, amount: number, method: PaymentMethod, reference: string): Promise<Payment> {
    if (this.isDemoMode) {
      const reservation = this.reservations().find((item) => item.id === reservationId);
      if (!reservation) throw new Error('Reserva no encontrada.');
      const balance = reservation.price.total - reservation.amountPaid;
      if (amount <= 0 || amount > balance) throw new Error('El valor del pago no es válido.');
      const payment: Payment = {
        id: crypto.randomUUID(), reservationId, reservationCode: reservation.code, guestName: reservation.guest.fullName,
        amount, method, status: 'APPROVED', reference, paidAt: new Date().toISOString()
      };
      this.payments.update((items) => [payment, ...items]);
      this.reservations.update((items) => items.map((item) => item.id === reservationId
        ? { ...item, amountPaid: item.amountPaid + amount, balance: item.price.total - item.amountPaid - amount, status: 'CONFIRMED' }
        : item));
      this.persistDemo(this.demoKeys.payments, this.payments());
      this.persistDemo(this.demoKeys.reservations, this.reservations());
      this.updateDemoDashboard();
      return payment;
    }
    const payment = await firstValueFrom(this.http.post<Payment>(`${this.api}/admin/payments`, {
      reservationId, amount, method, reference
    }));
    this.payments.update((items) => [payment, ...items]);
    const reservations = await firstValueFrom(this.http.get<Reservation[]>(`${this.api}/admin/reservations`));
    this.reservations.set(reservations.map((item) => this.normalizeReservation(item)));
    await this.refreshDashboard();
    return payment;
  }

  async addAccommodation(accommodation: AccommodationPayload): Promise<Accommodation> {
    if (this.isDemoMode) {
      const property = this.propertyById(accommodation.propertyId);
      if (!property) throw new Error('Selecciona una propiedad válida.');
      const created: Accommodation = {
        ...accommodation, id: crypto.randomUUID(), propertyName: property.name, propertyLocation: property.location
      };
      this.accommodations.update((items) => [created, ...items]);
      this.persistDemo(this.demoKeys.accommodations, this.accommodations());
      this.updateDemoDashboard();
      return created;
    }
    const created = await firstValueFrom(
      this.http.post<Accommodation>(`${this.api}/admin/accommodations`, accommodation)
    );
    const normalized = this.normalizeAccommodation(created);
    this.accommodations.update((items) => [normalized, ...items]);
    await this.refreshDashboard();
    return normalized;
  }

  resetDemoData(): void {
    if (!this.isDemoMode) return;
    Object.values(this.demoKeys).forEach((key) => localStorage.removeItem(key));
    this.loadDemoState(true);
  }

  private async refreshDashboard(): Promise<void> {
    if (this.isDemoMode) { this.updateDemoDashboard(); return; }
    const summary = await firstValueFrom(this.http.get<DashboardSummary>(`${this.api}/admin/dashboard`));
    this.dashboard.set(summary);
  }

  private normalizeAccommodation(item: Accommodation): Accommodation {
    return { ...item, amenities: [...(item.amenities ?? [])], imageUrl: item.imageUrl ?? '' };
  }

  private normalizeReservation(item: Reservation): Reservation {
    return { ...item, amountPaid: Number(item.amountPaid), balance: Number(item.balance), price: {
      ...item.price,
      accommodationSubtotal: Number(item.price.accommodationSubtotal),
      cleaningFee: Number(item.price.cleaningFee),
      serviceFee: Number(item.price.serviceFee),
      total: Number(item.price.total)
    } };
  }

  private loadDemoState(force = false): void {
    if (this.accommodations().length && !force) return;
    this.properties.set(this.loadDemo(this.demoKeys.properties, DEMO_PROPERTIES));
    this.accommodations.set(this.loadDemo(this.demoKeys.accommodations, DEMO_ACCOMMODATIONS));
    this.reservations.set(this.loadDemo(this.demoKeys.reservations, DEMO_RESERVATIONS));
    this.payments.set(this.loadDemo(this.demoKeys.payments, DEMO_PAYMENTS));
    this.error.set('');
    this.updateDemoDashboard();
  }

  private demoAvailability(accommodationId: string, checkIn: string, checkOut: string): boolean {
    if (!checkIn || !checkOut || checkIn >= checkOut) return false;
    const blocking: ReservationStatus[] = ['PENDING_PAYMENT', 'CONFIRMED', 'CHECKED_IN'];
    return !this.reservations().some((reservation) =>
      reservation.accommodationId === accommodationId && blocking.includes(reservation.status) &&
      checkIn < reservation.checkOut && checkOut > reservation.checkIn
    );
  }

  private demoQuote(accommodation: Accommodation, checkIn: string, checkOut: string): PriceBreakdown {
    const start = this.parseDate(checkIn);
    const end = this.parseDate(checkOut);
    if (end <= start) throw new Error('La fecha de salida debe ser posterior a la entrada.');
    let weekdayNights = 0;
    let weekendNights = 0;
    let accommodationSubtotal = 0;
    for (const cursor = new Date(start); cursor < end; cursor.setDate(cursor.getDate() + 1)) {
      const weekend = cursor.getDay() === 5 || cursor.getDay() === 6;
      accommodationSubtotal += weekend ? accommodation.weekendNightPrice : accommodation.baseNightPrice;
      if (weekend) weekendNights++; else weekdayNights++;
    }
    const serviceFee = Math.round(accommodationSubtotal * 0.03);
    return {
      nights: weekdayNights + weekendNights, weekdayNights, weekendNights, accommodationSubtotal,
      cleaningFee: accommodation.cleaningFee, serviceFee,
      total: accommodationSubtotal + accommodation.cleaningFee + serviceFee
    };
  }

  private updateDemoDashboard(): void {
    const activeStatuses: ReservationStatus[] = ['PENDING_PAYMENT', 'CONFIRMED', 'CHECKED_IN'];
    const validReservations = this.reservations().filter((item) => !['CANCELLED', 'EXPIRED'].includes(item.status));
    const today = this.localDate(new Date());
    const month = today.slice(0, 7);
    const activeAccommodations = this.accommodations().filter((item) => item.status === 'ACTIVE').length;
    const occupiedAccommodations = new Set(
      this.reservations()
        .filter((item) => activeStatuses.includes(item.status) && item.checkIn <= today && item.checkOut > today)
        .map((item) => item.accommodationId)
    ).size;
    this.dashboard.set({
      activeReservations: this.reservations().filter((item) => activeStatuses.includes(item.status)).length,
      pendingReservations: this.reservations().filter((item) => item.status === 'PENDING_PAYMENT').length,
      approvedRevenue: this.payments().filter((item) => item.status === 'APPROVED').reduce((sum, item) => sum + item.amount, 0),
      monthlyRevenue: this.payments()
        .filter((item) => item.status === 'APPROVED' && item.paidAt.slice(0, 7) === month)
        .reduce((sum, item) => sum + item.amount, 0),
      pendingBalance: validReservations.reduce((sum, item) => sum + item.price.total - item.amountPaid, 0),
      accommodations: this.accommodations().length,
      activeAccommodations,
      occupiedAccommodations,
      occupancyRate: activeAccommodations ? Math.round(occupiedAccommodations * 1000 / activeAccommodations) / 10 : 0,
      arrivalsToday: this.reservations().filter((item) =>
        ['PENDING_PAYMENT', 'CONFIRMED'].includes(item.status) && item.checkIn === today).length,
      departuresToday: this.reservations().filter((item) =>
        ['CONFIRMED', 'CHECKED_IN'].includes(item.status) && item.checkOut === today).length,
      guestsInHouse: this.reservations()
        .filter((item) => item.status === 'CHECKED_IN')
        .reduce((sum, item) => sum + item.adults + item.children, 0)
    });
  }

  private localDate(value: Date): string {
    const year = value.getFullYear();
    const month = String(value.getMonth() + 1).padStart(2, '0');
    const day = String(value.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  private parseDate(value: string): Date {
    const [year, month, day] = value.split('-').map(Number);
    return new Date(year, month - 1, day, 12, 0, 0, 0);
  }

  private loadDemo<T>(key: string, seed: T): T {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) as T : structuredClone(seed);
    } catch {
      return structuredClone(seed);
    }
  }

  private persistDemo<T>(key: string, value: T): void {
    localStorage.setItem(key, JSON.stringify(value));
  }
}

