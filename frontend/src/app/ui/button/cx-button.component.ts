import { Component, ViewEncapsulation, input } from '@angular/core';

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
}
