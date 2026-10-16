import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-not-found-page', standalone: true, imports: [RouterLink],
  template: `
    <main class="forest-404">
      <div class="forest-layer" aria-hidden="true"><span>▲</span><span>▲</span><span>▲</span><span>▲</span><span>▲</span></div>
      <section class="not-found-card">
        <span class="eyebrow">ERROR 404</span>
        <div class="cabin-icon" aria-hidden="true"><i class="bi bi-house-heart"></i></div>
        <h1>Te saliste del sendero</h1>
        <p>La página que buscas no existe, cambió de dirección o ya no está disponible.</p>
        <div class="not-found-actions"><a routerLink="/" class="btn btn-primary">Volver al inicio</a><a routerLink="/alojamientos" class="btn btn-outline">Explorar alojamientos</a></div>
        <a routerLink="/mis-reservas" class="text-link">¿Buscabas una reserva? Ir a Mis reservas →</a>
      </section>
    </main>
  `,
  styles: [`
    .forest-404{min-height:100vh;display:grid;place-items:center;position:relative;overflow:hidden;padding:2rem;background:radial-gradient(circle at 50% 10%,#edf8f3 0,#dcece5 42%,#b9d3c8 100%)}.not-found-card{position:relative;z-index:2;width:min(620px,100%);padding:clamp(2rem,6vw,4rem);text-align:center;border:1px solid rgba(255,255,255,.7);border-radius:24px;background:rgba(255,255,255,.88);backdrop-filter:blur(12px);box-shadow:0 30px 80px rgba(6,48,39,.18)}.cabin-icon{width:82px;height:82px;margin:1.2rem auto;display:grid;place-items:center;border-radius:24px;color:#fff;background:var(--primary);font-size:2.2rem;transform:rotate(-3deg)}h1{font:400 clamp(2.3rem,7vw,4.2rem) Georgia,serif;line-height:1;margin:.8rem 0}p{max-width:470px;margin:0 auto 1.5rem}.not-found-actions{display:flex;justify-content:center;gap:.7rem;flex-wrap:wrap;margin-bottom:1.2rem}.forest-layer{position:absolute;inset:auto 0 0;display:flex;justify-content:space-around;align-items:flex-end;color:#467d69;opacity:.26;font-size:clamp(7rem,20vw,16rem);line-height:.55}.forest-layer span:nth-child(2),.forest-layer span:nth-child(4){font-size:.65em;color:#1f604c}@media(max-width:520px){.not-found-actions{display:grid}.not-found-actions .btn{width:100%}}
  `]
})
export class NotFoundPageComponent {}
