import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AlertService } from '../../core/services/alert.service';
import { StayManagerApiService } from '../../core/services/staymanager-api.service';

@Component({
  selector: 'app-demo-hub-page',
  standalone: true,
  imports: [RouterLink],
  styles: [`
    .demo-hero{padding:9rem 0 4.5rem;color:#fff;background:radial-gradient(circle at 80% 15%,rgba(215,185,109,.23),transparent 30%),linear-gradient(135deg,#05241e,#0d4b3f)}
    .demo-hero .container{display:grid;grid-template-columns:1.15fr .85fr;gap:3rem;align-items:center}.demo-hero h1{max-width:760px;font:400 clamp(2.8rem,6vw,5.6rem)/.98 Georgia,serif}.demo-hero p{max-width:680px;color:#cfe1dc;font-size:1rem}.demo-actions{display:flex;gap:.7rem;flex-wrap:wrap;margin-top:1.7rem}
    .demo-summary{padding:1.5rem;border:1px solid rgba(255,255,255,.15);border-radius:20px;background:rgba(255,255,255,.08);backdrop-filter:blur(12px)}.demo-summary span{display:block;color:#9fc4bb;font-size:.68rem;font-weight:800;letter-spacing:.12em}.demo-summary strong{display:block;margin:.35rem 0 1rem;font-size:1.25rem}.demo-summary ul{margin:0;padding-left:1.1rem;color:#d9e8e4;font-size:.76rem;line-height:1.9}
    .demo-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:1rem}.demo-card{display:flex;flex-direction:column;padding:1.45rem;border:1px solid var(--line);border-radius:18px;background:#fff;box-shadow:var(--shadow)}.demo-icon{width:48px;height:48px;display:grid;place-items:center;border-radius:14px;background:var(--primary-soft);color:var(--primary);font-size:1.2rem}.demo-card h2{margin:1rem 0 .5rem;font:400 1.55rem Georgia,serif}.demo-card p{font-size:.76rem}.demo-card .credentials{margin:.4rem 0 1rem;padding:.8rem;border-radius:10px;background:#f3f7f5;font:600 .72rem/1.7 ui-monospace,monospace}.demo-card .btn{margin-top:auto}
    .tour-list{display:grid;grid-template-columns:repeat(4,1fr);gap:1rem;counter-reset:step}.tour-step{position:relative;padding:1.35rem;border-top:3px solid #d7b96d;background:#f8faf9;border-radius:0 0 14px 14px}.tour-step::before{counter-increment:step;content:'0' counter(step);display:block;margin-bottom:.7rem;color:var(--primary);font-weight:900}.tour-step h3{font-size:.9rem}.tour-step p{margin:0;font-size:.7rem}.demo-note{display:flex;justify-content:space-between;gap:1.5rem;align-items:center;margin-top:1.4rem;padding:1.15rem 1.3rem;border-radius:14px;background:#fff8e8;color:#6d500f}.demo-note p{margin:0;font-size:.73rem}
    @media(max-width:850px){.demo-hero .container,.tour-list{grid-template-columns:1fr 1fr}.demo-summary{grid-column:1/-1}.demo-hero{padding-top:7.5rem}}
    @media(max-width:620px){.demo-hero .container,.demo-grid,.tour-list{grid-template-columns:1fr}.demo-actions{display:grid}.demo-actions .btn{width:100%}.demo-note{align-items:flex-start;flex-direction:column}.demo-hero h1{font-size:2.75rem}}
  `],
  template: `
    <section class="demo-hero"><div class="container">
      <div><span class="eyebrow light">DEMO INTERACTIVA · JGMSOLUTIONS</span><h1>Explora StayManager de punta a punta.</h1><p>Prueba el portal del huésped y el centro operativo del alojamiento con datos ficticios. Los cambios se guardan únicamente en este navegador.</p><div class="demo-actions"><a class="btn btn-light" routerLink="/login">Entrar al panel administrativo</a><a class="btn btn-outline-light" routerLink="/mis-reservas" [queryParams]="{code:'ST-26001',email:'laura@example.com'}">Ver portal del huésped</a></div></div>
      <aside class="demo-summary"><span>INCLUYE</span><strong>Una operación completa y segura</strong><ul><li>Reservas, disponibilidad y cotización</li><li>Pagos pendientes, aprobación y rechazo</li><li>Check-in, check-out y WhatsApp</li><li>Limpieza, configuración y mapas por cabaña</li></ul></aside>
    </div></section>
    <section class="section"><div class="container">
      <div class="section-heading"><div><span class="eyebrow">DOS EXPERIENCIAS CONECTADAS</span><h2>Elige cómo quieres probarla</h2></div></div>
      <div class="demo-grid">
        <article class="demo-card"><span class="demo-icon"><i class="bi bi-person-heart"></i></span><h2>Experiencia del huésped</h2><p>Consulta una reserva realista, revisa el saldo, abre el mapa exacto de la cabaña y prepara solicitudes para WhatsApp.</p><div class="credentials">Código: ST-26001<br>Correo: laura&#64;example.com</div><a class="btn btn-primary" routerLink="/mis-reservas" [queryParams]="{code:'ST-26001',email:'laura@example.com'}">Abrir mi reserva</a></article>
        <article class="demo-card"><span class="demo-icon"><i class="bi bi-speedometer2"></i></span><h2>Experiencia administrativa</h2><p>Gestiona reservas, pagos, llegadas, salidas, limpieza, alojamientos y configuración desde un panel responsive.</p><div class="credentials">Usuario: owner&#64;demo.com<br>Contraseña: Demo123*</div><a class="btn btn-dark" routerLink="/login">Entrar al panel demo</a></article>
      </div>
    </div></section>
    <section class="section pt-0"><div class="container"><div class="section-heading"><div><span class="eyebrow">RECORRIDO RECOMENDADO</span><h2>Comprueba el flujo completo</h2></div></div><div class="tour-list"><article class="tour-step"><h3>Consulta y reserva</h3><p>Explora alojamientos, fechas, capacidad y precios.</p></article><article class="tour-step"><h3>Concilia pagos</h3><p>Revisa un pago pendiente y apruébalo o recházalo.</p></article><article class="tour-step"><h3>Opera la estadía</h3><p>Completa check-in y check-out con mensajes de WhatsApp.</p></article><article class="tour-step"><h3>Prepara la cabaña</h3><p>Asigna limpieza y verifica la ubicación individual.</p></article></div><div class="demo-note"><p><strong>Entorno seguro:</strong> no uses información real. Esta demostración no procesa dinero ni modifica el sistema de producción.</p><button class="btn btn-outline btn-small" type="button" (click)="resetDemo()">Restaurar datos demo</button></div></div></section>
  `
})
export class DemoHubPageComponent {
  constructor(private readonly store: StayManagerApiService, private readonly alerts: AlertService) {}

  async resetDemo(): Promise<void> {
    this.store.resetDemoData();
    await this.alerts.toast('Demostración restaurada');
  }
}
