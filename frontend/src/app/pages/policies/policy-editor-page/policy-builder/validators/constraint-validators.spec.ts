import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { Constraint } from '@shared/types/constraint.model';
import { Policy, POLICY_ID_PREFIX } from '@shared/types/policy.model';

import {
  isValidDidWeb,
  partitionDidCandidates,
  splitDidInput,
  validateConstraint,
  validateDidCandidate,
  validatePolicyDraft,
} from './constraint-validators';

describe('validateConstraint — Bedingungs-Prüfung', () => {
  describe('DATE_RANGE (datumsabhängig, fixe Systemzeit)', () => {
    beforeEach(() => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date('2026-07-17T12:00:00'));
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('meldet Start- und Ende-Required bei leeren Datumsangaben', () => {
      const errors = validateConstraint({ type: 'DATE_RANGE', startDate: '', endDate: '' });
      expect(errors).toEqual([
        { field: 'constraint[0].startDate', messageKey: 'validation.dateRangeStartRequired' },
        { field: 'constraint[0].endDate', messageKey: 'validation.dateRangeEndRequired' },
      ]);
    });

    it('meldet dateRangeStartInvalid bei unparsebarem Startdatum', () => {
      const errors = validateConstraint({
        type: 'DATE_RANGE',
        startDate: 'not-a-date',
        endDate: '2099-12-31',
      });
      expect(errors).toContainEqual({
        field: 'constraint[0].startDate',
        messageKey: 'validation.dateRangeStartInvalid',
      });
    });

    it('meldet dateRangeEndInvalid bei unparsebarem Enddatum', () => {
      const errors = validateConstraint({
        type: 'DATE_RANGE',
        startDate: '2099-01-01',
        endDate: 'not-a-date',
      });
      expect(errors).toContainEqual({
        field: 'constraint[0].endDate',
        messageKey: 'validation.dateRangeEndInvalid',
      });
    });

    it('akzeptiert ein Startdatum in der Vergangenheit (laufender Zeitraum bleibt bearbeitbar)', () => {
      expect(
        validateConstraint({ type: 'DATE_RANGE', startDate: '2020-01-01', endDate: '2099-12-31' }),
      ).toEqual([]);
    });

    it('meldet dateRangeEndInPast für ein Enddatum in der Vergangenheit', () => {
      const errors = validateConstraint({
        type: 'DATE_RANGE',
        startDate: '2026-07-17',
        endDate: '2020-01-01',
      });
      expect(errors).toContainEqual({
        field: 'constraint[0].endDate',
        messageKey: 'validation.dateRangeEndInPast',
      });
    });

    it('meldet dateRangeStartAfterEnd, wenn der Start nach dem Ende liegt (beide gültig)', () => {
      const errors = validateConstraint({
        type: 'DATE_RANGE',
        startDate: '2099-12-31',
        endDate: '2099-01-01',
      });
      expect(errors).toEqual([
        { field: 'constraint[0].endDate', messageKey: 'validation.dateRangeStartAfterEnd' },
      ]);
    });

    it('akzeptiert das heutige Datum als Start (today auf 00:00 gefloort)', () => {
      expect(
        validateConstraint({ type: 'DATE_RANGE', startDate: '2026-07-17', endDate: '2099-12-31' }),
      ).toEqual([]);
    });

    it('akzeptiert einen gültigen zukünftigen Zeitraum', () => {
      expect(
        validateConstraint({ type: 'DATE_RANGE', startDate: '2027-01-01', endDate: '2027-12-31' }),
      ).toEqual([]);
    });

    it('akzeptiert Start = Ende (gleicher Tag)', () => {
      expect(
        validateConstraint({ type: 'DATE_RANGE', startDate: '2027-05-05', endDate: '2027-05-05' }),
      ).toEqual([]);
    });
  });

  describe('MEMBERSHIP & FRAMEWORK_AGREEMENT — immer gültig', () => {
    it('MEMBERSHIP liefert keine Fehler', () => {
      expect(validateConstraint({ type: 'MEMBERSHIP', value: 'active' })).toEqual([]);
    });

    it('FRAMEWORK_AGREEMENT liefert keine Fehler', () => {
      expect(
        validateConstraint({ type: 'FRAMEWORK_AGREEMENT', agreement: 'DataExchangeGovernance' }),
      ).toEqual([]);
    });
  });

  describe('PARTICIPANT_DID', () => {
    it('meldet participantDidRequired bei leerer Liste', () => {
      expect(validateConstraint({ type: 'PARTICIPANT_DID', dids: [] }, 2)).toEqual([
        { field: 'constraint[2].dids', messageKey: 'validation.participantDidRequired' },
      ]);
    });

    it('meldet participantDidRequired, wenn dids aus der API kein Array ist', () => {
      const c = { type: 'PARTICIPANT_DID', dids: 'did:web:a.example' } as unknown as Constraint;
      expect(validateConstraint(c)[0].messageKey).toBe('validation.participantDidRequired');
    });

    it('meldet participantDidInvalid bei einem ungültigen Eintrag', () => {
      expect(
        validateConstraint({ type: 'PARTICIPANT_DID', dids: ['did:web:a.example', 'foo'] }),
      ).toEqual([{ field: 'constraint[0].dids', messageKey: 'validation.participantDidInvalid' }]);
    });

    it('meldet participantDidDuplicate bei doppelten Einträgen', () => {
      expect(
        validateConstraint({
          type: 'PARTICIPANT_DID',
          dids: ['did:web:a.example', 'did:web:a.example'],
        }),
      ).toEqual([
        { field: 'constraint[0].dids', messageKey: 'validation.participantDidDuplicate' },
      ]);
    });

    it('erkennt Duplikate unabhängig von Groß-/Kleinschreibung', () => {
      expect(
        validateConstraint({
          type: 'PARTICIPANT_DID',
          dids: ['did:web:a.example', 'did:web:A.Example'],
        }),
      ).toEqual([
        { field: 'constraint[0].dids', messageKey: 'validation.participantDidDuplicate' },
      ]);
    });

    it('akzeptiert eine Liste gültiger, eindeutiger DIDs', () => {
      expect(
        validateConstraint({
          type: 'PARTICIPANT_DID',
          dids: ['did:web:a.example', 'did:web:b.example'],
        }),
      ).toEqual([]);
    });
  });

  it('interpoliert den Index in das field-Präfix', () => {
    const errors = validateConstraint({ type: 'DATE_RANGE', startDate: '', endDate: '' }, 3);
    expect(errors[0].field).toBe('constraint[3].startDate');
  });
});

describe('isValidDidWeb', () => {
  const valid = [
    'did:web:example.com',
    'did:web:sub.example-domain.de',
    'did:web:localhost%3A8443',
    'did:web:example.com%3a8443',
    'did:web:example.com:user:alice',
    'did:web:example.com%3A8443:participants:acme_1',
    'did:web:example.com:path%20segment',
  ];
  const invalid: [string, unknown][] = [
    ['leer', ''],
    ['ohne Host', 'did:web:'],
    ['andere DID-Methode', 'did:key:z6Mkabc'],
    ['ohne Präfix', 'example.com'],
    ['Großschreibung im Präfix', 'DID:web:example.com'],
    ['Host beginnt mit Bindestrich', 'did:web:-example.com'],
    ['leeres Host-Label', 'did:web:example..com'],
    ['leeres Pfadsegment am Ende', 'did:web:example.com:'],
    ['Komma', 'did:web:a.example,did:web:b.example'],
    ['Leerzeichen', 'did:web:a example'],
    ['Interpolations-Delimiter', 'did:web:{{dids}}'],
    ['kein String', 42],
  ];

  for (const did of valid) {
    it(`akzeptiert ${did}`, () => {
      expect(isValidDidWeb(did)).toBe(true);
    });
  }

  for (const [label, value] of invalid) {
    it(`lehnt ab: ${label}`, () => {
      expect(isValidDidWeb(value)).toBe(false);
    });
  }
});

describe('splitDidInput', () => {
  it('trennt an Komma, Leerzeichen und Zeilenumbruch und verwirft leere Teile', () => {
    expect(splitDidInput(' did:web:a.example,did:web:b.example\n did:web:c.example ,, ')).toEqual([
      'did:web:a.example',
      'did:web:b.example',
      'did:web:c.example',
    ]);
  });

  it('liefert für leere Eingabe eine leere Liste', () => {
    expect(splitDidInput('   ')).toEqual([]);
  });
});

describe('validateDidCandidate', () => {
  it('liefert null für eine neue, gültige DID', () => {
    expect(validateDidCandidate('did:web:a.example', ['did:web:b.example'])).toBeNull();
  });

  it('meldet participantDidInvalid für eine ungültige DID', () => {
    expect(validateDidCandidate('did:web:', [])).toBe('validation.participantDidInvalid');
  });

  it('meldet participantDidDuplicate für eine bereits vorhandene DID', () => {
    expect(validateDidCandidate('did:web:a.example', ['did:web:a.example'])).toBe(
      'validation.participantDidDuplicate',
    );
  });

  it('meldet participantDidDuplicate auch bei abweichender Groß-/Kleinschreibung', () => {
    expect(validateDidCandidate('did:web:A.Example:Users', ['did:web:a.example:users'])).toBe(
      'validation.participantDidDuplicate',
    );
  });
});

describe('partitionDidCandidates', () => {
  it('übernimmt alle gültigen, neuen DIDs in Eingabereihenfolge', () => {
    expect(partitionDidCandidates(['did:web:a.example', 'did:web:b.example'], [])).toEqual({
      accepted: ['did:web:a.example', 'did:web:b.example'],
      rejected: [],
      errorKey: null,
    });
  });

  it('trennt ungültige und bereits vorhandene Kandidaten ab und meldet den ersten Fehler', () => {
    expect(
      partitionDidCandidates(
        ['did:web:a.example', 'kaputt', 'did:web:B.example'],
        ['did:web:b.example'],
      ),
    ).toEqual({
      accepted: ['did:web:a.example'],
      rejected: ['kaputt', 'did:web:B.example'],
      errorKey: 'validation.participantDidInvalid',
    });
  });

  it('erkennt Duplikate innerhalb derselben Eingabe', () => {
    expect(partitionDidCandidates(['did:web:a.example', 'did:web:A.example'], [])).toEqual({
      accepted: ['did:web:a.example'],
      rejected: ['did:web:A.example'],
      errorKey: 'validation.participantDidDuplicate',
    });
  });
});

describe('validatePolicyDraft', () => {
  function draft(overrides: Partial<Policy> = {}): Partial<Policy> {
    return {
      policyId: `${POLICY_ID_PREFIX}valid-policy`,
      category: 'ACCESS',
      constraints: [],
      ...overrides,
    };
  }

  it('liefert keine Fehler für einen gültigen Entwurf', () => {
    expect(validatePolicyDraft(draft())).toEqual([]);
  });

  it('meldet policyIdRequired bei leerer/whitespace-only ID', () => {
    expect(validatePolicyDraft(draft({ policyId: '   ' }))).toContainEqual({
      field: 'policyId',
      messageKey: 'validation.policyIdRequired',
    });
  });

  it('meldet policyIdRequired, wenn hinter dem Präfix nichts steht', () => {
    expect(validatePolicyDraft(draft({ policyId: POLICY_ID_PREFIX }))).toContainEqual({
      field: 'policyId',
      messageKey: 'validation.policyIdRequired',
    });
  });

  it('meldet policyIdPrefixMissing, wenn der Präfix fehlt oder verändert wurde', () => {
    for (const policyId of ['valid-policy', 'con-x-policyHub-valid-policy', 'CON-X-PH-x']) {
      expect(validatePolicyDraft(draft({ policyId }))).toContainEqual({
        field: 'policyId',
        messageKey: 'validation.policyIdPrefixMissing',
      });
    }
  });

  it('akzeptiert genau 200 Zeichen und lehnt 201 ab (Grenzwert)', () => {
    const fill = (length: number) =>
      POLICY_ID_PREFIX + 'a'.repeat(length - POLICY_ID_PREFIX.length);
    expect(validatePolicyDraft(draft({ policyId: fill(200) }))).toEqual([]);
    expect(validatePolicyDraft(draft({ policyId: fill(201) }))).toContainEqual({
      field: 'policyId',
      messageKey: 'validation.policyIdTooLong',
    });
  });

  it('meldet categoryRequired bei fehlender Kategorie', () => {
    const noCategory = { policyId: 'x', constraints: [] } as Partial<Policy>;
    expect(validatePolicyDraft(noCategory)).toContainEqual({
      field: 'category',
      messageKey: 'validation.categoryRequired',
    });
  });

  it('erlaubt DATE_RANGE sowohl unter ACCESS als auch unter CONTRACT', () => {
    for (const category of ['ACCESS', 'CONTRACT'] as const) {
      const errors = validatePolicyDraft(
        draft({
          category,
          constraints: [{ type: 'DATE_RANGE', startDate: '2099-01-01', endDate: '2099-12-31' }],
        }),
      );
      expect(errors).not.toContainEqual({
        field: 'constraint[0]',
        messageKey: 'validation.constraintNotAllowedInCategory',
      });
    }
  });

  it('aggregiert mehrere Fehler (ID + Kategorie + Bedingung)', () => {
    const errors = validatePolicyDraft({
      policyId: '',
      constraints: [{ type: 'DATE_RANGE', startDate: '', endDate: '' }],
    } as Partial<Policy>);
    const keys = errors.map((e) => e.messageKey);
    expect(keys).toContain('validation.policyIdRequired');
    expect(keys).toContain('validation.categoryRequired');
    expect(keys).toContain('validation.dateRangeStartRequired');
  });
});

describe('validatePolicyDraft — unbekannter Constraint-Typ aus der API', () => {
  const unknownConstraint = { type: 'FOO' } as unknown as Constraint;

  it('meldet einen Validierungsfehler statt zu werfen', () => {
    const errors = validatePolicyDraft({
      policyId: 'gueltige-id',
      category: 'ACCESS',
      constraints: [unknownConstraint],
    } as Partial<Policy>);

    expect(errors.map((e) => e.messageKey)).toContain('validation.constraintUnknownType');
  });

  it('prüft die übrigen Constraints trotzdem weiter', () => {
    const errors = validatePolicyDraft({
      policyId: 'gueltige-id',
      category: 'ACCESS',
      constraints: [unknownConstraint, { type: 'DATE_RANGE', startDate: '', endDate: '' }],
    } as Partial<Policy>);

    const keys = errors.map((e) => e.messageKey);
    expect(keys).toContain('validation.constraintUnknownType');
    expect(keys).toContain('validation.dateRangeStartRequired');
  });
});

/**
 * Die policyId landet über `policyToOdrl()` als JSON-LD-`@id` im ODRL-Dokument. `@id` ist
 * dort ein Identifier, keine Beschriftung: eine freie Zeichenkette könnte eine absolute IRI
 * oder eine Blank-Node-Referenz erzeugen und damit auf eine fremde PolicyDefinition zeigen.
 */
describe('validatePolicyDraft — Zeichensatz der policyId', () => {
  function withId(policyId: string): Partial<Policy> {
    return { policyId: `${POLICY_ID_PREFIX}${policyId}`, category: 'ACCESS', constraints: [] };
  }

  const accepted = [
    'zugriff-konsortium-mitglieder',
    'policy.use-case-quality-assurance',
    'bim_koordination_2027',
    'e2e-neue-policy',
    'A1',
    '.beginnt-mit-punkt',
  ];

  for (const id of accepted) {
    it(`akzeptiert die fachliche ID "${id}"`, () => {
      expect(validatePolicyDraft(withId(id))).toEqual([]);
    });
  }

  const rejected: [string, string][] = [
    ['absolute IRI', 'https://w3id.org/catenax/policy/fremde-policy'],
    ['Blank-Node-Referenz', '_:b0'],
    ['Leerzeichen', 'policy mit leerzeichen'],
    ['Pfadtrenner', '../andere-policy'],
    ['spitze Klammern', 'policy<script>'],
  ];

  for (const [label, id] of rejected) {
    it(`lehnt ab: ${label}`, () => {
      expect(validatePolicyDraft(withId(id))).toContainEqual({
        field: 'policyId',
        messageKey: 'validation.policyIdInvalidChars',
      });
    });
  }

  it('meldet bei leerer ID weiterhin policyIdRequired, nicht den Zeichensatz-Fehler', () => {
    const keys = validatePolicyDraft(withId('  ')).map((e) => e.messageKey);
    expect(keys).toContain('validation.policyIdRequired');
    expect(keys).not.toContain('validation.policyIdInvalidChars');
  });
});
