import { Component, computed, input } from '@angular/core';
import { TranslocoDirective } from '@jsverse/transloco';
import { PolicyCategory, PolicyType } from '@shared/types/policy.model';
import { POLICY_TYPE_METADATA } from '@features/policies/builder/metadata/policy-type-metadata';

export type BadgeVariant = 'category' | 'type';

@Component({
  selector: 'app-cx-category-badge',
  imports: [TranslocoDirective],
  templateUrl: './cx-category-badge.component.html',
  styleUrl: './cx-category-badge.component.scss',
})
export class CxCategoryBadgeComponent {
  variant = input.required<BadgeVariant>();
  category = input<PolicyCategory | null>(null);
  policyType = input<PolicyType | null>(null);

  labelKey = computed(() => {
    if (this.variant() === 'category') {
      const c = this.category();
      return c ? `policyCategory.${c}.label` : '';
    }
    const t = this.policyType();
    return t ? POLICY_TYPE_METADATA[t].labelKey : '';
  });

  icon = computed(() => {
    if (this.variant() === 'type') {
      const t = this.policyType();
      return t ? POLICY_TYPE_METADATA[t].icon : '';
    }
    return '';
  });
}
