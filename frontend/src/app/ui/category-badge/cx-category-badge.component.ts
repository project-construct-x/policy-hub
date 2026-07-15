import { Component, computed, input } from '@angular/core';
import { TranslocoDirective } from '@jsverse/transloco';
import { PolicyCategory } from '@shared/types/policy.model';

@Component({
  selector: 'app-cx-category-badge',
  imports: [TranslocoDirective],
  templateUrl: './cx-category-badge.component.html',
  styleUrl: './cx-category-badge.component.scss',
})
export class CxCategoryBadgeComponent {
  category = input.required<PolicyCategory>();

  labelKey = computed(() => `policyCategory.${this.category()}.label`);
}
