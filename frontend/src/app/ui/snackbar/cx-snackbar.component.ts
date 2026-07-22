import { Component, inject } from '@angular/core';
import {
  MAT_SNACK_BAR_DATA,
  MatSnackBarAction,
  MatSnackBarActions,
  MatSnackBarLabel,
  MatSnackBarRef,
} from '@angular/material/snack-bar';
import { TranslocoDirective } from '@jsverse/transloco';
import { CxButtonComponent } from '@ui/button/cx-button.component';

export type CxSnackbarType = 'success' | 'error' | 'info' | 'warning';

export interface CxSnackbarData {
  message: string;
  action: string;
  type: CxSnackbarType;
}

const SEVERITY_ICONS: Record<CxSnackbarType, string> = {
  success: 'check_circle',
  error: 'error',
  warning: 'warning',
  info: 'info',
};

@Component({
  selector: 'app-cx-snackbar',
  imports: [
    CxButtonComponent,
    MatSnackBarLabel,
    MatSnackBarActions,
    MatSnackBarAction,
    TranslocoDirective,
  ],
  templateUrl: './cx-snackbar.component.html',
  styleUrl: './cx-snackbar.component.scss',
})
export class CxSnackbarComponent {
  readonly snackBarRef = inject(MatSnackBarRef);
  readonly data = inject<CxSnackbarData>(MAT_SNACK_BAR_DATA);

  get icon(): string {
    return SEVERITY_ICONS[this.data.type];
  }
}
