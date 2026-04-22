import { Component, inject, input } from '@angular/core';
import { TranslocoDirective, TranslocoService } from '@jsverse/transloco';

@Component({
  selector: 'app-json-viewer',
  imports: [TranslocoDirective],
  template: `
    <div class="json-viewer" *transloco="let t">
      <div class="json-header">
        <span class="json-label">{{ t('jsonViewer.label') }}</span>
        <button class="copy-btn" (click)="copyToClipboard()">
          <span class="material-icons">content_copy</span>
        </button>
      </div>
      <pre class="json-content"><code>{{ formattedJson() }}</code></pre>
    </div>
  `,
  styles: `
    .json-viewer {
      border: 1px solid var(--cx-border-color);
      border-radius: 8px;
      overflow: hidden;
    }
    .json-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 8px 16px;
      background: var(--cx-bg-secondary);
      border-bottom: 1px solid var(--cx-border-color);
    }
    .json-label {
      font-family: 'Montserrat', sans-serif;
      font-weight: 600;
      font-size: 12px;
      color: var(--cx-text-secondary);
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .copy-btn {
      background: none;
      border: none;
      cursor: pointer;
      color: var(--cx-text-secondary);
      padding: 4px;
      border-radius: 4px;
      display: flex;
      align-items: center;
    }
    .copy-btn:hover {
      background: var(--cx-border-color);
      color: var(--cx-dark-blue);
    }
    .copy-btn .material-icons {
      font-size: 18px;
    }
    .json-content {
      margin: 0;
      padding: 16px;
      background: #fafbfc;
      font-family: 'Courier New', monospace;
      font-size: 13px;
      line-height: 1.5;
      overflow-x: auto;
      color: var(--cx-text-primary);
    }
  `,
})
export class JsonViewerComponent {
  private readonly transloco = inject(TranslocoService);
  json = input.required<string | null>();

  formattedJson(): string {
    const raw = this.json();
    if (!raw) return this.transloco.translate('jsonViewer.noContent');
    try {
      return JSON.stringify(JSON.parse(raw), null, 2);
    } catch {
      return raw;
    }
  }

  copyToClipboard(): void {
    const raw = this.json();
    if (raw) {
      navigator.clipboard.writeText(raw);
    }
  }
}
