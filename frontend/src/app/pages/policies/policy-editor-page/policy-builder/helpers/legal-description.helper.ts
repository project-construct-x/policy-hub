import { TranslocoService } from '@jsverse/transloco';
import { Constraint } from '@shared/types/constraint.model';
import { Policy } from '@shared/types/policy.model';
import { CONSTRAINT_METADATA } from '@features/policies/builder/metadata/constraint-metadata';

/**
 * Erzeugt aus den Constraints einer Policy einen zusammenhängenden juristischen
 * Beschreibungstext. Jede Bedingung wird in einen Satz gewandelt; alle Sätze
 * werden zu einem lesbaren Absatz verknüpft.
 */
export function buildLegalDescription(policy: Policy, transloco: TranslocoService): string {
  if (!policy.constraints.length) {
    return transloco.translate('legalDescription.unrestricted');
  }

  const intro = transloco.translate(
    policy.category === 'ACCESS'
      ? 'legalDescription.introAccess'
      : 'legalDescription.introContract',
  );

  const clauses = policy.constraints.map((c) => buildClause(c, transloco));
  const body = joinClauses(clauses, transloco);

  return `${intro} ${body}`;
}

function buildClause(c: Constraint, transloco: TranslocoService): string {
  const meta = CONSTRAINT_METADATA[c.type];
  const base = transloco.translate(meta.legalTextKey);

  switch (c.type) {
    case 'USE_CASE': {
      const labels = c.useCases.map((id) => {
        const key = `useCase.${id.replace(/^UC\./, '')}`;
        return transloco.translate(key);
      });
      return transloco.translate('legalDescription.clause.useCase', { list: joinList(labels) });
    }
    case 'END_DATE':
      return transloco.translate('legalDescription.clause.endDate', {
        date: formatDate(c.endDate),
      });
    case 'FRAMEWORK_AGREEMENT':
      return transloco.translate('legalDescription.clause.frameworkAgreement', {
        agreement: c.agreement,
      });
    case 'MEMBERSHIP':
    default:
      return base;
  }
}

function joinClauses(clauses: string[], transloco: TranslocoService): string {
  if (clauses.length === 1) return clauses[0];
  const separator = ` ${transloco.translate('legalDescription.and')} `;
  return clauses.join(separator);
}

function joinList(items: string[]): string {
  if (items.length <= 1) return items.join('');
  return items.slice(0, -1).join(', ') + ' & ' + items[items.length - 1];
}

function formatDate(iso: string): string {
  if (!iso) return '—';
  try {
    return new Intl.DateTimeFormat('de-DE', { dateStyle: 'long' }).format(new Date(iso));
  } catch {
    return iso;
  }
}
