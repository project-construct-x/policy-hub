import { describe, expect, it, vi } from 'vitest';

import { TranslocoService } from '@jsverse/transloco';
import { Constraint } from '@shared/types/constraint.model';
import { Policy } from '@shared/types/policy.model';

import { buildLegalDescription } from './legal-description.helper';

/**
 * Fake-TranslocoService: gibt den i18n-Key deterministisch zurück (bei Parametern als
 * `key[name=wert;...]`). So lässt sich die Kompositionslogik prüfen, ohne an den konkreten
 * de.json-Text zu koppeln — getestet wird, WAS zusammengesetzt wird, nicht die Übersetzung.
 */
function makeTransloco(): TranslocoService {
  return {
    translate: vi.fn((key: string, params?: Record<string, unknown>) => {
      if (!params) return key;
      const vals = Object.entries(params)
        .map(([k, v]) => `${k}=${v}`)
        .join(';');
      return `${key}[${vals}]`;
    }),
  } as unknown as TranslocoService;
}

type Draft = Pick<Policy, 'category' | 'constraints'>;

function draft(category: Policy['category'], constraints: Constraint[]): Draft {
  return { category, constraints };
}

describe('buildLegalDescription', () => {
  describe('ohne Bedingungen', () => {
    it('liefert den "unrestricted"-Text (kategorieunabhängig)', () => {
      const t = makeTransloco();
      expect(buildLegalDescription(draft('ACCESS', []), t)).toBe('legalDescription.unrestricted');
      expect(buildLegalDescription(draft('CONTRACT', []), t)).toBe('legalDescription.unrestricted');
    });
  });

  describe('Intro nach Kategorie', () => {
    it('ACCESS → introAccess', () => {
      const text = buildLegalDescription(
        draft('ACCESS', [{ type: 'MEMBERSHIP', value: 'active' }]),
        makeTransloco(),
      );
      expect(text.startsWith('legalDescription.introAccess')).toBe(true);
    });

    it('CONTRACT → introContract', () => {
      const text = buildLegalDescription(
        draft('CONTRACT', [{ type: 'MEMBERSHIP', value: 'active' }]),
        makeTransloco(),
      );
      expect(text.startsWith('legalDescription.introContract')).toBe(true);
    });
  });

  describe('Klausel je Bedingungstyp', () => {
    it('MEMBERSHIP → nutzt den legalText-Key aus der Metadaten-Registry', () => {
      const text = buildLegalDescription(
        draft('ACCESS', [{ type: 'MEMBERSHIP', value: 'active' }]),
        makeTransloco(),
      );
      expect(text).toContain('constraint.MEMBERSHIP.legalText');
    });

    it('FRAMEWORK_AGREEMENT → interpoliert das agreement', () => {
      const text = buildLegalDescription(
        draft('ACCESS', [{ type: 'FRAMEWORK_AGREEMENT', agreement: 'DataExchangeGovernance' }]),
        makeTransloco(),
      );
      expect(text).toContain(
        'legalDescription.clause.frameworkAgreement[agreement=DataExchangeGovernance]',
      );
    });

    it('END_DATE → interpoliert das formatierte Datum', () => {
      const text = buildLegalDescription(
        draft('CONTRACT', [{ type: 'END_DATE', endDate: '2027-12-31' }]),
        makeTransloco(),
      );
      expect(text).toContain('legalDescription.clause.endDate[date=31.12.2027]');
    });
  });

  describe('Use-Case-Liste (joinList)', () => {
    function useCaseList(useCases: string[]): string {
      const text = buildLegalDescription(
        draft('ACCESS', [{ type: 'USE_CASE', useCases }]),
        makeTransloco(),
      );
      // Übersetzte Labels sind hier `useCase.<id ohne UC.-Präfix>`.
      const match = /legalDescription\.clause\.useCase\[list=(.+?)\]/.exec(text);
      return match![1];
    }

    it('ein Use-Case → nur das Label, kein Trenner', () => {
      expect(useCaseList(['UC.geodata'])).toBe('useCase.geodata');
    });

    it('zwei Use-Cases → mit "&" verbunden', () => {
      expect(useCaseList(['UC.geodata', 'UC.quality'])).toBe('useCase.geodata & useCase.quality');
    });

    it('drei Use-Cases → Komma-getrennt, letztes mit "&"', () => {
      expect(useCaseList(['UC.a', 'UC.b', 'UC.c'])).toBe('useCase.a, useCase.b & useCase.c');
    });
  });

  describe('mehrere Bedingungen (joinClauses)', () => {
    it('verbindet Klauseln mit dem "and"-Konnektor und erhält die Reihenfolge', () => {
      const text = buildLegalDescription(
        draft('CONTRACT', [
          { type: 'MEMBERSHIP', value: 'active' },
          { type: 'END_DATE', endDate: '2027-12-31' },
        ]),
        makeTransloco(),
      );
      expect(text).toContain('legalDescription.and');
      const membershipPos = text.indexOf('constraint.MEMBERSHIP.legalText');
      const endDatePos = text.indexOf('legalDescription.clause.endDate');
      const andPos = text.indexOf('legalDescription.and');
      expect(membershipPos).toBeGreaterThan(-1);
      expect(andPos).toBeGreaterThan(membershipPos);
      expect(endDatePos).toBeGreaterThan(andPos);
    });
  });

  describe('formatDate — Randfälle des rechtlich maßgeblichen Datums', () => {
    it('formatiert YYYY-MM-DD zeitzonenunabhängig zu dd.mm.yyyy', () => {
      const text = buildLegalDescription(
        draft('CONTRACT', [{ type: 'END_DATE', endDate: '2027-01-05' }]),
        makeTransloco(),
      );
      // Regressionsschutz gegen UTC→lokal-Verschiebung (kein Off-by-one auf den 04.01.).
      expect(text).toContain('date=05.01.2027');
    });

    it('leeres Datum → Platzhalter "—"', () => {
      const text = buildLegalDescription(
        draft('CONTRACT', [{ type: 'END_DATE', endDate: '' }]),
        makeTransloco(),
      );
      expect(text).toContain('date=—');
    });

    it('unparsebares Datum → unverändert durchgereicht', () => {
      const text = buildLegalDescription(
        draft('CONTRACT', [{ type: 'END_DATE', endDate: 'not-a-date' }]),
        makeTransloco(),
      );
      expect(text).toContain('date=not-a-date');
    });
  });

  describe('erzwungene Sprache', () => {
    it('reicht den lang-Parameter an Transloco durch (für den rechtlich maßgeblichen de-Text)', () => {
      const t = makeTransloco();
      buildLegalDescription(draft('ACCESS', [{ type: 'MEMBERSHIP', value: 'active' }]), t, 'de');
      expect(t.translate).toHaveBeenCalledWith('legalDescription.introAccess', undefined, 'de');
      expect(t.translate).toHaveBeenCalledWith('constraint.MEMBERSHIP.legalText', undefined, 'de');
    });
  });
});
