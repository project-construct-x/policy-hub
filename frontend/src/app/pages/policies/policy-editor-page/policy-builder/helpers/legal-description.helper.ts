import { TranslocoService } from '@jsverse/transloco';
import { Constraint } from '@shared/types/constraint.model';
import { Policy } from '@shared/types/policy.model';
import { CONSTRAINT_METADATA } from '@features/policies/builder/metadata/constraint-metadata';

export interface LegalClause {
  /** Anzeigename des Constraints (Metadaten-Label), dient als Überschrift des Unterpunkts. */
  title: string;
  /** Juristischer Beschreibungssatz des Constraints. */
  text: string;
}

export interface LegalClauses {
  /** Einleitungssatz (kategorieabhängig, bzw. der "unrestricted"-Text ohne Bedingungen). */
  intro: string;
  /** Je Constraint eine eigenständige Klausel (Titel + Text); leer ohne Bedingungen. */
  clauses: LegalClause[];
}

/**
 * Zerlegt eine Policy in ihren juristischen Einleitungssatz und je Constraint eine eigenständige
 * Klausel. Grundlage für die Listendarstellung (ein Unterpunkt pro Bedingung) und für den
 * gespeicherten Text.
 *
 * Mit `lang` kann eine feste Sprache erzwungen werden (z.B. 'de' für den zu speichernden Text,
 * unabhängig von der aktiven UI-Sprache). Ohne `lang` wird die aktuell aktive Sprache verwendet.
 */
export function buildLegalClauses(
  policy: Pick<Policy, 'category' | 'constraints'>,
  transloco: TranslocoService,
  lang?: string,
): LegalClauses {
  if (!policy.constraints.length) {
    return {
      intro: transloco.translate('legalDescription.unrestricted', undefined, lang),
      clauses: [],
    };
  }

  const intro = transloco.translate(
    policy.category === 'ACCESS'
      ? 'legalDescription.introAccess'
      : 'legalDescription.introContract',
    undefined,
    lang,
  );

  const clauses = policy.constraints.map((c) => ({
    title: transloco.translate(CONSTRAINT_METADATA[c.type].labelKey, undefined, lang),
    text: buildClause(c, transloco, lang),
  }));

  return { intro, clauses };
}

/**
 * Erzeugt aus den Constraints einer Policy den zu speichernden juristischen Text als nummerierte
 * Liste: Einleitungssatz, danach je Bedingung ein nummerierter Unterpunkt aus Überschrift
 * (`1. <Name>`) und darunter dem Beschreibungstext. Ohne Bedingungen wird nur der
 * "unrestricted"-Einleitungstext geliefert.
 *
 * Rückgabe bleibt ein String (Backend-Vertrag `legalText`); die Nummerierung ist locale-neutral.
 */
export function buildLegalDescription(
  policy: Pick<Policy, 'category' | 'constraints'>,
  transloco: TranslocoService,
  lang?: string,
): string {
  const { intro, clauses } = buildLegalClauses(policy, transloco, lang);
  if (!clauses.length) {
    return intro;
  }
  const list = clauses.map((clause, i) => `${i + 1}. ${clause.title}\n${clause.text}`).join('\n\n');
  return `${intro}\n\n${list}`;
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
    case 'DATE_RANGE':
      return transloco.translate(
        'legalDescription.clause.dateRange',
        { start: formatDate(c.startDate), end: formatDate(c.endDate) },
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

function joinList(items: string[]): string {
  if (items.length <= 1) return items.join('');
  return items.slice(0, -1).join(', ') + ' & ' + items[items.length - 1];
}

function formatDate(iso: string): string {
  if (!iso) return '—';
  // Reine Datumsangaben (YYYY-MM-DD, das Format der DATE_RANGE-Eingabe) direkt formatieren,
  // ohne sie durch `new Date()` in UTC-Mitternacht zu wandeln. Sonst kippt der lokale Tag
  // in Zeitzonen westlich von UTC um einen Tag — beim rechtlich maßgeblichen Text unzulässig.
  const dateOnly = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (dateOnly) {
    const [, year, month, day] = dateOnly;
    return `${day}.${month}.${year}`;
  }
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${day}.${month}.${year}`;
}
