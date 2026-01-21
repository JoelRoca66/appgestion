import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideClientHydration, withEventReplay } from '@angular/platform-browser';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async'; 
import { provideHttpClient, withFetch } from '@angular/common/http';


import { providePrimeNG } from 'primeng/config';
import Aura from '@primeng/themes/aura'; 

import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    provideClientHydration(withEventReplay()),
    
    provideAnimationsAsync(),
    provideHttpClient(withFetch()),
    providePrimeNG({
        theme: {
            preset: Aura, 
            options: {
                prefix: 'p',
                darkModeSelector: 'system', 
                cssLayer: {
                    name: 'primeng',
                    order: 'false' 
                }
            }
        }
    })
  ]
};