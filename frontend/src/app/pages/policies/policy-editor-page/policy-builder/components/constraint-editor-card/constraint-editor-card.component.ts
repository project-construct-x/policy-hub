import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TranslocoDirective } from '@jsverse/transloco';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { ErrorStateMatcher, MatNativeDateModule } from '@angular/material/core';
import {
  Constraint,
  DateRangeConstraint,
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

function sameDateOrNull(a: Date | null, b: Date | null): boolean {
  return a === b || (a !== null && b !== null && a.getTime() === b.getTime());
}

@Component({
  selector: 'app-constraint-editor-card',
  imports: [
    FormsModule,
    TranslocoDirective,
    MatFormFieldModule,
    MatSelectModule,
    MatIconModule,
    MatDatepickerModule,
    MatNativeDateModule,
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

  readonly meta = computed(() => CONSTRAINT_METADATA[this.constraint().type]);
  readonly useCaseOptions = USE_CASE_OPTIONS;
  readonly minDate = new Date();

  readonly errors = computed<ValidationError[]>(() =>
    this.showErrors() ? validateConstraint(this.constraint(), this.index()) : [],
  );

  // `equal: sameDateOrNull` hält die Objekt-Referenz stabil, solange sich das Datum inhaltlich
  // nicht ändert. Ohne das erzeugt jede Änderung (z.B. am Enddatum) über `parseDate()` ein neues
  // `Date`-Objekt für BEIDE Felder; Angular sieht dadurch am Start-Input eine "neue" Referenz und
  // ruft erneut `writeValue()` auf `matStartDate` auf. Bei Range-Inputs ist das kein No-Op:
  // `MatStartDate._assignValueToModel()` schreibt den Wert zurück ins geteilte Auswahl-Modell —
  // dadurch wird der vom Nutzer gerade angeklickte neue Start sofort wieder überschrieben.
  readonly startDateValue = computed<Date | null>(
    () => this.parseDate(this.dateRange()?.startDate),
    { equal: sameDateOrNull },
  );
  readonly endDateValue = computed<Date | null>(() => this.parseDate(this.dateRange()?.endDate), {
    equal: sameDateOrNull,
  });

  private dateRange(): DateRangeConstraint | null {
    const c = this.constraint();
    return c.type === 'DATE_RANGE' ? c : null;
  }

  private parseDate(iso: string | undefined): Date | null {
    if (!iso) return null;
    const d = new Date(iso);
    return isNaN(d.getTime()) ? null : d;
  }

  hasError(field: string): boolean {
    return this.errors().some((e) => e.field.endsWith(field));
  }

  errorKey(field: string): string | null {
    return this.errors().find((e) => e.field.endsWith(field))?.messageKey ?? null;
  }

  // `mat-error` wird von Material nur eingeblendet, wenn der zugehörige Control-Direktive
  // (hier: mat-select bzw. matStartDate/matEndDate) einen NgControl mit errorState=true hat.
  // Deshalb ein `ngModel` je Feld im Template + ein darauf gekoppelter Matcher — analog
  // `policyIdErrorStateMatcher` in policy-builder.component.ts.
  readonly useCasesErrorStateMatcher: ErrorStateMatcher = {
    isErrorState: () => this.hasError('.useCases'),
  };
  readonly startDateErrorStateMatcher: ErrorStateMatcher = {
    isErrorState: () => this.hasError('.startDate'),
  };
  readonly endDateErrorStateMatcher: ErrorStateMatcher = {
    isErrorState: () => this.hasError('.endDate'),
  };

  asMembership(c: Constraint): MembershipConstraint {
    return c as MembershipConstraint;
  }
  asUseCase(c: Constraint): UseCaseConstraint {
    return c as UseCaseConstraint;
  }
  asDateRange(c: Constraint): DateRangeConstraint {
    return c as DateRangeConstraint;
  }
  asFramework(c: Constraint): FrameworkAgreementConstraint {
    return c as FrameworkAgreementConstraint;
  }

  onUseCaseChange(values: string[]): void {
    const current = this.asUseCase(this.constraint());
    this.constraintChange.emit({ ...current, useCases: values });
  }

  onStartDateChange(value: Date | null): void {
    const current = this.asDateRange(this.constraint());
    this.constraintChange.emit({ ...current, startDate: value ? this.toIsoDate(value) : '' });
  }

  onEndDateChange(value: Date | null): void {
    const current = this.asDateRange(this.constraint());
    this.constraintChange.emit({ ...current, endDate: value ? this.toIsoDate(value) : '' });
  }

  private toIsoDate(d: Date): string {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }
}
