import { TranslocoService } from '@jsverse/transloco';
import { Constraint } from '@shared/types/constraint.model';
import { Policy } from '@shared/types/policy.model';
import { CONSTRAINT_METADATA } from '@features/policies/builder/metadata/constraint-metadata';

/**
 * Erzeugt aus den Constraints einer Policy einen zusammenhängenden juristischen
 * Beschreibungstext. Jede Bedingung wird in einen Satz gewandelt; alle Sätze
 * werden zu einem lesbaren Absatz verknüpft.
 *
 * Mit `lang` kann eine feste Sprache erzwungen werden (z.B. 'de' für den zu
 * speichernden Text, unabhängig von der aktiven UI-Sprache). Ohne `lang` wird
 * die aktuell aktive Sprache verwendet (für die Anzeige).
 */
export function buildLegalDescription(
  policy: Pick<Policy, 'category' | 'constraints'>,
  transloco: TranslocoService,
  lang?: string,
): string {
  if (!policy.constraints.length) {
    return transloco.translate('legalDescription.unrestricted', undefined, lang);
  }

  const intro = transloco.translate(
    policy.category === 'ACCESS'
      ? 'legalDescription.introAccess'
      : 'legalDescription.introContract',
    undefined,
    lang,
  );

  const clauses = policy.constraints.map((c) => buildClause(c, transloco, lang));
  const body = joinClauses(clauses, transloco, lang);

  return `${intro} ${body}`;
}

function buildClause(c: Constraint, transloco: TranslocoService, lang?: string): string {
  const meta = CONSTRAINT_METADATA[c.type];
  const base = transloco.translate(meta.legalTextKey, undefined, lang);

  switch (c.type) {
    case 'USE_CASE': {
      const labels = c.useCases.map((id) => {
        const key = `useCase.${id.replace(/^UC\./, '')}`;
        return transloco.translate(key, undefined, lang);
      });
      return transloco.translate(
        'legalDescription.clause.useCase',
        { list: joinList(labels) },
        lang,
      );
    }
    case 'END_DATE':
      return transloco.translate(
        'legalDescription.clause.endDate',
        { date: formatDate(c.endDate) },
        lang,
      );
    case 'FRAMEWORK_AGREEMENT':
      return transloco.translate(
        'legalDescription.clause.frameworkAgreement',
        { agreement: c.agreement },
        lang,
      );
    case 'MEMBERSHIP':
    default:
      return base;
  }
}

function joinClauses(clauses: string[], transloco: TranslocoService, lang?: string): string {
  if (clauses.length === 1) return clauses[0];
  const separator = ` ${transloco.translate('legalDescription.and', undefined, lang)} `;
  return clauses.join(separator);
}

function joinList(items: string[]): string {
  if (items.length <= 1) return items.join('');
  return items.slice(0, -1).join(', ') + ' & ' + items[items.length - 1];
}

function formatDate(iso: string): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${day}.${month}.${year}`;
}
