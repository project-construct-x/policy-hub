import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  ElementRef,
  inject,
  input,
  output,
  signal,
  untracked,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { LiveAnnouncer } from '@angular/cdk/a11y';
import { TranslocoDirective, TranslocoService } from '@jsverse/transloco';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { ErrorStateMatcher } from '@angular/material/core';
import { ConXButtonComponent } from '@ui/button/con-x-button.component';
import { Constraint, ConstraintType } from '@shared/types/constraint.model';
import {
  DEFAULT_LOGICAL_OPERATOR,
  LogicalOperator,
  logicalOperatorOf,
  Policy,
  PolicyCategory,
} from '@shared/types/policy.model';
import {
  buildDefaultConstraint,
  CONSTRAINT_METADATA,
} from '@features/policies/builder/metadata/constraint-metadata';
import { validatePolicyDraft } from '@features/policies/builder/validators/constraint-validators';
import { buildLegalDescription } from '@features/policies/builder/helpers/legal-description.helper';
import { ConstraintPaletteComponent } from '../constraint-palette/constraint-palette.component';
import { ConstraintEditorCardComponent } from '../constraint-editor-card/constraint-editor-card.component';

export interface PolicyDraft {
  policyId: string;
  category: PolicyCategory;
  constraints: Constraint[];
  /** Verknüpfung der Constraints (`odrl:and` / `odrl:or`). */
  logicalOperator: LogicalOperator;
  /** Aus category + constraints erzeugter juristischer Text, der mit gespeichert wird. */
  legalText: string;
}

@Component({
  selector: 'app-policy-builder',
  imports: [
    FormsModule,
    TranslocoDirective,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    ConXButtonComponent,
    ConstraintPaletteComponent,
    ConstraintEditorCardComponent,
  ],
  templateUrl: './policy-builder.component.html',
  styleUrl: './policy-builder.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PolicyBuilderComponent {
  readonly initialPolicy = input<Policy | null>(null);
  readonly submitting = input(false);
  readonly submitLabelKey = input('policyBuilder.actions.save');

  readonly save = output<PolicyDraft>();
  readonly cancelled = output<void>();

  private readonly transloco = inject(TranslocoService);
  private readonly liveAnnouncer = inject(LiveAnnouncer);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);

  /** Category options in visual order — drives radiogroup arrow-key navigation. */
  private readonly categoryOrder: PolicyCategory[] = ['ACCESS', 'CONTRACT'];

  /** Logical-operator options in visual order — drives radiogroup arrow-key navigation. */
  private readonly logicalOperatorOrder: LogicalOperator[] = ['AND', 'OR'];

  readonly policyId = signal('');
  readonly category = signal<PolicyCategory>('ACCESS');
  readonly constraints = signal<Constraint[]>([]);
  readonly logicalOperator = signal<LogicalOperator>(DEFAULT_LOGICAL_OPERATOR);
  readonly submitted = signal(false);

  readonly existingConstraintTypes = computed<ConstraintType[]>(() =>
    this.constraints().map((c) => c.type),
  );

  readonly validationErrors = computed(() =>
    validatePolicyDraft({
      policyId: this.policyId().trim(),
      category: this.category(),
      constraints: this.constraints(),
    }),
  );

  /** Label zwischen den Constraint-Karten (UND/ODER). */
  readonly connectorKey = computed(() =>
    this.logicalOperator() === 'OR' ? 'policyBuilder.orConnector' : 'policyBuilder.andConnector',
  );

  readonly isValid = computed(() => this.validationErrors().length === 0);

  readonly policyIdError = computed(() => {
    if (!this.submitted()) return null;
    return this.validationErrors().find((e) => e.field === 'policyId')?.messageKey ?? null;
  });

  // Die Fehleranzeige des policyId-Felds wird exakt an unsere eigene Validierung gekoppelt:
  // Materials native Validatoren (`required`) decken nicht alle Regeln ab (z.B. "zu lang").
  // Damit der Matcher überhaupt greift, braucht das Feld ein NgControl — dafür ist im Template
  // `[ngModel]` gesetzt; nur dann ruft MatInput `updateErrorState()` und damit diesen Matcher auf.
  readonly policyIdErrorStateMatcher: ErrorStateMatcher = {
    isErrorState: () => this.policyIdError() !== null,
  };

  constructor() {
    effect(() => {
      const initial = this.initialPolicy();
      if (!initial) return;
      untracked(() => {
        this.policyId.set(initial.policyId);
        this.category.set(initial.category);
        this.constraints.set([...initial.constraints]);
        this.logicalOperator.set(logicalOperatorOf(initial));
      });
    });
  }

  selectCategory(c: PolicyCategory): void {
    if (this.category() === c) return;
    this.category.set(c);
    // Filter out constraints not allowed in the new category
    this.constraints.update((list) => list.filter((cn) => this.isConstraintAllowed(cn.type, c)));
  }

  /** Arrow-key navigation for the category radiogroup (WAI-ARIA radio pattern). */
  onCategoryKeydown(event: KeyboardEvent): void {
    const nextIndex = this.nextRadioIndex(
      event,
      this.categoryOrder.indexOf(this.category()),
      this.categoryOrder.length,
    );
    if (nextIndex === null) return;
    this.selectCategory(this.categoryOrder[nextIndex]);
    this.focusRadio(event, nextIndex);
  }

  selectLogicalOperator(op: LogicalOperator): void {
    this.logicalOperator.set(op);
  }

  /** Arrow-key navigation for the logical-operator radiogroup (WAI-ARIA radio pattern). */
  onLogicalOperatorKeydown(event: KeyboardEvent): void {
    const nextIndex = this.nextRadioIndex(
      event,
      this.logicalOperatorOrder.indexOf(this.logicalOperator()),
      this.logicalOperatorOrder.length,
    );
    if (nextIndex === null) return;
    this.selectLogicalOperator(this.logicalOperatorOrder[nextIndex]);
    this.focusRadio(event, nextIndex);
  }

  /** Wrapping target index for an arrow key, or `null` if the key is not an arrow key. */
  private nextRadioIndex(event: KeyboardEvent, currentIndex: number, count: number): number | null {
    const forwardKeys = ['ArrowRight', 'ArrowDown'];
    const backwardKeys = ['ArrowLeft', 'ArrowUp'];
    if (!forwardKeys.includes(event.key) && !backwardKeys.includes(event.key)) return null;
    event.preventDefault();
    const step = forwardKeys.includes(event.key) ? 1 : -1;
    return (currentIndex + step + count) % count;
  }

  /** Moves focus to the radio at `index` within the radiogroup of the event target. */
  private focusRadio(event: KeyboardEvent, index: number): void {
    const group = (event.currentTarget as HTMLElement).parentElement;
    const radios = group?.querySelectorAll<HTMLElement>('[role="radio"]');
    radios?.[index]?.focus();
  }

  private isConstraintAllowed(type: ConstraintType, cat: PolicyCategory): boolean {
    return CONSTRAINT_METADATA[type].allowedIn.includes(cat);
  }

  toggleConstraint(type: ConstraintType): void {
    this.constraints.update((list) => {
      const existingIndex = list.findIndex((c) => c.type === type);
      if (existingIndex !== -1) {
        return list.filter((_, i) => i !== existingIndex);
      }
      return [...list, buildDefaultConstraint(type)];
    });
  }

  updateConstraint(index: number, c: Constraint): void {
    this.constraints.update((list) => {
      const copy = [...list];
      copy[index] = c;
      return copy;
    });
  }

  removeConstraint(index: number): void {
    this.constraints.update((list) => list.filter((_, i) => i !== index));
  }

  onPolicyIdInput(value: string): void {
    this.policyId.set(value);
  }

  submit(): void {
    this.submitted.set(true);
    if (!this.isValid()) {
      this.announceAndFocusFirstError();
      return;
    }
    const category = this.category();
    const constraints = this.constraints();
    const logicalOperator = this.logicalOperator();
    this.save.emit({
      policyId: this.policyId().trim(),
      category,
      constraints,
      logicalOperator,
      // Gespeichert wird der Text immer auf Deutsch (rechtlich maßgeblich),
      // unabhängig von der aktiven UI-Sprache.
      legalText: buildLegalDescription(
        { category, constraints, logicalOperator },
        this.transloco,
        'de',
      ),
    });
  }

  onCancel(): void {
    this.cancelled.emit();
  }

  /** Announce the invalid-submit summary and move focus to the first invalid control. */
  private announceAndFocusFirstError(): void {
    void this.liveAnnouncer.announce(this.transloco.translate('a11y.formInvalid'), 'assertive');
    // Defer so error states (aria-invalid) are reflected in the DOM first.
    setTimeout(() => {
      const firstInvalid =
        this.host.nativeElement.querySelector<HTMLElement>('[aria-invalid="true"]');
      firstInvalid?.focus();
    });
  }
}
