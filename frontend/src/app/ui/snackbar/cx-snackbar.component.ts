import { Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import {
  MatSnackBarAction,
  MatSnackBarActions,
  MatSnackBarLabel,
  MatSnackBarRef,
} from '@angular/material/snack-bar';

@Component({
  selector: 'app-cx-snackbar',
  imports: [MatButtonModule, MatSnackBarLabel, MatSnackBarActions, MatSnackBarAction],
  template: `
    <span matSnackBarLabel>
      {{ snackBarRef.containerInstance.snackBarConfig.data.message }}
    </span>
    <span matSnackBarActions>
      <button mat-button matSnackBarAction (click)="snackBarRef.dismissWithAction()">
        {{ snackBarRef.containerInstance.snackBarConfig.data.action || 'OK' }}
      </button>
    </span>
  `,
  styles: `
    :host {
      display: flex;
    }
  `,
})
export class CxSnackbarComponent {
  snackBarRef = inject(MatSnackBarRef);
}
