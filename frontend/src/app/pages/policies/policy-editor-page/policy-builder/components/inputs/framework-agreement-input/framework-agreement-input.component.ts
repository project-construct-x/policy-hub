import { Component, input } from '@angular/core';
import { TranslocoDirective } from '@jsverse/transloco';

@Component({
  selector: 'app-framework-agreement-input',
  imports: [TranslocoDirective],
  template: `
    <div class="fa-input" *transloco="let t">
      <span class="label">{{ t('policyBuilder.inputs.frameworkAgreement.label') }}</span>
      <span class="value">{{ value() }}</span>
      <p class="hint">{{ t('policyBuilder.inputs.frameworkAgreement.hint') }}</p>
    </div>
  `,
  styles: [
    `
      .fa-input {
        display: flex;
        flex-direction: column;
        gap: 4px;
        padding: 14px;
        border: 1px dashed var(--cx-border-color);
        border-radius: 8px;
        background: #f9fafb;
      }
      .label {
        font-size: 13px;
        font-weight: 500;
        color: var(--cx-text-secondary);
      }
      .value {
        font-size: 16px;
        font-weight: 600;
        color: var(--cx-text-primary);
        font-family: 'JetBrains Mono', monospace;
      }
      .hint {
        margin: 4px 0 0 0;
        font-size: 13px;
        color: var(--cx-text-secondary);
      }
    `,
  ],
})
export class FrameworkAgreementInputComponent {
  value = input.required<string>();
}
