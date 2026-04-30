import { Component } from '@angular/core';
import { TranslocoDirective } from '@jsverse/transloco';

@Component({
  selector: 'app-profile-page',
  imports: [TranslocoDirective],
  template: `
    <div class="profile-page" *transloco="let t">
      <h1>{{ t('profile.title') }}</h1>
    </div>
  `,
  styles: `
    .profile-page {
      max-width: 960px;
      margin: 0 auto;
      padding: 56px 96px;
    }

    h1 {
      font-size: 26px;
      font-weight: 600;
      color: var(--cx-text-primary);
    }
  `,
})
export class ProfilePageComponent {}
