import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TranslocoDirective } from '@jsverse/transloco';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import {
  Constraint,
  EndDateConstraint,
  FrameworkAgreementConstraint,
  MembershipConstraint,
  UseCaseConstraint,
} from '@shared/types/constraint.model';
import { CONSTRAINT_METADATA } from '@features/policies/builder/metadata/constraint-metadata';
import { USE_CASE_OPTIONS } from '@features/policies/builder/metadata/use-case-options.data';
import {
  ValidationError,
  validateConstraint,
} from '@features/policies/builder/validators/constraint-validators';

@Component({
  selector: 'app-constraint-editor-card',
  imports: [
    FormsModule,
    TranslocoDirective,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatIconModule,
    MatButtonModule,
  ],
  templateUrl: './constraint-editor-card.component.html',
  styleUrl: './constraint-editor-card.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ConstraintEditorCardComponent {
  readonly constraint = input.required<Constraint>();
  readonly index = input.required<number>();
  readonly showErrors = input(false);

  readonly constraintChange = output<Constraint>();
  readonly remove = output<void>();

  readonly meta = computed(() => CONSTRAINT_METADATA[this.constraint().type]);
  readonly useCaseOptions = USE_CASE_OPTIONS;

  readonly errors = computed<ValidationError[]>(() =>
    this.showErrors() ? validateConstraint(this.constraint(), this.index()) : [],
  );

  hasError(field: string): boolean {
    return this.errors().some((e) => e.field.endsWith(field));
  }

  errorKey(field: string): string | null {
    return this.errors().find((e) => e.field.endsWith(field))?.messageKey ?? null;
  }

  asMembership(c: Constraint): MembershipConstraint {
    return c as MembershipConstraint;
  }
  asUseCase(c: Constraint): UseCaseConstraint {
    return c as UseCaseConstraint;
  }
  asEndDate(c: Constraint): EndDateConstraint {
    return c as EndDateConstraint;
  }
  asFramework(c: Constraint): FrameworkAgreementConstraint {
    return c as FrameworkAgreementConstraint;
  }

  onUseCaseChange(values: string[]): void {
    const current = this.asUseCase(this.constraint());
    this.constraintChange.emit({ ...current, useCases: values });
  }

  onEndDateChange(value: string): void {
    const current = this.asEndDate(this.constraint());
    this.constraintChange.emit({ ...current, endDate: value });
  }

  onRemove(): void {
    this.remove.emit();
  }
}
