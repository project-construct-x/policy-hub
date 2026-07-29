import { Component, computed, input } from '@angular/core';
import { TranslocoDirective } from '@jsverse/transloco';
import { PolicyCategory } from '@shared/types/policy.model';

@Component({
  selector: 'app-con-x-category-badge',
  imports: [TranslocoDirective],
  templateUrl: './con-x-category-badge.component.html',
  styleUrl: './con-x-category-badge.component.scss',
})
export class ConXCategoryBadgeComponent {
  category = input.required<PolicyCategory>();

  labelKey = computed(() => `policyCategory.${this.category()}.label`);
}
