import { Policy, PolicyCategory, PolicyType } from '@shared/types/policy.model';
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

function buildPolicy(params: {
  id: string;
  name: string;
  description: string;
  category: PolicyCategory;
  type: PolicyType;
  constraints: Constraint[];
  createdAt: string;
  updatedAt: string;
}): Policy {
  return { ...params };
}

function generatePolicies(mode: PolicyMockMode): Policy[] {
  switch (mode) {
    case 'empty':
      return [];
    case 'few':
      return [
        buildPolicy({
          id: '00000000-0000-0000-0000-000000000001',
          name: 'Öffentlicher Zugriff auf Projektdokumentation',
          description:
            'Erlaubt den uneingeschränkten Zugriff auf die öffentlich freigegebene Projektdokumentation.',
          category: 'ACCESS',
          type: 'ALWAYS_TRUE',
          constraints: [],
          createdAt: '2026-03-15T10:30:00Z',
          updatedAt: '2026-04-29T09:40:00Z',
        }),
        buildPolicy({
          id: '00000000-0000-0000-0000-000000000002',
          name: 'Zugriff nur für Konsortium-Mitglieder',
          description:
            'Schränkt den Zugriff auf aktive Dataspace-Mitglieder des Construct-X-Konsortiums ein.',
          category: 'ACCESS',
          type: 'MEMBERSHIP_STATIC',
          constraints: [{ type: 'MEMBERSHIP', value: 'active' }],
          createdAt: '2026-04-10T08:00:00Z',
          updatedAt: '2026-04-28T16:10:00Z',
        }),
        buildPolicy({
          id: '00000000-0000-0000-0000-000000000003',
          name: 'Baustellendaten für Qualitätsprüfungen',
          description:
            'Erlaubt die Nutzung der Baustellendaten ausschließlich im Anwendungsfall Qualitätssicherung.',
          category: 'CONTRACT',
          type: 'USE_CASE_MEMBERSHIP',
          constraints: [
            {
              type: 'USE_CASE',
              useCases: ['UC.quality-assurance', 'UC.material-testing'],
            },
          ],
          createdAt: '2026-02-20T14:00:00Z',
          updatedAt: '2026-04-24T11:30:00Z',
        }),
        buildPolicy({
          id: '00000000-0000-0000-0000-000000000004',
          name: 'Geodaten bis Projektende 2027',
          description: 'Erlaubt die Nutzung der Geodaten bis zum Projektabschluss am 31.12.2027.',
          category: 'CONTRACT',
          type: 'END_DATE',
          constraints: [{ type: 'END_DATE', endDate: '2027-12-31' }],
          createdAt: '2026-02-05T13:15:00Z',
          updatedAt: '2026-04-02T10:00:00Z',
        }),
        buildPolicy({
          id: '00000000-0000-0000-0000-000000000005',
          name: 'Datenaustausch unter DEG-Rahmenvertrag',
          description:
            'Setzt voraus, dass der Datenkonsument dem DataExchangeGovernance-Rahmenvertrag zugestimmt hat.',
          category: 'CONTRACT',
          type: 'FRAMEWORK_AGREEMENT',
          constraints: [{ type: 'FRAMEWORK_AGREEMENT', agreement: FRAMEWORK_AGREEMENT_VALUE }],
          createdAt: '2026-01-20T11:00:00Z',
          updatedAt: '2026-04-21T09:30:00Z',
        }),
        buildPolicy({
          id: '00000000-0000-0000-0000-000000000006',
          name: 'Temporärer Zugriff bis Quartalsende',
          description: 'Begrenzt den Zugriff auf das aktuelle Quartal und erlischt zum 30.06.2026.',
          category: 'ACCESS',
          type: 'END_DATE',
          constraints: [{ type: 'END_DATE', endDate: '2026-06-30' }],
          createdAt: '2026-04-15T16:00:00Z',
          updatedAt: '2026-04-15T16:00:00Z',
        }),
      ];
    case 'many':
      return [
        ...generatePolicies('few'),
        buildPolicy({
          id: '00000000-0000-0000-0000-000000000007',
          name: 'BIM-Koordination unbeschränkt',
          description:
            'Erlaubt allen Berechtigten die Nutzung des BIM-Koordinationsmodells ohne weitere Einschränkungen.',
          category: 'CONTRACT',
          type: 'ALWAYS_TRUE',
          constraints: [],
          createdAt: '2026-03-01T09:00:00Z',
          updatedAt: '2026-04-20T14:30:00Z',
        }),
        buildPolicy({
          id: '00000000-0000-0000-0000-000000000008',
          name: 'Materialprüfung Konsortium',
          description: 'Materialprüfberichte ausschließlich für aktive Mitglieder des Datenraums.',
          category: 'CONTRACT',
          type: 'MEMBERSHIP_STATIC',
          constraints: [{ type: 'MEMBERSHIP', value: 'active' }],
          createdAt: '2026-02-15T10:00:00Z',
          updatedAt: '2026-04-18T08:45:00Z',
        }),
        buildPolicy({
          id: '00000000-0000-0000-0000-000000000009',
          name: 'Baustellendokumentation Anwendungsfälle',
          description:
            'Begrenzt die Nutzung der Baustellendokumentation auf ausgewählte Anwendungsfälle.',
          category: 'ACCESS',
          type: 'USE_CASE_MEMBERSHIP',
          constraints: [
            {
              type: 'USE_CASE',
              useCases: ['UC.site-documentation', 'UC.bim-coordination'],
            },
          ],
          createdAt: '2026-04-01T07:30:00Z',
          updatedAt: '2026-04-25T16:00:00Z',
        }),
        buildPolicy({
          id: '00000000-0000-0000-0000-000000000010',
          name: 'Geodaten Rahmenvertrag',
          description:
            'Nutzung von Geodaten unter Zustimmung zum DataExchangeGovernance-Rahmenvertrag.',
          category: 'ACCESS',
          type: 'FRAMEWORK_AGREEMENT',
          constraints: [{ type: 'FRAMEWORK_AGREEMENT', agreement: FRAMEWORK_AGREEMENT_VALUE }],
          createdAt: '2026-01-15T13:00:00Z',
          updatedAt: '2026-03-30T09:15:00Z',
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

export function createMockedPolicy(data: {
  name: string;
  description: string;
  category: PolicyCategory;
  type: PolicyType;
  constraints: Constraint[];
}): Policy {
  if (policies.length === 0 && getCurrentPolicyMockMode() !== 'empty') {
    initializePolicies();
  }
  const now = new Date().toISOString();
  const newPolicy: Policy = {
    id: `generated-${nextIdCounter++}`,
    name: data.name,
    description: data.description,
    category: data.category,
    type: data.type,
    constraints: data.constraints ?? [],
    createdAt: now,
    updatedAt: now,
  };
  policies = [newPolicy, ...policies];
  return newPolicy;
}

export function updateMockedPolicy(
  id: string,
  data: {
    name: string;
    description: string;
    category: PolicyCategory;
    type: PolicyType;
    constraints: Constraint[];
  },
): Policy | undefined {
  if (policies.length === 0 && getCurrentPolicyMockMode() !== 'empty') {
    initializePolicies();
  }
  const index = policies.findIndex((p) => p.id === id);
  if (index === -1) return undefined;

  const updated: Policy = {
    ...policies[index],
    name: data.name,
    description: data.description,
    category: data.category,
    type: data.type,
    constraints: data.constraints ?? [],
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
