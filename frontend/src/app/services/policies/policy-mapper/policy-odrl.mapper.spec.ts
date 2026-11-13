import { describe, expect, it } from 'vitest';

import { Constraint } from '@shared/types/constraint.model';
import { Policy } from '@shared/types/policy.model';

import {
  actionForCategory,
  constraintToOdrl,
  OdrlAndConstraint,
  OdrlAtomicConstraint,
  OdrlOrConstraint,
  policyToOdrl,
} from './policy-odrl.mapper';

const CX_NS = 'https://w3id.org/catenax/2025/9/policy/';

/** Baut eine Policy mit sinnvollen Defaults; nur die relevanten Felder werden pro Test überschrieben. */
function buildPolicy(overrides: Partial<Policy> = {}): Policy {
  return {
    id: 'internal-id-1',
    policyId: 'test-policy',
    category: 'ACCESS',
    constraints: [],
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-02T00:00:00Z',
    ...overrides,
  };
}

/** Die logische Gruppe unter `odrl:constraint` der (einzigen) Permission. */
function constraintGroup(policy: Policy) {
  return policyToOdrl(policy).policy['odrl:permission'][0]['odrl:constraint'];
}

function andGroup(policy: Policy): OdrlAtomicConstraint[] {
  return (constraintGroup(policy) as OdrlAndConstraint)['odrl:and'] as OdrlAtomicConstraint[];
}

describe('actionForCategory', () => {
  it('mappt ACCESS auf die Catena-X-Access-Action', () => {
    expect(actionForCategory('ACCESS')).toBe(`${CX_NS}access`);
  });

  it('mappt CONTRACT auf odrl:use', () => {
    expect(actionForCategory('CONTRACT')).toBe('odrl:use');
  });
});

describe('constraintToOdrl — alle Bedingungstypen', () => {
  it('DATE_RANGE → zwei Atomics: Start (gteq) und Ende (lteq)', () => {
    const c: Constraint = { type: 'DATE_RANGE', startDate: '2026-06-01', endDate: '2027-12-31' };
    expect(constraintToOdrl(c)).toEqual([
      {
        'odrl:leftOperand': { '@id': `${CX_NS}DataUsageStartDate` },
        'odrl:operator': { '@id': 'odrl:gteq' },
        'odrl:rightOperand': '2026-06-01',
      },
      {
        'odrl:leftOperand': { '@id': `${CX_NS}DataUsageEndDate` },
        'odrl:operator': { '@id': 'odrl:lteq' },
        'odrl:rightOperand': '2027-12-31',
      },
    ]);
  });

  it('PARTICIPANT_DID → edc:connector / odrl:eq / komma-getrennter String (wie HTX Connector UI)', () => {
    const c: Constraint = {
      type: 'PARTICIPANT_DID',
      dids: ['did:web:a.example', 'did:web:b.example%3A8443:edc'],
    };
    expect(constraintToOdrl(c)).toEqual([
      {
        'odrl:leftOperand': { '@id': 'edc:connector' },
        'odrl:operator': { '@id': 'odrl:eq' },
        'odrl:rightOperand': 'did:web:a.example,did:web:b.example%3A8443:edc',
      },
    ]);
  });

  it('DATA_SUBSET → Platzhalter-Operand / odrl:isAnyOf / Selektoren als Array', () => {
    const constraint: Constraint = {
      type: 'DATA_SUBSET',
      selectors: ['field:a', 'submodel:urn:x#Y'],
    };
    expect(constraintToOdrl(constraint)).toEqual([
      {
        'odrl:leftOperand': { '@id': 'https://w3id.org/construct-x/policy/DataSubset' },
        'odrl:operator': { '@id': 'odrl:isAnyOf' },
        'odrl:rightOperand': ['field:a', 'submodel:urn:x#Y'],
      },
    ]);
  });
});

describe('policyToOdrl — Envelope & Kombinationen', () => {
  it('erzeugt ein standardkonformes PolicyDefinition-Envelope', () => {
    const result = policyToOdrl(buildPolicy({ policyId: 'my-policy', category: 'CONTRACT' }));
    expect(result['@type']).toBe('PolicyDefinition');
    expect(result['@id']).toBe('my-policy');
    expect(result['@context']).toEqual({
      '@vocab': 'https://w3id.org/edc/v0.0.1/ns/',
      edc: 'https://w3id.org/edc/v0.0.1/ns/',
      odrl: 'http://www.w3.org/ns/odrl/2/',
    });
    expect(result.policy['@context']).toBe('http://www.w3.org/ns/odrl.jsonld');
    expect(result.policy['@type']).toBe('Set');
    expect(result.policy['odrl:permission']).toHaveLength(1);
    expect(result.policy['odrl:prohibition']).toEqual([]);
    expect(result.policy['odrl:obligation']).toEqual([]);
  });

  it('nutzt policyId (nicht die interne id) als @id', () => {
    const result = policyToOdrl(buildPolicy({ id: 'internal-xyz', policyId: 'fachlich-abc' }));
    expect(result['@id']).toBe('fachlich-abc');
  });

  it('leitet die Action aus der Kategorie ab (ACCESS)', () => {
    const result = policyToOdrl(buildPolicy({ category: 'ACCESS' }));
    expect(result.policy['odrl:permission'][0]['odrl:action']).toEqual({ '@id': `${CX_NS}access` });
  });

  it('leitet die Action aus der Kategorie ab (CONTRACT)', () => {
    const result = policyToOdrl(buildPolicy({ category: 'CONTRACT' }));
    expect(result.policy['odrl:permission'][0]['odrl:action']).toEqual({ '@id': 'odrl:use' });
  });

  it('lässt odrl:constraint bei 0 Bedingungen komplett weg', () => {
    const permission = policyToOdrl(buildPolicy({ constraints: [] })).policy['odrl:permission'][0];
    expect(permission['odrl:constraint']).toBeUndefined();
    expect(Object.keys(permission)).toEqual(['odrl:action']);
  });

  it('verpackt eine einzelne Bedingung dennoch in ein odrl:and-Array', () => {
    const policy = buildPolicy({
      constraints: [{ type: 'PARTICIPANT_DID', dids: ['did:web:a.example'] }],
    });
    expect(constraintGroup(policy)).toBeDefined();
    expect(andGroup(policy)).toHaveLength(1);
    expect(andGroup(policy)[0]['odrl:leftOperand']).toEqual({ '@id': 'edc:connector' });
  });

  it('kombiniert mehrere Bedingungen (alle Typen) unter odrl:and und erhält die Reihenfolge', () => {
    const constraints: Constraint[] = [
      { type: 'PARTICIPANT_DID', dids: ['did:web:a.example'] },
      { type: 'DATE_RANGE', startDate: '2026-09-01', endDate: '2028-03-31' },
      { type: 'DATA_SUBSET', selectors: ['field:a'] },
    ];
    const policy = buildPolicy({ category: 'CONTRACT', constraints });
    const atomics = andGroup(policy);

    // DATE_RANGE wird zu zwei Atomics (Start + Ende) aufgefächert → 4 gesamt.
    expect(atomics).toHaveLength(4);
    expect(atomics.map((a) => a['odrl:leftOperand']['@id'])).toEqual([
      'edc:connector',
      `${CX_NS}DataUsageStartDate`,
      `${CX_NS}DataUsageEndDate`,
      'https://w3id.org/construct-x/policy/DataSubset',
    ]);
    expect(atomics.map((a) => a['odrl:operator']['@id'])).toEqual([
      'odrl:eq',
      'odrl:gteq',
      'odrl:lteq',
      'odrl:isAnyOf',
    ]);
  });
});

describe('policyToOdrl — logische Verknüpfung (UND/ODER)', () => {
  const participant: Constraint = { type: 'PARTICIPANT_DID', dids: ['did:web:a.example'] };
  const dateRange: Constraint = {
    type: 'DATE_RANGE',
    startDate: '2026-06-01',
    endDate: '2027-12-31',
  };

  it('nutzt ohne logicalOperator (Altdaten) odrl:and', () => {
    const policy = buildPolicy({ constraints: [participant, dateRange] });
    expect(constraintGroup(policy)).toHaveProperty('odrl:and');
    expect(constraintGroup(policy)).not.toHaveProperty('odrl:or');
  });

  it('nutzt bei AND odrl:and und lässt DATE_RANGE flach (unverändert zur bisherigen Ausgabe)', () => {
    const policy = buildPolicy({ logicalOperator: 'AND', constraints: [participant, dateRange] });
    expect(constraintGroup(policy)).toEqual({
      'odrl:and': [...constraintToOdrl(participant), ...constraintToOdrl(dateRange)],
    });
  });

  it('verschachtelt DATE_RANGE bei OR als inneres odrl:and (Start UND Ende)', () => {
    const policy = buildPolicy({ logicalOperator: 'OR', constraints: [participant, dateRange] });
    const nodes = (constraintGroup(policy) as OdrlOrConstraint)['odrl:or'];

    expect(nodes).toHaveLength(2);
    expect(nodes[0]).toEqual(constraintToOdrl(participant)[0]);
    expect(nodes[1]).toEqual({ 'odrl:and': constraintToOdrl(dateRange) });
  });

  it('verpackt bei OR auch eine einzelne Bedingung in odrl:or', () => {
    const policy = buildPolicy({ logicalOperator: 'OR', constraints: [participant] });
    expect(constraintGroup(policy)).toEqual({ 'odrl:or': constraintToOdrl(participant) });
  });

  it('lässt odrl:constraint bei OR ohne Bedingungen komplett weg', () => {
    const policy = buildPolicy({ logicalOperator: 'OR', constraints: [] });
    expect(constraintGroup(policy)).toBeUndefined();
  });

  describe('DATA_SUBSET gilt immer (auch bei OR)', () => {
    const subset: Constraint = { type: 'DATA_SUBSET', selectors: ['field:a'] };

    it('AND → flach in odrl:and in gespeicherter Reihenfolge', () => {
      const policy = buildPolicy({ logicalOperator: 'AND', constraints: [participant, subset] });
      expect(constraintGroup(policy)).toEqual({
        'odrl:and': [...constraintToOdrl(participant), ...constraintToOdrl(subset)],
      });
    });

    it('OR → odrl:or der Voraussetzungen, per äußerem odrl:and mit dem Teildatensatz verknüpft', () => {
      const policy = buildPolicy({
        logicalOperator: 'OR',
        constraints: [subset, participant, dateRange],
      });
      expect(constraintGroup(policy)).toEqual({
        'odrl:and': [
          {
            'odrl:or': [
              constraintToOdrl(participant)[0],
              { 'odrl:and': constraintToOdrl(dateRange) },
            ],
          },
          ...constraintToOdrl(subset),
        ],
      });
    });

    it('OR mit nur einer Voraussetzung → flach in odrl:and', () => {
      const policy = buildPolicy({ logicalOperator: 'OR', constraints: [dateRange, subset] });
      expect(constraintGroup(policy)).toEqual({
        'odrl:and': [...constraintToOdrl(dateRange), ...constraintToOdrl(subset)],
      });
    });

    it('OR ohne weitere Voraussetzung → nur der Teildatensatz in odrl:and', () => {
      const policy = buildPolicy({ logicalOperator: 'OR', constraints: [subset] });
      expect(constraintGroup(policy)).toEqual({ 'odrl:and': constraintToOdrl(subset) });
    });
  });
});
