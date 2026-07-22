import { Injectable, inject } from '@angular/core';
import { MatSnackBar, MatSnackBarConfig } from '@angular/material/snack-bar';
import { CxSnackbarComponent, CxSnackbarType } from '@ui/snackbar/cx-snackbar.component';

@Injectable({ providedIn: 'root' })
export class NotificationService {
  private readonly snackBar = inject(MatSnackBar);

  success(message: string): void {
    this.show(message, 'success');
  }

  error(message: string): void {
    this.show(message, 'error');
  }

  info(message: string): void {
    this.show(message, 'info');
  }

  warning(message: string): void {
    this.show(message, 'warning');
  }

  private show(message: string, type: CxSnackbarType): void {
    const config: MatSnackBarConfig = {
      duration: 5000,
      horizontalPosition: 'center',
      verticalPosition: 'top',
      panelClass: [`cx-snackbar-${type}`],
      politeness: type === 'error' || type === 'warning' ? 'assertive' : 'polite',
      data: { message, action: 'OK', type },
    };
    this.snackBar.openFromComponent(CxSnackbarComponent, config);
  }
}
