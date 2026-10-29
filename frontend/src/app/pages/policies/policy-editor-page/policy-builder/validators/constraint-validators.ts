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
 * Zerlegt eine Eingabe der Teilnehmer-Liste in einzelne Kandidaten. Getrennt wird an Komma und
 * Leerraum, damit auch mehrere eingefügte DIDs (z.B. eine Zeile pro DID) übernommen werden.
 */
export function splitDidInput(raw: string): string[] {
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

export interface DidPartition {
  /** Gültige, neue DIDs in Eingabereihenfolge. */
  accepted: string[];
  /** Abgelehnte Kandidaten; sie bleiben zur Korrektur im Eingabefeld stehen. */
  rejected: string[];
  /** i18n-Key des ersten Fehlers, `null` wenn alles übernommen wurde. */
  errorKey: string | null;
}

/**
 * Teilt Kandidaten (z.B. aus einer eingefügten Liste) in übernehmbare und abgelehnte auf.
 * Duplikate werden auch innerhalb derselben Eingabe erkannt.
 */
export function partitionDidCandidates(
  candidates: readonly string[],
  existing: readonly string[],
): DidPartition {
  const result: DidPartition = { accepted: [], rejected: [], errorKey: null };
  for (const candidate of candidates) {
    const errorKey = validateDidCandidate(candidate, [...existing, ...result.accepted]);
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
