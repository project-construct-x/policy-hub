import { describe, expect, it } from 'vitest';

import { Constraint } from '@shared/types/constraint.model';
import { Policy } from '@shared/types/policy.model';

import { actionForCategory, constraintToOdrl, policyToOdrl } from './policy-odrl.mapper';

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

describe('actionForCategory', () => {
  it('mappt ACCESS auf die Catena-X-Access-Action', () => {
    expect(actionForCategory('ACCESS')).toBe(`${CX_NS}access`);
  });

  it('mappt CONTRACT auf odrl:use', () => {
    expect(actionForCategory('CONTRACT')).toBe('odrl:use');
  });
});

describe('constraintToOdrl — alle Bedingungstypen', () => {
  it('MEMBERSHIP → Membership / odrl:eq / String-rightOperand', () => {
    const c: Constraint = { type: 'MEMBERSHIP', value: 'active' };
    expect(constraintToOdrl(c)).toEqual({
      'odrl:leftOperand': { '@id': `${CX_NS}Membership` },
      'odrl:operator': { '@id': 'odrl:eq' },
      'odrl:rightOperand': 'active',
    });
  });

  it('USE_CASE → UsagePurpose / odrl:isAnyOf / Array-rightOperand', () => {
    const c: Constraint = { type: 'USE_CASE', useCases: ['UC.quality-assurance', 'UC.geodata'] };
    const result = constraintToOdrl(c);
    expect(result['odrl:leftOperand']).toEqual({ '@id': `${CX_NS}UsagePurpose` });
    expect(result['odrl:operator']).toEqual({ '@id': 'odrl:isAnyOf' });
    expect(result['odrl:rightOperand']).toEqual(['UC.quality-assurance', 'UC.geodata']);
    expect(Array.isArray(result['odrl:rightOperand'])).toBe(true);
  });

  it('END_DATE → DataUsageEndDate / odrl:eq / String-rightOperand', () => {
    const c: Constraint = { type: 'END_DATE', endDate: '2027-12-31' };
    expect(constraintToOdrl(c)).toEqual({
      'odrl:leftOperand': { '@id': `${CX_NS}DataUsageEndDate` },
      'odrl:operator': { '@id': 'odrl:eq' },
      'odrl:rightOperand': '2027-12-31',
    });
  });

  it('FRAMEWORK_AGREEMENT → FrameworkAgreement / odrl:eq / String-rightOperand', () => {
    const c: Constraint = { type: 'FRAMEWORK_AGREEMENT', agreement: 'DataExchangeGovernance' };
    expect(constraintToOdrl(c)).toEqual({
      'odrl:leftOperand': { '@id': `${CX_NS}FrameworkAgreement` },
      'odrl:operator': { '@id': 'odrl:eq' },
      'odrl:rightOperand': 'DataExchangeGovernance',
    });
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
    const policy = buildPolicy({ constraints: [{ type: 'MEMBERSHIP', value: 'active' }] });
    const permission = policyToOdrl(policy).policy['odrl:permission'][0];
    expect(permission['odrl:constraint']).toBeDefined();
    expect(permission['odrl:constraint']!['odrl:and']).toHaveLength(1);
    expect(permission['odrl:constraint']!['odrl:and'][0]['odrl:leftOperand']).toEqual({
      '@id': `${CX_NS}Membership`,
    });
  });

  it('kombiniert mehrere Bedingungen (alle Typen) unter odrl:and und erhält die Reihenfolge', () => {
    const constraints: Constraint[] = [
      { type: 'MEMBERSHIP', value: 'active' },
      { type: 'USE_CASE', useCases: ['UC.geodata'] },
      { type: 'FRAMEWORK_AGREEMENT', agreement: 'DataExchangeGovernance' },
      { type: 'END_DATE', endDate: '2028-03-31' },
    ];
    const policy = buildPolicy({ category: 'CONTRACT', constraints });
    const group = policyToOdrl(policy).policy['odrl:permission'][0]['odrl:constraint']!;

    expect(group['odrl:and']).toHaveLength(4);
    expect(group['odrl:and'].map((a) => a['odrl:leftOperand']['@id'])).toEqual([
      `${CX_NS}Membership`,
      `${CX_NS}UsagePurpose`,
      `${CX_NS}FrameworkAgreement`,
      `${CX_NS}DataUsageEndDate`,
    ]);
    // Jede Bedingung wird zu genau einem Atomic gemappt.
    expect(group['odrl:and'].map((a) => a['odrl:operator']['@id'])).toEqual([
      'odrl:eq',
      'odrl:isAnyOf',
      'odrl:eq',
      'odrl:eq',
    ]);
  });
});
