import {
  Component,
  computed,
  effect,
  inject,
  input,
  output,
  signal,
  untracked,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TranslocoDirective, TranslocoService } from '@jsverse/transloco';
import { Constraint } from '@shared/types/constraint.model';
import { Policy, PolicyCategory, PolicyType } from '@shared/types/policy.model';
import {
  getPolicyTypesForCategory,
  POLICY_TYPE_METADATA,
} from '@features/policies/builder/metadata/policy-type-metadata';
import {
  buildDefaultConstraintsForType,
  validatePolicyDraft,
  ValidationError,
} from '@features/policies/builder/validators/constraint-validators';
import { ConstraintInputComponent } from '../constraint-input/constraint-input.component';
import { PolicySummaryCardComponent } from '../policy-summary-card/policy-summary-card.component';

export interface PolicyDraft {
  name: string;
  description: string;
  category: PolicyCategory;
  type: PolicyType;
  constraints: Constraint[];
}

@Component({
  selector: 'app-policy-builder',
  imports: [FormsModule, TranslocoDirective, ConstraintInputComponent, PolicySummaryCardComponent],
  templateUrl: './policy-builder.component.html',
  styleUrl: './policy-builder.component.scss',
})
export class PolicyBuilderComponent {
  initialPolicy = input<Policy | null>(null);
  submitting = input(false);
  submitLabelKey = input('policyBuilder.actions.save');

  save = output<PolicyDraft>();
  cancelled = output<void>();

  private readonly transloco = inject(TranslocoService);

  name = signal('');
  description = signal('');
  category = signal<PolicyCategory | null>(null);
  type = signal<PolicyType | null>(null);
  constraints = signal<Constraint[]>([]);

  submitted = signal(false);

  availableTypes = computed(() => {
    const c = this.category();
    return c ? getPolicyTypesForCategory(c) : [];
  });

  selectedTypeDescription = computed(() => {
    const t = this.type();
    return t ? POLICY_TYPE_METADATA[t].descriptionKey : '';
  });

  validationErrors = computed(() => {
    return validatePolicyDraft({
      name: this.name(),
      category: this.category() ?? undefined,
      type: this.type() ?? undefined,
      constraints: this.constraints(),
    });
  });

  errorsByField = computed<Record<string, string>>(() => {
    const map: Record<string, string> = {};
    for (const err of this.validationErrors()) {
      if (!map[err.field]) map[err.field] = err.messageKey;
    }
    return map;
  });

  isValid = computed(() => this.validationErrors().length === 0);

  draftPreview = computed<Pick<Policy, 'category' | 'type' | 'constraints'>>(() => ({
    category: this.category() ?? 'ACCESS',
    type: this.type() ?? 'ALWAYS_TRUE',
    constraints: this.constraints(),
  }));

  constructor() {
    effect(() => {
      const initial = this.initialPolicy();
      if (!initial) return;
      untracked(() => {
        this.name.set(initial.name);
        this.description.set(initial.description);
        this.category.set(initial.category);
        this.type.set(initial.type);
        this.constraints.set(initial.constraints);
      });
    });
  }

  selectCategory(c: PolicyCategory): void {
    if (this.category() === c) return;
    this.category.set(c);
    // Reset type if not allowed in the new category
    const t = this.type();
    if (t && !POLICY_TYPE_METADATA[t].allowedCategories.includes(c)) {
      this.type.set(null);
      this.constraints.set([]);
    }
  }

  selectType(t: PolicyType): void {
    if (this.type() === t) return;
    this.type.set(t);
    this.constraints.set(buildDefaultConstraintsForType(t));
  }

  updateConstraint(index: number, c: Constraint): void {
    this.constraints.update((list) => {
      const copy = [...list];
      copy[index] = c;
      return copy;
    });
  }

  showErrorFor(field: string): string | null {
    if (!this.submitted()) return null;
    return this.errorsByField()[field] ?? null;
  }

  errorsForConstraintIndex(index: number): Record<string, string> {
    if (!this.submitted()) return {};
    const c = this.constraints()[index];
    if (!c) return {};
    const fieldByType: Record<string, string[]> = {
      USE_CASE: ['useCases'],
      END_DATE: ['endDate'],
      MEMBERSHIP: [],
      FRAMEWORK_AGREEMENT: [],
    };
    const fields = fieldByType[c.type] ?? [];
    const errors = this.errorsByField();
    const result: Record<string, string> = {};
    for (const f of fields) {
      if (errors[f]) result[f] = errors[f];
    }
    return result;
  }

  submit(): void {
    this.submitted.set(true);
    if (!this.isValid()) return;
    this.save.emit({
      name: this.name().trim(),
      description: this.description().trim(),
      category: this.category()!,
      type: this.type()!,
      constraints: this.constraints(),
    });
  }

  onCancel(): void {
    this.cancelled.emit();
  }
}

// Unused helper signature kept for clarity
export type _ValidationError = ValidationError;
