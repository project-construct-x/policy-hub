import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { TranslocoDirective, TranslocoService } from '@jsverse/transloco';
import { Constraint } from '@shared/types/constraint.model';
import { CONSTRAINT_METADATA } from '@features/policies/builder/metadata/constraint-metadata';
import { dataSubsetKindOption } from '@features/policies/builder/metadata/data-subset.data';
import { parseDataSubsetSelector } from '@features/policies/builder/validators/constraint-validators';

interface ChipList {
  /** `kindKey`: i18n-Key der Art (nur Teildatensätze), wird vor dem Text angezeigt. */
  items: { kindKey: string | null; text: string }[];
  labelKey: string;
  cy: string;
}

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

  /** Listenwerte (DIDs bzw. Teildatensätze), die als Chips unter der Zusammenfassung erscheinen. */
  readonly list = computed<ChipList | null>(() => {
    const c = this.constraint();
    if (c.type === 'PARTICIPANT_DID' && Array.isArray(c.dids) && c.dids.length) {
      const items = c.dids.map((did) => ({ kindKey: null, text: did }));
      return { items, labelKey: 'a11y.participantDid.list', cy: 'cc-dids' };
    }
    if (c.type === 'DATA_SUBSET' && Array.isArray(c.selectors) && c.selectors.length) {
      const items = c.selectors.map((selector) => {
        const parsed = parseDataSubsetSelector(selector);
        return parsed
          ? { kindKey: dataSubsetKindOption(parsed.kind).labelKey, text: parsed.identifier }
          : { kindKey: null, text: selector };
      });
      return { items, labelKey: 'a11y.dataSubset.list', cy: 'cc-selectors' };
    }
    return null;
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
    case 'DATA_SUBSET':
      return transloco.translate('constraint.DATA_SUBSET.summary', {
        count: Array.isArray(c.selectors) ? c.selectors.length : 0,
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
