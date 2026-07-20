import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-not-found-page', standalone: true, imports: [RouterLink],
  template: `<section class="not-found"><span>404</span><h1>Este camino no lleva a ningún refugio</h1><p>La página que buscas no está disponible.</p><a routerLink="/" class="btn btn-primary">Volver al inicio</a></section>`
})
export class NotFoundPageComponent {}
