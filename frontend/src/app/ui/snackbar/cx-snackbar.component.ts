import { Component, inject } from '@angular/core';
import {
  MatSnackBarAction,
  MatSnackBarActions,
  MatSnackBarLabel,
  MatSnackBarRef,
} from '@angular/material/snack-bar';
import { CxButtonComponent } from '@ui/button/cx-button.component';

@Component({
  selector: 'app-cx-snackbar',
  imports: [CxButtonComponent, MatSnackBarLabel, MatSnackBarActions, MatSnackBarAction],
  template: `
    <span matSnackBarLabel>
      {{ snackBarRef.containerInstance.snackBarConfig.data.message }}
    </span>
    <span matSnackBarActions>
      <button cx-button variant="text" matSnackBarAction (click)="snackBarRef.dismissWithAction()">
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
