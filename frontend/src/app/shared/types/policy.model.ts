export type PolicyStatus = 'DRAFT' | 'ACTIVE' | 'ARCHIVED';

export interface Policy {
  id: string;
  name: string;
  description: string;
  status: PolicyStatus;
  content: string | null;
  legalText: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreatePolicyRequest {
  name: string;
  description: string;
  content: string | null;
  legalText: string | null;
}

export interface UpdatePolicyRequest {
  name: string;
  description: string;
  status: PolicyStatus;
  content: string | null;
  legalText: string | null;
}
