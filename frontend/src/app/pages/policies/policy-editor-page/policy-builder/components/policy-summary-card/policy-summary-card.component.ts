import { Component, computed, inject, input } from '@angular/core';
import { TranslocoDirective, TranslocoService } from '@jsverse/transloco';
import { Policy } from '@shared/types/policy.model';
import { buildPolicySummary } from '@features/policies/builder/helpers/policy-summary.helper';

@Component({
  selector: 'app-policy-summary-card',
  imports: [TranslocoDirective],
  template: `
    <section class="summary-card" *transloco="let t">
      <header>
        <span class="material-icons" aria-hidden="true">summarize</span>
        <h3>{{ t('policySummary.title') }}</h3>
      </header>
      <p class="text">{{ summary() }}</p>
    </section>
  `,
  styles: [
    `
      .summary-card {
        padding: 18px;
        background: #fff7ed;
        border: 1px solid #fed7aa;
        border-radius: 10px;
      }
      header {
        display: flex;
        align-items: center;
        gap: 8px;
        margin-bottom: 8px;
      }
      header .material-icons {
        color: var(--cx-orange, #f97316);
      }
      h3 {
        margin: 0;
        font-size: 14px;
        font-weight: 600;
        color: var(--cx-text-primary);
      }
      .text {
        margin: 0;
        font-size: 14px;
        line-height: 1.55;
        color: var(--cx-text-primary);
      }
    `,
  ],
})
export class PolicySummaryCardComponent {
  policy = input.required<Pick<Policy, 'category' | 'type' | 'constraints'>>();

  private readonly transloco = inject(TranslocoService);

  summary = computed(() => buildPolicySummary(this.policy(), this.transloco));
}
