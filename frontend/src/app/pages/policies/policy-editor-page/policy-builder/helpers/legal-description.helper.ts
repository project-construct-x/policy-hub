import { TranslocoService } from '@jsverse/transloco';
import { Constraint } from '@shared/types/constraint.model';
import { Policy } from '@shared/types/policy.model';
import {
  CONSTRAINT_METADATA,
  keepKnownConstraints,
} from '@features/policies/builder/metadata/constraint-metadata';
import {
  FRAMEWORK_AGREEMENT_VALUE,
  USE_CASE_OPTIONS,
} from '@features/policies/builder/metadata/use-case-options.data';

/**
 * Anzeigewert für Constraint-Inhalte, die nicht aus der Metadaten-Registry stammen —
 * etwa weil das Backend einen unbekannten Use-Case oder Rahmenvertrag geliefert hat.
 */
const UNKNOWN_VALUE = '—';

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
  // Constraints mit unbekanntem Typ übergehen: sie haben keinen Eintrag in der
  // Metadaten-Registry, und der Zugriff auf `labelKey`/`legalTextKey` würde werfen.
  // Für den Rechtstext ist Weglassen richtiger als ein Abbruch der ganzen Darstellung.
  const constraints = keepKnownConstraints(policy.constraints);

  if (!constraints.length) {
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

  const clauses = constraints.map((c) => ({
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

/**
 * WICHTIG — warum hier gegen Whitelists geprüft wird statt die Werte direkt zu verwenden:
 *
 * Transloco durchsucht das Ergebnis einer Platzhalter-Ersetzung ERNEUT nach Platzhaltern
 * (`DefaultTranspiler.transpile()` iteriert über den bereits ersetzten String, und
 * `interpolationMatcher` liefert bei jedem Zugriff ein frisches RegExp mit `lastIndex = 0`).
 * Ein Parameterwert, der selbst `{{…}}` enthält, wird dadurch ein zweites Mal aufgelöst:
 * `{{legalDescription.unrestricted}}` schiebt einen fremden Satz in den Rechtstext, und
 * `{{agreement}}` ersetzt sich endlos selbst — die Schleife terminiert nie und der Tab friert ein.
 *
 * Constraint-Werte stammen nicht nur aus der UI (dort sind sie durch Dropdown bzw. Konstante
 * gedeckelt), sondern auch aus `GET /v1/policies/:id`. Ein HTTP-Response ist Eingabe; der
 * `Constraint`-Typ ist nur ein Compile-Zeit-Versprechen. Deshalb: nur Werte weiterreichen,
 * die nachweislich aus der Metadaten-Registry stammen.
 */
function buildClause(c: Constraint, transloco: TranslocoService, lang?: string): string {
  const meta = CONSTRAINT_METADATA[c.type];
  const base = transloco.translate(meta.legalTextKey, undefined, lang);

  switch (c.type) {
    case 'USE_CASE': {
      const labels = c.useCases.map((id) => useCaseLabel(id, transloco, lang));
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
        { agreement: c.agreement === FRAMEWORK_AGREEMENT_VALUE ? c.agreement : UNKNOWN_VALUE },
        lang,
      );
    case 'MEMBERSHIP':
    default:
      return base;
  }
}

/**
 * Übersetzt eine Use-Case-ID über die Registry. Der i18n-Key wird bewusst NICHT aus der ID
 * zusammengesetzt, sondern der Registry entnommen — sonst könnte eine ID aus dem Backend
 * einen beliebigen Key erzeugen (`useCase.<beliebig>`), dessen Auflösung bei fehlendem Key
 * den Key selbst zurückliefert und ihn so in den Rechtstext schreibt.
 */
function useCaseLabel(id: string, transloco: TranslocoService, lang?: string): string {
  const option = USE_CASE_OPTIONS.find((o) => o.id === id);
  return option ? transloco.translate(option.labelKey, undefined, lang) : UNKNOWN_VALUE;
}

function joinList(items: string[]): string {
  if (items.length <= 1) return items.join('');
  return items.slice(0, -1).join(', ') + ' & ' + items[items.length - 1];
}

function formatDate(iso: string): string {
  if (!iso) return UNKNOWN_VALUE;
  // Reine Datumsangaben (YYYY-MM-DD, das Format der DATE_RANGE-Eingabe) direkt formatieren,
  // ohne sie durch `new Date()` in UTC-Mitternacht zu wandeln. Sonst kippt der lokale Tag
  // in Zeitzonen westlich von UTC um einen Tag — beim rechtlich maßgeblichen Text unzulässig.
  const dateOnly = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (dateOnly) {
    const [, year, month, day] = dateOnly;
    return `${day}.${month}.${year}`;
  }
  const d = new Date(iso);
  // Kein Rohwert-Fallback: ein unparsebarer Wert würde sonst ungeprüft als
  // Transloco-Parameter in den Rechtstext gelangen (siehe Hinweis an `buildClause`).
  if (isNaN(d.getTime())) return UNKNOWN_VALUE;
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${day}.${month}.${year}`;
}
