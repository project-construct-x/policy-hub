import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatIconModule } from '@angular/material/icon';
import { TranslocoDirective, TranslocoService } from '@jsverse/transloco';
import { PolicyService } from '@services/policies/policy.service';
import { NotificationService } from '@services/notification/notification.service';
import { Policy } from '@shared/types/policy.model';
import { RelativeDatePipe } from '@shared/pipes/relative-date.pipe';
import { ConXButtonComponent } from '@ui/button/con-x-button.component';
import { ConXCategoryBadgeComponent } from '@ui/category-badge/con-x-category-badge.component';
import { ConfirmDeleteDialogComponent } from '@ui/confirm-delete-dialog/confirm-delete-dialog.component';
import { ConstraintCardComponent } from '@features/policies/builder/components/constraint-card/constraint-card.component';
import { policyToOdrl } from '@services/policies/policy-mapper/policy-odrl.mapper';
import { buildLegalDescription } from '@features/policies/builder/helpers/legal-description.helper';

@Component({
  selector: 'app-policy-detail-page',
  imports: [
    RouterLink,
    MatDialogModule,
    MatExpansionModule,
    MatIconModule,
    TranslocoDirective,
    RelativeDatePipe,
    ConXButtonComponent,
    ConXCategoryBadgeComponent,
    ConstraintCardComponent,
  ],
  templateUrl: './policy-detail-page.component.html',
  styleUrl: './policy-detail-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PolicyDetailPageComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly policyService = inject(PolicyService);
  private readonly notification = inject(NotificationService);
  private readonly dialog = inject(MatDialog);
  private readonly transloco = inject(TranslocoService);

  readonly policy = signal<Policy | null>(null);
  readonly loading = signal(true);

  /** Aktive UI-Sprache als Signal – sorgt dafür, dass die Anzeige bei Sprachwechsel neu berechnet wird. */
  private readonly activeLang = toSignal(this.transloco.langChanges$, {
    initialValue: this.transloco.getActiveLang(),
  });

  readonly odrlJson = computed(() => {
    const p = this.policy();
    if (!p) return '';
    return JSON.stringify(policyToOdrl(p), null, 2);
  });

  readonly legalDescription = computed(() => {
    // Abhängigkeit auf die aktive Sprache: Anzeige folgt dem UI-Sprachwechsel (z.B. Englisch).
    this.activeLang();
    const p = this.policy();
    if (!p) return '';
    return buildLegalDescription(p, this.transloco);
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

  deletePolicy(): void {
    const p = this.policy();
    if (!p) return;

    const dialogRef = this.dialog.open(ConfirmDeleteDialogComponent, {
      data: { policyName: p.policyId },
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
