import { Component, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslocoDirective } from '@jsverse/transloco';
import { PolicyService } from '@services/policies/policy.service';
import { Policy } from '@shared/types/policy.model';

@Component({
  selector: 'app-home-page',
  imports: [RouterLink, TranslocoDirective],
  templateUrl: './home-page.component.html',
  styleUrl: './home-page.component.scss',
})
export class HomePageComponent implements OnInit {
  private readonly policyService = inject(PolicyService);

  policyCount = signal(0);
  useCaseCount = signal(0);
  recentPolicies = signal<Policy[]>([]);

  ngOnInit(): void {
    this.policyService.getAll().subscribe((policies) => {
      this.policyCount.set(policies.length);

      const useCases = new Set(policies.map((p) => p.useCaseContext).filter(Boolean));
      this.useCaseCount.set(useCases.size);

      const sorted = [...policies].sort(
        (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
      );
      this.recentPolicies.set(sorted.slice(0, 3));
    });
  }

  formatDate(iso: string): string {
    const date = new Date(iso);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const oneDay = 24 * 60 * 60 * 1000;

    if (diff < oneDay && date.getDate() === now.getDate()) {
      return `Heute, ${date.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })}`;
    }
    if (diff < 2 * oneDay) {
      return `Gestern, ${date.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })}`;
    }
    return date.toLocaleDateString('de-DE', { day: 'numeric', month: 'long', year: 'numeric' });
  }
}
