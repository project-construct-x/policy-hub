import { Constraint } from './constraint.model';

export type PolicyCategory = 'ACCESS' | 'CONTRACT';

export interface Policy {
  id: string;
  /** Fachliche Policy-ID (z.B. "policy.use-case-quality-assurance"). */
  policyId: string;
  category: PolicyCategory;
  constraints: Constraint[];
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
  /**
   * Aus den Constraints erzeugter juristischer Text. Wird vom Frontend mitgeschickt,
   * im Backend persistiert und unverändert wieder ausgeliefert (das Backend erzeugt ihn nicht selbst).
   */
  legalText: string;
}

export type UpdatePolicyRequest = CreatePolicyRequest;
