import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { Constraint } from '@shared/types/constraint.model';
import { Policy } from '@shared/types/policy.model';

import { validateConstraint, validatePolicyDraft } from './constraint-validators';

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

    it('meldet dateRangeStartInPast für ein Startdatum in der Vergangenheit', () => {
      const errors = validateConstraint({
        type: 'DATE_RANGE',
        startDate: '2020-01-01',
        endDate: '2099-12-31',
      });
      expect(errors).toContainEqual({
        field: 'constraint[0].startDate',
        messageKey: 'validation.dateRangeStartInPast',
      });
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
      constraints: [{ type: 'USE_CASE', useCases: [] }],
    } as Partial<Policy>);
    const keys = errors.map((e) => e.messageKey);
    expect(keys).toContain('validation.policyIdRequired');
    expect(keys).toContain('validation.categoryRequired');
    expect(keys).toContain('validation.useCaseRequired');
  });
});
