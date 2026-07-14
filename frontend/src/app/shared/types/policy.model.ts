import { Constraint } from './constraint.model';

export type PolicyCategory = 'ACCESS' | 'CONTRACT';

export interface Policy {
  id: string;
  /** Fachliche Policy-ID (z.B. "policy.use-case-quality-assurance"). */
  policyId: string;
  category: PolicyCategory;
  constraints: Constraint[];
  /**
   * Aus Kategorie und Constraints erzeugter juristischer Text.
   * Wird vom Backend unverändert persistiert und zurückgeliefert.
   */
  legalText: string;
  createdAt: string;
  updatedAt: string;
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
