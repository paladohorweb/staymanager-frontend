import { Component } from '@angular/core';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-floating-whatsapp',
  standalone: true,
  template: `
    <a
      class="floating-whatsapp"
      [href]="whatsappUrl"
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Contactar a JGMSolutions por WhatsApp"
      title="¿Necesitas ayuda? Escríbenos por WhatsApp">
      <i class="bi bi-whatsapp" aria-hidden="true"></i>
      <span>WhatsApp</span>
    </a>
  `,
  styles: [`
    .floating-whatsapp {
      position: fixed;
      right: max(1rem, env(safe-area-inset-right));
      bottom: max(1rem, env(safe-area-inset-bottom));
      z-index: 1080;
      display: inline-flex;
      align-items: center;
      gap: .55rem;
      min-height: 52px;
      padding: .75rem 1rem;
      border-radius: 999px;
      color: #fff;
      background: #1fa855;
      box-shadow: 0 14px 34px rgba(15, 118, 58, .35);
      font-weight: 800;
      text-decoration: none;
      transition: transform .2s ease, box-shadow .2s ease;
    }
    .floating-whatsapp:hover {
      color: #fff;
      transform: translateY(-3px);
      box-shadow: 0 18px 40px rgba(15, 118, 58, .42);
    }
    .floating-whatsapp:focus-visible {
      outline: 3px solid #fff;
      outline-offset: 3px;
    }
    .floating-whatsapp i { font-size: 1.45rem; }
    @media (max-width: 575.98px) {
      .floating-whatsapp { width: 52px; padding: 0; justify-content: center; }
      .floating-whatsapp span { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0, 0, 0, 0); }
    }
  `]
})
export class FloatingWhatsappComponent {
  readonly whatsappUrl = `https://wa.me/${environment.whatsappNumber}?text=${encodeURIComponent(environment.whatsappMessage)}`;
}
