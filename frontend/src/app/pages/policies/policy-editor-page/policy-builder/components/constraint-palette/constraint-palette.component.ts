import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { TranslocoDirective } from '@jsverse/transloco';
import { MatIconModule } from '@angular/material/icon';
import { ConstraintType } from '@shared/types/constraint.model';
import { PolicyCategory } from '@shared/types/policy.model';
import {
  CONSTRAINT_METADATA,
  getAllowedConstraintTypes,
} from '@features/policies/builder/metadata/constraint-metadata';

@Component({
  selector: 'app-constraint-palette',
  imports: [TranslocoDirective, MatIconModule],
  templateUrl: './constraint-palette.component.html',
  styleUrl: './constraint-palette.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ConstraintPaletteComponent {
  readonly category = input.required<PolicyCategory>();
  readonly existingTypes = input<ConstraintType[]>([]);

  readonly toggleConstraint = output<ConstraintType>();

  readonly options = computed(() => {
    const cat = this.category();
    const existing = new Set(this.existingTypes());
    return getAllowedConstraintTypes(cat).map((type) => ({
      type,
      meta: CONSTRAINT_METADATA[type],
      active: existing.has(type),
    }));
  });

  onToggle(type: ConstraintType): void {
    this.toggleConstraint.emit(type);
  }
}
