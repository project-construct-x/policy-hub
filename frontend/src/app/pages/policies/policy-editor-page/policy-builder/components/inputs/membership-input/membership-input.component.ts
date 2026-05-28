import { Component } from '@angular/core';
import { TranslocoDirective } from '@jsverse/transloco';

@Component({
  selector: 'app-membership-input',
  imports: [TranslocoDirective],
  template: `
    <div class="readonly-info" *transloco="let t">
      <span class="material-icons" aria-hidden="true">verified_user</span>
      <div class="text">
        <p class="label">{{ t('policyBuilder.inputs.membership.title') }}</p>
        <p class="desc">{{ t('policyBuilder.inputs.membership.description') }}</p>
      </div>
    </div>
  `,
  styles: [
    `
      .readonly-info {
        display: flex;
        gap: 12px;
        padding: 14px;
        border: 1px dashed var(--cx-border-color);
        border-radius: 8px;
        background: #f9fafb;
      }
      .material-icons {
        color: var(--cx-text-secondary);
      }
      .label {
        margin: 0 0 4px 0;
        font-size: 14px;
        font-weight: 600;
        color: var(--cx-text-primary);
      }
      .desc {
        margin: 0;
        font-size: 13px;
        color: var(--cx-text-secondary);
      }
    `,
  ],
})
export class MembershipInputComponent {}
