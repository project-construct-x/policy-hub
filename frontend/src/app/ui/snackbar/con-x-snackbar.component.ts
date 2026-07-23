import { Component, inject } from '@angular/core';
import {
  MAT_SNACK_BAR_DATA,
  MatSnackBarAction,
  MatSnackBarActions,
  MatSnackBarLabel,
  MatSnackBarRef,
} from '@angular/material/snack-bar';
import { TranslocoDirective } from '@jsverse/transloco';
import { ConXButtonComponent } from '@ui/button/con-x-button.component';

export type ConXSnackbarType = 'success' | 'error' | 'info' | 'warning';

export interface ConXSnackbarData {
  message: string;
  action: string;
  type: ConXSnackbarType;
}

const SEVERITY_ICONS: Record<ConXSnackbarType, string> = {
  success: 'check_circle',
  error: 'error',
  warning: 'warning',
  info: 'info',
};

@Component({
  selector: 'app-con-x-snackbar',
  imports: [
    ConXButtonComponent,
    MatSnackBarLabel,
    MatSnackBarActions,
    MatSnackBarAction,
    TranslocoDirective,
  ],
  templateUrl: './con-x-snackbar.component.html',
  styleUrl: './con-x-snackbar.component.scss',
})
export class ConXSnackbarComponent {
  readonly snackBarRef = inject(MatSnackBarRef);
  readonly data = inject<ConXSnackbarData>(MAT_SNACK_BAR_DATA);

  get icon(): string {
    return SEVERITY_ICONS[this.data.type];
  }
}
