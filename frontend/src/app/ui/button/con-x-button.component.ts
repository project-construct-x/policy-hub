import {
  afterNextRender,
  Component,
  ElementRef,
  inject,
  isDevMode,
  ViewEncapsulation,
  input,
} from '@angular/core';

@Component({
  selector: 'button[con-x-button], a[con-x-button]',
  templateUrl: './con-x-button.component.html',
  styleUrl: './con-x-button.component.scss',
  encapsulation: ViewEncapsulation.None,
  host: {
    class: 'con-x-btn',
    '[class.con-x-btn--filled]': 'variant() === "filled"',
    '[class.con-x-btn--outlined]': 'variant() === "outlined"',
    '[class.con-x-btn--text]': 'variant() === "text"',
    '[class.con-x-btn--icon-only]': 'variant() === "icon"',
    '[class.con-x-btn--neutral]': 'color() === "neutral"',
    '[class.con-x-btn--danger]': 'color() === "danger"',
  },
})
export class ConXButtonComponent {
  variant = input<'filled' | 'outlined' | 'text' | 'icon'>('filled');
  color = input<'primary' | 'neutral' | 'danger'>('primary');

  constructor() {
    // Dev-only guard: icon-only buttons carry no visible text, so they must
    // provide an accessible name via aria-label/aria-labelledby/title.
    if (isDevMode()) {
      const host = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
      afterNextRender(() => {
        if (this.variant() !== 'icon') return;
        const hasName =
          host.hasAttribute('aria-label') ||
          host.hasAttribute('aria-labelledby') ||
          host.hasAttribute('title');
        if (!hasName) {
          console.warn('[con-x-button] Icon-only button is missing an accessible name:', host);
        }
      });
    }
  }
}
