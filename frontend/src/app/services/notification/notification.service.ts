import { Injectable, inject } from '@angular/core';
import { MatSnackBar, MatSnackBarConfig } from '@angular/material/snack-bar';
import { CxSnackbarComponent } from '@ui/snackbar/cx-snackbar.component';

@Injectable({ providedIn: 'root' })
export class NotificationService {
  private readonly snackBar = inject(MatSnackBar);

  success(message: string): void {
    this.show(message, 'cx-snackbar-success');
  }

  error(message: string): void {
    this.show(message, 'cx-snackbar-error');
  }

  info(message: string): void {
    this.show(message, 'cx-snackbar-info');
  }

  warning(message: string): void {
    this.show(message, 'cx-snackbar-warning');
  }

  private show(message: string, panelClass: string): void {
    const config: MatSnackBarConfig = {
      duration: 5000,
      horizontalPosition: 'center',
      verticalPosition: 'top',
      panelClass: [panelClass],
      data: { message, action: 'OK' },
    };
    this.snackBar.openFromComponent(CxSnackbarComponent, config);
  }
}
