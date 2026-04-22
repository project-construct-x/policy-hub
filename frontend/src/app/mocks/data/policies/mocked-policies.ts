import { Policy } from '@shared/types/policy.model';
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

const sampleOdrlPolicy = JSON.stringify(
  {
    '@context': 'http://www.w3.org/ns/odrl.jsonld',
    '@type': 'Set',
    uid: 'urn:constructx:policy:usage-data-sharing-001',
    profile: 'https://construct-x.org/odrl/profile/v1',
    permission: [
      {
        target: 'urn:constructx:asset:bim-model-2024',
        action: 'use',
        constraint: [
          {
            leftOperand: 'purpose',
            operator: 'eq',
            rightOperand: 'construction-planning',
          },
        ],
      },
    ],
    prohibition: [
      {
        target: 'urn:constructx:asset:bim-model-2024',
        action: 'distribute',
      },
    ],
  },
  null,
  2,
);

const sampleLegalText = `§ 1 Nutzungsrecht
Der Datennutzer erhält ein einfaches, nicht übertragbares Nutzungsrecht an den bereitgestellten Daten ausschließlich zum Zweck der Bauplanung.

§ 2 Nutzungsbeschränkung
Eine Weitergabe der Daten an Dritte ist ausdrücklich untersagt. Die Daten dürfen nur im Rahmen des definierten Zwecks verwendet werden.

§ 3 Haftung
Der Datenanbieter haftet nicht für die Richtigkeit, Vollständigkeit oder Aktualität der bereitgestellten Daten, soweit gesetzlich zulässig.

§ 4 Laufzeit
Dieses Nutzungsrecht gilt für die Dauer des Projekts, längstens jedoch für 24 Monate ab Bereitstellung.`;

const sampleOdrlAccess = JSON.stringify(
  {
    '@context': 'http://www.w3.org/ns/odrl.jsonld',
    '@type': 'Set',
    uid: 'urn:constructx:policy:access-bim-viewer-002',
    profile: 'https://construct-x.org/odrl/profile/v1',
    permission: [
      {
        target: 'urn:constructx:asset:bim-viewer-app',
        action: 'read',
        constraint: [
          {
            leftOperand: 'role',
            operator: 'eq',
            rightOperand: 'project-member',
          },
        ],
      },
    ],
  },
  null,
  2,
);

const sampleAccessLegalText = `§ 1 Zugriffsrecht
Projektmitglieder erhalten lesenden Zugriff auf den BIM-Viewer und die darin enthaltenen Modelle.

§ 2 Zugriffsbeschränkung
Der Zugriff ist auf authentifizierte Nutzer mit der Rolle "Projektmitglied" beschränkt.`;

let policies: Policy[] = [];
let nextIdCounter = 100;

function generatePolicies(mode: PolicyMockMode): Policy[] {
  switch (mode) {
    case 'empty':
      return [];
    case 'few':
      return [
        {
          id: '00000000-0000-0000-0000-000000000001',
          name: 'Datennutzung Bauplanung',
          description:
            'Erlaubt die Nutzung von BIM-Modelldaten ausschließlich für Bauplanungszwecke. Weitergabe an Dritte ist untersagt.',
          status: 'ACTIVE',
          content: sampleOdrlPolicy,
          legalText: sampleLegalText,
          createdAt: '2026-03-15T10:30:00Z',
          updatedAt: '2026-04-01T14:20:00Z',
        },
        {
          id: '00000000-0000-0000-0000-000000000002',
          name: 'BIM-Viewer Zugriff',
          description: 'Gewährt Projektmitgliedern lesenden Zugriff auf den BIM-Viewer.',
          status: 'DRAFT',
          content: sampleOdrlAccess,
          legalText: sampleAccessLegalText,
          createdAt: '2026-04-10T08:00:00Z',
          updatedAt: '2026-04-10T08:00:00Z',
        },
        {
          id: '00000000-0000-0000-0000-000000000003',
          name: 'Lieferketten-Daten (veraltet)',
          description:
            'Ehemalige Policy für den Austausch von Lieferkettendaten. Wurde durch eine aktualisierte Version ersetzt.',
          status: 'ARCHIVED',
          content: null,
          legalText: null,
          createdAt: '2025-12-01T09:00:00Z',
          updatedAt: '2026-02-15T16:45:00Z',
        },
      ];
    case 'many':
      return [
        ...generatePolicies('few'),
        {
          id: '00000000-0000-0000-0000-000000000004',
          name: 'Qualitätsdaten-Austausch',
          description:
            'Regelt den Austausch von Qualitätsdaten zwischen Generalunternehmer und Nachunternehmern.',
          status: 'ACTIVE',
          content: sampleOdrlPolicy,
          legalText: sampleLegalText,
          createdAt: '2026-01-20T11:00:00Z',
          updatedAt: '2026-03-10T09:30:00Z',
        },
        {
          id: '00000000-0000-0000-0000-000000000005',
          name: 'Zeiterfassungs-Policy',
          description:
            'Policy für den kontrollierten Zugriff auf Zeiterfassungsdaten im Bauprojekt.',
          status: 'DRAFT',
          content: sampleOdrlAccess,
          legalText: sampleAccessLegalText,
          createdAt: '2026-04-18T07:00:00Z',
          updatedAt: '2026-04-18T07:00:00Z',
        },
        {
          id: '00000000-0000-0000-0000-000000000006',
          name: 'Geodaten-Nutzung',
          description:
            'Erlaubt die Nutzung von Geodaten für Vermessungszwecke innerhalb des Projekts.',
          status: 'ACTIVE',
          content: sampleOdrlPolicy,
          legalText: sampleLegalText,
          createdAt: '2026-02-05T13:15:00Z',
          updatedAt: '2026-04-02T10:00:00Z',
        },
        {
          id: '00000000-0000-0000-0000-000000000007',
          name: 'IoT-Sensordaten Baustelle',
          description: 'Regelt die Erfassung und Weitergabe von IoT-Sensordaten der Baustelle.',
          status: 'DRAFT',
          content: sampleOdrlPolicy,
          legalText: sampleLegalText,
          createdAt: '2026-04-15T16:00:00Z',
          updatedAt: '2026-04-15T16:00:00Z',
        },
        {
          id: '00000000-0000-0000-0000-000000000008',
          name: 'Materiallogistik-Daten (veraltet)',
          description:
            'Veraltete Policy für Materiallogistik. Ersetzt durch aktualisierte Version.',
          status: 'ARCHIVED',
          content: null,
          legalText: null,
          createdAt: '2025-10-01T08:00:00Z',
          updatedAt: '2026-01-10T12:00:00Z',
        },
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
  content: string | null;
  legalText: string | null;
}): Policy {
  if (policies.length === 0 && getCurrentPolicyMockMode() !== 'empty') {
    initializePolicies();
  }
  const now = new Date().toISOString();
  const newPolicy: Policy = {
    id: `generated-${nextIdCounter++}`,
    name: data.name,
    description: data.description,
    status: 'DRAFT',
    content: data.content,
    legalText: data.legalText,
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
    status: string;
    content: string | null;
    legalText: string | null;
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
    status: data.status as Policy['status'],
    content: data.content,
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
