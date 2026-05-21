import { Component, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslocoDirective } from '@jsverse/transloco';
import { PolicyService } from '@services/policies/policy.service';
import { Policy } from '@shared/types/policy.model';
import { CxPolicyTableComponent } from '@ui/policy-table/cx-policy-table.component';
import { CxEmptyStateComponent } from '@ui/empty-state/cx-empty-state.component';
import { CxButtonComponent } from '@ui/button/cx-button.component';

@Component({
  selector: 'app-home-page',
  imports: [
    RouterLink,
    TranslocoDirective,
    CxButtonComponent,
    CxPolicyTableComponent,
    CxEmptyStateComponent,
  ],
  templateUrl: './home-page.component.html',
  styleUrl: './home-page.component.scss',
})
export class HomePageComponent implements OnInit {
  private readonly policyService = inject(PolicyService);

  policyCount = signal(0);
  useCaseCount = signal(0);
  recentPolicies = signal<Policy[]>([]);

  ngOnInit(): void {
    this.policyService.getAllPolicies().subscribe((policies) => {
      this.policyCount.set(policies.length);

      const useCases = new Set(policies.map((p) => p.useCaseContext).filter(Boolean));
      this.useCaseCount.set(useCases.size);

      const sorted = [...policies].sort(
        (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
      );
      this.recentPolicies.set(sorted.slice(0, 3));
    });
  }
}
