import { Constraint } from './constraint.model';

export type PolicyCategory = 'ACCESS' | 'CONTRACT';

export type PolicyType =
  | 'ALWAYS_TRUE'
  | 'MEMBERSHIP_STATIC'
  | 'USE_CASE_MEMBERSHIP'
  | 'END_DATE'
  | 'FRAMEWORK_AGREEMENT';

export interface Policy {
  id: string;
  name: string;
  description: string;
  category: PolicyCategory;
  type: PolicyType;
  constraints: Constraint[];
  createdAt: string;
  updatedAt: string;
}

export interface CreatePolicyRequest {
  name: string;
  description: string;
  category: PolicyCategory;
  type: PolicyType;
  constraints: Constraint[];
}

export interface UpdatePolicyRequest {
  name: string;
  description: string;
  category: PolicyCategory;
  type: PolicyType;
  constraints: Constraint[];
}
