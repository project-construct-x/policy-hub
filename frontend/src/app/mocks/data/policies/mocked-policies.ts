import { Policy, PolicyCategory, CreatePolicyRequest, UpdatePolicyRequest } from '@shared/types/policy.model';
import { Constraint } from '@shared/types/constraint.model';
import { FRAMEWORK_AGREEMENT_VALUE } from '@features/policies/builder/metadata/use-case-options.data';
import { BehaviorSubject } from 'rxjs';

export type PolicyMockMode = 'empty' | 'few' | 'many';

const policyMockMode$ = new BehaviorSubject<PolicyMockMode>(
  (localStorage.getItem('mock-policy-mode') as PolicyMockMode) || 'few',
);

export function getPolicyMockMode$() {
  return policyMockMode$.asObservable();
}

export function getCurrentPolicyMockMode(): PolicyMockMode {
  return policyMockMode$.value;
}

export function setPolicyMockMode(mode: PolicyMockMode): void {
  localStorage.setItem('mock-policy-mode', mode);
  policyMockMode$.next(mode);
}

let policies: Policy[] = [];
let nextIdCounter = 100;

function buildPolicy(policy: Policy): Policy {
  return policy;
}

function generatePolicies(mode: PolicyMockMode): Policy[] {
  switch (mode) {
    case 'empty':
      return [];
    case 'few':
      return [
        buildPolicy({
          id: '00000000-0000-0000-0000-000000000001',
          policyId: 'oeffentlicher-zugriff-projektdokumentation',
          category: 'ACCESS',
          constraints: [],
          legalText: 'aus den Constraints einer Policy erzeugter juristischen Beschreibungstext...',
          createdAt: '2026-03-15T10:30:00Z',
          updatedAt: '2026-04-29T09:40:00Z',
        }),
        buildPolicy({
          id: '00000000-0000-0000-0000-000000000002',
          policyId: 'zugriff-konsortium-mitglieder',
          category: 'ACCESS',
          constraints: [{ type: 'MEMBERSHIP', value: 'active' }],
          legalText: 'aus den Constraints einer Policy erzeugter juristischen Beschreibungstext...',
          createdAt: '2026-04-10T08:00:00Z',
          updatedAt: '2026-04-28T16:10:00Z',
        }),
        buildPolicy({
          id: '00000000-0000-0000-0000-000000000003',
          policyId: 'baustellendaten-qualitaetspruefung',
          category: 'CONTRACT',
          constraints: [
            {
              type: 'USE_CASE',
              useCases: ['UC.quality-assurance', 'UC.material-testing'],
            },
          ],
          legalText: 'aus den Constraints einer Policy erzeugter juristischen Beschreibungstext...',
          createdAt: '2026-02-20T14:00:00Z',
          updatedAt: '2026-04-24T11:30:00Z',
        }),
        buildPolicy({
          id: '00000000-0000-0000-0000-000000000004',
          policyId: 'geodaten-bis-2027',
          category: 'CONTRACT',
          constraints: [
            { type: 'MEMBERSHIP', value: 'active' },
            { type: 'END_DATE', endDate: '2027-12-31' },
          ],
          legalText: 'aus den Constraints einer Policy erzeugter juristischen Beschreibungstext...',
          createdAt: '2026-02-05T13:15:00Z',
          updatedAt: '2026-04-02T10:00:00Z',
        }),
        buildPolicy({
          id: '00000000-0000-0000-0000-000000000005',
          policyId: 'datenaustausch-deg-rahmenvertrag',
          category: 'CONTRACT',
          constraints: [{ type: 'FRAMEWORK_AGREEMENT', agreement: FRAMEWORK_AGREEMENT_VALUE }],
          legalText: 'aus den Constraints einer Policy erzeugter juristischen Beschreibungstext...',
          createdAt: '2026-01-20T11:00:00Z',
          updatedAt: '2026-04-21T09:30:00Z',
        }),
        buildPolicy({
          id: '00000000-0000-0000-0000-000000000006',
          policyId: 'bim-koordination-q2-2027',
          category: 'CONTRACT',
          constraints: [
            { type: 'MEMBERSHIP', value: 'active' },
            { type: 'FRAMEWORK_AGREEMENT', agreement: FRAMEWORK_AGREEMENT_VALUE },
            { type: 'END_DATE', endDate: '2027-06-30' },
          ],
          legalText: 'aus den Constraints einer Policy erzeugter juristischen Beschreibungstext...',
          createdAt: '2026-04-15T16:00:00Z',
          updatedAt: '2026-04-15T16:00:00Z',
        }),
        buildPolicy({
          id: '00000000-0000-0000-0000-000000000007',
          policyId: 'materialpruefberichte-mitglieder',
          category: 'ACCESS',
          constraints: [
            { type: 'MEMBERSHIP', value: 'active' },
            {
              type: 'USE_CASE',
              useCases: ['UC.quality-assurance', 'UC.material-testing'],
            },
          ],
          legalText: 'aus den Constraints einer Policy erzeugter juristischen Beschreibungstext...',
          createdAt: '2026-03-01T09:00:00Z',
          updatedAt: '2026-04-20T14:30:00Z',
        }),
      ];
    case 'many':
      return [
        ...generatePolicies('few'),
        buildPolicy({
          id: '00000000-0000-0000-0000-000000000008',
          policyId: 'baustellendoku-alle-bedingungen',
          category: 'CONTRACT',
          constraints: [
            { type: 'MEMBERSHIP', value: 'active' },
            { type: 'USE_CASE', useCases: ['UC.site-documentation', 'UC.bim-coordination'] },
            { type: 'FRAMEWORK_AGREEMENT', agreement: FRAMEWORK_AGREEMENT_VALUE },
            { type: 'END_DATE', endDate: '2028-03-31' },
          ],
          legalText: 'aus den Constraints einer Policy erzeugter juristischen Beschreibungstext...',
          createdAt: '2026-03-01T09:00:00Z',
          updatedAt: '2026-04-20T14:30:00Z',
        }),
        buildPolicy({
          id: '00000000-0000-0000-0000-000000000009',
          policyId: 'geodaten-rahmenvertrag-mitglied',
          category: 'ACCESS',
          constraints: [
            { type: 'MEMBERSHIP', value: 'active' },
            { type: 'FRAMEWORK_AGREEMENT', agreement: FRAMEWORK_AGREEMENT_VALUE },
          ],
          legalText: 'aus den Constraints einer Policy erzeugter juristischen Beschreibungstext...',
          createdAt: '2026-01-15T13:00:00Z',
          updatedAt: '2026-03-30T09:15:00Z',
        }),
        buildPolicy({
          id: '00000000-0000-0000-0000-000000000010',
          policyId: 'qualitaetssicherung-befristet-2027',
          category: 'CONTRACT',
          constraints: [
            { type: 'USE_CASE', useCases: ['UC.quality-assurance'] },
            { type: 'END_DATE', endDate: '2027-12-31' },
          ],
          legalText: 'aus den Constraints einer Policy erzeugter juristischen Beschreibungstext...',
          createdAt: '2026-02-15T10:00:00Z',
          updatedAt: '2026-04-18T08:45:00Z',
        }),
      ];
  }
}

export function initializePolicies(): void {
  policies = generatePolicies(getCurrentPolicyMockMode());
}

export function getMockedPolicies(): Policy[] {
  if (policies.length === 0 && getCurrentPolicyMockMode() !== 'empty') {
    initializePolicies();
  }
  return [...policies];
}

export function getMockedPolicyById(id: string): Policy | undefined {
  if (policies.length === 0 && getCurrentPolicyMockMode() !== 'empty') {
    initializePolicies();
  }
  return policies.find((p) => p.id === id);
}

export function createMockedPolicy(data: CreatePolicyRequest): Policy {
  if (policies.length === 0 && getCurrentPolicyMockMode() !== 'empty') {
    initializePolicies();
  }

  const now = new Date().toISOString();

  const newPolicy: Policy = {
    id: `generated-${nextIdCounter++}`,
    policyId: data.policyId,
    category: data.category,
    constraints: data.constraints ?? [],
    legalText: data.legalText,
    createdAt: now,
    updatedAt: now,
  };

  policies = [newPolicy, ...policies];
  return newPolicy;
}

export function updateMockedPolicy(
  id: string,
  data: UpdatePolicyRequest,
): Policy | undefined {
  if (policies.length === 0 && getCurrentPolicyMockMode() !== 'empty') {
    initializePolicies();
  }

  const index = policies.findIndex((p) => p.id === id);
  if (index === -1) return undefined;

  const updated: Policy = {
    ...policies[index],
    policyId: data.policyId,
    category: data.category,
    constraints: data.constraints ?? [],
    legalText: data.legalText,
    updatedAt: new Date().toISOString(),
  };

  policies[index] = updated;
  return updated;
}

export function deleteMockedPolicy(id: string): boolean {
  if (policies.length === 0 && getCurrentPolicyMockMode() !== 'empty') {
    initializePolicies();
  }
  const before = policies.length;
  policies = policies.filter((p) => p.id !== id);
  return policies.length < before;
}

// Re-initialize when mock mode changes
policyMockMode$.subscribe(() => {
  initializePolicies();
});
