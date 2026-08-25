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
import { OdrlPolicyDefinition } from '@services/policies/policy-mapper/policy-odrl.mapper';
import {
  buildLegalClauses,
  hasDivergingLegalText,
} from '@features/policies/builder/helpers/legal-description.helper';
import { keepKnownConstraints } from '@features/policies/builder/metadata/constraint-metadata';
import { httpErrorMessageKey } from '@services/http/http-error.helper';

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

  readonly odrl = signal<OdrlPolicyDefinition | null>(null);
  readonly odrlLoading = signal(false);
  readonly odrlError = signal(false);
  private odrlRequested = false;

  readonly odrlJson = computed(() => {
    const o = this.odrl();
    return o ? JSON.stringify(o, null, 2) : '';
  });

  readonly legalDescription = computed(() => {
    // Abhängigkeit auf die aktive Sprache: Anzeige folgt dem UI-Sprachwechsel (z.B. Englisch).
    this.activeLang();
    const p = this.policy();
    if (!p) return { intro: '', clauses: [] };
    return buildLegalClauses(p, this.transloco);
  });

  /** Der gespeicherte, rechtlich maßgebliche Text — nicht die abgeleitete Anzeigefassung. */
  readonly storedLegalText = computed(() => this.policy()?.legalText ?? null);

  /** Siehe {@link hasDivergingLegalText}: warnt, wenn gespeichert ≠ abgeleitet. */
  readonly legalTextDiverges = computed(() => {
    const p = this.policy();
    return p ? hasDivergingLegalText(p, this.transloco) : false;
  });

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      this.router.navigate(['/policies']);
      return;
    }
    this.policyService.getPolicyById(id).subscribe({
      next: (data) => {
        this.policy.set(this.withKnownConstraintsOnly(data));
        this.loading.set(false);
      },
      error: (err: unknown) => {
        this.notification.error(
          this.transloco.translate(
            httpErrorMessageKey(err, 'policyDetail.notifications.loadError'),
          ),
        );
        this.loading.set(false);
        this.router.navigate(['/policies']);
      },
    });
  }

  /**
   * Verwirft Constraints, deren Typ die Metadaten-Registry nicht kennt, und weist den
   * Nutzer darauf hin. Ohne diesen Filter würde `app-constraint-card` beim Rendern auf
   * `undefined` zugreifen und die gesamte Detailseite mit einem TypeError abbrechen.
   */
  private withKnownConstraintsOnly(policy: Policy): Policy {
    const constraints = keepKnownConstraints(policy.constraints);
    if (constraints.length !== policy.constraints.length) {
      this.notification.warning(
        this.transloco.translate('policyDetail.notifications.unknownConstraints'),
      );
    }
    return { ...policy, constraints };
  }

  /**
   * Lädt das ODRL lazy — erst beim ersten Öffnen des Panels (`(opened)`), nicht beim Laden der
   * Seite. Im Mock-Modus fängt MirageJS diesen Request ab und liefert `policyToOdrl()`, gegen
   * ein echtes Backend liefert dessen eigener Java-Mapper das Ergebnis (siehe `PolicyService.
   * getPolicyOdrl()`). `force` überspringt den Once-Guard für den Retry-Button.
   */
  loadOdrl(force = false): void {
    if (this.odrlRequested && !force) return;
    this.odrlRequested = true;

    const p = this.policy();
    if (!p) return;

    this.odrlLoading.set(true);
    this.odrlError.set(false);
    this.policyService.getPolicyOdrl(p.id).subscribe({
      next: (data) => {
        this.odrl.set(data);
        this.odrlLoading.set(false);
      },
      error: (err: unknown) => {
        this.odrlLoading.set(false);
        this.odrlError.set(true);
        this.notification.error(
          this.transloco.translate(
            httpErrorMessageKey(err, 'policyDetail.notifications.odrlLoadError'),
          ),
        );
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
          error: (err: unknown) =>
            this.notification.error(
              this.transloco.translate(
                httpErrorMessageKey(err, 'policyDetail.notifications.deleteError'),
              ),
            ),
        });
      }
    });
  }
}
