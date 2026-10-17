import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { computed, Injectable, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import {
  Accommodation,
  AppNotification,
  AvailabilityResponse,
  BookingRequest,
  DashboardSummary,
  GuestPaymentReport,
  GuestPortalReservation,
  HousekeepingStatus,
  HousekeepingTask,
  OrganizationSettings,
  Payment,
  PaymentMethod,
  PriceBreakdown,
  Property,
  QuoteResponse,
  Reservation,
  ReservationStatus
} from '../models/domain.models';
import { ApiErrorService } from './api-error.service';
import { AuthService } from './auth.service';
import { environment } from '../../../environments/environment';
import { DEMO_ACCOMMODATIONS, DEMO_PAYMENTS, DEMO_PROPERTIES, DEMO_RESERVATIONS, DEMO_SETTINGS } from '../data/demo.seed';

type AccommodationPayload = Omit<Accommodation, 'id' | 'propertyName' | 'propertyLocation'>;
type PropertyPayload = Omit<Property, 'id' | 'slug'>;

@Injectable({ providedIn: 'root' })
export class StayManagerApiService {
  private readonly api = environment.apiUrl;
  private publicLoad?: Promise<void>;
  private readonly demoKeys = {
    properties: 'staymanager.demo.properties',
    accommodations: 'staymanager.demo.accommodations',
    reservations: 'staymanager.demo.reservations',
    payments: 'staymanager.demo.payments',
    settings: 'staymanager.demo.settings',
    housekeeping: 'staymanager.demo.housekeeping'
  };

  readonly isDemoMode = environment.demoMode;

  readonly properties = signal<Property[]>([]);
  readonly accommodations = signal<Accommodation[]>([]);
  readonly reservations = signal<Reservation[]>([]);
  readonly payments = signal<Payment[]>([]);
  readonly dashboard = signal<DashboardSummary | null>(null);
  readonly notifications = signal<AppNotification[]>([]);
  readonly settings = signal<OrganizationSettings | null>(null);
  readonly housekeeping = signal<HousekeepingTask[]>([]);
  readonly clientReservations = signal<GuestPortalReservation[]>([]);
  readonly unreadNotifications = computed(() => this.notifications().filter((item) => !item.readAt).length);
  readonly loading = signal(false);
  readonly error = signal('');

  readonly activeAccommodations = computed(() => this.accommodations().filter((item) => item.status === 'ACTIVE'));
  readonly confirmedRevenue = computed(() =>
    this.dashboard()?.approvedRevenue ??
    this.payments().filter((item) => item.status === 'APPROVED').reduce((total, item) => total + Number(item.amount), 0)
  );

  constructor(private readonly http: HttpClient, private readonly errors: ApiErrorService, private readonly auth: AuthService) {}

  loadPublicCatalog(force = false): Promise<void> {
    if (this.publicLoad && !force) return this.publicLoad;
    if (this.isDemoMode) {
      this.loadDemoState(force);
      this.publicLoad = Promise.resolve();
      return this.publicLoad;
    }
    this.loading.set(true);
    this.error.set('');
    this.publicLoad = Promise.all([
      firstValueFrom(this.http.get<Accommodation[]>(`${this.api}/public/organizations/refugios-del-bosque/accommodations`)),
      firstValueFrom(this.http.get<OrganizationSettings>(`${this.api}/public/organizations/refugios-del-bosque/settings`))
    ]).then(([items, settings]) => {
      this.accommodations.set(items.map((item) => this.normalizeAccommodation(item)));
      this.settings.set(this.normalizeSettings(settings));
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
      const [properties, accommodations, reservations, payments, dashboard, notifications, settings, housekeeping] = await Promise.all([
        firstValueFrom(this.http.get<Property[]>(`${this.api}/admin/properties`)),
        firstValueFrom(this.http.get<Accommodation[]>(`${this.api}/admin/accommodations`)),
        firstValueFrom(this.http.get<Reservation[]>(`${this.api}/admin/reservations`)),
        firstValueFrom(this.http.get<Payment[]>(`${this.api}/admin/payments`)),
        firstValueFrom(this.http.get<DashboardSummary>(`${this.api}/admin/dashboard`)),
        firstValueFrom(this.http.get<AppNotification[]>(`${this.api}/admin/notifications`)),
        firstValueFrom(this.http.get<OrganizationSettings>(`${this.api}/admin/settings`)),
        firstValueFrom(this.http.get<HousekeepingTask[]>(`${this.api}/admin/housekeeping`))
      ]);
      this.properties.set(properties);
      this.accommodations.set(accommodations.map((item) => this.normalizeAccommodation(item)));
      this.reservations.set(reservations.map((item) => this.normalizeReservation(item)));
      this.payments.set(payments);
      this.dashboard.set(dashboard);
      this.notifications.set(notifications);
      this.settings.set(this.normalizeSettings(settings));
      this.housekeeping.set(housekeeping);
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
    if (this.auth.currentUser()?.role === 'CLIENT'
      && normalized.guest.email.toLowerCase() === this.auth.currentUser()?.email.toLowerCase()) {
      try { await this.linkClientReservation(normalized.code); } catch { /* La reserva existe y puede vincularse manualmente. */ }
    }
    return normalized;
  }

  async accessGuestReservation(code: string, email: string): Promise<GuestPortalReservation> {
    if (this.isDemoMode) {
      this.loadDemoState();
      const reservation = this.reservations().find((item) =>
        item.code.toLowerCase() === code.trim().toLowerCase()
        && item.guest.email.toLowerCase() === email.trim().toLowerCase());
      if (!reservation) throw new Error('No encontramos una reserva con esos datos.');
      return this.toDemoGuestPortal(reservation);
    }
    const reservation = await firstValueFrom(this.http.post<GuestPortalReservation>(
      `${this.api}/public/guest/reservations/access`, { code: code.trim(), email: email.trim() }
    ));
    return this.normalizeGuestPortal(reservation);
  }

  async loadClientReservations(): Promise<GuestPortalReservation[]> {
    if (this.isDemoMode) return [];
    const items = await firstValueFrom(this.http.get<GuestPortalReservation[]>(`${this.api}/client/reservations`));
    const normalized = items.map((item) => this.normalizeGuestPortal(item));
    this.clientReservations.set(normalized);
    return normalized;
  }

  async linkClientReservation(code: string): Promise<GuestPortalReservation> {
    if (this.isDemoMode) throw new Error('Esta función requiere una cuenta de huésped.');
    const linked = this.normalizeGuestPortal(await firstValueFrom(this.http.post<GuestPortalReservation>(
      `${this.api}/client/reservations/link`, { code: code.trim() }
    )));
    this.clientReservations.update((items) => [linked, ...items.filter((item) => item.code !== linked.code)]);
    return linked;
  }

  async cancelClientReservation(code: string): Promise<GuestPortalReservation> {
    const updated = this.normalizeGuestPortal(await firstValueFrom(this.http.post<GuestPortalReservation>(
      `${this.api}/client/reservations/${encodeURIComponent(code)}/cancel`, {}
    )));
    this.clientReservations.update((items) => items.map((item) => item.code === code ? updated : item));
    return updated;
  }

  async cancelGuestReservation(code: string, email: string): Promise<GuestPortalReservation> {
    if (this.isDemoMode) {
      const current = this.reservations().find((item) =>
        item.code.toLowerCase() === code.trim().toLowerCase()
        && item.guest.email.toLowerCase() === email.trim().toLowerCase());
      if (!current) throw new Error('No encontramos una reserva con esos datos.');
      const updated: Reservation = { ...current, status: 'CANCELLED' };
      this.reservations.update((items) => items.map((item) => item.id === current.id ? updated : item));
      this.persistDemo(this.demoKeys.reservations, this.reservations());
      this.updateDemoDashboard();
      return this.toDemoGuestPortal(updated);
    }
    const reservation = await firstValueFrom(this.http.post<GuestPortalReservation>(
      `${this.api}/public/guest/reservations/cancel`, { code: code.trim(), email: email.trim() }
    ));
    return this.normalizeGuestPortal(reservation);
  }

  async reportGuestPayment(
    code: string, email: string, amount: number, method: PaymentMethod,
    reference: string, idempotencyKey: string = crypto.randomUUID()
  ): Promise<GuestPaymentReport> {
    if (this.isDemoMode) {
      const reservation = this.reservations().find((item) =>
        item.code.toLowerCase() === code.trim().toLowerCase()
        && item.guest.email.toLowerCase() === email.trim().toLowerCase());
      if (!reservation) throw new Error('No encontramos una reserva con esos datos.');
      if (!['NEQUI', 'BANK_TRANSFER'].includes(method)) throw new Error('Método de pago no permitido desde el portal.');
      const balance = reservation.price.total - reservation.amountPaid;
      if (amount <= 0 || amount > balance) throw new Error('El valor reportado no es válido.');
      const submittedAt = new Date().toISOString();
      const payment: Payment = {
        id: crypto.randomUUID(), reservationId: reservation.id, reservationCode: reservation.code,
        guestName: reservation.guest.fullName, amount, method, status: 'PENDING',
        reference: reference.trim(), submittedAt, paidAt: null
      };
      this.payments.update((items) => [payment, ...items]);
      this.persistDemo(this.demoKeys.payments, this.payments());
      this.updateDemoDashboard();
      return { id: payment.id, amount, method, status: 'PENDING', reference: payment.reference, submittedAt };
    }
    return firstValueFrom(this.http.post<GuestPaymentReport>(`${this.api}/public/guest/payments`, {
      code: code.trim(), email: email.trim(), amount, method, reference: reference.trim()
    }, { headers: new HttpHeaders({ 'Idempotency-Key': idempotencyKey }) }));
  }

  async updateReservationStatus(id: string, status: ReservationStatus): Promise<Reservation> {
    if (this.isDemoMode) {
      const current = this.reservations().find((item) => item.id === id);
      if (!current) throw new Error('Reserva no encontrada.');
      const updated = { ...current, status };
      this.reservations.update((items) => items.map((item) => item.id === id ? updated : item));
      this.persistDemo(this.demoKeys.reservations, this.reservations());
      this.syncDemoHousekeeping();
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

  async updateSettings(settings: OrganizationSettings): Promise<OrganizationSettings> {
    if (this.isDemoMode) {
      const updated = this.normalizeSettings(settings);
      this.settings.set(updated);
      this.persistDemo(this.demoKeys.settings, updated);
      return updated;
    }
    const updated = await firstValueFrom(this.http.put<OrganizationSettings>(`${this.api}/admin/settings`, {
      organizationName: settings.organizationName,
      whatsappNumber: settings.whatsappNumber,
      checkInTime: settings.checkInTime,
      checkOutTime: settings.checkOutTime,
      mapLabel: settings.mapLabel,
      mapAddress: settings.mapAddress,
      mapLatitude: settings.mapLatitude,
      mapLongitude: settings.mapLongitude,
      arrivalInstructions: settings.arrivalInstructions
    }));
    const normalized = this.normalizeSettings(updated);
    this.settings.set(normalized);
    return normalized;
  }

  async updateHousekeeping(
    id: string, status: HousekeepingStatus, assignedTo: string, notes: string
  ): Promise<HousekeepingTask> {
    if (this.isDemoMode) {
      const current = this.housekeeping().find((item) => item.id === id);
      if (!current) throw new Error('Tarea de limpieza no encontrada.');
      const completed = status === 'COMPLETED' || status === 'INSPECTED';
      const updated: HousekeepingTask = {
        ...current, status, assignedTo: assignedTo.trim() || null, notes: notes.trim() || null,
        completedAt: completed ? current.completedAt ?? new Date().toISOString() : null,
        updatedAt: new Date().toISOString()
      };
      this.housekeeping.update((items) => items.map((item) => item.id === id ? updated : item));
      this.persistDemo(this.demoKeys.housekeeping, this.housekeeping());
      return updated;
    }
    const updated = await firstValueFrom(this.http.patch<HousekeepingTask>(`${this.api}/admin/housekeeping/${id}`, {
      status, assignedTo: assignedTo.trim(), notes: notes.trim()
    }));
    this.housekeeping.update((items) => items.map((item) => item.id === id ? updated : item));
    return updated;
  }

  async refreshHousekeeping(): Promise<void> {
    if (this.isDemoMode) {
      this.syncDemoHousekeeping();
      return;
    }
    const tasks = await firstValueFrom(this.http.get<HousekeepingTask[]>(`${this.api}/admin/housekeeping`));
    this.housekeeping.set(tasks);
  }

  async registerPayment(reservationId: string, amount: number, method: PaymentMethod, reference: string, idempotencyKey: string = crypto.randomUUID()): Promise<Payment> {
    if (this.isDemoMode) {
      const reservation = this.reservations().find((item) => item.id === reservationId);
      if (!reservation) throw new Error('Reserva no encontrada.');
      const balance = reservation.price.total - reservation.amountPaid;
      if (amount <= 0 || amount > balance) throw new Error('El valor del pago no es válido.');
      const payment: Payment = {
        id: crypto.randomUUID(), reservationId, reservationCode: reservation.code, guestName: reservation.guest.fullName,
        amount, method, status: 'PENDING', reference: reference.trim(), submittedAt: new Date().toISOString(), paidAt: null
      };
      this.payments.update((items) => [payment, ...items]);
      this.persistDemo(this.demoKeys.payments, this.payments());
      this.updateDemoDashboard();
      return payment;
    }
    const payment = await firstValueFrom(this.http.post<Payment>(`${this.api}/admin/payments`, {
      reservationId, amount, method, reference: reference.trim()
    }, { headers: new HttpHeaders({ 'Idempotency-Key': idempotencyKey }) }));
    this.payments.update((items) => [payment, ...items]);
    await this.refreshDashboard();
    return payment;
  }

  async approvePayment(id: string): Promise<Payment> {
    if (this.isDemoMode) {
      const payment = this.payments().find((item) => item.id === id);
      if (!payment) throw new Error('Pago no encontrado.');
      if (payment.status === 'APPROVED') return payment;
      if (payment.status !== 'PENDING') throw new Error('Solo se pueden aprobar pagos pendientes.');
      const reservation = this.reservations().find((item) => item.id === payment.reservationId);
      if (!reservation) throw new Error('Reserva no encontrada.');
      const balance = reservation.price.total - reservation.amountPaid;
      if (payment.amount > balance) throw new Error('El pago supera el saldo pendiente.');
      const now = new Date().toISOString();
      const updated: Payment = { ...payment, status: 'APPROVED', paidAt: now, reviewedAt: now };
      this.payments.update((items) => items.map((item) => item.id === id ? updated : item));
      this.reservations.update((items) => items.map((item) => item.id === reservation.id ? {
        ...item, amountPaid: item.amountPaid + payment.amount,
        balance: item.price.total - item.amountPaid - payment.amount,
        status: item.status === 'PENDING_PAYMENT' ? 'CONFIRMED' : item.status
      } : item));
      this.persistDemo(this.demoKeys.payments, this.payments());
      this.persistDemo(this.demoKeys.reservations, this.reservations());
      this.updateDemoDashboard();
      return updated;
    }
    const payment = await firstValueFrom(this.http.patch<Payment>(`${this.api}/admin/payments/${id}/approve`, {}));
    this.payments.update((items) => items.map((item) => item.id === id ? payment : item));
    const reservations = await firstValueFrom(this.http.get<Reservation[]>(`${this.api}/admin/reservations`));
    this.reservations.set(reservations.map((item) => this.normalizeReservation(item)));
    await this.refreshDashboard();
    return payment;
  }

  async rejectPayment(id: string, reason: string): Promise<Payment> {
    if (this.isDemoMode) {
      const payment = this.payments().find((item) => item.id === id);
      if (!payment) throw new Error('Pago no encontrado.');
      if (payment.status === 'REJECTED') return payment;
      if (payment.status !== 'PENDING') throw new Error('Solo se pueden rechazar pagos pendientes.');
      const updated: Payment = {
        ...payment, status: 'REJECTED', reviewedAt: new Date().toISOString(), rejectionReason: reason.trim()
      };
      this.payments.update((items) => items.map((item) => item.id === id ? updated : item));
      this.persistDemo(this.demoKeys.payments, this.payments());
      this.updateDemoDashboard();
      return updated;
    }
    const payment = await firstValueFrom(this.http.patch<Payment>(`${this.api}/admin/payments/${id}/reject`, { reason: reason.trim() }));
    this.payments.update((items) => items.map((item) => item.id === id ? payment : item));
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

  async addProperty(property: PropertyPayload): Promise<Property> {
    if (this.isDemoMode) {
      const created: Property = { ...property, id: crypto.randomUUID(), slug: property.name.toLowerCase().replace(/[^a-z0-9]+/g, '-') };
      this.properties.update((items) => [...items, created]);
      this.persistDemo(this.demoKeys.properties, this.properties());
      return created;
    }
    const created = await firstValueFrom(this.http.post<Property>(`${this.api}/admin/properties`, property));
    this.properties.update((items) => [...items, created]);
    return created;
  }

  async updateProperty(id: string, property: PropertyPayload): Promise<Property> {
    if (this.isDemoMode) {
      const current = this.propertyById(id);
      if (!current) throw new Error('Propiedad no encontrada.');
      const updated: Property = { ...current, ...property };
      this.properties.update((items) => items.map((item) => item.id === id ? updated : item));
      this.persistDemo(this.demoKeys.properties, this.properties());
      return updated;
    }
    const updated = await firstValueFrom(this.http.put<Property>(`${this.api}/admin/properties/${id}`, property));
    this.properties.update((items) => items.map((item) => item.id === id ? updated : item));
    return updated;
  }

  async updateAccommodation(id: string, accommodation: AccommodationPayload): Promise<Accommodation> {
    if (this.isDemoMode) {
      const property = this.propertyById(accommodation.propertyId);
      if (!property) throw new Error('Selecciona una propiedad válida.');
      const updated: Accommodation = {
        ...accommodation, id, propertyName: property.name, propertyLocation: property.location
      };
      this.accommodations.update((items) => items.map((item) => item.id === id ? updated : item));
      this.persistDemo(this.demoKeys.accommodations, this.accommodations());
      this.updateDemoDashboard();
      return updated;
    }
    const updated = await firstValueFrom(
      this.http.put<Accommodation>(`${this.api}/admin/accommodations/${id}`, accommodation)
    );
    const normalized = this.normalizeAccommodation(updated);
    this.accommodations.update((items) => items.map((item) => item.id === id ? normalized : item));
    return normalized;
  }

  async markNotificationRead(id: string): Promise<void> {
    const current = this.notifications().find((item) => item.id === id);
    if (!current || current.readAt) return;
    if (this.isDemoMode) {
      this.notifications.update((items) => items.map((item) => item.id === id
        ? { ...item, readAt: new Date().toISOString() } : item));
      return;
    }
    const updated = await firstValueFrom(
      this.http.patch<AppNotification>(`${this.api}/admin/notifications/${id}/read`, {})
    );
    this.notifications.update((items) => items.map((item) => item.id === id ? updated : item));
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
    return {
      ...item,
      amenities: [...(item.amenities ?? [])],
      imageUrl: item.imageUrl ?? '',
      mapAddress: item.mapAddress ?? item.propertyLocation ?? '',
      mapLatitude: item.mapLatitude === null || item.mapLatitude === undefined ? null : Number(item.mapLatitude),
      mapLongitude: item.mapLongitude === null || item.mapLongitude === undefined ? null : Number(item.mapLongitude),
      googleMapsUrl: item.googleMapsUrl ?? '',
      arrivalInstructions: item.arrivalInstructions ?? ''
    };
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

  private normalizeSettings(item: OrganizationSettings): OrganizationSettings {
    return {
      ...item,
      whatsappNumber: item.whatsappNumber ?? '',
      checkInTime: item.checkInTime || '15:00',
      checkOutTime: item.checkOutTime || '11:00',
      mapLabel: item.mapLabel ?? '',
      mapAddress: item.mapAddress ?? '',
      mapLatitude: item.mapLatitude === null || item.mapLatitude === undefined ? null : Number(item.mapLatitude),
      mapLongitude: item.mapLongitude === null || item.mapLongitude === undefined ? null : Number(item.mapLongitude),
      arrivalInstructions: item.arrivalInstructions ?? ''
    };
  }

  private normalizeGuestPortal(item: GuestPortalReservation): GuestPortalReservation {
    return {
      ...item,
      accommodationId: item.accommodationId || this.accommodations().find((candidate) => candidate.name === item.accommodationName)?.id || '',
      amountPaid: Number(item.amountPaid), balance: Number(item.balance),
      pendingPaymentAmount: Number(item.pendingPaymentAmount ?? 0),
      pendingPaymentCount: Number(item.pendingPaymentCount ?? 0),
      paymentInstructions: {
        enabled: Boolean(item.paymentInstructions?.enabled),
        nequiNumber: item.paymentInstructions?.nequiNumber ?? '',
        accountHolder: item.paymentInstructions?.accountHolder ?? '',
        bankInstructions: item.paymentInstructions?.bankInstructions ?? '',
        acceptedMethods: [...(item.paymentInstructions?.acceptedMethods ?? [])]
      },
      price: {
      ...item.price,
      accommodationSubtotal: Number(item.price.accommodationSubtotal),
      cleaningFee: Number(item.price.cleaningFee),
      serviceFee: Number(item.price.serviceFee),
      total: Number(item.price.total)
    } };
  }

  private toDemoGuestPortal(item: Reservation): GuestPortalReservation {
    const cancellable = ['PENDING_PAYMENT', 'CONFIRMED'].includes(item.status) && item.checkIn > this.localDate(new Date());
    const pendingPayments = this.payments().filter((payment) =>
      payment.reservationId === item.id && payment.status === 'PENDING');
    return {
      accommodationId: item.accommodationId,
      code: item.code, accommodationName: item.accommodationName,
      propertyName: this.accommodationById(item.accommodationId)?.propertyName || 'Refugios del Bosque',
      propertyLocation: this.accommodationById(item.accommodationId)?.propertyLocation || 'Colombia',
      guestName: item.guest.fullName, guestEmail: item.guest.email, guestPhone: item.guest.phone,
      checkIn: item.checkIn, checkOut: item.checkOut, adults: item.adults, children: item.children,
      status: item.status, price: item.price, amountPaid: item.amountPaid, balance: item.balance,
      cancellable, notes: item.notes,
      pendingPaymentAmount: pendingPayments.reduce((sum, payment) => sum + Number(payment.amount), 0),
      pendingPaymentCount: pendingPayments.length,
      paymentInstructions: {
        enabled: true, nequiNumber: '300 000 0000', accountHolder: 'Alojamiento Demo',
        bankInstructions: 'Bancolombia · Cuenta de ahorros demo 000-000000-00',
        acceptedMethods: ['NEQUI', 'BANK_TRANSFER']
      }
    };
  }

  private loadDemoState(force = false): void {
    if (this.accommodations().length && !force) return;
    this.properties.set(this.loadDemo(this.demoKeys.properties, DEMO_PROPERTIES));
    this.accommodations.set(this.loadDemo(this.demoKeys.accommodations, DEMO_ACCOMMODATIONS));
    this.reservations.set(this.loadDemo(this.demoKeys.reservations, DEMO_RESERVATIONS));
    this.payments.set(this.loadDemo(this.demoKeys.payments, DEMO_PAYMENTS));
    this.settings.set(this.normalizeSettings(this.loadDemo(this.demoKeys.settings, DEMO_SETTINGS)));
    this.syncDemoHousekeeping();
    this.notifications.set([
      { id: 'demo-reservation', type: 'RESERVATION', title: 'Nueva reserva demo', message: 'Laura reservó Cabaña Nido.', link: '/admin/reservas', readAt: null, createdAt: new Date().toISOString() },
      { id: 'demo-payment', type: 'PAYMENT', title: 'Pago pendiente de revisión', message: 'Santiago reportó $500.000 por Nequi.', link: '/admin/pagos', readAt: null, createdAt: new Date(Date.now() - 3600000).toISOString() }
    ]);
    this.error.set('');
    this.updateDemoDashboard();
  }

  private syncDemoHousekeeping(): void {
    const existing = this.loadDemo<HousekeepingTask[]>(this.demoKeys.housekeeping, []);
    const next = [...existing];
    for (const reservation of this.reservations().filter((item) => item.status === 'CHECKED_OUT')) {
      if (next.some((item) => item.reservationId === reservation.id)) continue;
      next.push({
        id: `clean-${reservation.id}`,
        reservationId: reservation.id,
        reservationCode: reservation.code,
        accommodationId: reservation.accommodationId,
        accommodationName: reservation.accommodationName,
        guestName: reservation.guest.fullName,
        checkOut: reservation.checkOut,
        taskDate: reservation.checkOut,
        status: 'PENDING',
        assignedTo: null,
        notes: null,
        completedAt: null,
        updatedAt: new Date().toISOString()
      });
    }
    this.housekeeping.set(next);
    this.persistDemo(this.demoKeys.housekeeping, next);
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
        .filter((item) => item.status === 'APPROVED' && item.paidAt?.slice(0, 7) === month)
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

