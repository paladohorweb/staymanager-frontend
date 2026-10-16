import { Component, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AnalyticsService } from '../../core/services/analytics.service';

type ConsentValue = 'analytics' | 'essential';

@Component({
  selector: 'app-cookie-consent',
  standalone: true,
  imports: [RouterLink],
  template: `
    @if (visible()) {
      <section class="cookie-banner" role="dialog" aria-live="polite" aria-label="Preferencias de cookies">
        <div class="cookie-icon"><i class="bi bi-shield-check" aria-hidden="true"></i></div>
        <div class="cookie-copy">
          <strong>Tu privacidad es importante</strong>
          <p>Usamos cookies esenciales para que StayManager funcione. La analítica es opcional y solo se activa con tu autorización.</p>
          <a routerLink="/politica-cookies">Consultar política de cookies</a>
        </div>
        <div class="cookie-actions">
          <button class="btn btn-outline btn-small" type="button" (click)="save('essential')">Solo esenciales</button>
          <button class="btn btn-primary btn-small" type="button" (click)="save('analytics')">Aceptar analítica</button>
        </div>
      </section>
    }
  `,
  styles: [`
    .cookie-banner{position:fixed;z-index:1200;left:50%;bottom:max(1rem,env(safe-area-inset-bottom));transform:translateX(-50%);width:min(920px,calc(100% - 2rem));display:grid;grid-template-columns:auto 1fr auto;gap:1rem;align-items:center;padding:1.1rem 1.2rem;background:#fff;border:1px solid #dfe7e3;border-radius:16px;box-shadow:0 20px 60px rgba(5,30,25,.22)}
    .cookie-icon{width:46px;height:46px;border-radius:12px;display:grid;place-items:center;background:#e8f5f0;color:var(--primary);font-size:1.25rem}.cookie-copy strong{display:block;margin-bottom:.25rem}.cookie-copy p{margin:0;color:var(--muted);font-size:.72rem;line-height:1.5}.cookie-copy a{display:inline-block;margin-top:.3rem;color:var(--primary);font-size:.66rem;font-weight:800}.cookie-actions{display:flex;gap:.55rem;white-space:nowrap}
    @media(max-width:760px){.cookie-banner{grid-template-columns:auto 1fr}.cookie-actions{grid-column:1/-1;display:grid;grid-template-columns:1fr 1fr}.cookie-actions .btn{width:100%}}
    @media(max-width:480px){.cookie-banner{display:block}.cookie-icon{margin-bottom:.7rem}.cookie-actions{margin-top:.9rem;grid-template-columns:1fr}}
  `]
})
export class CookieConsentComponent {
  private readonly storageKey = 'staymanager.cookie-consent.v1';
  readonly visible = signal(!this.readConsent());

  constructor(private readonly analytics: AnalyticsService) {
    if (this.readConsent() === 'analytics') this.analytics.enable();
  }

  save(value: ConsentValue): void {
    localStorage.setItem(this.storageKey, value);
    this.visible.set(false);
    if (value === 'analytics') this.analytics.enable();
  }

  private readConsent(): ConsentValue | null {
    const value = localStorage.getItem(this.storageKey);
    return value === 'analytics' || value === 'essential' ? value : null;
  }
}
