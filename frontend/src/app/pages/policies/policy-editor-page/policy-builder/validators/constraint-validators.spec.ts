import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { Constraint, CredentialRule } from '@shared/types/constraint.model';
import { Policy, POLICY_ID_PREFIX } from '@shared/types/policy.model';

import {
  isValidCredentialValue,
  isValidDataSubsetSelector,
  isValidDidWeb,
  splitCredentialValues,
  parseDataSubsetSelector,
  partitionCandidates,
  splitDataSubsetInput,
  splitListInput,
  validateConstraint,
  validateDidCandidate,
  validatePolicyDraft,
  toDataSubsetSelector,
  validateSelectorCandidate,
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

  describe('DATA_SUBSET', () => {
    it('meldet dataSubsetSelectorRequired bei leerer Liste', () => {
      expect(validateConstraint({ type: 'DATA_SUBSET', selectors: [] }, 1)).toEqual([
        { field: 'constraint[1].selectors', messageKey: 'validation.dataSubsetSelectorRequired' },
      ]);
    });

    it('meldet dataSubsetSelectorRequired, wenn selectors aus der API kein Array ist', () => {
      const constraint = { type: 'DATA_SUBSET', selectors: 'field:a' } as unknown as Constraint;
      expect(validateConstraint(constraint)[0].messageKey).toBe(
        'validation.dataSubsetSelectorRequired',
      );
    });

    it('meldet dataSubsetSelectorInvalid bei einem ungültigen Eintrag', () => {
      expect(
        validateConstraint({ type: 'DATA_SUBSET', selectors: ['field:a', 'unbekannt:b'] }),
      ).toEqual([
        { field: 'constraint[0].selectors', messageKey: 'validation.dataSubsetSelectorInvalid' },
      ]);
    });

    it('meldet dataSubsetSelectorDuplicate bei exakt doppelten Einträgen', () => {
      expect(
        validateConstraint({ type: 'DATA_SUBSET', selectors: ['field:a', 'field:a'] }),
      ).toEqual([
        { field: 'constraint[0].selectors', messageKey: 'validation.dataSubsetSelectorDuplicate' },
      ]);
    });

    it('akzeptiert Einträge, die sich nur in Groß-/Kleinschreibung unterscheiden', () => {
      expect(
        validateConstraint({ type: 'DATA_SUBSET', selectors: ['field:name', 'field:Name'] }),
      ).toEqual([]);
    });
  });

  it('interpoliert den Index in das field-Präfix', () => {
    const errors = validateConstraint({ type: 'DATE_RANGE', startDate: '', endDate: '' }, 3);
    expect(errors[0].field).toBe('constraint[3].startDate');
  });

  describe('CREDENTIAL_ATTRIBUTE', () => {
    const validRule: CredentialRule = {
      credentialType: 'https://w3id.org/constructx/credentials/v0.1/MembershipCredential',
      attributePath: 'isMember',
      operator: 'eq',
      value: 'true',
      values: [],
    };

    function validate(...rules: Partial<CredentialRule>[]) {
      return validateConstraint(
        {
          type: 'CREDENTIAL_ATTRIBUTE',
          rules: rules.map((rule) => ({ ...validRule, ...rule })),
        },
        2,
      );
    }

    it('akzeptiert gültige Regeln aller Wertarten', () => {
      expect(
        validate(
          {},
          { attributePath: 'site.accessLevel', operator: 'gteq', value: '4' },
          { attributePath: 'roles[0]', operator: 'isNoneOf', value: '', values: ['Gast'] },
          { operator: 'neq', value: 'Site Manager' },
          { operator: 'lt', value: '-2.5' },
        ),
      ).toEqual([]);
    });

    it('meldet credentialRulesRequired ohne Regel (auch wenn rules kein Array ist)', () => {
      expect(validateConstraint({ type: 'CREDENTIAL_ATTRIBUTE', rules: [] }, 2)).toEqual([
        { field: 'constraint[2].rules', messageKey: 'validation.credentialRulesRequired' },
      ]);
      const constraint = { type: 'CREDENTIAL_ATTRIBUTE', rules: 'x' } as unknown as Constraint;
      expect(validateConstraint(constraint)[0].messageKey).toBe(
        'validation.credentialRulesRequired',
      );
    });

    it('prüft den Credential-Typ (Pflicht, vollständige https-IRI)', () => {
      const field = 'constraint[2].rules[0].credentialType';
      expect(validate({ credentialType: '' })).toEqual([
        { field, messageKey: 'validation.credentialTypeRequired' },
      ]);
      for (const credentialType of [
        'MembershipCredential',
        'http://w3id.org/constructx/credentials/v0.1/MembershipCredential',
        'https://w3id.org/constructx/credentials/v0.1/membershipCredential',
        'https://w3id.org/constructx/credentials/v0.1/Foo.Bar',
        'https://w3id.org/{{x}}/Foo',
        'https://localhost/Foo',
      ]) {
        expect(validate({ credentialType })).toEqual([
          { field, messageKey: 'validation.credentialTypeInvalid' },
        ]);
      }
    });

    it('prüft den Attribut-Pfad', () => {
      const field = 'constraint[2].rules[0].attributePath';
      expect(validate({ attributePath: '' })).toEqual([
        { field, messageKey: 'validation.credentialAttributePathRequired' },
      ]);
      for (const attributePath of ['a..b', '.a', 'a.', 'a[x]', 'a b', 'credentialSubject/a']) {
        expect(validate({ attributePath })).toEqual([
          { field, messageKey: 'validation.credentialAttributePathInvalid' },
        ]);
      }
    });

    it('meldet credentialOperatorInvalid bei unbekanntem Operator', () => {
      const rule = { operator: 'isPartOf' } as unknown as Partial<CredentialRule>;
      expect(validate(rule)).toEqual([
        {
          field: 'constraint[2].rules[0].operator',
          messageKey: 'validation.credentialOperatorInvalid',
        },
      ]);
    });

    it('verlangt bei Vergleichen eine Zahl', () => {
      const field = 'constraint[2].rules[0].value';
      expect(validate({ operator: 'gt', value: '' })).toEqual([
        { field, messageKey: 'validation.credentialValueRequired' },
      ]);
      expect(validate({ operator: 'gt', value: 'vier' })).toEqual([
        { field, messageKey: 'validation.credentialValueNumber' },
      ]);
    });

    it('lehnt Einzelwerte ab, die die Extension als Liste deuten würde oder die {} enthalten', () => {
      for (const value of ['[1]', 'a"b', '{{x}}', ' x', 'x ', 'a\\b']) {
        expect(validate({ value })).toEqual([
          {
            field: 'constraint[2].rules[0].value',
            messageKey: 'validation.credentialValueInvalid',
          },
        ]);
      }
    });

    it('prüft Wertelisten (Pflicht, Format, Duplikate) und ignoriert dabei value', () => {
      const field = 'constraint[2].rules[0].values';
      expect(validate({ operator: 'isAnyOf', value: '', values: [] })).toEqual([
        { field, messageKey: 'validation.credentialValuesRequired' },
      ]);
      expect(validate({ operator: 'isAnyOf', values: ['a', '[b]'] })).toEqual([
        { field, messageKey: 'validation.credentialValueInvalid' },
      ]);
      expect(validate({ operator: 'isAnyOf', values: ['a', 'a'] })).toEqual([
        { field, messageKey: 'validation.credentialValuesDuplicate' },
      ]);
    });

    it('erlaubt bei bekannten Merkmalen nur Werte aus der Auswahl (Arbeitspakete 1–9)', () => {
      const field = 'constraint[2].rules[0].values';
      const memberType = { attributePath: 'memberType', operator: 'isAnyOf' as const, value: '' };
      const workpackages = {
        attributePath: 'workpackages',
        operator: 'isNoneOf' as const,
        value: '',
      };
      expect(validate({ ...memberType, values: ['consortium', 'external'] })).toEqual([]);
      expect(validate({ ...memberType, values: ['consortium', 'partner'] })).toEqual([
        { field, messageKey: 'validation.credentialValueNotAllowed' },
      ]);
      expect(validate({ ...workpackages, values: ['1', '7', '9'] })).toEqual([]);
      for (const value of ['0', '10', '1.5', '-3', '07', 'sieben']) {
        expect(validate({ ...workpackages, values: ['7', value] })).toEqual([
          { field, messageKey: 'validation.credentialValueNotAllowed' },
        ]);
      }
    });

    it('prüft im Expertenmodus ohne Registry (anderer Vergleich als angeboten)', () => {
      expect(validate({ attributePath: 'memberType', operator: 'eq', value: 'partner' })).toEqual(
        [],
      );
    });

    it('nennt die Regel im Fehlerpfad', () => {
      expect(validate({}, { credentialType: '' })[0].field).toBe(
        'constraint[2].rules[1].credentialType',
      );
    });
  });
});

describe('isValidCredentialValue / splitCredentialValues', () => {
  it('erlaubt Leerzeichen im Wert und begrenzt die Länge auf 200 Zeichen', () => {
    expect(isValidCredentialValue('Site Manager')).toBe(true);
    expect(isValidCredentialValue('x'.repeat(200))).toBe(true);
    expect(isValidCredentialValue('x'.repeat(201))).toBe(false);
    expect(isValidCredentialValue('a\nb')).toBe(false);
    expect(isValidCredentialValue(4)).toBe(false);
  });

  it('trennt an Komma und Zeilenumbruch, nicht an Leerzeichen', () => {
    expect(splitCredentialValues(' Bauleitung, Site Manager\nPolier,, ')).toEqual([
      'Bauleitung',
      'Site Manager',
      'Polier',
    ]);
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

describe('splitListInput', () => {
  it('trennt an Komma, Leerzeichen und Zeilenumbruch und verwirft leere Teile', () => {
    expect(splitListInput(' did:web:a.example,did:web:b.example\n did:web:c.example ,, ')).toEqual([
      'did:web:a.example',
      'did:web:b.example',
      'did:web:c.example',
    ]);
  });

  it('liefert für leere Eingabe eine leere Liste', () => {
    expect(splitListInput('   ')).toEqual([]);
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

describe('partitionCandidates (mit validateDidCandidate)', () => {
  it('übernimmt alle gültigen, neuen DIDs in Eingabereihenfolge', () => {
    expect(
      partitionCandidates(['did:web:a.example', 'did:web:b.example'], [], validateDidCandidate),
    ).toEqual({
      accepted: ['did:web:a.example', 'did:web:b.example'],
      rejected: [],
      errorKey: null,
    });
  });

  it('trennt ungültige und bereits vorhandene Kandidaten ab und meldet den ersten Fehler', () => {
    expect(
      partitionCandidates(
        ['did:web:a.example', 'kaputt', 'did:web:B.example'],
        ['did:web:b.example'],
        validateDidCandidate,
      ),
    ).toEqual({
      accepted: ['did:web:a.example'],
      rejected: ['kaputt', 'did:web:B.example'],
      errorKey: 'validation.participantDidInvalid',
    });
  });

  it('erkennt Duplikate innerhalb derselben Eingabe', () => {
    expect(
      partitionCandidates(['did:web:a.example', 'did:web:A.example'], [], validateDidCandidate),
    ).toEqual({
      accepted: ['did:web:a.example'],
      rejected: ['did:web:A.example'],
      errorKey: 'validation.participantDidDuplicate',
    });
  });
});

describe('isValidDataSubsetSelector', () => {
  const valid = [
    'field:materialName',
    'field:materialDetails.weight',
    'attribute:color',
    'record:2027-Q1',
    'submodel:urn:samm:com.example.material:1.0.0#Material',
    'submodel:https://example.com/submodels/qa',
  ];
  const invalid: [string, unknown][] = [
    ['leer', ''],
    ['ohne Bezeichner', 'field:'],
    ['unbekannte Art', 'column:a'],
    ['Art in Großschreibung', 'Field:a'],
    ['ohne Art', 'materialName'],
    ['Komma', 'field:a,field:b'],
    ['Leerzeichen', 'field:a b'],
    ['Interpolations-Delimiter', 'field:{{selectors}}'],
    ['kein String', 42],
  ];

  for (const selector of valid) {
    it(`akzeptiert ${selector}`, () => {
      expect(isValidDataSubsetSelector(selector)).toBe(true);
    });
  }

  for (const [label, value] of invalid) {
    it(`lehnt ab: ${label}`, () => {
      expect(isValidDataSubsetSelector(value)).toBe(false);
    });
  }
});

describe('splitDataSubsetInput', () => {
  it('trennt an Komma und Zeilenumbruch, nicht an Leerzeichen', () => {
    expect(splitDataSubsetInput(' a,b\r\nmaterial name ,, ')).toEqual(['a', 'b', 'material name']);
  });
});

describe('toDataSubsetSelector / parseDataSubsetSelector', () => {
  it('setzt Art und Name zum gespeicherten Selektor zusammen', () => {
    expect(toDataSubsetSelector('field', 'materialName')).toBe('field:materialName');
  });

  it('zerlegt einen Selektor; Doppelpunkte im Namen bleiben erhalten', () => {
    expect(parseDataSubsetSelector('submodel:urn:samm:io.example:1.0.0#Part')).toEqual({
      kind: 'submodel',
      identifier: 'urn:samm:io.example:1.0.0#Part',
    });
  });

  it('liefert null für ungültige Werte', () => {
    expect(parseDataSubsetSelector('spalte:name')).toBeNull();
    expect(parseDataSubsetSelector('field:')).toBeNull();
    expect(parseDataSubsetSelector(42)).toBeNull();
  });
});

describe('validateSelectorCandidate', () => {
  it('liefert null für einen neuen, gültigen Selektor', () => {
    expect(validateSelectorCandidate('field:a', ['field:b'])).toBeNull();
  });

  it('meldet dataSubsetSelectorInvalid für einen ungültigen Selektor', () => {
    expect(validateSelectorCandidate('a', [])).toBe('validation.dataSubsetSelectorInvalid');
  });

  it('meldet dataSubsetSelectorDuplicate für einen bereits vorhandenen Selektor', () => {
    expect(validateSelectorCandidate('field:a', ['field:a'])).toBe(
      'validation.dataSubsetSelectorDuplicate',
    );
  });

  it('erkennt Duplikate innerhalb derselben Eingabe (über partitionCandidates)', () => {
    expect(
      partitionCandidates(['field:a', 'kaputt', 'field:a'], [], validateSelectorCandidate),
    ).toEqual({
      accepted: ['field:a'],
      rejected: ['kaputt', 'field:a'],
      errorKey: 'validation.dataSubsetSelectorInvalid',
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
