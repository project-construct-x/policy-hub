import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { TranslocoDirective, TranslocoService } from '@jsverse/transloco';
import { PolicyService } from '@services/policies/policy.service';
import { NotificationService } from '@services/notification/notification.service';
import { Policy } from '@shared/types/policy.model';
import { keepKnownConstraints } from '@features/policies/builder/metadata/constraint-metadata';
import {
  PolicyBuilderComponent,
  PolicyDraft,
} from './policy-builder/components/policy-builder/policy-builder.component';

@Component({
  selector: 'app-policy-editor-page',
  imports: [TranslocoDirective, PolicyBuilderComponent],
  templateUrl: './policy-editor-page.component.html',
  styleUrl: './policy-editor-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PolicyEditorPageComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly policyService = inject(PolicyService);
  private readonly notification = inject(NotificationService);
  private readonly transloco = inject(TranslocoService);

  isEditMode = signal(false);
  policyId = signal<string | null>(null);
  initialPolicy = signal<Policy | null>(null);
  submitting = signal(false);
  loading = signal(false);

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.isEditMode.set(true);
      this.policyId.set(id);
      this.loading.set(true);
      this.policyService.getPolicyById(id).subscribe({
        next: (p) => {
          // Unbekannte Constraint-Typen entfernen, bevor sie in den Builder gelangen:
          // sie haben keinen Registry-Eintrag und würden beim Rendern der Editor-Card
          // bzw. in der Validierung auf `undefined` zugreifen.
          const constraints = keepKnownConstraints(p.constraints);
          if (constraints.length !== p.constraints.length) {
            this.notification.warning(
              this.transloco.translate('policyEditor.notifications.unknownConstraints'),
            );
          }
          this.initialPolicy.set({ ...p, constraints });
          this.loading.set(false);
        },
        error: () => {
          this.notification.error(this.transloco.translate('policyEditor.notifications.loadError'));
          this.loading.set(false);
          this.router.navigate(['/policies']);
        },
      });
    }
  }

  onSave(draft: PolicyDraft): void {
    this.submitting.set(true);
    if (this.isEditMode()) {
      const id = this.policyId()!;
      this.policyService.updatePolicy(id, draft).subscribe({
        next: () => {
          this.submitting.set(false);
          this.notification.success(
            this.transloco.translate('policyEditor.notifications.updateSuccess'),
          );
          this.router.navigate(['/policies', id]);
        },
        error: () => {
          this.submitting.set(false);
          this.notification.error(
            this.transloco.translate('policyEditor.notifications.updateError'),
          );
        },
      });
    } else {
      this.policyService.createPolicy(draft).subscribe({
        next: (created) => {
          this.submitting.set(false);
          this.notification.success(
            this.transloco.translate('policyEditor.notifications.createSuccess'),
          );
          this.router.navigate(['/policies', created.id]);
        },
        error: () => {
          this.submitting.set(false);
          this.notification.error(
            this.transloco.translate('policyEditor.notifications.createError'),
          );
        },
      });
    }
  }

  onCancel(): void {
    if (this.isEditMode()) {
      this.router.navigate(['/policies', this.policyId()]);
    } else {
      this.router.navigate(['/policies']);
    }
  }
}
