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
  templateUrl: './cx-snackbar.component.html',
  styleUrl: './cx-snackbar.component.scss',
})
export class CxSnackbarComponent {
  snackBarRef = inject(MatSnackBarRef);
}
