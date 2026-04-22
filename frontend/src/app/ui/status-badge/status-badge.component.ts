import { Component, inject, input } from '@angular/core';
import { TranslocoService } from '@jsverse/transloco';
import { PolicyStatus } from '@shared/types/policy.model';

@Component({
  selector: 'app-status-badge',
  template: `
    <span class="status-badge" [class]="'status-' + status()">
      {{ label() }}
    </span>
  `,
  styles: `
    .status-badge {
      display: inline-block;
      padding: 4px 12px;
      border-radius: 12px;
      font-family: 'Montserrat', sans-serif;
      font-size: 12px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .status-DRAFT {
      background-color: var(--cx-light-yellow);
      color: var(--cx-dark-yellow);
    }
    .status-ACTIVE {
      background-color: var(--cx-light-blue);
      color: var(--cx-dark-blue);
    }
    .status-ARCHIVED {
      background-color: var(--cx-light-gray);
      color: var(--cx-dark-gray);
    }
  `,
})
export class StatusBadgeComponent {
  private readonly transloco = inject(TranslocoService);
  status = input.required<PolicyStatus>();

  label() {
    return this.transloco.translate('status.' + this.status());
  }
}
