export type PolicyStatus = 'DRAFT' | 'ACTIVE' | 'ARCHIVED';

export interface Policy {
  id: string;
  name: string;
  description: string;
  status: PolicyStatus;
  useCaseContext: string;
  purpose: string;
  permittedUsage: string;
  restrictions: string;
  content: string | null;
  legalText: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreatePolicyRequest {
  name: string;
  description: string;
  useCaseContext: string;
  purpose: string;
  permittedUsage: string;
  restrictions: string;
  content: string | null;
  legalText: string | null;
}

export interface UpdatePolicyRequest {
  name: string;
  description: string;
  status: PolicyStatus;
  useCaseContext: string;
  purpose: string;
  permittedUsage: string;
  restrictions: string;
  content: string | null;
  legalText: string | null;
}
