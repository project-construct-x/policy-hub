import { Component, inject } from '@angular/core';
import { MatDialogModule, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { TranslocoDirective } from '@jsverse/transloco';

@Component({
  selector: 'app-confirm-delete-dialog',
  imports: [MatDialogModule, MatButtonModule, TranslocoDirective],
  template: `
    <ng-container *transloco="let t">
      <h2 mat-dialog-title>{{ t('deleteDialog.title') }}</h2>
      <mat-dialog-content>
        <p>{{ t('deleteDialog.message', { name: data.policyName }) }}</p>
      </mat-dialog-content>
      <mat-dialog-actions align="end">
        <button mat-stroked-button mat-dialog-close>{{ t('deleteDialog.cancel') }}</button>
        <button mat-flat-button color="warn" [mat-dialog-close]="true">
          {{ t('deleteDialog.confirm') }}
        </button>
      </mat-dialog-actions>
    </ng-container>
  `,
})
export class ConfirmDeleteDialogComponent {
  readonly data = inject<{ policyName: string }>(MAT_DIALOG_DATA);
}
