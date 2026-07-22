import {
  ApplicationConfig,
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
import { CxTitleStrategy } from '@services/a11y/title-strategy.service';
import { CxDateAdapter } from '@shared/adapters/cx-date.adapter';

import { routes } from './app.routes';

registerLocaleData(localeDe);

export const CX_DATE_FORMATS = {
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
    provideRouter(routes),
    provideHttpClient(),
    provideAnimationsAsync(),
    { provide: TitleStrategy, useClass: CxTitleStrategy },
    { provide: LOCALE_ID, useValue: 'de-DE' },
    { provide: MAT_DATE_LOCALE, useValue: 'de-DE' },
    { provide: MAT_DATE_FORMATS, useValue: CX_DATE_FORMATS },
    { provide: DateAdapter, useClass: CxDateAdapter },
    provideTransloco({
      config: {
        availableLangs: ['de', 'en'],
        defaultLang: 'de',
        reRenderOnLangChange: true,
        prodMode: !isDevMode(),
      },
      loader: TranslocoHttpLoader,
    }),
  ],
};
