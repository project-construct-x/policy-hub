import { Constraint } from '@shared/types/constraint.model';
import { Policy, POLICY_ID_PREFIX } from '@shared/types/policy.model';
import {
  CONSTRAINT_METADATA,
  isKnownConstraintType,
} from '@features/policies/builder/metadata/constraint-metadata';

export interface ValidationError {
  field: string;
  messageKey: string;
}

/**
 * Zulässiger Zeichensatz der fachlichen Policy-ID: Buchstabe oder Ziffer am Anfang, danach
 * zusätzlich Punkt, Unterstrich und Bindestrich (z.B. `policy.use-case-quality-assurance`).
 *
 * Der Wert wird von `policyToOdrl()` als JSON-LD-`@id` übernommen. `@id` ist dort ein
 * Identifier, keine Beschriftung — eine freie Zeichenkette könnte eine absolute IRI
 * (`https://…/fremde-policy`) oder eine Blank-Node-Referenz (`_:b0`) erzeugen und damit
 * auf eine fremde PolicyDefinition zeigen.
 */
const POLICY_ID_PATTERN = /^[a-zA-Z0-9][a-zA-Z0-9._-]*$/;

/**
 * `did:web`-Identität (W3C did:web Method): Domain, optional ein Port als `%3A<port>`, optional
 * Pfadsegmente getrennt durch `:` (z.B. `did:web:example.com%3A8443:participants:acme`).
 *
 * Der Zeichensatz schließt Komma, Leerraum und `{}` aus. Das ist Absicht: Kommas trennen die
 * DIDs im ODRL-RightOperand (`policyToOdrl()`), und ohne `{}` ist ein geprüfter Wert als
 * Transloco-Parameter im Rechtstext unbedenklich (`legal-description.helper.ts`).
 */
export const DID_WEB_PATTERN =
  /^did:web:[A-Za-z0-9](?:[A-Za-z0-9-]*[A-Za-z0-9])?(?:\.[A-Za-z0-9](?:[A-Za-z0-9-]*[A-Za-z0-9])?)*(?:%3[Aa]\d{1,5})?(?::(?:[A-Za-z0-9._~-]|%[0-9A-Fa-f]{2})+)*$/;

export function isValidDidWeb(value: unknown): value is string {
  return typeof value === 'string' && DID_WEB_PATTERN.test(value);
}

/**
 * Erlaubte Arten eines Teildatensatz-Selektors (`<art>:<bezeichner>`). Im Editor wählt der Nutzer
 * die Art aus einer Liste (`DATA_SUBSET_KIND_OPTIONS`) und tippt nur den Bezeichner.
 */
export const DATA_SUBSET_SELECTOR_KINDS = ['field', 'attribute', 'submodel', 'record'] as const;
export type DataSubsetSelectorKind = (typeof DATA_SUBSET_SELECTOR_KINDS)[number];

/**
 * Bezeichner eines Teildatensatzes, z.B. `materialName` oder
 * `urn:samm:com.example.material:1.0.0#Material`.
 *
 * Wie bei `DID_WEB_PATTERN` schließt der Zeichensatz Komma, Leerraum und `{}` aus: Kommas und
 * Leerraum trennen Einträge bei der Eingabe, und ohne `{}` ist ein geprüfter Wert als
 * Transloco-Parameter im Rechtstext unbedenklich (`legal-description.helper.ts`).
 */
const DATA_SUBSET_IDENTIFIER = '[A-Za-z0-9._~:/#-]+';

/** Vollständiger Selektor `<art>:<bezeichner>`; so wird er gespeichert und ins ODRL übernommen. */
export const DATA_SUBSET_SELECTOR_PATTERN = new RegExp(
  `^(${DATA_SUBSET_SELECTOR_KINDS.join('|')}):(${DATA_SUBSET_IDENTIFIER})$`,
);

export function isValidDataSubsetSelector(value: unknown): value is string {
  return typeof value === 'string' && DATA_SUBSET_SELECTOR_PATTERN.test(value);
}

/**
 * Zerlegt die Eingabe von Teildatensatz-Namen. Anders als bei `splitListInput` wird nur an Komma
 * und Zeilenumbruch getrennt: Ein Leerzeichen im Namen ist ein Tippfehler, der als Fehler
 * angezeigt werden soll, statt stillschweigend zwei Einträge zu erzeugen.
 */
export function splitDataSubsetInput(raw: string): string[] {
  return raw
    .split(/[,\r\n]+/)
    .map((part) => part.trim())
    .filter(Boolean);
}

export function toDataSubsetSelector(kind: DataSubsetSelectorKind, identifier: string): string {
  return `${kind}:${identifier}`;
}

/** Zerlegt einen gültigen Selektor in Art und Bezeichner; `null` bei ungültigem Wert. */
export function parseDataSubsetSelector(
  value: unknown,
): { kind: DataSubsetSelectorKind; identifier: string } | null {
  if (typeof value !== 'string') return null;
  const match = DATA_SUBSET_SELECTOR_PATTERN.exec(value);
  return match ? { kind: match[1] as DataSubsetSelectorKind, identifier: match[2] } : null;
}

/**
 * Zerlegt die Eingabe einer Chip-Liste (Teilnehmer, Teildatensätze) in einzelne Kandidaten.
 * Getrennt wird an Komma und Leerraum, damit auch mehrere eingefügte Werte (z.B. einer pro
 * Zeile) übernommen werden.
 */
export function splitListInput(raw: string): string[] {
  return raw.split(/[\s,]+/).filter(Boolean);
}

/**
 * Vergleichsschlüssel für Duplikate: DIDs, die sich nur in Groß-/Kleinschreibung unterscheiden,
 * gelten als derselbe Teilnehmer. Gespeichert wird weiterhin die Schreibweise der Eingabe.
 */
function didKey(did: string): string {
  return did.toLowerCase();
}

/**
 * Prüft einen einzelnen Kandidaten vor dem Hinzufügen zur Liste. Liefert den i18n-Key des
 * Fehlers oder `null`, wenn der Kandidat übernommen werden darf.
 */
export function validateDidCandidate(
  candidate: string,
  existing: readonly string[],
): string | null {
  if (!isValidDidWeb(candidate)) return 'validation.participantDidInvalid';
  const key = didKey(candidate);
  if (existing.some((did) => didKey(did) === key)) return 'validation.participantDidDuplicate';
  return null;
}

/**
 * Prüft einen einzelnen Teildatensatz-Selektor vor dem Hinzufügen zur Liste. Bezeichner sind
 * case-sensitiv (z.B. Feldnamen), daher werden Duplikate exakt verglichen.
 */
export function validateSelectorCandidate(
  candidate: string,
  existing: readonly string[],
): string | null {
  if (!isValidDataSubsetSelector(candidate)) return 'validation.dataSubsetSelectorInvalid';
  if (existing.includes(candidate)) return 'validation.dataSubsetSelectorDuplicate';
  return null;
}

export interface ListPartition {
  /** Gültige, neue Werte in Eingabereihenfolge. */
  accepted: string[];
  /** Abgelehnte Kandidaten; sie bleiben zur Korrektur im Eingabefeld stehen. */
  rejected: string[];
  /** i18n-Key des ersten Fehlers, `null` wenn alles übernommen wurde. */
  errorKey: string | null;
}

/** Prüft einen Kandidaten gegen die bereits vorhandenen Werte; `null` = übernehmbar. */
export type CandidateValidator = (candidate: string, existing: readonly string[]) => string | null;

/**
 * Teilt Kandidaten (z.B. aus einer eingefügten Liste) in übernehmbare und abgelehnte auf.
 * Duplikate werden auch innerhalb derselben Eingabe erkannt.
 */
export function partitionCandidates(
  candidates: readonly string[],
  existing: readonly string[],
  validate: CandidateValidator,
): ListPartition {
  const result: ListPartition = { accepted: [], rejected: [], errorKey: null };
  for (const candidate of candidates) {
    const errorKey = validate(candidate, [...existing, ...result.accepted]);
    if (errorKey) {
      result.rejected.push(candidate);
      result.errorKey ??= errorKey;
    } else {
      result.accepted.push(candidate);
    }
  }
  return result;
}

export function validatePolicyDraft(draft: Partial<Policy>): ValidationError[] {
  const errors: ValidationError[] = [];

  const id = (draft.policyId ?? '').trim();
  // `draft.policyId` ist die vollständige ID inkl. Präfix; ohne Anteil hinter dem Präfix gilt
  // sie als nicht ausgefüllt.
  if (!id || id === POLICY_ID_PREFIX) {
    errors.push({ field: 'policyId', messageKey: 'validation.policyIdRequired' });
  } else if (!id.startsWith(POLICY_ID_PREFIX)) {
    errors.push({ field: 'policyId', messageKey: 'validation.policyIdPrefixMissing' });
  } else if (id.length > 200) {
    errors.push({ field: 'policyId', messageKey: 'validation.policyIdTooLong' });
  } else if (!POLICY_ID_PATTERN.test(id)) {
    errors.push({ field: 'policyId', messageKey: 'validation.policyIdInvalidChars' });
  }

  if (!draft.category) {
    errors.push({ field: 'category', messageKey: 'validation.categoryRequired' });
  }

  for (const [index, c] of (draft.constraints ?? []).entries()) {
    // Typ zuerst gegen die Registry prüfen: bei einem unbekannten Typ (möglich, weil
    // Constraints auch aus der API stammen) liefert der Index-Zugriff `undefined` und
    // `.allowedIn` würde werfen. Ein unbekannter Typ ist ein Validierungsfehler, kein Absturz.
    if (!isKnownConstraintType(c.type)) {
      errors.push({
        field: `constraint[${index}]`,
        messageKey: 'validation.constraintUnknownType',
      });
      continue;
    }

    // Check category compatibility
    if (draft.category && !CONSTRAINT_METADATA[c.type].allowedIn.includes(draft.category)) {
      errors.push({
        field: `constraint[${index}]`,
        messageKey: 'validation.constraintNotAllowedInCategory',
      });
    }
    errors.push(...validateConstraint(c, index));
  }

  return errors;
}

export function validateConstraint(constraint: Constraint, index = 0): ValidationError[] {
  const errors: ValidationError[] = [];
  const prefix = `constraint[${index}]`;

  switch (constraint.type) {
    case 'DATE_RANGE': {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const start = validateDate(
        constraint.startDate,
        `${prefix}.startDate`,
        'dateRangeStartRequired',
        'dateRangeStartInvalid',
        'dateRangeStartInPast',
        today,
        errors,
      );
      const end = validateDate(
        constraint.endDate,
        `${prefix}.endDate`,
        'dateRangeEndRequired',
        'dateRangeEndInvalid',
        'dateRangeEndInPast',
        today,
        errors,
      );

      // Cross-Field: Start darf nicht nach dem Ende liegen (nur prüfen, wenn beide gültig sind).
      if (start && end && start > end) {
        errors.push({
          field: `${prefix}.endDate`,
          messageKey: 'validation.dateRangeStartAfterEnd',
        });
      }
      break;
    }
    case 'PARTICIPANT_DID': {
      const field = `${prefix}.dids`;
      // `dids` kann aus einem HTTP-Response stammen; der Typ ist nur ein Compile-Zeit-Versprechen.
      const dids: unknown[] = Array.isArray(constraint.dids) ? constraint.dids : [];
      if (!dids.length) {
        errors.push({ field, messageKey: 'validation.participantDidRequired' });
      } else if (!dids.every(isValidDidWeb)) {
        errors.push({ field, messageKey: 'validation.participantDidInvalid' });
      } else if (new Set((dids as string[]).map(didKey)).size !== dids.length) {
        errors.push({ field, messageKey: 'validation.participantDidDuplicate' });
      }
      break;
    }
    case 'DATA_SUBSET': {
      const field = `${prefix}.selectors`;
      // `selectors` kann aus einem HTTP-Response stammen (siehe PARTICIPANT_DID).
      const selectors: unknown[] = Array.isArray(constraint.selectors) ? constraint.selectors : [];
      if (!selectors.length) {
        errors.push({ field, messageKey: 'validation.dataSubsetSelectorRequired' });
      } else if (!selectors.every(isValidDataSubsetSelector)) {
        errors.push({ field, messageKey: 'validation.dataSubsetSelectorInvalid' });
      } else if (new Set(selectors).size !== selectors.length) {
        errors.push({ field, messageKey: 'validation.dataSubsetSelectorDuplicate' });
      }
      break;
    }
    case 'MEMBERSHIP':
    case 'FRAMEWORK_AGREEMENT':
      break;
  }

  return errors;
}

/**
 * Validiert ein einzelnes Pflicht-Datum (required + parsebar + nicht in der Vergangenheit)
 * und hängt gefundene Fehler an `errors`. Gibt bei gültigem Wert das `Date` zurück, sonst `null`
 * (für die anschließende Start-≤-Ende-Prüfung).
 */
function validateDate(
  value: string,
  field: string,
  requiredKey: string,
  invalidKey: string,
  inPastKey: string,
  today: Date,
  errors: ValidationError[],
): Date | null {
  if (!value) {
    errors.push({ field, messageKey: `validation.${requiredKey}` });
    return null;
  }
  const date = new Date(value);
  if (isNaN(date.getTime())) {
    errors.push({ field, messageKey: `validation.${invalidKey}` });
    return null;
  }
  if (date < today) {
    errors.push({ field, messageKey: `validation.${inPastKey}` });
    return null;
  }
  return date;
}
