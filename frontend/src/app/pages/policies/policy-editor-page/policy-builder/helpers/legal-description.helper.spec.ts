import { describe, expect, it, vi } from 'vitest';

import { TranslocoService } from '@jsverse/transloco';
import { Constraint } from '@shared/types/constraint.model';
import { Policy } from '@shared/types/policy.model';

import { buildLegalClauses, buildLegalDescription } from './legal-description.helper';

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

    it('DATE_RANGE → interpoliert Start- und Enddatum formatiert', () => {
      const text = buildLegalDescription(
        draft('CONTRACT', [{ type: 'DATE_RANGE', startDate: '2026-06-01', endDate: '2027-12-31' }]),
        makeTransloco(),
      );
      expect(text).toContain('legalDescription.clause.dateRange[start=01.06.2026;end=31.12.2027]');
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

  describe('mehrere Bedingungen (nummerierte Liste)', () => {
    it('rendert je Bedingung eine nummerierte Zeile in Reihenfolge, ohne "and"-Konnektor', () => {
      const text = buildLegalDescription(
        draft('CONTRACT', [
          { type: 'MEMBERSHIP', value: 'active' },
          { type: 'DATE_RANGE', startDate: '2026-06-01', endDate: '2027-12-31' },
        ]),
        makeTransloco(),
      );
      // Intro auf eigener Zeile, danach nummerierte Unterpunkte.
      expect(text).toContain('1. constraint.MEMBERSHIP.legalText');
      expect(text).toContain('2. legalDescription.clause.dateRange');
      expect(text).not.toContain('legalDescription.and');
      const clause1Pos = text.indexOf('1. constraint.MEMBERSHIP.legalText');
      const clause2Pos = text.indexOf('2. legalDescription.clause.dateRange');
      expect(clause1Pos).toBeGreaterThan(-1);
      expect(clause2Pos).toBeGreaterThan(clause1Pos);
    });

    it('trennt Einleitung und Klauseln durch Zeilenumbrüche (kein Block-Text)', () => {
      const text = buildLegalDescription(
        draft('CONTRACT', [
          { type: 'MEMBERSHIP', value: 'active' },
          { type: 'FRAMEWORK_AGREEMENT', agreement: 'DataExchangeGovernance' },
        ]),
        makeTransloco(),
      );
      const lines = text.split('\n');
      expect(lines[0]).toBe('legalDescription.introContract');
      expect(lines[1]).toBe('1. constraint.MEMBERSHIP.legalText');
      expect(lines[2].startsWith('2. legalDescription.clause.frameworkAgreement')).toBe(true);
    });
  });

  describe('buildLegalClauses (strukturiert für die Listendarstellung)', () => {
    it('liefert Intro nach Kategorie und je Constraint eine Klausel in Reihenfolge', () => {
      const result = buildLegalClauses(
        draft('ACCESS', [
          { type: 'MEMBERSHIP', value: 'active' },
          { type: 'DATE_RANGE', startDate: '2026-06-01', endDate: '2027-12-31' },
        ]),
        makeTransloco(),
      );
      expect(result.intro).toBe('legalDescription.introAccess');
      expect(result.clauses).toHaveLength(2);
      expect(result.clauses[0]).toBe('constraint.MEMBERSHIP.legalText');
      expect(result.clauses[1]).toContain('legalDescription.clause.dateRange');
    });

    it('liefert bei fehlenden Bedingungen den unrestricted-Text und keine Klauseln', () => {
      const result = buildLegalClauses(draft('CONTRACT', []), makeTransloco());
      expect(result.intro).toBe('legalDescription.unrestricted');
      expect(result.clauses).toEqual([]);
    });

    it('reicht den lang-Parameter durch', () => {
      const t = makeTransloco();
      buildLegalClauses(draft('ACCESS', [{ type: 'MEMBERSHIP', value: 'active' }]), t, 'de');
      expect(t.translate).toHaveBeenCalledWith('legalDescription.introAccess', undefined, 'de');
      expect(t.translate).toHaveBeenCalledWith('constraint.MEMBERSHIP.legalText', undefined, 'de');
    });
  });

  describe('formatDate — Randfälle des rechtlich maßgeblichen Datums', () => {
    it('formatiert YYYY-MM-DD zeitzonenunabhängig zu dd.mm.yyyy', () => {
      const text = buildLegalDescription(
        draft('CONTRACT', [{ type: 'DATE_RANGE', startDate: '2027-01-05', endDate: '2027-02-10' }]),
        makeTransloco(),
      );
      // Regressionsschutz gegen UTC→lokal-Verschiebung (kein Off-by-one auf den 04.01.).
      expect(text).toContain('start=05.01.2027;end=10.02.2027');
    });

    it('leere Datumsangaben → Platzhalter "—"', () => {
      const text = buildLegalDescription(
        draft('CONTRACT', [{ type: 'DATE_RANGE', startDate: '', endDate: '' }]),
        makeTransloco(),
      );
      expect(text).toContain('start=—;end=—');
    });

    it('unparsebares Datum → unverändert durchgereicht', () => {
      const text = buildLegalDescription(
        draft('CONTRACT', [{ type: 'DATE_RANGE', startDate: 'not-a-date', endDate: 'not-a-date' }]),
        makeTransloco(),
      );
      expect(text).toContain('start=not-a-date;end=not-a-date');
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
