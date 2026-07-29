-- V3: Seed the Construct-X example policies used by the frontend mock mode "few"

INSERT INTO policies (
    id,
    policy_id,
    category,
    constraints,
    legal_text,
    created_at,
    updated_at
)
VALUES
    (
        '00000000-0000-0000-0000-000000000001',
        'oeffentlicher-zugriff-projektdokumentation',
        'ACCESS',
        '[]'::jsonb,
        'Diese Policy enthält keine Einschränkungen. Der Zugriff auf die bereitgestellten Daten ist uneingeschränkt gestattet.',
        '2026-03-15T10:30:00Z',
        '2026-04-29T09:40:00Z'
    ),
    (
        '00000000-0000-0000-0000-000000000002',
        'zugriff-konsortium-mitglieder',
        'ACCESS',
        '[
          {
            "type": "MEMBERSHIP",
            "value": "active"
          }
        ]'::jsonb,
        'Der Zugriff auf die bereitgestellten Daten ist nur unter den folgenden Voraussetzungen gestattet: Der Datenkonsument muss zum Zeitpunkt des Datenzugriffs ein aktives, verifiziertes Mitglied des Construct-X Datenraums sein. Ein Zugriff durch Nicht-Mitglieder oder Organisationen mit ruhender Mitgliedschaft ist ausgeschlossen.',
        '2026-04-10T08:00:00Z',
        '2026-04-28T16:10:00Z'
    ),
    (
        '00000000-0000-0000-0000-000000000003',
        'baustellendaten-qualitaetspruefung',
        'CONTRACT',
        '[
          {
            "type": "USE_CASE",
            "useCases": [
              "UC.quality-assurance",
              "UC.material-testing"
            ]
          }
        ]'::jsonb,
        'Die Nutzung der bereitgestellten Daten ist nur unter den folgenden Voraussetzungen gestattet: Die Daten dürfen ausschließlich im Rahmen der folgenden Anwendungsfälle verarbeitet werden: Qualitätssicherung & Materialprüfung. Eine Nutzung zu anderen Zwecken ist nicht gestattet.',
        '2026-02-20T14:00:00Z',
        '2026-04-24T11:30:00Z'
    ),
    (
        '00000000-0000-0000-0000-000000000004',
        'geodaten-bis-2027',
        'CONTRACT',
        '[
          {
            "type": "MEMBERSHIP",
            "value": "active"
          },
          {
            "type": "DATE_RANGE",
            "startDate": "2026-06-01",
            "endDate": "2027-12-31"
          }
        ]'::jsonb,
        'Die Nutzung der bereitgestellten Daten ist nur unter den folgenden Voraussetzungen gestattet: Der Datenkonsument muss zum Zeitpunkt des Datenzugriffs ein aktives, verifiziertes Mitglied des Construct-X Datenraums sein. Ein Zugriff durch Nicht-Mitglieder oder Organisationen mit ruhender Mitgliedschaft ist ausgeschlossen. Darüber hinaus gilt: Die Nutzung der Daten ist ausschließlich im Zeitraum vom 01.06.2026 bis einschließlich 31.12.2027 gestattet. Außerhalb dieses Zeitraums ist jegliche Nutzung der Daten unzulässig.',
        '2026-02-05T13:15:00Z',
        '2026-04-02T10:00:00Z'
    ),
    (
        '00000000-0000-0000-0000-000000000005',
        'datenaustausch-deg-rahmenvertrag',
        'CONTRACT',
        '[
          {
            "type": "FRAMEWORK_AGREEMENT",
            "agreement": "DataExchangeGovernance"
          }
        ]'::jsonb,
        'Die Nutzung der bereitgestellten Daten ist nur unter den folgenden Voraussetzungen gestattet: Der Datenkonsument muss dem Rahmenvertrag „DataExchangeGovernance“ ausdrücklich zugestimmt haben, bevor eine Datenübertragung erfolgen darf.',
        '2026-01-20T11:00:00Z',
        '2026-04-21T09:30:00Z'
    ),
    (
        '00000000-0000-0000-0000-000000000006',
        'bim-koordination-q2-2027',
        'CONTRACT',
        '[
          {
            "type": "MEMBERSHIP",
            "value": "active"
          },
          {
            "type": "FRAMEWORK_AGREEMENT",
            "agreement": "DataExchangeGovernance"
          },
          {
            "type": "DATE_RANGE",
            "startDate": "2027-01-01",
            "endDate": "2027-06-30"
          }
        ]'::jsonb,
        'Die Nutzung der bereitgestellten Daten ist nur unter den folgenden Voraussetzungen gestattet: Der Datenkonsument muss zum Zeitpunkt des Datenzugriffs ein aktives, verifiziertes Mitglied des Construct-X Datenraums sein. Ein Zugriff durch Nicht-Mitglieder oder Organisationen mit ruhender Mitgliedschaft ist ausgeschlossen. Darüber hinaus gilt: Der Datenkonsument muss dem Rahmenvertrag „DataExchangeGovernance“ ausdrücklich zugestimmt haben, bevor eine Datenübertragung erfolgen darf. Darüber hinaus gilt: Die Nutzung der Daten ist ausschließlich im Zeitraum vom 01.01.2027 bis einschließlich 30.06.2027 gestattet. Außerhalb dieses Zeitraums ist jegliche Nutzung der Daten unzulässig.',
        '2026-04-15T16:00:00Z',
        '2026-04-15T16:00:00Z'
    ),
    (
        '00000000-0000-0000-0000-000000000007',
        'materialpruefberichte-mitglieder',
        'ACCESS',
        '[
          {
            "type": "MEMBERSHIP",
            "value": "active"
          },
          {
            "type": "USE_CASE",
            "useCases": [
              "UC.quality-assurance",
              "UC.material-testing"
            ]
          },
          {
            "type": "DATE_RANGE",
            "startDate": "2026-08-01",
            "endDate": "2027-07-31"
          }
        ]'::jsonb,
        'Der Zugriff auf die bereitgestellten Daten ist nur unter den folgenden Voraussetzungen gestattet: Der Datenkonsument muss zum Zeitpunkt des Datenzugriffs ein aktives, verifiziertes Mitglied des Construct-X Datenraums sein. Ein Zugriff durch Nicht-Mitglieder oder Organisationen mit ruhender Mitgliedschaft ist ausgeschlossen. Darüber hinaus gilt: Die Daten dürfen ausschließlich im Rahmen der folgenden Anwendungsfälle verarbeitet werden: Qualitätssicherung & Materialprüfung. Eine Nutzung zu anderen Zwecken ist nicht gestattet. Darüber hinaus gilt: Der Zugriff auf die Daten ist ausschließlich im Zeitraum vom 01.08.2026 bis einschließlich 31.07.2027 gestattet. Außerhalb dieses Zeitraums ist der Zugriff nicht gestattet.',
        '2026-03-01T09:00:00Z',
        '2026-04-20T14:30:00Z'
    );;