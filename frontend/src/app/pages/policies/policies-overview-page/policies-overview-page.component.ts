import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { TranslocoDirective, TranslocoService } from '@jsverse/transloco';
import { PolicyService } from '@services/policies/policy.service';
import { NotificationService } from '@services/notification/notification.service';
import { Policy } from '@shared/types/policy.model';

@Component({
  selector: 'app-policies-overview-page',
  imports: [RouterLink, FormsModule, TranslocoDirective],
  templateUrl: './policies-overview-page.component.html',
  styleUrl: './policies-overview-page.component.scss',
})
export class PoliciesOverviewPageComponent implements OnInit {
  private readonly policyService = inject(PolicyService);
  private readonly notification = inject(NotificationService);
  private readonly router = inject(Router);
  private readonly transloco = inject(TranslocoService);

  policies = signal<Policy[]>([]);
  loading = signal(true);
  error = signal(false);

  searchQuery = signal('');
  selectedContext = signal('');
  currentPage = signal(1);
  pageSize = 4;

  useCaseContexts = computed(() => {
    const contexts = this.policies()
      .map((p) => p.useCaseContext)
      .filter(Boolean);
    return [...new Set(contexts)].sort();
  });

  filteredPolicies = computed(() => {
    let result = this.policies();
    const query = this.searchQuery().toLowerCase().trim();
    const context = this.selectedContext();

    if (query) {
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(query) || p.useCaseContext.toLowerCase().includes(query),
      );
    }

    if (context) {
      result = result.filter((p) => p.useCaseContext === context);
    }

    return result.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  });

  paginatedPolicies = computed(() => {
    const start = (this.currentPage() - 1) * this.pageSize;
    return this.filteredPolicies().slice(start, start + this.pageSize);
  });

  totalPages = computed(() => Math.ceil(this.filteredPolicies().length / this.pageSize));

  paginationInfo = computed(() => {
    const total = this.filteredPolicies().length;
    const start = (this.currentPage() - 1) * this.pageSize + 1;
    const end = Math.min(this.currentPage() * this.pageSize, total);
    return `${start}–${end} von ${total} Richtlinien`;
  });

  ngOnInit(): void {
    this.loadPolicies();
  }

  loadPolicies(): void {
    this.loading.set(true);
    this.error.set(false);
    this.policyService.getAll().subscribe({
      next: (data) => {
        this.policies.set(data);
        this.loading.set(false);
      },
      error: () => {
        this.notification.error(this.transloco.translate('policies.notifications.loadError'));
        this.loading.set(false);
        this.error.set(true);
      },
    });
  }

  onSearch(value: string): void {
    this.searchQuery.set(value);
    this.currentPage.set(1);
  }

  onContextFilter(value: string): void {
    this.selectedContext.set(value);
    this.currentPage.set(1);
  }

  openDetail(policy: Policy): void {
    this.router.navigate(['/policies', policy.id]);
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages()) {
      this.currentPage.set(page);
    }
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
