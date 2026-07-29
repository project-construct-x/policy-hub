import { Component, input } from '@angular/core';

/** Heading level for the empty-state title, so it fits the surrounding outline. */
export type ConXHeadingLevel = 'h1' | 'h2' | 'h3' | 'h4';

@Component({
  selector: 'app-con-x-empty-state',
  templateUrl: './con-x-empty-state.component.html',
  styleUrl: './con-x-empty-state.component.scss',
})
export class ConXEmptyStateComponent {
  icon = input('description');
  title = input.required<string>();
  description = input('');
  hint = input('');
  headingLevel = input<ConXHeadingLevel>('h2');
}
