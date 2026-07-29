import { inject, Injectable } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Title } from '@angular/platform-browser';
import { RouterStateSnapshot, TitleStrategy } from '@angular/router';
import { TranslocoService } from '@jsverse/transloco';
import { filter } from 'rxjs';

/**
 * Sets the document title per route as `"<page> · Policy Hub"`. The route's
 * `title` carries an i18n key (see `app.routes.ts`); it is resolved via
 * Transloco and re-applied whenever the active language changes or a
 * translation file finishes loading.
 */
@Injectable({ providedIn: 'root' })
export class ConXTitleStrategy extends TitleStrategy {
  private readonly title = inject(Title);
  private readonly transloco = inject(TranslocoService);

  private currentKey: string | undefined;

  constructor() {
    super();
    this.transloco.events$
      .pipe(
        filter((e) => e.type === 'translationLoadSuccess' || e.type === 'langChanged'),
        takeUntilDestroyed(),
      )
      .subscribe(() => this.applyTitle());
  }

  override updateTitle(snapshot: RouterStateSnapshot): void {
    this.currentKey = this.buildTitle(snapshot);
    this.applyTitle();
  }

  private applyTitle(): void {
    const suffix = this.transloco.translate('a11y.titleSuffix');
    if (!this.currentKey) {
      this.title.setTitle(suffix);
      return;
    }
    const page = this.transloco.translate(this.currentKey);
    this.title.setTitle(`${page} · ${suffix}`);
  }
}
