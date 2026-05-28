import { Component, input, output } from '@angular/core';
import { TranslocoDirective } from '@jsverse/transloco';
import { USE_CASE_OPTIONS } from '@features/policies/builder/metadata/use-case-options.data';

@Component({
  selector: 'app-use-case-input',
  imports: [TranslocoDirective],
  template: `
    <div class="use-case-input" *transloco="let t">
      <p class="hint">{{ t('policyBuilder.inputs.useCase.hint') }}</p>
      <div class="options">
        @for (opt of options; track opt.id) {
          <label class="option">
            <input
              type="checkbox"
              [checked]="isChecked(opt.id)"
              (change)="toggle(opt.id, $any($event.target).checked)"
            />
            <span>{{ t(opt.labelKey) }}</span>
          </label>
        }
      </div>
      @if (errorKey()) {
        <p class="error">{{ t(errorKey()!) }}</p>
      }
    </div>
  `,
  styles: [
    `
      .use-case-input {
        display: flex;
        flex-direction: column;
        gap: 8px;
      }
      .hint {
        margin: 0;
        font-size: 13px;
        color: var(--cx-text-secondary);
      }
      .options {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
        gap: 8px;
      }
      .option {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 10px 12px;
        border: 1px solid var(--cx-border-color);
        border-radius: 6px;
        cursor: pointer;
        background: #fff;
        font-size: 14px;
      }
      .option:has(input:checked) {
        border-color: var(--cx-orange, #f97316);
        background: #fff7ed;
      }
      .error {
        color: #b91c1c;
        font-size: 13px;
        margin: 4px 0 0 0;
      }
    `,
  ],
})
export class UseCaseInputComponent {
  selected = input.required<string[]>();
  errorKey = input<string | null>(null);
  selectedChange = output<string[]>();

  readonly options = USE_CASE_OPTIONS;

  isChecked(id: string): boolean {
    return this.selected().includes(id);
  }

  toggle(id: string, checked: boolean): void {
    const current = this.selected();
    if (checked) {
      if (!current.includes(id)) {
        this.selectedChange.emit([...current, id]);
      }
    } else {
      this.selectedChange.emit(current.filter((v) => v !== id));
    }
  }
}
