import { describe, expect, it } from 'vitest';

import { buildDefaultConstraint, getAllowedConstraintTypes } from './constraint-metadata';

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
