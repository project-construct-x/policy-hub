import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { TranslocoDirective, TranslocoService } from '@jsverse/transloco';
import { Constraint } from '@shared/types/constraint.model';
import { CONSTRAINT_METADATA } from '@features/policies/builder/metadata/constraint-metadata';

@Component({
  selector: 'app-constraint-card',
  imports: [TranslocoDirective],
  templateUrl: './constraint-card.component.html',
  styleUrl: './constraint-card.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ConstraintCardComponent {
  readonly constraint = input.required<Constraint>();

  private readonly transloco = inject(TranslocoService);

  readonly metadata = computed(() => CONSTRAINT_METADATA[this.constraint().type]);

  readonly summary = computed(() => formatSummary(this.constraint(), this.transloco));

  readonly dids = computed<readonly string[]>(() => {
    const c = this.constraint();
    return c.type === 'PARTICIPANT_DID' && Array.isArray(c.dids) ? c.dids : [];
  });
}

function formatSummary(c: Constraint, transloco: TranslocoService): string {
  switch (c.type) {
    case 'MEMBERSHIP':
      return transloco.translate('constraint.MEMBERSHIP.summary');
    case 'DATE_RANGE': {
      if (!c.startDate && !c.endDate) return '—';
      const start = formatDisplayDate(c.startDate);
      const end = formatDisplayDate(c.endDate);
      return `${start} – ${end}`;
    }
    case 'FRAMEWORK_AGREEMENT':
      return c.agreement;
    case 'PARTICIPANT_DID':
      // Nur die Anzahl als Parameter; die DIDs selbst rendert das Template per Interpolation.
      return transloco.translate('constraint.PARTICIPANT_DID.summary', {
        count: Array.isArray(c.dids) ? c.dids.length : 0,
      });
  }
}

function formatDisplayDate(iso: string): string {
  if (!iso) return '…';
  try {
    return new Intl.DateTimeFormat('de-DE', { dateStyle: 'long' }).format(new Date(iso));
  } catch {
    return iso;
  }
}
