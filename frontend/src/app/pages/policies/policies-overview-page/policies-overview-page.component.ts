import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatTableModule } from '@angular/material/table';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { TranslocoDirective, TranslocoService } from '@jsverse/transloco';
import { PolicyService } from '@services/policies/policy.service';
import { NotificationService } from '@services/notification/notification.service';
import { Policy } from '@shared/types/policy.model';
import { StatusBadgeComponent } from '@ui/status-badge/status-badge.component';

@Component({
  selector: 'app-policies-overview-page',
  imports: [
    CommonModule,
    RouterLink,
    MatButtonModule,
    MatTableModule,
    MatProgressSpinnerModule,
    TranslocoDirective,
    StatusBadgeComponent,
  ],
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
  displayedColumns = ['name', 'status', 'updatedAt', 'actions'];

  ngOnInit(): void {
    this.loadPolicies();
  }

  loadPolicies(): void {
    this.loading.set(true);
    this.policyService.getAll().subscribe({
      next: (data) => {
        this.policies.set(data);
        this.loading.set(false);
      },
      error: () => {
        this.notification.error(this.transloco.translate('policies.notifications.loadError'));
        this.loading.set(false);
      },
    });
  }

  openDetail(policy: Policy): void {
    this.router.navigate(['/policies', policy.id]);
  }

  formatDate(iso: string): string {
    return new Date(iso).toLocaleDateString('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  }
}
