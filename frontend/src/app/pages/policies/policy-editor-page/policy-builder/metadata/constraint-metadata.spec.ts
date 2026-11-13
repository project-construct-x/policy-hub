import { describe, expect, it } from 'vitest';

import { Constraint } from '@shared/types/constraint.model';

import {
  ALL_CONSTRAINT_TYPES,
  buildDefaultConstraint,
  connectorKeyAfter,
  getAllowedConstraintTypes,
  isKnownConstraintType,
  keepKnownConstraints,
  orderConstraints,
} from './constraint-metadata';

describe('getAllowedConstraintTypes', () => {
  it('erlaubt alle Typen (inkl. DATE_RANGE) für ACCESS', () => {
    expect(getAllowedConstraintTypes('ACCESS')).toEqual([
      'DATE_RANGE',
      'PARTICIPANT_DID',
      'DATA_SUBSET',
    ]);
  });

  it('erlaubt alle Typen für CONTRACT', () => {
    expect(getAllowedConstraintTypes('CONTRACT')).toEqual([
      'DATE_RANGE',
      'PARTICIPANT_DID',
      'DATA_SUBSET',
    ]);
  });
});

describe('buildDefaultConstraint', () => {
  it('DATE_RANGE → leere Datumsangaben (per Validator ungültig, bis Nutzer welche wählt)', () => {
    expect(buildDefaultConstraint('DATE_RANGE')).toEqual({
      type: 'DATE_RANGE',
      startDate: '',
      endDate: '',
    });
  });

  it('PARTICIPANT_DID → leere Liste (per Validator ungültig, bis Nutzer DIDs ergänzt)', () => {
    expect(buildDefaultConstraint('PARTICIPANT_DID')).toEqual({
      type: 'PARTICIPANT_DID',
      dids: [],
    });
  });

  it('DATA_SUBSET → leere Liste (per Validator ungültig, bis Nutzer Selektoren ergänzt)', () => {
    expect(buildDefaultConstraint('DATA_SUBSET')).toEqual({ type: 'DATA_SUBSET', selectors: [] });
  });
});

describe('orderConstraints', () => {
  it('stellt immer geltende Constraints (DATA_SUBSET) stabil ans Ende', () => {
    const subset: Constraint = { type: 'DATA_SUBSET', selectors: ['field:a'] };
    const dateRange: Constraint = { type: 'DATE_RANGE', startDate: '', endDate: '' };
    const did: Constraint = { type: 'PARTICIPANT_DID', dids: ['did:web:a.example'] };

    expect(orderConstraints([subset, dateRange, did])).toEqual([dateRange, did, subset]);
  });

  it('lässt die Reihenfolge ohne immer geltende Constraints unverändert', () => {
    const list: Constraint[] = [
      { type: 'PARTICIPANT_DID', dids: [] },
      { type: 'DATE_RANGE', startDate: '', endDate: '' },
    ];
    expect(orderConstraints(list)).toEqual(list);
  });
});

describe('connectorKeyAfter', () => {
  const list: Constraint[] = [
    { type: 'DATE_RANGE', startDate: '', endDate: '' },
    { type: 'PARTICIPANT_DID', dids: [] },
    { type: 'DATA_SUBSET', selectors: [] },
  ];

  it('AND → überall UND', () => {
    expect(connectorKeyAfter(list, 0, 'AND')).toBe('policyBuilder.andConnector');
    expect(connectorKeyAfter(list, 1, 'AND')).toBe('policyBuilder.andConnector');
  });

  it('OR → ODER zwischen Voraussetzungen, UND vor dem Teildatensatz', () => {
    expect(connectorKeyAfter(list, 0, 'OR')).toBe('policyBuilder.orConnector');
    expect(connectorKeyAfter(list, 1, 'OR')).toBe('policyBuilder.andConnector');
  });

  it('OR → UND auch nach einem Teildatensatz', () => {
    const subsetFirst: Constraint[] = [list[2], list[0]];
    expect(connectorKeyAfter(subsetFirst, 0, 'OR')).toBe('policyBuilder.andConnector');
  });
});

/**
 * `CONSTRAINT_METADATA` ist als `Record<ConstraintType, …>` typisiert — das gilt aber nur
 * zur Compile-Zeit. Constraints kommen auch aus `GET /v1/policies/:id` und sind damit
 * ungeprüfte Eingabe; ein unbekannter Typ liefert beim Index-Zugriff `undefined`.
 */
describe('isKnownConstraintType / keepKnownConstraints', () => {
  it('erkennt alle registrierten Typen', () => {
    for (const type of ALL_CONSTRAINT_TYPES) {
      expect(isKnownConstraintType(type)).toBe(true);
    }
  });

  it('weist einen unbekannten Typ ab', () => {
    expect(isKnownConstraintType('FOO')).toBe(false);
  });

  it('lässt sich nicht von geerbten Object-Properties täuschen', () => {
    // Ohne hasOwnProperty würde `'constructor' in CONSTRAINT_METADATA` true liefern.
    expect(isKnownConstraintType('constructor')).toBe(false);
    expect(isKnownConstraintType('toString')).toBe(false);
    expect(isKnownConstraintType('__proto__')).toBe(false);
  });

  it('filtert unbekannte Constraints heraus und erhält die bekannten', () => {
    const constraints = [
      { type: 'PARTICIPANT_DID', dids: ['did:web:a.example'] },
      { type: 'FOO' },
      { type: 'DATE_RANGE', startDate: '2027-01-01', endDate: '2027-12-31' },
    ] as unknown as Constraint[];

    expect(keepKnownConstraints(constraints)).toEqual([
      { type: 'PARTICIPANT_DID', dids: ['did:web:a.example'] },
      { type: 'DATE_RANGE', startDate: '2027-01-01', endDate: '2027-12-31' },
    ]);
  });
});
