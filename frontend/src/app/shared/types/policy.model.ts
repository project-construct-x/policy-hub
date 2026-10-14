import { Constraint } from './constraint.model';

export type PolicyCategory = 'ACCESS' | 'CONTRACT';

/**
 * Logische Verknüpfung der Constraints einer Policy: `AND` → `odrl:and` (alle müssen zutreffen),
 * `OR` → `odrl:or` (mindestens einer muss zutreffen). Standard ist `AND`.
 *
 * Bewusst nicht "operator" genannt — das ist bereits der Vergleichsoperator eines einzelnen
 * Constraints (`eq`, `gteq`, …).
 */
export type LogicalOperator = 'AND' | 'OR';

export const DEFAULT_LOGICAL_OPERATOR: LogicalOperator = 'AND';

/** Ältere Datensätze bzw. Clients liefern kein `logicalOperator` — sie gelten als `AND`. */
export function logicalOperatorOf(policy: {
  logicalOperator?: LogicalOperator | null;
}): LogicalOperator {
  return policy.logicalOperator === 'OR' ? 'OR' : DEFAULT_LOGICAL_OPERATOR;
}

export interface Policy {
  id: string;
  /** Fachliche Policy-ID (z.B. "policy.use-case-quality-assurance"). */
  policyId: string;
  category: PolicyCategory;
  constraints: Constraint[];
  /** Optional, weil ältere Datensätze ihn nicht haben — fehlt er, gilt `AND` (siehe {@link logicalOperatorOf}). */
  logicalOperator?: LogicalOperator;
  createdAt: string;
  updatedAt: string;
  /**
   * Der beim Speichern übermittelte und unverändert zurückgelieferte Rechtstext
   * (siehe {@link CreatePolicyRequest.legalText}).
   *
   * Optional, weil ältere Datensätze ihn nicht haben. Er ist bewusst Teil des Lesemodells:
   * Ohne ihn ließe sich nicht erkennen, ob der **gespeicherte** — rechtlich maßgebliche —
   * Text noch zu den gespeicherten Constraints passt. Die Detailseite leitet ihre Anzeige
   * aus den Constraints ab; eine Abweichung wäre sonst prinzipiell unsichtbar.
   */
  legalText?: string;
}

export interface CreatePolicyRequest {
  policyId: string;
  category: PolicyCategory;
  constraints: Constraint[];
  logicalOperator: LogicalOperator;
  /**
   * Aus den Constraints erzeugter juristischer Text. Wird vom Frontend mitgeschickt,
   * im Backend persistiert und unverändert wieder ausgeliefert (das Backend erzeugt ihn nicht selbst).
   */
  legalText: string;
}

export type UpdatePolicyRequest = CreatePolicyRequest;
