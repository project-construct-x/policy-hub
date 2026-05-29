import {
  ChangeDetectionStrategy,
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
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { CxButtonComponent } from '@ui/button/cx-button.component';
import { Constraint, ConstraintType } from '@shared/types/constraint.model';
import { Policy, PolicyCategory } from '@shared/types/policy.model';
import {
  buildDefaultConstraint,
  CONSTRAINT_METADATA,
} from '@features/policies/builder/metadata/constraint-metadata';
import { validatePolicyDraft } from '@features/policies/builder/validators/constraint-validators';
import { ConstraintPaletteComponent } from '../constraint-palette/constraint-palette.component';
import { ConstraintEditorCardComponent } from '../constraint-editor-card/constraint-editor-card.component';

export interface PolicyDraft {
  policyId: string;
  category: PolicyCategory;
  constraints: Constraint[];
}

@Component({
  selector: 'app-policy-builder',
  imports: [
    FormsModule,
    TranslocoDirective,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    CxButtonComponent,
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

  readonly policyId = signal('');
  readonly category = signal<PolicyCategory>('ACCESS');
  readonly constraints = signal<Constraint[]>([]);
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

  readonly isValid = computed(() => this.validationErrors().length === 0);

  readonly policyIdError = computed(() => {
    if (!this.submitted()) return null;
    return this.validationErrors().find((e) => e.field === 'policyId')?.messageKey ?? null;
  });

  constructor() {
    effect(() => {
      const initial = this.initialPolicy();
      if (!initial) return;
      untracked(() => {
        this.policyId.set(initial.policyId);
        this.category.set(initial.category);
        this.constraints.set([...initial.constraints]);
      });
    });
  }

  selectCategory(c: PolicyCategory): void {
    if (this.category() === c) return;
    this.category.set(c);
    // Filter out constraints not allowed in the new category
    this.constraints.update((list) => list.filter((cn) => this.isConstraintAllowed(cn.type, c)));
  }

  private isConstraintAllowed(type: ConstraintType, cat: PolicyCategory): boolean {
    return CONSTRAINT_METADATA[type].allowedIn.includes(cat);
  }

  addConstraint(type: ConstraintType): void {
    this.constraints.update((list) => [...list, buildDefaultConstraint(type)]);
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
    if (!this.isValid()) return;
    this.save.emit({
      policyId: this.policyId().trim(),
      category: this.category(),
      constraints: this.constraints(),
    });
  }

  onCancel(): void {
    this.cancelled.emit();
  }
}
