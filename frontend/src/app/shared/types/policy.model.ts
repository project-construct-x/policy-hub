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
}

export interface CreatePolicyRequest {
  policyId: string;
  category: PolicyCategory;
  constraints: Constraint[];
}

export type UpdatePolicyRequest = CreatePolicyRequest;
