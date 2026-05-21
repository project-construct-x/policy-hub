import { Component, input } from '@angular/core';

@Component({
  selector: 'app-cx-empty-state',
  templateUrl: './cx-empty-state.component.html',
  styleUrl: './cx-empty-state.component.scss',
})
export class CxEmptyStateComponent {
  icon = input('description');
  title = input.required<string>();
  description = input('');
  hint = input('');
}
