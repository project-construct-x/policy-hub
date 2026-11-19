import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { TranslocoDirective, TranslocoService } from '@jsverse/transloco';
import { Constraint } from '@shared/types/constraint.model';
import { CONSTRAINT_METADATA } from '@features/policies/builder/metadata/constraint-metadata';
import { dataSubsetKindOption } from '@features/policies/builder/metadata/data-subset.data';
import {
  credentialOperatorOption,
  knownPropertyDisplayValues,
  knownPropertyOf,
  knownPropertyOperator,
} from '@features/policies/builder/metadata/credential-attribute.data';
import { credentialValueKind, CredentialRule } from '@shared/types/constraint.model';
import { parseDataSubsetSelector } from '@features/policies/builder/validators/constraint-validators';

interface ChipList {
  /**
   * `kindKey`: i18n-Key der Art (nur Teildatensätze), wird vor dem Text angezeigt.
   * `plain`: fachlicher Text (bekannte Credential-Merkmale) in der Fließtextschrift statt monospace.
   */
  items: { kindKey: string | null; text: string; plain?: boolean }[];
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
    const constraint = this.constraint();
    if (
      constraint.type === 'PARTICIPANT_DID' &&
      Array.isArray(constraint.dids) &&
      constraint.dids.length
    ) {
      const items = constraint.dids.map((did) => ({ kindKey: null, text: did }));
      return { items, labelKey: 'a11y.participantDid.list', cy: 'cc-dids' };
    }
    if (
      constraint.type === 'DATA_SUBSET' &&
      Array.isArray(constraint.selectors) &&
      constraint.selectors.length
    ) {
      const items = constraint.selectors.map((selector) => {
        const parsed = parseDataSubsetSelector(selector);
        return parsed
          ? { kindKey: dataSubsetKindOption(parsed.kind).labelKey, text: parsed.identifier }
          : { kindKey: null, text: selector };
      });
      return { items, labelKey: 'a11y.dataSubset.list', cy: 'cc-selectors' };
    }
    if (
      constraint.type === 'CREDENTIAL_ATTRIBUTE' &&
      Array.isArray(constraint.rules) &&
      constraint.rules.length
    ) {
      const items = constraint.rules.map((rule) => {
        const known = formatKnownCredentialRule(rule, this.transloco);
        return known
          ? { kindKey: null, text: known, plain: true }
          : { kindKey: null, text: formatCredentialRule(rule, this.transloco) };
      });
      return { items, labelKey: 'a11y.credentialRules.list', cy: 'cc-credential-rules' };
    }
    return null;
  });
}

/**
 * Kurzform einer Regel für die Chips, z.B. `SiteAccessCredential · accessLevel ≥ 4` — für Expertenregeln; bekannte Merkmale siehe `formatKnownCredentialRule`.
 * Wird per Interpolation gerendert (kein Transloco-Parameter), daher ist Freitext hier unbedenklich.
 */
function formatCredentialRule(rule: CredentialRule, transloco: TranslocoService): string {
  // Expertenregel: Kurzname des Credentials (letztes Segment der Typ-IRI) statt der ganzen IRI.
  const credential = String(rule.credentialType).split('/').pop();
  const option = credentialOperatorOption(rule.operator);
  if (!option) return `${credential} · ${rule.attributePath}`;
  const value =
    credentialValueKind(option.operator) === 'list'
      ? (Array.isArray(rule.values) ? rule.values : []).join(', ')
      : rule.value;
  return `${credential} · ${rule.attributePath} ${transloco.translate(option.symbolKey)} ${value}`;
}

/** z.B. `Arbeitspakete: mind. eines von 7, 8`; `null`, wenn die Regel kein bekanntes Merkmal ist. */
function formatKnownCredentialRule(
  rule: CredentialRule,
  transloco: TranslocoService,
): string | null {
  const property = knownPropertyOf(rule);
  const operator = property && knownPropertyOperator(property, rule.operator);
  const displayValues = property && knownPropertyDisplayValues(property, rule.values);
  if (!operator || !displayValues) return null;
  const values = displayValues
    .map((item) => ('labelKey' in item ? transloco.translate(item.labelKey) : item.text))
    .join(', ');
  return transloco.translate(operator.summaryKey, { values });
}

function formatSummary(constraint: Constraint, transloco: TranslocoService): string {
  switch (constraint.type) {
    case 'DATE_RANGE': {
      if (!constraint.startDate && !constraint.endDate) return '—';
      const start = formatDisplayDate(constraint.startDate);
      const end = formatDisplayDate(constraint.endDate);
      return `${start} – ${end}`;
    }
    case 'PARTICIPANT_DID':
      // Nur die Anzahl als Parameter; die DIDs selbst rendert das Template per Interpolation.
      return transloco.translate('constraint.PARTICIPANT_DID.summary', {
        count: Array.isArray(constraint.dids) ? constraint.dids.length : 0,
      });
    case 'DATA_SUBSET':
      return transloco.translate('constraint.DATA_SUBSET.summary', {
        count: Array.isArray(constraint.selectors) ? constraint.selectors.length : 0,
      });
    case 'CREDENTIAL_ATTRIBUTE':
      return transloco.translate('constraint.CREDENTIAL_ATTRIBUTE.summary', {
        count: Array.isArray(constraint.rules) ? constraint.rules.length : 0,
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
