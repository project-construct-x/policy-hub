import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { TranslocoDirective, TranslocoService } from '@jsverse/transloco';
import { PolicyService } from '@services/policies/policy.service';
import { NotificationService } from '@services/notification/notification.service';
import { Policy } from '@shared/types/policy.model';
import { StatusBadgeComponent } from '@ui/status-badge/status-badge.component';
import { JsonViewerComponent } from '@ui/json-viewer/json-viewer.component';
import { ConfirmDeleteDialogComponent } from './confirm-delete-dialog.component';

@Component({
  selector: 'app-policy-detail-page',
  imports: [
    CommonModule,
    RouterLink,
    MatButtonModule,
    MatCardModule,
    MatProgressSpinnerModule,
    MatDialogModule,
    TranslocoDirective,
    StatusBadgeComponent,
    JsonViewerComponent,
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

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      this.router.navigate(['/policies']);
      return;
    }
    this.policyService.getById(id).subscribe({
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

  formatDate(iso: string): string {
    return new Date(iso).toLocaleDateString('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
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
        this.policyService.delete(p.id).subscribe({
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
