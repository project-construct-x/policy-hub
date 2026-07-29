import { Component, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslocoDirective } from '@jsverse/transloco';
import { PolicyService } from '@services/policies/policy.service';
import { Policy } from '@shared/types/policy.model';
import { ConXPolicyTableComponent } from '@ui/policy-table/con-x-policy-table.component';
import { ConXEmptyStateComponent } from '@ui/empty-state/con-x-empty-state.component';
import { ConXButtonComponent } from '@ui/button/con-x-button.component';

@Component({
  selector: 'app-home-page',
  imports: [
    RouterLink,
    TranslocoDirective,
    ConXButtonComponent,
    ConXPolicyTableComponent,
    ConXEmptyStateComponent,
  ],
  templateUrl: './home-page.component.html',
  styleUrl: './home-page.component.scss',
})
export class HomePageComponent implements OnInit {
  private readonly policyService = inject(PolicyService);

  policyCount = signal(0);
  recentPolicies = signal<Policy[]>([]);

  ngOnInit(): void {
    this.policyService.getAllPolicies().subscribe((policies) => {
      this.policyCount.set(policies.length);

      const sorted = [...policies].sort(
        (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
      );
      this.recentPolicies.set(sorted.slice(0, 3));
    });
  }
}
