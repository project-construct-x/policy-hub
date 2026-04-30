import { Component, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { TranslocoDirective, TranslocoService } from '@jsverse/transloco';
import { PolicyService } from '@services/policies/policy.service';
import { NotificationService } from '@services/notification/notification.service';
import { Policy } from '@shared/types/policy.model';
import { ConfirmDeleteDialogComponent } from './confirm-delete-dialog.component';

@Component({
  selector: 'app-policy-detail-page',
  imports: [RouterLink, MatDialogModule, TranslocoDirective],
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
    const date = new Date(iso);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const oneDay = 24 * 60 * 60 * 1000;

    if (diff < oneDay && date.getDate() === now.getDate()) {
      return `heute, ${date.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })}`;
    }
    if (diff < 2 * oneDay) {
      return `gestern, ${date.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })}`;
    }
    return date.toLocaleDateString('de-DE', { day: 'numeric', month: 'long', year: 'numeric' });
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
