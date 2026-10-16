import { DOCUMENT } from '@angular/common';
import { Inject, Injectable } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { filter } from 'rxjs';
import { environment } from '../../../environments/environment';

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

@Injectable({ providedIn: 'root' })
export class AnalyticsService {
  private loaded = false;

  constructor(@Inject(DOCUMENT) private readonly document: Document, private readonly router: Router) {}

  enable(): void {
    const measurementId = environment.analyticsMeasurementId.trim();
    if (this.loaded || !measurementId || measurementId === 'G-XXXXXXXXXX') return;
    this.loaded = true;

    const script = this.document.createElement('script');
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(measurementId)}`;
    script.referrerPolicy = 'strict-origin-when-cross-origin';
    this.document.head.appendChild(script);

    window.dataLayer = window.dataLayer ?? [];
    window.gtag = (...args: unknown[]) => window.dataLayer?.push(args);
    window.gtag('js', new Date());
    window.gtag('config', measurementId, { anonymize_ip: true, send_page_view: false });
    this.trackPageView(this.router.url);

    this.router.events.pipe(filter((event) => event instanceof NavigationEnd)).subscribe((event) => {
      this.trackPageView((event as NavigationEnd).urlAfterRedirects);
    });
  }

  trackEvent(name: string, parameters: Record<string, string | number | boolean> = {}): void {
    if (!this.loaded) return;
    window.gtag?.('event', name, parameters);
  }

  private trackPageView(path: string): void {
    window.gtag?.('event', 'page_view', {
      page_path: path,
      page_location: window.location.href,
      page_title: this.document.title
    });
  }
}
