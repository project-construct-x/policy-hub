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
          name: 'Baustellendaten für Qualitätsprüfungen',
          description:
            'Diese Richtlinie beschreibt, wie Baustellendaten für interne Qualitätsprüfungen genutzt werden dürfen. Sie hilft Projektteams, Daten nachvollziehbar, zweckgebunden und regelkonform einzusetzen.',
          status: 'ACTIVE',
          useCaseContext: 'Qualitätssicherung',
          purpose: 'Sicherstellung der Datenqualität bei internen Prüfprozessen auf der Baustelle.',
          permittedUsage:
            'Interne Qualitätsprüfungen durch autorisierte Projektmitglieder. Nutzung ausschließlich im Rahmen des definierten Projektkontexts.',
          restrictions:
            'Keine Weitergabe an Dritte. Keine Verwendung außerhalb des Qualitätssicherungsprozesses. Daten dürfen nicht für kommerzielle Auswertungen genutzt werden.',
          content: sampleOdrlPolicy,
          legalText: sampleLegalText,
          createdAt: '2026-03-15T10:30:00Z',
          updatedAt: '2026-04-29T09:40:00Z',
        },
        {
          id: '00000000-0000-0000-0000-000000000002',
          name: 'BIM-Koordinationsmodell Zugriff',
          description:
            'Regelt den Zugriff auf das BIM-Koordinationsmodell für alle beteiligten Planungspartner im Projekt.',
          status: 'DRAFT',
          useCaseContext: 'Planung und Koordination',
          purpose:
            'Koordinierte Zusammenarbeit aller Planungsbeteiligten auf Basis eines gemeinsamen BIM-Modells.',
          permittedUsage:
            'Lesender und kommentierender Zugriff für Projektmitglieder mit der Rolle Planer oder Koordinator.',
          restrictions:
            'Kein Schreibzugriff ohne explizite Freigabe durch den BIM-Manager. Export nur in abgestimmten Formaten.',
          content: sampleOdrlAccess,
          legalText: sampleAccessLegalText,
          createdAt: '2026-04-10T08:00:00Z',
          updatedAt: '2026-04-28T16:10:00Z',
        },
        {
          id: '00000000-0000-0000-0000-000000000003',
          name: 'Materialprüfung Laborergebnisse',
          description:
            'Richtlinie für die Nutzung und Weitergabe von Laborergebnissen aus der Materialprüfung.',
          status: 'ACTIVE',
          useCaseContext: 'Materialprüfung',
          purpose: 'Nachvollziehbarkeit der Materialqualität und Einhaltung der Baustoffnormen.',
          permittedUsage:
            'Einsicht durch Bauleitung und Qualitätssicherung. Weitergabe an den Auftraggeber auf Anfrage.',
          restrictions:
            'Keine eigenständige Veröffentlichung der Ergebnisse. Nur im Zusammenhang mit dem zugehörigen Prüfauftrag nutzbar.',
          content: sampleOdrlPolicy,
          legalText: sampleLegalText,
          createdAt: '2026-02-20T14:00:00Z',
          updatedAt: '2026-04-24T11:30:00Z',
        },
      ];
    case 'many':
      return [
        ...generatePolicies('few'),
        {
          id: '00000000-0000-0000-0000-000000000004',
          name: 'Partnerverträge Datenaustausch',
          description:
            'Regelt den Austausch von Vertragsdaten zwischen Generalunternehmer und Nachunternehmern.',
          status: 'ACTIVE',
          useCaseContext: 'Partnerarbeit',
          purpose:
            'Transparenter und regelkonformer Austausch von Vertragsinformationen im Partnernetzwerk.',
          permittedUsage:
            'Einsicht durch berechtigte Vertragspartner. Automatisierte Synchronisation der Vertragsstände.',
          restrictions:
            'Keine Weitergabe an nicht beteiligte Dritte. Vertrauliche Konditionen sind ausgenommen.',
          content: sampleOdrlPolicy,
          legalText: sampleLegalText,
          createdAt: '2026-01-20T11:00:00Z',
          updatedAt: '2026-04-21T09:30:00Z',
        },
        {
          id: '00000000-0000-0000-0000-000000000005',
          name: 'Zeiterfassung Bauprojekt',
          description:
            'Policy für den kontrollierten Zugriff auf Zeiterfassungsdaten im Bauprojekt.',
          status: 'DRAFT',
          useCaseContext: 'Projektsteuerung',
          purpose:
            'Nachvollziehbare Dokumentation der Arbeitszeiten für Abrechnung und Controlling.',
          permittedUsage: 'Zugriff durch Projektleitung und Controlling-Abteilung.',
          restrictions:
            'Personenbezogene Daten nur aggregiert auswertbar. Keine Einzelauswertung ohne Zustimmung.',
          content: sampleOdrlAccess,
          legalText: sampleAccessLegalText,
          createdAt: '2026-04-18T07:00:00Z',
          updatedAt: '2026-04-18T07:00:00Z',
        },
        {
          id: '00000000-0000-0000-0000-000000000006',
          name: 'Geodaten Vermessung',
          description:
            'Erlaubt die Nutzung von Geodaten für Vermessungszwecke innerhalb des Projekts.',
          status: 'ACTIVE',
          useCaseContext: 'Vermessung',
          purpose: 'Präzise Verortung von Baumaßnahmen und Abgleich mit amtlichen Geodaten.',
          permittedUsage:
            'Nutzung durch Vermessungsingenieure und Geoinformationssysteme des Projekts.',
          restrictions:
            'Keine kommerzielle Weiterverwertung. Amtliche Grenzdaten dürfen nicht verändert werden.',
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
          useCaseContext: 'Baustellenüberwachung',
          purpose:
            'Echtzeitüberwachung von Umgebungsbedingungen und Maschinenstatus auf der Baustelle.',
          permittedUsage:
            'Automatisierte Auswertung durch Monitoring-Systeme. Alarmierung bei Grenzwertüberschreitung.',
          restrictions: 'Rohdaten werden nach 90 Tagen gelöscht. Keine Personenüberwachung.',
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
          useCaseContext: 'Logistik',
          purpose: '',
          permittedUsage: '',
          restrictions: '',
          content: null,
          legalText: null,
          createdAt: '2025-10-01T08:00:00Z',
          updatedAt: '2026-01-10T12:00:00Z',
        },
        {
          id: '00000000-0000-0000-0000-000000000009',
          name: 'Abfallentsorgungsnachweis Digital',
          description:
            'Regelt die digitale Dokumentation und Weitergabe von Abfallentsorgungsnachweisen auf Baustellen.',
          status: 'ACTIVE',
          useCaseContext: 'Entsorgung',
          purpose:
            'Lückenlose Nachverfolgung der ordnungsgemäßen Entsorgung von Bauabfällen gemäß KrWG.',
          permittedUsage:
            'Einsicht durch Bauleitung, Umweltbeauftragte und zuständige Behörden auf Anfrage.',
          restrictions:
            'Entsorgungsnachweise dürfen nicht verändert werden. Archivierungspflicht von 5 Jahren.',
          content: sampleOdrlPolicy,
          legalText: sampleLegalText,
          createdAt: '2026-03-01T09:00:00Z',
          updatedAt: '2026-04-20T14:30:00Z',
        },
        {
          id: '00000000-0000-0000-0000-000000000010',
          name: 'Drohnenbefliegung Dokumentation',
          description:
            'Policy für die Nutzung von Drohnenaufnahmen zur Baufortschrittsdokumentation.',
          status: 'ACTIVE',
          useCaseContext: 'Dokumentation',
          purpose: 'Regelmäßige visuelle Dokumentation des Baufortschritts aus der Luft.',
          permittedUsage:
            'Nutzung durch Projektleitung und Auftraggeber. Einbindung in Baufortschrittsberichte.',
          restrictions:
            'Keine Aufnahmen von Personen ohne Einwilligung. Flugverbotszonen sind einzuhalten.',
          content: sampleOdrlAccess,
          legalText: sampleAccessLegalText,
          createdAt: '2026-02-15T10:00:00Z',
          updatedAt: '2026-04-18T08:45:00Z',
        },
        {
          id: '00000000-0000-0000-0000-000000000011',
          name: 'Energieverbrauchsdaten Gebäudebetrieb',
          description:
            'Richtlinie zur Erfassung und Auswertung von Energieverbrauchsdaten im Gebäudebetrieb.',
          status: 'DRAFT',
          useCaseContext: 'Gebäudebetrieb',
          purpose: 'Optimierung des Energieverbrauchs und Erfüllung von ESG-Berichtspflichten.',
          permittedUsage: 'Auswertung durch Facility Management und Nachhaltigkeitsbeauftragte.',
          restrictions: 'Keine Weitergabe an Dritte ohne Zustimmung des Gebäudeeigentümers.',
          content: sampleOdrlPolicy,
          legalText: sampleLegalText,
          createdAt: '2026-04-01T07:30:00Z',
          updatedAt: '2026-04-25T16:00:00Z',
        },
        {
          id: '00000000-0000-0000-0000-000000000012',
          name: 'Lieferantenbewertung Baustoffe',
          description:
            'Regelt den Zugriff auf Bewertungsdaten von Baustofflieferanten im Beschaffungsprozess.',
          status: 'ACTIVE',
          useCaseContext: 'Beschaffung',
          purpose:
            'Qualitätssicherung bei der Lieferantenauswahl durch transparente Bewertungskriterien.',
          permittedUsage:
            'Einsicht durch Einkauf und Bauleitung. Vergleichende Auswertungen für Vergabeentscheidungen.',
          restrictions:
            'Bewertungen sind vertraulich. Keine direkte Weitergabe an bewertete Lieferanten.',
          content: sampleOdrlAccess,
          legalText: sampleAccessLegalText,
          createdAt: '2026-01-15T13:00:00Z',
          updatedAt: '2026-03-30T09:15:00Z',
        },
        {
          id: '00000000-0000-0000-0000-000000000013',
          name: 'Arbeitsschutz Gefährdungsbeurteilung',
          description:
            'Policy für die digitale Verwaltung und Weitergabe von Gefährdungsbeurteilungen.',
          status: 'ACTIVE',
          useCaseContext: 'Arbeitsschutz',
          purpose:
            'Sicherstellung der Einhaltung von Arbeitsschutzvorschriften auf allen Baustellen.',
          permittedUsage: 'Zugriff durch SiGeKo, Bauleitung und Fachkräfte für Arbeitssicherheit.',
          restrictions:
            'Personenbezogene Unfalldaten nur anonymisiert auswertbar. Löschfrist nach Projektende: 10 Jahre.',
          content: sampleOdrlPolicy,
          legalText: sampleLegalText,
          createdAt: '2026-03-20T11:00:00Z',
          updatedAt: '2026-04-22T15:30:00Z',
        },
        {
          id: '00000000-0000-0000-0000-000000000014',
          name: 'Bautagebuch Digital',
          description:
            'Regelt die Erfassung, Speicherung und Einsichtnahme des digitalen Bautagebuchs.',
          status: 'DRAFT',
          useCaseContext: 'Baudokumentation',
          purpose:
            'Tägliche Dokumentation des Baugeschehens als Nachweis- und Abrechnungsgrundlage.',
          permittedUsage:
            'Eintragung durch Bauleitung. Lesezugriff für Auftraggeber und Projektsteuerung.',
          restrictions:
            'Einträge dürfen nach Freigabe nicht mehr verändert werden. Nur Ergänzungen sind zulässig.',
          content: sampleOdrlAccess,
          legalText: sampleAccessLegalText,
          createdAt: '2026-04-05T06:00:00Z',
          updatedAt: '2026-04-28T17:00:00Z',
        },
        {
          id: '00000000-0000-0000-0000-000000000015',
          name: 'Nachunternehmer Leistungsverzeichnis',
          description:
            'Policy für den kontrollierten Zugriff auf Leistungsverzeichnisse von Nachunternehmern.',
          status: 'ACTIVE',
          useCaseContext: 'Vergabe',
          purpose:
            'Transparente Vergabeprozesse durch standardisierten Zugriff auf Leistungsbeschreibungen.',
          permittedUsage:
            'Einsicht durch Vergabestelle und Kalkulation. Export nur für interne Auswertung.',
          restrictions:
            'Preisblätter sind vertraulich und nur für berechtigte Vergabeteilnehmer sichtbar.',
          content: sampleOdrlPolicy,
          legalText: sampleLegalText,
          createdAt: '2026-02-28T14:00:00Z',
          updatedAt: '2026-04-10T10:45:00Z',
        },
        {
          id: '00000000-0000-0000-0000-000000000016',
          name: 'Bestandsmodell Sanierung',
          description: 'Richtlinie für die Nutzung von Bestandsmodellen bei Sanierungsprojekten.',
          status: 'DRAFT',
          useCaseContext: 'Sanierung',
          purpose:
            'Bereitstellung aktueller Bestandsdaten als Planungsgrundlage für Sanierungsmaßnahmen.',
          permittedUsage:
            'Lesender Zugriff für Planer und Fachingenieure. Integration in Fachmodelle erlaubt.',
          restrictions:
            'Bestandsdaten dürfen nicht als Grundlage für statische Berechnungen ohne Vor-Ort-Überprüfung verwendet werden.',
          content: sampleOdrlAccess,
          legalText: sampleAccessLegalText,
          createdAt: '2026-03-10T08:30:00Z',
          updatedAt: '2026-04-30T12:00:00Z',
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
  useCaseContext?: string;
  purpose?: string;
  permittedUsage?: string;
  restrictions?: string;
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
    useCaseContext: data.useCaseContext ?? '',
    purpose: data.purpose ?? '',
    permittedUsage: data.permittedUsage ?? '',
    restrictions: data.restrictions ?? '',
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
    useCaseContext?: string;
    purpose?: string;
    permittedUsage?: string;
    restrictions?: string;
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
    useCaseContext: data.useCaseContext ?? policies[index].useCaseContext,
    purpose: data.purpose ?? policies[index].purpose,
    permittedUsage: data.permittedUsage ?? policies[index].permittedUsage,
    restrictions: data.restrictions ?? policies[index].restrictions,
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
