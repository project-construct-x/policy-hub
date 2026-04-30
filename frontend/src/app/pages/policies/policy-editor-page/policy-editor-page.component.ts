import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { TranslocoDirective, TranslocoService } from '@jsverse/transloco';
import { PolicyService } from '@services/policies/policy.service';
import { NotificationService } from '@services/notification/notification.service';
import { PolicyStatus } from '@shared/types/policy.model';

@Component({
  selector: 'app-policy-editor-page',
  imports: [CommonModule, ReactiveFormsModule, TranslocoDirective],
  templateUrl: './policy-editor-page.component.html',
  styleUrl: './policy-editor-page.component.scss',
})
export class PolicyEditorPageComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly policyService = inject(PolicyService);
  private readonly notification = inject(NotificationService);
  private readonly transloco = inject(TranslocoService);

  isEditMode = signal(false);
  loading = signal(false);
  saving = signal(false);
  policyId = signal<string | null>(null);
  currentStep = signal(0);

  steps = ['grundlagen', 'useCase', 'nutzung', 'pruefen'] as const;

  useCaseOptions = [
    'Qualitätssicherung Bau',
    'Planung und Koordination',
    'Baustellenlogistik',
    'Arbeitssicherheit',
    'Datenfreigabe extern',
  ];

  form = this.fb.group({
    name: ['', [Validators.required, Validators.maxLength(255)]],
    description: ['', [Validators.maxLength(2000)]],
    useCaseContext: ['', [Validators.required]],
    purpose: ['', [Validators.maxLength(2000)]],
    permittedUsage: ['', [Validators.maxLength(2000)]],
    restrictions: ['', [Validators.maxLength(2000)]],
    legalText: [''],
    status: ['DRAFT' as PolicyStatus],
  });

  canProceed = computed(() => {
    const step = this.currentStep();
    if (step === 0) {
      const name = this.form.get('name');
      const ctx = this.form.get('useCaseContext');
      return name?.valid && ctx?.valid;
    }
    return true;
  });

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.isEditMode.set(true);
      this.policyId.set(id);
      this.loadPolicy(id);
    }
  }

  private loadPolicy(id: string): void {
    this.loading.set(true);
    this.policyService.getById(id).subscribe({
      next: (policy) => {
        this.form.patchValue({
          name: policy.name,
          description: policy.description,
          useCaseContext: policy.useCaseContext,
          purpose: policy.purpose,
          permittedUsage: policy.permittedUsage,
          restrictions: policy.restrictions,
          legalText: policy.legalText ?? '',
          status: policy.status,
        });
        this.loading.set(false);
      },
      error: () => {
        this.notification.error(this.transloco.translate('policyEditor.notifications.loadError'));
        this.router.navigate(['/policies']);
      },
    });
  }

  nextStep(): void {
    if (this.currentStep() < 3) {
      this.currentStep.update((s) => s + 1);
    }
  }

  prevStep(): void {
    if (this.currentStep() > 0) {
      this.currentStep.update((s) => s - 1);
    }
  }

  goToStep(index: number): void {
    this.currentStep.set(index);
  }

  skipToReview(): void {
    this.currentStep.set(3);
  }

  save(): void {
    if (this.form.get('name')?.invalid) {
      this.currentStep.set(0);
      this.form.markAllAsTouched();
      return;
    }

    this.saving.set(true);
    const v = this.form.getRawValue();
    const legalText = v.legalText?.trim() || null;

    if (this.isEditMode()) {
      this.policyService
        .update(this.policyId()!, {
          name: v.name!,
          description: v.description ?? '',
          status: v.status!,
          useCaseContext: v.useCaseContext ?? '',
          purpose: v.purpose ?? '',
          permittedUsage: v.permittedUsage ?? '',
          restrictions: v.restrictions ?? '',
          content: null,
          legalText,
        })
        .subscribe({
          next: (updated) => {
            this.saving.set(false);
            this.notification.success(
              this.transloco.translate('policyEditor.notifications.saveSuccess'),
            );
            this.router.navigate(['/policies', updated.id]);
          },
          error: () => {
            this.saving.set(false);
            this.notification.error(
              this.transloco.translate('policyEditor.notifications.saveError'),
            );
          },
        });
    } else {
      this.policyService
        .create({
          name: v.name!,
          description: v.description ?? '',
          useCaseContext: v.useCaseContext ?? '',
          purpose: v.purpose ?? '',
          permittedUsage: v.permittedUsage ?? '',
          restrictions: v.restrictions ?? '',
          content: null,
          legalText,
        })
        .subscribe({
          next: (created) => {
            this.saving.set(false);
            this.notification.success(
              this.transloco.translate('policyEditor.notifications.createSuccess'),
            );
            this.router.navigate(['/policies', created.id]);
          },
          error: () => {
            this.saving.set(false);
            this.notification.error(
              this.transloco.translate('policyEditor.notifications.createError'),
            );
          },
        });
    }
  }

  cancel(): void {
    if (this.isEditMode()) {
      this.router.navigate(['/policies', this.policyId()]);
    } else {
      this.router.navigate(['/policies']);
    }
  }
}
