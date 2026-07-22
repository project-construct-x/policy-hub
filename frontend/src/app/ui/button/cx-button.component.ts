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
  selector: 'button[cx-button], a[cx-button]',
  templateUrl: './cx-button.component.html',
  styleUrl: './cx-button.component.scss',
  encapsulation: ViewEncapsulation.None,
  host: {
    class: 'cx-btn',
    '[class.cx-btn--filled]': 'variant() === "filled"',
    '[class.cx-btn--outlined]': 'variant() === "outlined"',
    '[class.cx-btn--text]': 'variant() === "text"',
    '[class.cx-btn--icon-only]': 'variant() === "icon"',
    '[class.cx-btn--neutral]': 'color() === "neutral"',
    '[class.cx-btn--danger]': 'color() === "danger"',
  },
})
export class CxButtonComponent {
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
          console.warn('[cx-button] Icon-only button is missing an accessible name:', host);
        }
      });
    }
  }
}
