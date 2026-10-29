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
import { MatIconModule } from '@angular/material/icon';
import { ConXButtonComponent } from '@ui/button/con-x-button.component';
import { Constraint, ConstraintType } from '@shared/types/constraint.model';
import {
  DEFAULT_LOGICAL_OPERATOR,
  LogicalOperator,
  logicalOperatorOf,
  Policy,
  PolicyCategory,
  POLICY_ID_PREFIX,
} from '@shared/types/policy.model';
import {
  buildDefaultConstraint,
  connectorKeyAfter,
  CONSTRAINT_METADATA,
  orderConstraints,
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

  /** Fester, nicht editierbarer Präfix der Policy-ID (im Template vor dem Eingabefeld). */
  readonly policyIdPrefix = POLICY_ID_PREFIX;

  /** Nur der vom Nutzer editierbare Teil hinter dem Präfix. */
  readonly policyId = signal('');
  /** Vollständige Policy-ID inkl. Präfix — das, was validiert und gespeichert wird. */
  private readonly fullPolicyId = computed(() => `${POLICY_ID_PREFIX}${this.policyId().trim()}`);
  readonly category = signal<PolicyCategory>('ACCESS');
  readonly constraints = signal<Constraint[]>([]);
  readonly logicalOperator = signal<LogicalOperator>(DEFAULT_LOGICAL_OPERATOR);
  readonly submitted = signal(false);

  readonly existingConstraintTypes = computed<ConstraintType[]>(() =>
    this.constraints().map((c) => c.type),
  );

  readonly validationErrors = computed(() =>
    validatePolicyDraft({
      policyId: this.fullPolicyId(),
      category: this.category(),
      constraints: this.constraints(),
    }),
  );

  /** Label nach der Constraint-Karte an `index` (UND/ODER; vor einem Teildatensatz immer UND). */
  connectorKeyAfter(index: number): string {
    return connectorKeyAfter(this.constraints(), index, this.logicalOperator());
  }

  /**
   * Constraint-Typen, deren Eingabefeld noch nicht übernommenen (und damit ungültigen) Text
   * enthält, z.B. eine abgelehnte did:web. Solcher Text darf nicht stillschweigend verloren
   * gehen, deshalb blockiert er das Speichern. Beim Entfernen eines Constraints wird der Eintrag
   * verworfen (`prunePendingInput`), sonst blockierte er nach erneutem Hinzufügen weiter.
   */
  private readonly pendingInputTypes = signal<ReadonlySet<ConstraintType>>(new Set());
  private readonly hasPendingInput = computed(() => this.pendingInputTypes().size > 0);

  readonly isValid = computed(
    () => this.validationErrors().length === 0 && !this.hasPendingInput(),
  );

  readonly policyIdError = computed(() => {
    if (!this.submitted()) return null;
    return this.validationErrors().find((e) => e.field === 'policyId')?.messageKey ?? null;
  });

  constructor() {
    effect(() => {
      const initial = this.initialPolicy();
      if (!initial) return;
      untracked(() => {
        this.policyId.set(
          initial.policyId.startsWith(POLICY_ID_PREFIX)
            ? initial.policyId.slice(POLICY_ID_PREFIX.length)
            : initial.policyId,
        );
        this.category.set(initial.category);
        this.constraints.set(orderConstraints(initial.constraints));
        this.logicalOperator.set(logicalOperatorOf(initial));
      });
    });
  }

  selectCategory(c: PolicyCategory): void {
    if (this.category() === c) return;
    this.category.set(c);
    // Filter out constraints not allowed in the new category
    this.constraints.update((list) => list.filter((cn) => this.isConstraintAllowed(cn.type, c)));
    this.prunePendingInput();
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
      // Immer geltende Constraints (Teildatensatz) bleiben hinter den Voraussetzungen.
      return orderConstraints([...list, buildDefaultConstraint(type)]);
    });
    this.prunePendingInput();
  }

  updateConstraint(index: number, c: Constraint): void {
    this.constraints.update((list) => {
      const copy = [...list];
      copy[index] = c;
      return copy;
    });
  }

  setPendingInput(type: ConstraintType, pending: boolean): void {
    this.pendingInputTypes.update((set) => {
      const next = new Set(set);
      if (pending) next.add(type);
      else next.delete(type);
      return next;
    });
  }

  removeConstraint(index: number): void {
    this.constraints.update((list) => list.filter((_, i) => i !== index));
    this.prunePendingInput();
  }

  private prunePendingInput(): void {
    const existing = this.existingConstraintTypes();
    this.pendingInputTypes.update((set) => new Set([...set].filter((t) => existing.includes(t))));
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
      policyId: this.fullPolicyId(),
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
      // Zusammengesetzte Controls (z.B. `mat-chip-grid`) tragen `aria-invalid` auch selbst; ihr
      // Fokus-Handler springt auf den ersten Chip. Fokussiert wird das fehlerhafte Eingabefeld.
      const target =
        firstInvalid?.querySelector<HTMLElement>('input[aria-invalid="true"]') ?? firstInvalid;
      target?.focus();
    });
  }
}
