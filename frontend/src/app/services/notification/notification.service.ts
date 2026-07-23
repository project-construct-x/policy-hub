import { Injectable, inject } from '@angular/core';
import { MatSnackBar, MatSnackBarConfig } from '@angular/material/snack-bar';
import { ConXSnackbarComponent, ConXSnackbarType } from '@ui/snackbar/con-x-snackbar.component';

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

  private show(message: string, type: ConXSnackbarType): void {
    const config: MatSnackBarConfig = {
      duration: 5000,
      horizontalPosition: 'center',
      verticalPosition: 'top',
      panelClass: [`con-x-snackbar-${type}`],
      politeness: type === 'error' || type === 'warning' ? 'assertive' : 'polite',
      data: { message, action: 'OK', type },
    };
    this.snackBar.openFromComponent(ConXSnackbarComponent, config);
  }
}
