import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { TranslocoDirective, TranslocoService } from '@jsverse/transloco';
import { PolicyService } from '@services/policies/policy.service';
import { NotificationService } from '@services/notification/notification.service';
import { Policy } from '@shared/types/policy.model';
import { RelativeDatePipe } from '@shared/pipes/relative-date.pipe';
import { CxButtonComponent } from '@ui/button/cx-button.component';
import { CxCategoryBadgeComponent } from '@ui/category-badge/cx-category-badge.component';
import { ConfirmDeleteDialogComponent } from '@ui/confirm-delete-dialog/confirm-delete-dialog.component';
import { ConstraintCardComponent } from '@features/policies/builder/components/constraint-card/constraint-card.component';
import { PolicySummaryCardComponent } from '@features/policies/builder/components/policy-summary-card/policy-summary-card.component';
import { policyToOdrl } from '@services/policies/policy-mapper/policy-odrl.mapper';

@Component({
  selector: 'app-policy-detail-page',
  imports: [
    RouterLink,
    MatDialogModule,
    TranslocoDirective,
    RelativeDatePipe,
    CxButtonComponent,
    CxCategoryBadgeComponent,
    ConstraintCardComponent,
    PolicySummaryCardComponent,
  ],
  templateUrl: './policy-detail-page.component.html',
  styleUrl: './policy-detail-page.component.scss',
})
export class PolicyDetailPageComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly policyService = inject(PolicyService);
  private readonly notification = inject(NotificationService);
  private readonly dialog = inject(MatDialog);
  private readonly transloco = inject(TranslocoService);

  policy = signal<Policy | null>(null);
  loading = signal(true);
  showJsonLd = signal(false);

  odrlJson = computed(() => {
    const p = this.policy();
    if (!p) return '';
    return JSON.stringify(policyToOdrl(p), null, 2);
  });

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      this.router.navigate(['/policies']);
      return;
    }
    this.policyService.getPolicyById(id).subscribe({
      next: (data) => {
        this.policy.set(data);
        this.loading.set(false);
      },
      error: () => {
        this.notification.error(this.transloco.translate('policyDetail.notifications.loadError'));
        this.loading.set(false);
        this.router.navigate(['/policies']);
      },
    });
  }

  toggleJsonLd(): void {
    this.showJsonLd.update((v) => !v);
  }

  deletePolicy(): void {
    const p = this.policy();
    if (!p) return;

    const dialogRef = this.dialog.open(ConfirmDeleteDialogComponent, {
      data: { policyName: p.name },
      width: '400px',
    });

    dialogRef.afterClosed().subscribe((confirmed) => {
      if (confirmed) {
        this.policyService.deletePolicy(p.id).subscribe({
          next: () => {
            this.notification.success(
              this.transloco.translate('policyDetail.notifications.deleteSuccess'),
            );
            this.router.navigate(['/policies']);
          },
          error: () =>
            this.notification.error(
              this.transloco.translate('policyDetail.notifications.deleteError'),
            ),
        });
      }
    });
  }
}
