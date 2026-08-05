import {
  ApplicationConfig,
  inject,
  provideAppInitializer,
  provideBrowserGlobalErrorListeners,
  isDevMode,
  LOCALE_ID,
} from '@angular/core';
import { registerLocaleData } from '@angular/common';
import localeDe from '@angular/common/locales/de';
import { provideRouter, TitleStrategy } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { MAT_DATE_LOCALE, MAT_DATE_FORMATS, DateAdapter } from '@angular/material/core';
import { provideTransloco } from '@jsverse/transloco';
import { TranslocoHttpLoader } from './services/transloco-loader.service';
import { ConXTitleStrategy } from '@services/a11y/title-strategy.service';
import { ConXDateAdapter } from '@shared/adapters/con-x-date.adapter';
import { MockService } from '@mocks/mock.service';
import { environment } from '@env';

import { routes } from './app.routes';

registerLocaleData(localeDe);

export const CONX_DATE_FORMATS = {
  parse: {
    dateInput: 'DD.MM.YYYY',
  },
  display: {
    dateInput: 'DD.MM.YYYY',
    monthYearLabel: 'MMM YYYY',
    dateA11yLabel: 'DD.MM.YYYY',
    monthYearA11yLabel: 'MMMM YYYY',
  },
};

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    // Start the MirageJS mock server BEFORE the app bootstraps. mirageJsServer()
    // is async (miragejs is a lazily imported chunk), so starting it from a
    // component's ngOnInit would race the first HTTP call of the routed page:
    // whenever the chunk lost that race the request escaped to the real network
    // and the view stayed empty. Returning the promise here makes Angular wait
    // for the interceptor to be installed. No-op in production — useMocks is
    // false and MockService is replaced by a stub via fileReplacements.
    provideAppInitializer(() =>
      environment.useMocks ? inject(MockService).mirageJsServer() : Promise.resolve(),
    ),
    provideRouter(routes),
    provideHttpClient(),
    provideAnimationsAsync(),
    { provide: TitleStrategy, useClass: ConXTitleStrategy },
    { provide: LOCALE_ID, useValue: 'de-DE' },
    { provide: MAT_DATE_LOCALE, useValue: 'de-DE' },
    { provide: MAT_DATE_FORMATS, useValue: CONX_DATE_FORMATS },
    { provide: DateAdapter, useClass: ConXDateAdapter },
    provideTransloco({
      config: {
        availableLangs: ['de', 'en'],
        defaultLang: 'de',
        fallbackLang: 'de',
        reRenderOnLangChange: true,
        prodMode: !isDevMode(),
        missingHandler: {
          useFallbackTranslation: true,
        },
      },
      loader: TranslocoHttpLoader,
    }),
  ],
};
