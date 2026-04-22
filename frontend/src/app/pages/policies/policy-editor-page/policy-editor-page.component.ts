import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { TranslocoDirective, TranslocoService } from '@jsverse/transloco';
import { PolicyService } from '@services/policies/policy.service';
import { NotificationService } from '@services/notification/notification.service';
import { Policy, PolicyStatus } from '@shared/types/policy.model';

@Component({
  selector: 'app-policy-editor-page',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterLink,
    MatButtonModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatProgressSpinnerModule,
    TranslocoDirective,
  ],
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

  statuses: { value: PolicyStatus }[] = [
    { value: 'DRAFT' },
    { value: 'ACTIVE' },
    { value: 'ARCHIVED' },
  ];

  form = this.fb.group({
    name: ['', [Validators.required, Validators.maxLength(255)]],
    description: ['', [Validators.maxLength(2000)]],
    status: ['DRAFT' as PolicyStatus],
    content: [''],
    legalText: [''],
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
          status: policy.status,
          content: policy.content ?? '',
          legalText: policy.legalText ?? '',
        });
        this.loading.set(false);
      },
      error: () => {
        this.notification.error(this.transloco.translate('policyEditor.notifications.loadError'));
        this.router.navigate(['/policies']);
      },
    });
  }

  save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.saving.set(true);
    const formValue = this.form.getRawValue();
    const content = formValue.content?.trim() || null;
    const legalText = formValue.legalText?.trim() || null;

    if (this.isEditMode()) {
      this.policyService
        .update(this.policyId()!, {
          name: formValue.name!,
          description: formValue.description ?? '',
          status: formValue.status!,
          content,
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
          name: formValue.name!,
          description: formValue.description ?? '',
          content,
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
