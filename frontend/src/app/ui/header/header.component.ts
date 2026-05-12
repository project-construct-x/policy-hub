import { Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { TranslocoDirective, TranslocoService } from '@jsverse/transloco';
import { NotificationService } from '@services/notification/notification.service';

@Component({
  selector: 'app-header',
  imports: [RouterLink, RouterLinkActive, MatButtonModule, TranslocoDirective],
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss',
})
export class HeaderComponent {
  private readonly transloco = inject(TranslocoService);
  private readonly notification = inject(NotificationService);

  get activeLang(): string {
    return this.transloco.getActiveLang();
  }

  get availableLangs(): string[] {
    return this.transloco.getAvailableLangs() as string[];
  }

  switchLang(lang: string): void {
    this.transloco.setActiveLang(lang);
  }

  onLoginClick(): void {
    this.notification.info(this.transloco.translate('header.loginNotAvailable'));
  }
}
