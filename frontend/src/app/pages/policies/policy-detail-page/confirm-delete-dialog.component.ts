import { Component, inject } from '@angular/core';
import { MatDialogModule, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { TranslocoDirective } from '@jsverse/transloco';
import { CxButtonComponent } from '@ui/button/cx-button.component';

@Component({
  selector: 'app-confirm-delete-dialog',
  imports: [MatDialogModule, TranslocoDirective, CxButtonComponent],
  template: `
    <ng-container *transloco="let t">
      <h2 mat-dialog-title>{{ t('deleteDialog.title') }}</h2>
      <mat-dialog-content>
        <p>{{ t('deleteDialog.message', { name: data.policyName }) }}</p>
      </mat-dialog-content>
      <mat-dialog-actions align="end">
        <button cx-button variant="outlined" color="neutral" mat-dialog-close>
          {{ t('deleteDialog.cancel') }}
        </button>
        <button cx-button color="danger" [mat-dialog-close]="true">
          {{ t('deleteDialog.confirm') }}
        </button>
      </mat-dialog-actions>
    </ng-container>
  `,
})
export class ConfirmDeleteDialogComponent {
  readonly data = inject<{ policyName: string }>(MAT_DIALOG_DATA);
}
