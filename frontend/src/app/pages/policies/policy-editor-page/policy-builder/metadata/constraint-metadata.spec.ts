import { describe, expect, it } from 'vitest';

import { buildDefaultConstraint, getAllowedConstraintTypes } from './constraint-metadata';

describe('getAllowedConstraintTypes', () => {
  it('schließt END_DATE für ACCESS aus', () => {
    const allowed = getAllowedConstraintTypes('ACCESS');
    expect(allowed).toEqual(['MEMBERSHIP', 'USE_CASE', 'FRAMEWORK_AGREEMENT']);
    expect(allowed).not.toContain('END_DATE');
  });

  it('erlaubt alle vier Typen für CONTRACT', () => {
    expect(getAllowedConstraintTypes('CONTRACT')).toEqual([
      'MEMBERSHIP',
      'USE_CASE',
      'END_DATE',
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

  it('END_DATE → leeres Datum (per Validator ungültig, bis Nutzer eins wählt)', () => {
    expect(buildDefaultConstraint('END_DATE')).toEqual({ type: 'END_DATE', endDate: '' });
  });

  it('FRAMEWORK_AGREEMENT → Default-Agreement DataExchangeGovernance', () => {
    expect(buildDefaultConstraint('FRAMEWORK_AGREEMENT')).toEqual({
      type: 'FRAMEWORK_AGREEMENT',
      agreement: 'DataExchangeGovernance',
    });
  });
});
