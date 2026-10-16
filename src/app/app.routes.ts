import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { AdminShellComponent } from './layout/admin-shell.component';
import { PublicLayoutComponent } from './layout/public-layout.component';

export const routes: Routes = [
  {
    path: '', component: PublicLayoutComponent, children: [
      { path: '', loadComponent: () => import('./features/public/home-page.component').then((m) => m.HomePageComponent) },
      { path: 'alojamientos', loadComponent: () => import('./features/public/explore-page.component').then((m) => m.ExplorePageComponent) },
      { path: 'reservar/:id', loadComponent: () => import('./features/public/booking-page.component').then((m) => m.BookingPageComponent) },
      { path: 'mi-reserva', loadComponent: () => import('./features/public/guest-portal-page.component').then((m) => m.GuestPortalPageComponent) }
    ]
  },
  { path: 'login', loadComponent: () => import('./features/public/login-page.component').then((m) => m.LoginPageComponent) },
  {
    path: 'admin', component: AdminShellComponent, canActivate: [authGuard], children: [
      { path: '', loadComponent: () => import('./features/admin/dashboard-page.component').then((m) => m.DashboardPageComponent) },
      { path: 'reservas', loadComponent: () => import('./features/admin/reservations-page.component').then((m) => m.ReservationsPageComponent) },
      { path: 'alojamientos', loadComponent: () => import('./features/admin/accommodations-page.component').then((m) => m.AccommodationsPageComponent) },
      { path: 'pagos', loadComponent: () => import('./features/admin/payments-page.component').then((m) => m.PaymentsPageComponent) }
    ]
  },
  { path: '**', loadComponent: () => import('./features/public/not-found-page.component').then((m) => m.NotFoundPageComponent) }
];

