import { Component, input } from '@angular/core';

/** Heading level for the empty-state title, so it fits the surrounding outline. */
export type CxHeadingLevel = 'h1' | 'h2' | 'h3' | 'h4';

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
  headingLevel = input<CxHeadingLevel>('h2');
}
