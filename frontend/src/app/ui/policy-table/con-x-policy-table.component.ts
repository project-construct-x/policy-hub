import { Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslocoDirective } from '@jsverse/transloco';
import { Policy } from '@shared/types/policy.model';
import { RelativeDatePipe } from '@shared/pipes/relative-date.pipe';
import { ConXCategoryBadgeComponent } from '@ui/category-badge/con-x-category-badge.component';

@Component({
  selector: 'app-con-x-policy-table',
  imports: [RouterLink, TranslocoDirective, RelativeDatePipe, ConXCategoryBadgeComponent],
  templateUrl: './con-x-policy-table.component.html',
  styleUrl: './con-x-policy-table.component.scss',
})
export class ConXPolicyTableComponent {
  policies = input.required<Policy[]>();
  showHeader = input(true);
  showAction = input(true);
}
