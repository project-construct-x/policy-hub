import { TranslocoService } from '@jsverse/transloco';
import { alwaysApplies, Constraint } from '@shared/types/constraint.model';
import { logicalOperatorOf, Policy } from '@shared/types/policy.model';
import {
  CONSTRAINT_METADATA,
  keepKnownConstraints,
  orderConstraints,
} from '@features/policies/builder/metadata/constraint-metadata';
import { FRAMEWORK_AGREEMENT_VALUE } from '@features/policies/builder/metadata/framework-agreement.data';
import { dataSubsetKindOption } from '@features/policies/builder/metadata/data-subset.data';
import {
  isValidDidWeb,
  parseDataSubsetSelector,
} from '@features/policies/builder/validators/constraint-validators';

/**
 * Anzeigewert für Constraint-Inhalte, die nicht aus der Metadaten-Registry stammen —
 * etwa weil das Backend einen unbekannten Rahmenvertrag geliefert hat.
 */
const UNKNOWN_VALUE = '—';

export interface LegalClause {
  /** Anzeigename des Constraints (Metadaten-Label), dient als Überschrift des Unterpunkts. */
  title: string;
  /** Juristischer Beschreibungssatz des Constraints. */
  text: string;
}

export interface LegalSection {
  intro: string;
  clauses: LegalClause[];
}

export interface LegalClauses {
  /**
   * Einleitungssatz (abhängig von Kategorie und Verknüpfung, bzw. der "unrestricted"-Text ohne
   * Bedingungen).
   */
  intro: string;
  /** Je Constraint eine eigenständige Klausel (Titel + Text); leer ohne Bedingungen. */
  clauses: LegalClause[];
  /**
   * Immer geltende Constraints (z.B. Teildatensatz), sofern es daneben Voraussetzungen gibt.
   * Eigener Abschnitt, damit sie bei ODER nicht unter "mindestens eine der folgenden
   * Voraussetzungen" fallen. Ohne weitere Voraussetzungen stehen sie in `clauses`.
   */
  additional: LegalSection | null;
}

/**
 * Zerlegt eine Policy in ihren juristischen Einleitungssatz und je Constraint eine eigenständige
 * Klausel. Grundlage für die Listendarstellung (ein Unterpunkt pro Bedingung) und für den
 * gespeicherten Text.
 *
 * Bei ODER-Verknüpfung und mehr als einer Bedingung lautet der Einleitungssatz "mindestens eine
 * der folgenden Voraussetzungen". Bei nur einer Bedingung sind UND und ODER gleichbedeutend; dann
 * bleibt es beim gewohnten Einleitungssatz.
 *
 * Immer geltende Constraints (`alwaysApplies()`) zählen nicht als Voraussetzung: Gibt es daneben
 * weitere Constraints, stehen sie in `additional` mit eigenem Einleitungssatz.
 *
 * Mit `lang` kann eine feste Sprache erzwungen werden (z.B. 'de' für den zu speichernden Text,
 * unabhängig von der aktiven UI-Sprache). Ohne `lang` wird die aktuell aktive Sprache verwendet.
 */
export function buildLegalClauses(
  policy: Pick<Policy, 'category' | 'constraints' | 'logicalOperator'>,
  transloco: TranslocoService,
  lang?: string,
): LegalClauses {
  // Constraints mit unbekanntem Typ übergehen: sie haben keinen Eintrag in der
  // Metadaten-Registry, und der Zugriff auf `labelKey`/`legalTextKey` würde werfen.
  // Für den Rechtstext ist Weglassen richtiger als ein Abbruch der ganzen Darstellung.
  const constraints = orderConstraints(keepKnownConstraints(policy.constraints));

  if (!constraints.length) {
    return {
      intro: transloco.translate('legalDescription.unrestricted', undefined, lang),
      clauses: [],
      additional: null,
    };
  }

  const toClause = (c: Constraint): LegalClause => ({
    title: transloco.translate(CONSTRAINT_METADATA[c.type].labelKey, undefined, lang),
    text: buildClause(c, transloco, lang),
  });

  const conditions = constraints.filter((c) => !alwaysApplies(c));
  const restrictions = constraints.filter((c) => alwaysApplies(c));

  if (!conditions.length) {
    return {
      intro: transloco.translate(introKey(policy.category, false), undefined, lang),
      clauses: restrictions.map(toClause),
      additional: null,
    };
  }

  const anyOf = logicalOperatorOf(policy) === 'OR' && conditions.length > 1;
  return {
    intro: transloco.translate(introKey(policy.category, anyOf), undefined, lang),
    clauses: conditions.map(toClause),
    additional: restrictions.length
      ? {
          intro: transloco.translate('legalDescription.introAlwaysApplies', undefined, lang),
          clauses: restrictions.map(toClause),
        }
      : null,
  };
}

/**
 * Erzeugt aus den Constraints einer Policy den zu speichernden juristischen Text als nummerierte
 * Liste: Einleitungssatz, danach je Bedingung ein nummerierter Unterpunkt aus Überschrift
 * (`1. <Name>`) und darunter dem Beschreibungstext. Ohne Bedingungen wird nur der
 * "unrestricted"-Einleitungstext geliefert.
 *
 * Ein Abschnitt `additional` folgt mit eigenem Einleitungssatz; die Nummerierung läuft weiter.
 *
 * Rückgabe bleibt ein String (Backend-Vertrag `legalText`); die Nummerierung ist locale-neutral.
 */
export function buildLegalDescription(
  policy: Pick<Policy, 'category' | 'constraints' | 'logicalOperator'>,
  transloco: TranslocoService,
  lang?: string,
): string {
  const { intro, clauses, additional } = buildLegalClauses(policy, transloco, lang);
  if (!clauses.length) {
    return intro;
  }
  const list = (items: LegalClause[], offset: number) =>
    items.map((clause, i) => `${offset + i + 1}. ${clause.title}\n${clause.text}`).join('\n\n');
  const text = `${intro}\n\n${list(clauses, 0)}`;
  return additional
    ? `${text}\n\n${additional.intro}\n\n${list(additional.clauses, clauses.length)}`
    : text;
}

/**
 * Prüft, ob der **gespeicherte** Rechtstext einer Policy noch zu ihren gespeicherten
 * Constraints passt.
 *
 * Rechtlich maßgeblich ist der Text, der beim Speichern übermittelt und persistiert wurde
 * (`CreatePolicyRequest.legalText`) — angezeigt wird auf der Detailseite dagegen eine bei
 * jedem Aufruf neu aus den Constraints abgeleitete Fassung. Solange beides über diese UI
 * entsteht, ist es identisch; bei einem anderen Client, nachträglich geänderten Daten oder
 * einer angepassten Ableitungslogik läuft es auseinander, ohne dass es jemandem auffällt.
 *
 * Verglichen wird gegen die deutsche Fassung, weil `legalText` genau so erzeugt wird
 * (siehe `PolicyBuilderComponent.submit`) — unabhängig von der aktiven UI-Sprache.
 *
 * Ohne gespeicherten Text (ältere Datensätze) gibt es nichts zu vergleichen: `false`.
 */
export function hasDivergingLegalText(
  policy: Pick<Policy, 'category' | 'constraints' | 'logicalOperator' | 'legalText'>,
  transloco: TranslocoService,
): boolean {
  if (policy.legalText === undefined || policy.legalText === null) return false;
  return policy.legalText !== buildLegalDescription(policy, transloco, 'de');
}

/** Transloco-Keys bewusst ausgeschrieben statt zusammengesetzt (i18n-Regel: keine dynamischen Keys). */
function introKey(category: Policy['category'], anyOf: boolean): string {
  if (category === 'ACCESS') {
    return anyOf ? 'legalDescription.introAccessAnyOf' : 'legalDescription.introAccess';
  }
  return anyOf ? 'legalDescription.introContractAnyOf' : 'legalDescription.introContract';
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
    case 'PARTICIPANT_DID':
      // Die DIDs sind Freitext und lassen sich nicht gegen eine Registry prüfen. Stattdessen
      // gilt das strikte Format aus `DID_WEB_PATTERN` (kein `{}`), sonst `UNKNOWN_VALUE`.
      return transloco.translate(
        'legalDescription.clause.participantDid',
        { dids: formatDids(c.dids) },
        lang,
      );
    case 'DATA_SUBSET':
      // Namen sind Freitext wie bei PARTICIPANT_DID: nur Werte im strikten Selektor-Format
      // (kein `{}`), die Art wird über die Registry übersetzt.
      return transloco.translate(
        'legalDescription.clause.dataSubset',
        { selectors: formatSelectors(c.selectors, transloco, lang) },
        lang,
      );
    case 'MEMBERSHIP':
    default:
      return base;
  }
}

/** z.B. `Feld „materialName“, Submodell „urn:…#Part“`; bei einem ungültigen Eintrag `UNKNOWN_VALUE`. */
function formatSelectors(selectors: unknown, transloco: TranslocoService, lang?: string): string {
  if (!Array.isArray(selectors) || !selectors.length) return UNKNOWN_VALUE;
  const items: string[] = [];
  for (const selector of selectors) {
    const parsed = parseDataSubsetSelector(selector);
    if (!parsed) return UNKNOWN_VALUE;
    const kind = transloco.translate(dataSubsetKindOption(parsed.kind).labelKey, undefined, lang);
    items.push(
      transloco.translate(
        'legalDescription.dataSubsetItem',
        { kind, identifier: parsed.identifier },
        lang,
      ),
    );
  }
  return items.join(', ');
}

function formatDids(dids: unknown): string {
  if (!Array.isArray(dids) || !dids.length || !dids.every(isValidDidWeb)) return UNKNOWN_VALUE;
  return dids.join(', ');
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
