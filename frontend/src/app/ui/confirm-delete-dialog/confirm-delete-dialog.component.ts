import { Component, inject, ViewEncapsulation } from '@angular/core';
import { MatDialogModule, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { TranslocoDirective } from '@jsverse/transloco';
import { ConXButtonComponent } from '@ui/button/con-x-button.component';

@Component({
  selector: 'app-confirm-delete-dialog',
  imports: [MatDialogModule, TranslocoDirective, ConXButtonComponent],
  templateUrl: './confirm-delete-dialog.component.html',
  encapsulation: ViewEncapsulation.None,
})
export class ConfirmDeleteDialogComponent {
  readonly data = inject<{ policyName: string }>(MAT_DIALOG_DATA);
}
