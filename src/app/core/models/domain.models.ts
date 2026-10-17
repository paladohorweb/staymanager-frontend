export type AccommodationStatus = 'ACTIVE' | 'INACTIVE' | 'MAINTENANCE';
export type AccommodationType = 'CABIN' | 'GLAMPING' | 'COUNTRY_HOUSE' | 'APARTMENT';
export type ReservationStatus =
  | 'QUOTED'
  | 'PENDING_PAYMENT'
  | 'CONFIRMED'
  | 'CHECKED_IN'
  | 'CHECKED_OUT'
  | 'CANCELLED'
  | 'EXPIRED'
  | 'NO_SHOW';
export type PaymentStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'REFUNDED';
export type PaymentMethod = 'NEQUI' | 'BANK_TRANSFER' | 'CASH' | 'CARD' | 'MANUAL';

export interface Property {
  id: string;
  name: string;
  slug: string;
  location: string;
  description: string;
  imageUrl: string;
  active: boolean;
}

export interface Accommodation {
  id: string;
  propertyId: string;
  propertyName?: string;
  propertyLocation?: string;
  name: string;
  type: AccommodationType;
  description: string;
  capacity: number;
  bedrooms: number;
  bathrooms: number;
  baseNightPrice: number;
  weekendNightPrice: number;
  cleaningFee: number;
  status: AccommodationStatus;
  amenities: string[];
  imageUrl: string;
  mapAddress: string;
  mapLatitude: number | null;
  mapLongitude: number | null;
  googleMapsUrl: string;
  arrivalInstructions: string;
}

export interface Guest {
  fullName: string;
  email: string;
  phone: string;
  documentNumber: string;
}

export interface PriceBreakdown {
  nights: number;
  weekdayNights: number;
  weekendNights: number;
  accommodationSubtotal: number;
  cleaningFee: number;
  serviceFee: number;
  total: number;
}

export interface Reservation {
  id: string;
  code: string;
  accommodationId: string;
  accommodationName: string;
  guest: Guest;
  checkIn: string;
  checkOut: string;
  adults: number;
  children: number;
  status: ReservationStatus;
  price: PriceBreakdown;
  amountPaid: number;
  balance: number;
  notes: string;
  createdAt: string;
}

export interface Payment {
  id: string;
  reservationId: string;
  reservationCode: string;
  guestName: string;
  amount: number;
  method: PaymentMethod;
  status: PaymentStatus;
  reference: string;
  submittedAt?: string;
  paidAt: string | null;
  reviewedAt?: string | null;
  reviewedBy?: string | null;
  rejectionReason?: string | null;
}

export interface SessionUser {
  id: string;
  organizationId: string | null;
  fullName: string;
  email: string;
  phone: string | null;
  documentNumber: string | null;
  role: 'OWNER' | 'MANAGER' | 'RECEPTIONIST' | 'HOUSEKEEPING' | 'CLIENT';
  mfaEnabled: boolean;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  expiresIn: number;
  user: SessionUser;
}

export interface LoginResponse extends Partial<AuthTokens> {
  mfaRequired: boolean;
  challengeToken: string | null;
}

export interface AuthMessage {
  message: string;
  developmentToken: string | null;
}

export interface MfaSetup {
  secret: string;
  otpauthUri: string;
}

export interface BookingRequest {
  accommodationId: string;
  checkIn: string;
  checkOut: string;
  adults: number;
  children: number;
  guest: Guest;
  notes: string;
}

export interface QuoteResponse {
  accommodationId: string;
  available: boolean;
  price: PriceBreakdown;
}

export interface AvailabilityResponse {
  accommodationId: string;
  checkIn: string;
  checkOut: string;
  available: boolean;
}

export interface DashboardSummary {
  activeReservations: number;
  pendingReservations: number;
  approvedRevenue: number;
  monthlyRevenue: number;
  pendingBalance: number;
  accommodations: number;
  activeAccommodations: number;
  occupiedAccommodations: number;
  occupancyRate: number;
  arrivalsToday: number;
  departuresToday: number;
  guestsInHouse: number;
}

export interface PaymentInstructions {
  enabled: boolean;
  nequiNumber: string;
  accountHolder: string;
  bankInstructions: string;
  acceptedMethods: PaymentMethod[];
}

export interface GuestPaymentReport {
  id: string;
  amount: number;
  method: PaymentMethod;
  status: PaymentStatus;
  reference: string;
  submittedAt: string;
}

export interface GuestPortalReservation {
  accommodationId: string;
  code: string;
  accommodationName: string;
  propertyName: string;
  propertyLocation: string;
  guestName: string;
  guestEmail: string;
  guestPhone: string;
  checkIn: string;
  checkOut: string;
  adults: number;
  children: number;
  status: ReservationStatus;
  price: PriceBreakdown;
  amountPaid: number;
  balance: number;
  cancellable: boolean;
  notes: string;
  pendingPaymentAmount: number;
  pendingPaymentCount: number;
  paymentInstructions: PaymentInstructions;
}

export type NotificationType = 'RESERVATION' | 'PAYMENT' | 'STAY' | 'SYSTEM';

export interface AppNotification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  link: string;
  readAt: string | null;
  createdAt: string;
}

export interface OrganizationSettings {
  organizationName: string;
  organizationSlug: string;
  whatsappNumber: string;
  checkInTime: string;
  checkOutTime: string;
  mapLabel: string;
  mapAddress: string;
  mapLatitude: number | null;
  mapLongitude: number | null;
  arrivalInstructions: string;
}

export type HousekeepingStatus = 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'INSPECTED';

export interface HousekeepingTask {
  id: string;
  reservationId: string;
  reservationCode: string;
  accommodationId: string;
  accommodationName: string;
  guestName: string;
  checkOut: string;
  taskDate: string;
  status: HousekeepingStatus;
  assignedTo: string | null;
  notes: string | null;
  completedAt: string | null;
  updatedAt: string;
}

export interface ApiProblem {
  detail?: string;
  title?: string;
  code?: string;
  errors?: Record<string, string>;
}

