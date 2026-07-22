import { Component, DOCUMENT, inject, OnInit } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { LiveAnnouncer } from '@angular/cdk/a11y';
import { TranslocoDirective, TranslocoService } from '@jsverse/transloco';
import { filter } from 'rxjs';
import { environment } from '@env';
import { HeaderComponent } from '@ui/header/header.component';
import { MockDataSwitcherComponent } from '@ui/mock-data-switcher/mock-data-switcher.component';
import { MockService } from '@mocks/mock.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, HeaderComponent, MockDataSwitcherComponent, TranslocoDirective],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
})
export class App implements OnInit {
  private readonly mockService = inject(MockService);
  private readonly transloco = inject(TranslocoService);
  private readonly router = inject(Router);
  private readonly liveAnnouncer = inject(LiveAnnouncer);
  private readonly document = inject(DOCUMENT);

  readonly useMocks = environment.useMocks;

  constructor() {
    // Keep <html lang> in sync with the active UI language.
    this.transloco.langChanges$
      .pipe(takeUntilDestroyed())
      .subscribe((lang) => this.document.documentElement.setAttribute('lang', lang));

    // On route change, move focus to the main landmark and announce the new page.
    this.router.events
      .pipe(
        filter((e): e is NavigationEnd => e instanceof NavigationEnd),
        takeUntilDestroyed(),
      )
      .subscribe(() => this.onNavigationEnd());
  }

  ngOnInit(): void {
    if (environment.useMocks) {
      this.mockService.mirageJsServer();
    }
  }

  private onNavigationEnd(): void {
    // Defer so the new view is rendered and CxTitleStrategy has set the title.
    setTimeout(() => {
      this.document.getElementById('main-content')?.focus({ preventScroll: false });
      const title = this.document.title;
      if (title) {
        void this.liveAnnouncer.announce(this.transloco.translate('a11y.navigatedTo', { title }));
      }
    });
  }
}
