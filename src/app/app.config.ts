import { ApplicationConfig } from '@angular/core';
import { provideRouter, withComponentInputBinding, withInMemoryScrolling } from '@angular/router';

import { routes } from './app.routes';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { provideHttpClient } from '@angular/common/http';
import { provideFirebaseApp } from './core/firebase-app.provider';

export const appConfig: ApplicationConfig = {
  providers: [
    // Al cambiar de página se vuelve arriba (y al retroceder se recupera la posición): sin
    // esto, la bienvenida quedaba a medio scroll al venir desde la portada larga.
    provideRouter(
      routes,
      withComponentInputBinding(),
      withInMemoryScrolling({ scrollPositionRestoration: 'enabled' })
    ),
    provideAnimationsAsync(),
    provideHttpClient(),
    provideFirebaseApp()
  ]
};
