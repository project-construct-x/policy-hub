import { Component, input, signal } from '@angular/core';
import { TranslocoDirective } from '@jsverse/transloco';

@Component({
  selector: 'app-legal-text-block',
  imports: [TranslocoDirective],
  template: `
    <div class="legal-block" *transloco="let t">
      <button type="button" class="legal-toggle" (click)="toggle()">
        <span class="material-icons" aria-hidden="true">gavel</span>
        <span class="legal-title">{{ t('policyBuilder.legalText.title') }}</span>
        <span class="material-icons chevron" [class.open]="open()" aria-hidden="true">
          expand_more
        </span>
      </button>
      @if (open()) {
        <p class="legal-content">{{ t(legalTextKey()) }}</p>
      }
    </div>
  `,
  styles: [
    `
      .legal-block {
        border: 1px solid var(--cx-border-color);
        border-radius: 8px;
        background: #fafafa;
      }
      .legal-toggle {
        display: flex;
        align-items: center;
        gap: 8px;
        width: 100%;
        padding: 10px 14px;
        border: none;
        background: transparent;
        cursor: pointer;
        font-size: 13px;
        font-weight: 500;
        color: var(--cx-text-secondary);
      }
      .legal-title {
        flex: 1;
        text-align: left;
      }
      .chevron {
        transition: transform 0.15s;
      }
      .chevron.open {
        transform: rotate(180deg);
      }
      .legal-content {
        margin: 0;
        padding: 0 14px 12px 42px;
        font-size: 13px;
        color: var(--cx-text-secondary);
        line-height: 1.55;
      }
    `,
  ],
})
export class LegalTextBlockComponent {
  legalTextKey = input.required<string>();
  defaultOpen = input(false);

  open = signal(this.defaultOpen());

  toggle(): void {
    this.open.update((v) => !v);
  }
}
