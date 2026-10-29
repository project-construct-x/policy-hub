import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TranslocoDirective } from '@jsverse/transloco';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { ErrorStateMatcher, MatNativeDateModule } from '@angular/material/core';
import {
  Constraint,
  DateRangeConstraint,
  FrameworkAgreementConstraint,
  MembershipConstraint,
  ParticipantDidConstraint,
} from '@shared/types/constraint.model';
import { CONSTRAINT_METADATA } from '@features/policies/builder/metadata/constraint-metadata';
import {
  ValidationError,
  validateConstraint,
} from '@features/policies/builder/validators/constraint-validators';
import { ParticipantDidInputComponent } from '@features/policies/builder/components/participant-did-input/participant-did-input.component';

@Component({
  selector: 'app-constraint-editor-card',
  imports: [
    FormsModule,
    TranslocoDirective,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatDatepickerModule,
    MatNativeDateModule,
    ParticipantDidInputComponent,
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
  /** `true`, solange ein Eingabefeld Text enthält, der noch nicht übernommen wurde. */
  readonly pendingInputChange = output<boolean>();

  readonly meta = computed(() => CONSTRAINT_METADATA[this.constraint().type]);

  // Start und Ende haben je einen eigenen Datepicker (kein Range-Picker): Ein Range-Picker setzt
  // beim ersten Klick immer den Start neu — bei einem laufenden Zeitraum ließe sich so nicht nur
  // das Enddatum verlängern.
  //
  // Nur die Auswahl im Kalender ist auf heute-und-später begrenzt (`[min]`). Ein bereits
  // gespeichertes Startdatum in der Vergangenheit bleibt erhalten und gültig, solange es nicht
  // geändert wird — der Validator prüft das Startdatum bewusst nicht gegen heute.
  readonly minDate = (() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  })();

  readonly errors = computed<ValidationError[]>(() =>
    this.showErrors() ? validateConstraint(this.constraint(), this.index()) : [],
  );

  readonly startDateValue = computed<Date | null>(() =>
    this.parseDate(this.dateRange()?.startDate),
  );
  readonly endDateValue = computed<Date | null>(() => this.parseDate(this.dateRange()?.endDate));

  // Das Ende ist frühestens heute bzw. frühestens am (künftigen) Startdatum wählbar.
  readonly endMinDate = computed<Date>(() => {
    const start = this.startDateValue();
    return start && start > this.minDate ? start : this.minDate;
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
  // (hier: matInput am Start- bzw. End-Feld) einen NgControl mit errorState=true hat.
  // Deshalb ein `ngModel` je Feld im Template + ein darauf gekoppelter Matcher — analog
  // `policyIdErrorStateMatcher` in policy-builder.component.ts.
  readonly startDateErrorStateMatcher: ErrorStateMatcher = {
    isErrorState: () => this.hasError('.startDate'),
  };
  readonly endDateErrorStateMatcher: ErrorStateMatcher = {
    isErrorState: () => this.hasError('.endDate'),
  };

  asMembership(c: Constraint): MembershipConstraint {
    return c as MembershipConstraint;
  }
  asDateRange(c: Constraint): DateRangeConstraint {
    return c as DateRangeConstraint;
  }
  asFramework(c: Constraint): FrameworkAgreementConstraint {
    return c as FrameworkAgreementConstraint;
  }
  asParticipantDid(c: Constraint): ParticipantDidConstraint {
    return c as ParticipantDidConstraint;
  }

  onDidsChange(dids: string[]): void {
    this.constraintChange.emit({ ...this.asParticipantDid(this.constraint()), dids });
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
