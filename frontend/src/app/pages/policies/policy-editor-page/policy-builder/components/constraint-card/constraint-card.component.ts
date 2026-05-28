import { Component, computed, inject, input } from '@angular/core';
import { TranslocoDirective, TranslocoService } from '@jsverse/transloco';
import { Constraint } from '@shared/types/constraint.model';
import { CONSTRAINT_METADATA } from '@features/policies/builder/metadata/constraint-metadata';
import { LegalTextBlockComponent } from '../legal-text-block/legal-text-block.component';
import { formatConstraintSummary } from '@features/policies/builder/helpers/policy-summary.helper';

@Component({
  selector: 'app-constraint-card',
  imports: [TranslocoDirective, LegalTextBlockComponent],
  template: `
    <article class="constraint-card" *transloco="let t">
      <header>
        <span class="material-icons" aria-hidden="true">{{ metadata().icon }}</span>
        <div>
          <h4>{{ t(metadata().labelKey) }}</h4>
          <p class="value">{{ summaryText() }}</p>
        </div>
      </header>
      <app-legal-text-block [legalTextKey]="metadata().legalTextKey" />
    </article>
  `,
  styles: [
    `
      .constraint-card {
        display: flex;
        flex-direction: column;
        gap: 12px;
        padding: 18px;
        border: 1px solid var(--cx-border-color);
        border-radius: 10px;
        background: #fff;
      }
      header {
        display: flex;
        gap: 12px;
        align-items: flex-start;
      }
      header .material-icons {
        color: var(--cx-orange, #f97316);
        margin-top: 2px;
      }
      h4 {
        margin: 0;
        font-size: 15px;
        font-weight: 600;
      }
      .value {
        margin: 4px 0 0 0;
        font-size: 14px;
        color: var(--cx-text-secondary);
      }
    `,
  ],
})
export class ConstraintCardComponent {
  constraint = input.required<Constraint>();

  private readonly transloco = inject(TranslocoService);

  metadata = computed(() => CONSTRAINT_METADATA[this.constraint().type]);
  summaryText = computed(() => formatConstraintSummary(this.constraint(), this.transloco));
}
