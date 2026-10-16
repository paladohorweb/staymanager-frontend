import { Accommodation, OrganizationSettings, Payment, Property, Reservation } from '../models/domain.models';

const isoFromToday = (days: number): string => {
  const date = new Date();
  date.setHours(12, 0, 0, 0);
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
};

export const DEMO_SETTINGS: OrganizationSettings = {
  organizationName: 'Refugios del Bosque',
  organizationSlug: 'refugios-del-bosque',
  whatsappNumber: '573233098671',
  checkInTime: '15:00',
  checkOutTime: '11:00',
  mapLabel: 'Reserva Refugios del Bosque',
  mapAddress: 'Guatapé, Antioquia, Colombia',
  mapLatitude: 6.232584,
  mapLongitude: -75.158989,
  arrivalInstructions: 'Al llegar a Guatapé, continúa por la vía principal y confirma tu hora de llegada por WhatsApp. Te enviaremos el punto exacto y las instrucciones de acceso.'
};

export const DEMO_PROPERTIES: Property[] = [
  {
    id: 'prop-bosque', name: 'Reserva Refugios del Bosque', slug: 'reserva-refugios-del-bosque',
    location: 'Guatapé, Antioquia',
    description: 'Un refugio privado entre montañas, bosque nativo y vistas al embalse.',
    imageUrl: 'https://images.unsplash.com/photo-1449158743715-0a90ebb6d2d8?auto=format&fit=crop&fm=webp&w=1200&q=68', active: true
  },
  {
    id: 'prop-cafe', name: 'Mirador del Café', slug: 'mirador-del-cafe', location: 'Salento, Quindío',
    description: 'Arquitectura tradicional, cafetales y descanso con vista a la cordillera.',
    imageUrl: 'https://images.unsplash.com/photo-1520984032042-162d526883e0?auto=format&fit=crop&fm=webp&w=1200&q=68', active: true
  }
];

export const DEMO_ACCOMMODATIONS: Accommodation[] = [
  {
    id: 'acc-romantica', propertyId: 'prop-bosque', propertyName: 'Reserva Refugios del Bosque', propertyLocation: 'Guatapé, Antioquia',
    name: 'Cabaña Nido', type: 'CABIN', description: 'Cabaña íntima con jacuzzi, chimenea y terraza privada frente al bosque.',
    capacity: 2, bedrooms: 1, bathrooms: 1, baseNightPrice: 360000, weekendNightPrice: 430000, cleaningFee: 65000,
    status: 'ACTIVE', amenities: ['Jacuzzi', 'Chimenea', 'Desayuno', 'Wi-Fi', 'Parqueadero'],
    imageUrl: 'https://images.unsplash.com/photo-1510798831971-661eb04b3739?auto=format&fit=crop&fm=webp&w=960&q=68'
  },
  {
    id: 'acc-familiar', propertyId: 'prop-bosque', propertyName: 'Reserva Refugios del Bosque', propertyLocation: 'Guatapé, Antioquia',
    name: 'Cabaña Roble', type: 'COUNTRY_HOUSE', description: 'Espacio familiar amplio con cocina, fogata y sendero privado.',
    capacity: 6, bedrooms: 3, bathrooms: 2, baseNightPrice: 620000, weekendNightPrice: 740000, cleaningFee: 95000,
    status: 'ACTIVE', amenities: ['Cocina', 'Fogata', 'BBQ', 'Wi-Fi', 'Pet friendly'],
    imageUrl: 'https://images.unsplash.com/photo-1473445361085-b9a07f55608b?auto=format&fit=crop&fm=webp&w=960&q=68'
  },
  {
    id: 'acc-glamping', propertyId: 'prop-cafe', propertyName: 'Mirador del Café', propertyLocation: 'Salento, Quindío',
    name: 'Domo Aurora', type: 'GLAMPING', description: 'Domo panorámico para ver las estrellas, con baño privado y desayuno local.',
    capacity: 3, bedrooms: 1, bathrooms: 1, baseNightPrice: 410000, weekendNightPrice: 485000, cleaningFee: 70000,
    status: 'ACTIVE', amenities: ['Vista panorámica', 'Desayuno', 'Minibar', 'Wi-Fi', 'Hamaca'],
    imageUrl: 'https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?auto=format&fit=crop&fm=webp&w=960&q=68'
  }
];

export const DEMO_RESERVATIONS: Reservation[] = [
  {
    id: 'res-001', code: 'ST-26001', accommodationId: 'acc-romantica', accommodationName: 'Cabaña Nido',
    guest: { fullName: 'Laura Martínez', email: 'laura@example.com', phone: '300 555 0132', documentNumber: '1032456789' },
    checkIn: isoFromToday(2), checkOut: isoFromToday(4), adults: 2, children: 0, status: 'CONFIRMED',
    price: { nights: 2, weekdayNights: 1, weekendNights: 1, accommodationSubtotal: 790000, cleaningFee: 65000, serviceFee: 23700, total: 878700 },
    amountPaid: 439350, balance: 439350, notes: 'Celebración de aniversario.', createdAt: new Date().toISOString()
  },
  {
    id: 'res-002', code: 'ST-26002', accommodationId: 'acc-familiar', accommodationName: 'Cabaña Roble',
    guest: { fullName: 'Santiago Ruiz', email: 'santiago@example.com', phone: '310 222 4098', documentNumber: '98765432' },
    checkIn: isoFromToday(7), checkOut: isoFromToday(10), adults: 4, children: 2, status: 'PENDING_PAYMENT',
    price: { nights: 3, weekdayNights: 2, weekendNights: 1, accommodationSubtotal: 1980000, cleaningFee: 95000, serviceFee: 59400, total: 2134400 },
    amountPaid: 0, balance: 2134400, notes: '', createdAt: new Date().toISOString()
  },
  {
    id: 'res-003', code: 'ST-26003', accommodationId: 'acc-glamping', accommodationName: 'Domo Aurora',
    guest: { fullName: 'Mariana López', email: 'mariana@example.com', phone: '315 812 3090', documentNumber: '1012345678' },
    checkIn: isoFromToday(-5), checkOut: isoFromToday(-3), adults: 2, children: 0, status: 'CHECKED_OUT',
    price: { nights: 2, weekdayNights: 2, weekendNights: 0, accommodationSubtotal: 820000, cleaningFee: 70000, serviceFee: 24600, total: 914600 },
    amountPaid: 914600, balance: 0, notes: '', createdAt: new Date().toISOString()
  }
];

export const DEMO_PAYMENTS: Payment[] = [
  {
    id: 'pay-001', reservationId: 'res-001', reservationCode: 'ST-26001', guestName: 'Laura Martínez', amount: 439350,
    method: 'NEQUI', status: 'APPROVED', reference: 'NQ-839201', paidAt: new Date().toISOString()
  },
  {
    id: 'pay-002', reservationId: 'res-003', reservationCode: 'ST-26003', guestName: 'Mariana López', amount: 914600,
    method: 'BANK_TRANSFER', status: 'APPROVED', reference: 'TR-184039', paidAt: new Date(Date.now() - 7 * 86400000).toISOString()
  }
];
