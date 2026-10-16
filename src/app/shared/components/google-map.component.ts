import { Component, Input, OnChanges } from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';

@Component({
  selector: 'app-google-map', standalone: true,
  template: `<div class="map-frame"><iframe [src]="embedUrl" [title]="'Mapa de ' + label" loading="lazy" referrerpolicy="no-referrer-when-downgrade" allowfullscreen></iframe></div>`,
  styles: [`.map-frame{position:relative;width:100%;min-height:360px;overflow:hidden;border-radius:18px;background:#e5eeea}.map-frame iframe{position:absolute;inset:0;width:100%;height:100%;border:0}@media(max-width:600px){.map-frame{min-height:310px}}`]
})
export class GoogleMapComponent implements OnChanges {
  @Input() label = 'Ubicación del alojamiento';
  @Input() address = '';
  @Input() latitude: number | null = null;
  @Input() longitude: number | null = null;
  embedUrl!: SafeResourceUrl;

  constructor(private readonly sanitizer: DomSanitizer) { this.refresh(); }
  ngOnChanges(): void { this.refresh(); }

  private refresh(): void {
    const query = this.latitude !== null && this.longitude !== null
      ? `${this.latitude},${this.longitude}`
      : this.address || 'Colombia';
    this.embedUrl = this.sanitizer.bypassSecurityTrustResourceUrl(
      `https://www.google.com/maps?q=${encodeURIComponent(query)}&z=15&output=embed`
    );
  }
}
