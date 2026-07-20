import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { Constraint } from '@shared/types/constraint.model';
import { Policy } from '@shared/types/policy.model';

import { validateConstraint, validatePolicyDraft } from './constraint-validators';

describe('validateConstraint — Bedingungs-Prüfung', () => {
  describe('END_DATE (datumsabhängig, fixe Systemzeit)', () => {
    beforeEach(() => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date('2026-07-17T12:00:00'));
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('meldet endDateRequired bei leerem Datum', () => {
      const errors = validateConstraint({ type: 'END_DATE', endDate: '' });
      expect(errors).toEqual([
        { field: 'constraint[0].endDate', messageKey: 'validation.endDateRequired' },
      ]);
    });

    it('meldet endDateInvalid bei unparsebarem Datum', () => {
      const errors = validateConstraint({ type: 'END_DATE', endDate: 'not-a-date' });
      expect(errors).toContainEqual({
        field: 'constraint[0].endDate',
        messageKey: 'validation.endDateInvalid',
      });
    });

    it('meldet endDateInPast für ein Datum in der Vergangenheit', () => {
      const errors = validateConstraint({ type: 'END_DATE', endDate: '2020-01-01' });
      expect(errors).toContainEqual({
        field: 'constraint[0].endDate',
        messageKey: 'validation.endDateInPast',
      });
    });

    it('akzeptiert das heutige Datum (today auf 00:00 gefloort)', () => {
      expect(validateConstraint({ type: 'END_DATE', endDate: '2026-07-17' })).toEqual([]);
    });

    it('akzeptiert ein Datum in der Zukunft', () => {
      expect(validateConstraint({ type: 'END_DATE', endDate: '2099-12-31' })).toEqual([]);
    });
  });

  describe('USE_CASE', () => {
    it('meldet useCaseRequired bei leerer Liste', () => {
      expect(validateConstraint({ type: 'USE_CASE', useCases: [] })).toEqual([
        { field: 'constraint[0].useCases', messageKey: 'validation.useCaseRequired' },
      ]);
    });

    it('meldet useCaseRequired bei fehlender Liste (undefined)', () => {
      const invalid = { type: 'USE_CASE' } as unknown as Constraint;
      expect(validateConstraint(invalid)).toContainEqual({
        field: 'constraint[0].useCases',
        messageKey: 'validation.useCaseRequired',
      });
    });

    it('ist gültig bei mindestens einem Use-Case', () => {
      expect(validateConstraint({ type: 'USE_CASE', useCases: ['UC.geodata'] })).toEqual([]);
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

  it('interpoliert den Index in das field-Präfix', () => {
    const errors = validateConstraint({ type: 'USE_CASE', useCases: [] }, 3);
    expect(errors[0].field).toBe('constraint[3].useCases');
  });
});

describe('validatePolicyDraft', () => {
  function draft(overrides: Partial<Policy> = {}): Partial<Policy> {
    return { policyId: 'valid-policy', category: 'ACCESS', constraints: [], ...overrides };
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

  it('akzeptiert genau 200 Zeichen und lehnt 201 ab (Grenzwert)', () => {
    expect(validatePolicyDraft(draft({ policyId: 'a'.repeat(200) }))).toEqual([]);
    expect(validatePolicyDraft(draft({ policyId: 'a'.repeat(201) }))).toContainEqual({
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

  it('meldet constraintNotAllowedInCategory für END_DATE unter ACCESS', () => {
    const errors = validatePolicyDraft(
      draft({ category: 'ACCESS', constraints: [{ type: 'END_DATE', endDate: '2099-12-31' }] }),
    );
    expect(errors).toContainEqual({
      field: 'constraint[0]',
      messageKey: 'validation.constraintNotAllowedInCategory',
    });
  });

  it('aggregiert mehrere Fehler (ID + Kategorie + Bedingung)', () => {
    const errors = validatePolicyDraft({
      policyId: '',
      constraints: [{ type: 'USE_CASE', useCases: [] }],
    } as Partial<Policy>);
    const keys = errors.map((e) => e.messageKey);
    expect(keys).toContain('validation.policyIdRequired');
    expect(keys).toContain('validation.categoryRequired');
    expect(keys).toContain('validation.useCaseRequired');
  });
});
