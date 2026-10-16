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
export type PaymentMethod = 'NEQUI' | 'BANK_TRANSFER' | 'CASH' | 'CARD';

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
  paidAt: string;
}

export interface SessionUser {
  id: string;
  organizationId: string;
  fullName: string;
  email: string;
  role: 'OWNER' | 'MANAGER' | 'RECEPTIONIST';
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  expiresIn: number;
  user: SessionUser;
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

export interface GuestPortalReservation {
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
}

export interface ApiProblem {
  detail?: string;
  title?: string;
  code?: string;
  errors?: Record<string, string>;
}

