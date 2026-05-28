import { Component, input, output } from '@angular/core';
import { TranslocoDirective } from '@jsverse/transloco';
import { Constraint } from '@shared/types/constraint.model';
import { CONSTRAINT_METADATA } from '@features/policies/builder/metadata/constraint-metadata';
import { LegalTextBlockComponent } from '../legal-text-block/legal-text-block.component';
import { MembershipInputComponent } from '../inputs/membership-input/membership-input.component';
import { UseCaseInputComponent } from '../inputs/use-case-input/use-case-input.component';
import { EndDateInputComponent } from '../inputs/end-date-input/end-date-input.component';
import { FrameworkAgreementInputComponent } from '../inputs/framework-agreement-input/framework-agreement-input.component';

@Component({
  selector: 'app-constraint-input',
  imports: [
    TranslocoDirective,
    LegalTextBlockComponent,
    MembershipInputComponent,
    UseCaseInputComponent,
    EndDateInputComponent,
    FrameworkAgreementInputComponent,
  ],
  template: `
    <div class="constraint-input" *transloco="let t">
      <header class="header">
        <span class="material-icons" aria-hidden="true">{{ metadata().icon }}</span>
        <div>
          <h4 class="title">{{ t(metadata().labelKey) }}</h4>
          <p class="desc">{{ t(metadata().descriptionKey) }}</p>
        </div>
      </header>

      <div class="body">
        @switch (constraint().type) {
          @case ('MEMBERSHIP') {
            <app-membership-input />
          }
          @case ('USE_CASE') {
            <app-use-case-input
              [selected]="useCaseConstraint().useCases"
              [errorKey]="errorKeyFor('useCases')"
              (selectedChange)="onUseCasesChange($event)"
            />
          }
          @case ('END_DATE') {
            <app-end-date-input
              [value]="endDateConstraint().endDate"
              [errorKey]="errorKeyFor('endDate')"
              (valueChange)="onEndDateChange($event)"
            />
          }
          @case ('FRAMEWORK_AGREEMENT') {
            <app-framework-agreement-input [value]="frameworkConstraint().agreement" />
          }
        }
      </div>

      <app-legal-text-block [legalTextKey]="metadata().legalTextKey" />
    </div>
  `,
  styles: [
    `
      .constraint-input {
        display: flex;
        flex-direction: column;
        gap: 12px;
        padding: 18px;
        border: 1px solid var(--cx-border-color);
        border-radius: 10px;
        background: #fff;
      }
      .header {
        display: flex;
        gap: 12px;
        align-items: flex-start;
      }
      .header .material-icons {
        color: var(--cx-orange, #f97316);
      }
      .title {
        margin: 0;
        font-size: 15px;
        font-weight: 600;
        color: var(--cx-text-primary);
      }
      .desc {
        margin: 2px 0 0 0;
        font-size: 13px;
        color: var(--cx-text-secondary);
      }
    `,
  ],
})
export class ConstraintInputComponent {
  constraint = input.required<Constraint>();
  errors = input<Record<string, string>>({});
  constraintChange = output<Constraint>();

  get metadata() {
    return () => CONSTRAINT_METADATA[this.constraint().type];
  }

  useCaseConstraint = () =>
    this.constraint().type === 'USE_CASE'
      ? (this.constraint() as { type: 'USE_CASE'; useCases: string[] })
      : { type: 'USE_CASE' as const, useCases: [] };

  endDateConstraint = () =>
    this.constraint().type === 'END_DATE'
      ? (this.constraint() as { type: 'END_DATE'; endDate: string })
      : { type: 'END_DATE' as const, endDate: '' };

  frameworkConstraint = () =>
    this.constraint().type === 'FRAMEWORK_AGREEMENT'
      ? (this.constraint() as { type: 'FRAMEWORK_AGREEMENT'; agreement: string })
      : { type: 'FRAMEWORK_AGREEMENT' as const, agreement: '' };

  errorKeyFor(field: string): string | null {
    return this.errors()[field] ?? null;
  }

  onUseCasesChange(useCases: string[]): void {
    this.constraintChange.emit({ type: 'USE_CASE', useCases });
  }

  onEndDateChange(endDate: string): void {
    this.constraintChange.emit({ type: 'END_DATE', endDate });
  }
}
