import { Routes } from '@angular/router';
import { adminGuard, clientGuard } from './core/guards/auth.guard';
import { AdminShellComponent } from './layout/admin-shell.component';
import { PublicLayoutComponent } from './layout/public-layout.component';

export const routes: Routes = [
  {
    path: '', component: PublicLayoutComponent, children: [
      { path: '', loadComponent: () => import('./features/public/home-page.component').then((m) => m.HomePageComponent), data: { seo: { title: 'Cabañas y refugios en Colombia | StayManager', description: 'Descubre cabañas, glamping y alojamientos de naturaleza. Consulta disponibilidad, reserva y administra tu estadía con StayManager.' } } },
      { path: 'alojamientos', loadComponent: () => import('./features/public/explore-page.component').then((m) => m.ExplorePageComponent), data: { seo: { title: 'Alojamientos disponibles | StayManager', description: 'Compara cabañas, glamping, capacidad, comodidades y disponibilidad para elegir tu próxima estadía en Colombia.' } } },
      { path: 'experiencias', loadComponent: () => import('./features/public/experiences-page.component').then((m) => m.ExperiencesPageComponent), data: { seo: { title: 'Experiencias para tu estadía | StayManager', description: 'Descubre experiencias de naturaleza, bienestar y celebraciones que puedes solicitar durante tu estadía.' } } },
      { path: 'demo', loadComponent: () => import('./features/public/demo-hub-page.component').then((m) => m.DemoHubPageComponent), data: { seo: { title: 'Demo interactiva de StayManager | JGMSolutions', description: 'Explora el portal del huésped y el panel administrativo de StayManager con reservas, pagos, operación, limpieza y mapas por cabaña.' } } },
      { path: 'como-llegar', loadComponent: () => import('./features/public/map-page.component').then((m) => m.MapPageComponent), data: { seo: { title: 'Cómo llegar | StayManager', description: 'Consulta la ubicación del alojamiento, abre la ruta en Google Maps y revisa las instrucciones de llegada.' } } },
      { path: 'reservar/:id', loadComponent: () => import('./features/public/booking-page.component').then((m) => m.BookingPageComponent), data: { seo: { title: 'Solicitar una reserva | StayManager', description: 'Consulta el valor de tu estadía y envía una solicitud de reserva segura al alojamiento.', noIndex: true } } },
      { path: 'mi-reserva', redirectTo: 'mis-reservas', pathMatch: 'full' },
      { path: 'mis-reservas', loadComponent: () => import('./features/public/guest-portal-page.component').then((m) => m.GuestPortalPageComponent), data: { seo: { title: 'Mis reservas | StayManager', description: 'Consulta de forma segura el estado, fechas, pagos y experiencias de tu reserva.', noIndex: true } } },
      { path: 'aviso-legal', loadComponent: () => import('./features/public/legal-page.component').then((m) => m.LegalPageComponent), data: { legalType: 'notice', seo: { title: 'Aviso legal | StayManager', description: 'Condiciones de uso, responsabilidades y datos legales de StayManager y los alojamientos publicados.' } } },
      { path: 'politica-privacidad', loadComponent: () => import('./features/public/legal-page.component').then((m) => m.LegalPageComponent), data: { legalType: 'privacy', seo: { title: 'Política de privacidad | StayManager', description: 'Conoce cómo StayManager y los alojamientos tratan y protegen los datos personales de huéspedes y visitantes.' } } },
      { path: 'politica-cookies', loadComponent: () => import('./features/public/legal-page.component').then((m) => m.LegalPageComponent), data: { legalType: 'cookies', seo: { title: 'Política de cookies | StayManager', description: 'Información sobre cookies esenciales, analítica opcional y control del consentimiento en StayManager.' } } }
    ]
  },
  { path: 'login', loadComponent: () => import('./features/public/login-page.component').then((m) => m.LoginPageComponent), data: { seo: { title: 'Acceso administrativo | StayManager', description: 'Acceso seguro al centro de operaciones del alojamiento.', noIndex: true } } },
  { path: 'registro', loadComponent: () => import('./features/public/register-page.component').then((m) => m.RegisterPageComponent), data: { seo: { title: 'Crear cuenta | StayManager', description: 'Crea el espacio operativo de tu alojamiento en StayManager.', noIndex: true } } },
  { path: 'recuperar-contrasena', loadComponent: () => import('./features/public/forgot-password-page.component').then((m) => m.ForgotPasswordPageComponent), data: { seo: { title: 'Recuperar contraseña | StayManager', description: 'Solicita un enlace seguro para recuperar tu cuenta.', noIndex: true } } },
  { path: 'restablecer-contrasena', loadComponent: () => import('./features/public/reset-password-page.component').then((m) => m.ResetPasswordPageComponent), data: { seo: { title: 'Nueva contraseña | StayManager', description: 'Define una nueva contraseña segura para tu cuenta.', noIndex: true } } },
  {
    path: 'admin', component: AdminShellComponent, canActivate: [adminGuard], children: [
      { path: '', loadComponent: () => import('./features/admin/dashboard-page.component').then((m) => m.DashboardPageComponent) },
      { path: 'bienvenida', loadComponent: () => import('./features/admin/owner-onboarding-page.component').then((m) => m.OwnerOnboardingPageComponent) },
      { path: 'reservas', loadComponent: () => import('./features/admin/reservations-page.component').then((m) => m.ReservationsPageComponent) },
      { path: 'alojamientos', loadComponent: () => import('./features/admin/accommodations-page.component').then((m) => m.AccommodationsPageComponent) },
      { path: 'pagos', loadComponent: () => import('./features/admin/payments-page.component').then((m) => m.PaymentsPageComponent) },
      { path: 'operacion', loadComponent: () => import('./features/admin/operations-page.component').then((m) => m.OperationsPageComponent) },
      { path: 'limpieza', loadComponent: () => import('./features/admin/housekeeping-page.component').then((m) => m.HousekeepingPageComponent) },
      { path: 'configuracion', loadComponent: () => import('./features/admin/settings-page.component').then((m) => m.SettingsPageComponent) },
      { path: 'perfil', loadComponent: () => import('./features/account/profile-page.component').then((m) => m.ProfilePageComponent) },
      { path: 'seguridad', loadComponent: () => import('./features/admin/security-page.component').then((m) => m.SecurityPageComponent) }
    ]
  },
  {
    path: 'cliente', canActivate: [clientGuard],
    loadComponent: () => import('./layout/client-shell.component').then((m) => m.ClientShellComponent), children: [
      { path: '', loadComponent: () => import('./features/client/client-reservations-page.component').then((m) => m.ClientReservationsPageComponent) },
      { path: 'perfil', loadComponent: () => import('./features/account/profile-page.component').then((m) => m.ProfilePageComponent) },
      { path: 'seguridad', loadComponent: () => import('./features/admin/security-page.component').then((m) => m.SecurityPageComponent) }
    ]
  },
  { path: '**', loadComponent: () => import('./features/public/not-found-page.component').then((m) => m.NotFoundPageComponent), data: { seo: { title: 'Página no encontrada | StayManager', description: 'La página solicitada no existe o cambió de ubicación.', noIndex: true } } }
];

