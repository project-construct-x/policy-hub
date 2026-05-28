import { Component, input, output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TranslocoDirective } from '@jsverse/transloco';

@Component({
  selector: 'app-end-date-input',
  imports: [FormsModule, TranslocoDirective],
  template: `
    <div class="end-date-input" *transloco="let t">
      <label class="label" for="end-date">{{ t('policyBuilder.inputs.endDate.label') }}</label>
      <input
        id="end-date"
        type="date"
        [ngModel]="value()"
        (ngModelChange)="valueChange.emit($event)"
        [min]="minDate"
      />
      @if (errorKey()) {
        <p class="error">{{ t(errorKey()!) }}</p>
      }
    </div>
  `,
  styles: [
    `
      .end-date-input {
        display: flex;
        flex-direction: column;
        gap: 4px;
        max-width: 240px;
      }
      .label {
        font-size: 13px;
        font-weight: 500;
        color: var(--cx-text-primary);
      }
      input[type='date'] {
        padding: 8px 10px;
        border: 1px solid var(--cx-border-color);
        border-radius: 6px;
        font-size: 14px;
        font-family: inherit;
      }
      .error {
        color: #b91c1c;
        font-size: 13px;
        margin: 4px 0 0 0;
      }
    `,
  ],
})
export class EndDateInputComponent {
  value = input.required<string>();
  errorKey = input<string | null>(null);
  valueChange = output<string>();

  readonly minDate = new Date().toISOString().slice(0, 10);
}
