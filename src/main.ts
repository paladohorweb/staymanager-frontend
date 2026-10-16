import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { AppComponent } from './app/app.component';
import { environment } from './environments/environment';

const insecureProduction = environment.production
  && window.location.protocol === 'http:'
  && !['localhost', '127.0.0.1'].includes(window.location.hostname);

if (insecureProduction) {
  window.location.replace(`https://${window.location.host}${window.location.pathname}${window.location.search}${window.location.hash}`);
} else {
  bootstrapApplication(AppComponent, appConfig).catch((error) => console.error(error));
}
