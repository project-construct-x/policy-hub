import { Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { TranslocoDirective, TranslocoService } from '@jsverse/transloco';
import { NotificationService } from '@services/notification/notification.service';
import { ConXButtonComponent } from '@ui/button/con-x-button.component';

@Component({
  selector: 'app-header',
  imports: [RouterLink, RouterLinkActive, TranslocoDirective, ConXButtonComponent],
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
