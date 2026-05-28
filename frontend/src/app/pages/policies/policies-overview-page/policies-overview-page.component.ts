import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { TranslocoDirective, TranslocoService } from '@jsverse/transloco';
import { PolicyService } from '@services/policies/policy.service';
import { NotificationService } from '@services/notification/notification.service';
import { Policy, PolicyCategory, PolicyType } from '@shared/types/policy.model';
import { CxPolicyTableComponent } from '@ui/policy-table/cx-policy-table.component';
import { CxEmptyStateComponent } from '@ui/empty-state/cx-empty-state.component';
import { CxButtonComponent } from '@ui/button/cx-button.component';
import {
  ALL_POLICY_TYPES,
  POLICY_TYPE_METADATA,
} from '@features/policies/builder/metadata/policy-type-metadata';

@Component({
  selector: 'app-policies-overview-page',
  imports: [
    RouterLink,
    FormsModule,
    TranslocoDirective,
    CxButtonComponent,
    CxPolicyTableComponent,
    CxEmptyStateComponent,
  ],
  templateUrl: './policies-overview-page.component.html',
  styleUrl: './policies-overview-page.component.scss',
})
export class PoliciesOverviewPageComponent implements OnInit {
  private readonly policyService = inject(PolicyService);
  private readonly notification = inject(NotificationService);
  private readonly transloco = inject(TranslocoService);

  readonly categoryOptions: PolicyCategory[] = ['ACCESS', 'CONTRACT'];
  readonly typeOptions = ALL_POLICY_TYPES.map((t) => ({
    value: t,
    labelKey: POLICY_TYPE_METADATA[t].labelKey,
  }));

  policies = signal<Policy[]>([]);
  loading = signal(true);
  error = signal(false);

  searchQuery = signal('');
  selectedCategory = signal<PolicyCategory | ''>('');
  selectedType = signal<PolicyType | ''>('');
  currentPage = signal(1);
  pageSize = 8;

  filteredPolicies = computed(() => {
    let result = this.policies();
    const query = this.searchQuery().toLowerCase().trim();
    const category = this.selectedCategory();
    const type = this.selectedType();

    if (query) {
      result = result.filter(
        (p) => p.name.toLowerCase().includes(query) || p.description.toLowerCase().includes(query),
      );
    }

    if (category) {
      result = result.filter((p) => p.category === category);
    }

    if (type) {
      result = result.filter((p) => p.type === type);
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
    return this.transloco.translate('policies.pagination.info', { start, end, total });
  });

  ngOnInit(): void {
    this.loadPolicies();
  }

  loadPolicies(): void {
    this.loading.set(true);
    this.error.set(false);
    this.policyService.getAllPolicies().subscribe({
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

  onCategoryFilter(value: string): void {
    this.selectedCategory.set((value as PolicyCategory) || '');
    this.currentPage.set(1);
  }

  onTypeFilter(value: string): void {
    this.selectedType.set((value as PolicyType) || '');
    this.currentPage.set(1);
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages()) {
      this.currentPage.set(page);
    }
  }
}
