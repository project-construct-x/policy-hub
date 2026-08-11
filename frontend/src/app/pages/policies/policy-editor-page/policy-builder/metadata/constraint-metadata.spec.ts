import { describe, expect, it } from 'vitest';

import { Constraint } from '@shared/types/constraint.model';

import {
  ALL_CONSTRAINT_TYPES,
  buildDefaultConstraint,
  getAllowedConstraintTypes,
  isKnownConstraintType,
  keepKnownConstraints,
} from './constraint-metadata';

describe('getAllowedConstraintTypes', () => {
  it('erlaubt alle vier Typen (inkl. DATE_RANGE) für ACCESS', () => {
    expect(getAllowedConstraintTypes('ACCESS')).toEqual([
      'MEMBERSHIP',
      'USE_CASE',
      'DATE_RANGE',
      'FRAMEWORK_AGREEMENT',
    ]);
  });

  it('erlaubt alle vier Typen für CONTRACT', () => {
    expect(getAllowedConstraintTypes('CONTRACT')).toEqual([
      'MEMBERSHIP',
      'USE_CASE',
      'DATE_RANGE',
      'FRAMEWORK_AGREEMENT',
    ]);
  });
});

describe('buildDefaultConstraint', () => {
  it('MEMBERSHIP → value "active"', () => {
    expect(buildDefaultConstraint('MEMBERSHIP')).toEqual({ type: 'MEMBERSHIP', value: 'active' });
  });

  it('USE_CASE → leere useCases-Liste', () => {
    expect(buildDefaultConstraint('USE_CASE')).toEqual({ type: 'USE_CASE', useCases: [] });
  });

  it('DATE_RANGE → leere Datumsangaben (per Validator ungültig, bis Nutzer welche wählt)', () => {
    expect(buildDefaultConstraint('DATE_RANGE')).toEqual({
      type: 'DATE_RANGE',
      startDate: '',
      endDate: '',
    });
  });

  it('FRAMEWORK_AGREEMENT → Default-Agreement DataExchangeGovernance', () => {
    expect(buildDefaultConstraint('FRAMEWORK_AGREEMENT')).toEqual({
      type: 'FRAMEWORK_AGREEMENT',
      agreement: 'DataExchangeGovernance',
    });
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
      { type: 'MEMBERSHIP', value: 'active' },
      { type: 'FOO' },
      { type: 'DATE_RANGE', startDate: '2027-01-01', endDate: '2027-12-31' },
    ] as unknown as Constraint[];

    expect(keepKnownConstraints(constraints)).toEqual([
      { type: 'MEMBERSHIP', value: 'active' },
      { type: 'DATE_RANGE', startDate: '2027-01-01', endDate: '2027-12-31' },
    ]);
  });
});
