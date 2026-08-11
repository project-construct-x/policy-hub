import { describe, expect, it, vi, type MockedFunction } from 'vitest';

import { TranslocoService } from '@jsverse/transloco';
import { Constraint } from '@shared/types/constraint.model';
import { Policy } from '@shared/types/policy.model';
import { FRAMEWORK_AGREEMENT_VALUE } from '@features/policies/builder/metadata/use-case-options.data';

import {
  buildLegalClauses,
  buildLegalDescription,
  hasDivergingLegalText,
} from './legal-description.helper';

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
    // Nur IDs aus USE_CASE_OPTIONS verwenden: unbekannte IDs werden bewusst zu "—"
    // zusammengefaltet (siehe "Schutz vor Transloco-Parameter-Injection") und würden
    // die Trennlogik hier nicht mehr sichtbar machen.
    function useCaseList(useCases: string[]): string {
      const text = buildLegalDescription(
        draft('ACCESS', [{ type: 'USE_CASE', useCases }]),
        makeTransloco(),
      );
      // Übersetzte Labels sind hier der i18n-Key aus der Registry, also `useCase.<id>`.
      const match = /legalDescription\.clause\.useCase\[list=(.+?)\]/.exec(text);
      return match![1];
    }

    it('ein Use-Case → nur das Label, kein Trenner', () => {
      expect(useCaseList(['UC.geodata'])).toBe('useCase.geodata');
    });

    it('zwei Use-Cases → mit "&" verbunden', () => {
      expect(useCaseList(['UC.geodata', 'UC.quality-assurance'])).toBe(
        'useCase.geodata & useCase.quality-assurance',
      );
    });

    it('drei Use-Cases → Komma-getrennt, letztes mit "&"', () => {
      expect(useCaseList(['UC.geodata', 'UC.material-testing', 'UC.bim-coordination'])).toBe(
        'useCase.geodata, useCase.material-testing & useCase.bim-coordination',
      );
    });
  });

  describe('mehrere Bedingungen (nummerierte Liste mit Titel + Text)', () => {
    it('rendert je Bedingung einen nummerierten Unterpunkt (Titel) mit Text, in Reihenfolge', () => {
      const text = buildLegalDescription(
        draft('CONTRACT', [
          { type: 'MEMBERSHIP', value: 'active' },
          { type: 'DATE_RANGE', startDate: '2026-06-01', endDate: '2027-12-31' },
        ]),
        makeTransloco(),
      );
      // Nummer + Constraint-Name als Überschrift, darunter der Beschreibungstext.
      expect(text).toContain('1. constraint.MEMBERSHIP.label');
      expect(text).toContain('2. constraint.DATE_RANGE.label');
      expect(text).toContain('constraint.MEMBERSHIP.legalText');
      expect(text).toContain('legalDescription.clause.dateRange');
      expect(text).not.toContain('legalDescription.and');
      const clause1Pos = text.indexOf('1. constraint.MEMBERSHIP.label');
      const clause2Pos = text.indexOf('2. constraint.DATE_RANGE.label');
      expect(clause1Pos).toBeGreaterThan(-1);
      expect(clause2Pos).toBeGreaterThan(clause1Pos);
    });

    it('trennt Einleitung, Titel und Text durch Zeilenumbrüche (kein Block-Text)', () => {
      const text = buildLegalDescription(
        draft('CONTRACT', [
          { type: 'MEMBERSHIP', value: 'active' },
          { type: 'FRAMEWORK_AGREEMENT', agreement: 'DataExchangeGovernance' },
        ]),
        makeTransloco(),
      );
      const lines = text.split('\n');
      expect(lines[0]).toBe('legalDescription.introContract');
      expect(lines[1]).toBe(''); // Leerzeile zwischen Intro und erstem Unterpunkt
      expect(lines[2]).toBe('1. constraint.MEMBERSHIP.label');
      expect(lines[3]).toBe('constraint.MEMBERSHIP.legalText');
      expect(lines[4]).toBe(''); // Leerzeile zwischen den Unterpunkten
      expect(lines[5]).toBe('2. constraint.FRAMEWORK_AGREEMENT.label');
      expect(lines[6].startsWith('legalDescription.clause.frameworkAgreement')).toBe(true);
    });
  });

  describe('buildLegalClauses (strukturiert für die Listendarstellung)', () => {
    it('liefert Intro nach Kategorie und je Constraint Titel + Text in Reihenfolge', () => {
      const result = buildLegalClauses(
        draft('ACCESS', [
          { type: 'MEMBERSHIP', value: 'active' },
          { type: 'DATE_RANGE', startDate: '2026-06-01', endDate: '2027-12-31' },
        ]),
        makeTransloco(),
      );
      expect(result.intro).toBe('legalDescription.introAccess');
      expect(result.clauses).toHaveLength(2);
      expect(result.clauses[0]).toEqual({
        title: 'constraint.MEMBERSHIP.label',
        text: 'constraint.MEMBERSHIP.legalText',
      });
      expect(result.clauses[1].title).toBe('constraint.DATE_RANGE.label');
      expect(result.clauses[1].text).toContain('legalDescription.clause.dateRange');
    });

    it('liefert bei fehlenden Bedingungen den unrestricted-Text und keine Klauseln', () => {
      const result = buildLegalClauses(draft('CONTRACT', []), makeTransloco());
      expect(result.intro).toBe('legalDescription.unrestricted');
      expect(result.clauses).toEqual([]);
    });

    it('reicht den lang-Parameter durch (Titel und Text)', () => {
      const t = makeTransloco();
      buildLegalClauses(draft('ACCESS', [{ type: 'MEMBERSHIP', value: 'active' }]), t, 'de');
      expect(t.translate).toHaveBeenCalledWith('legalDescription.introAccess', undefined, 'de');
      expect(t.translate).toHaveBeenCalledWith('constraint.MEMBERSHIP.label', undefined, 'de');
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

    it('unparsebares Datum → Platzhalter "—" statt Rohwert', () => {
      const text = buildLegalDescription(
        draft('CONTRACT', [{ type: 'DATE_RANGE', startDate: 'not-a-date', endDate: 'not-a-date' }]),
        makeTransloco(),
      );
      expect(text).toContain('start=—;end=—');
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

  /**
   * Transloco durchsucht das Ergebnis einer Ersetzung ERNEUT nach Platzhaltern:
   * `DefaultTranspiler.transpile()` läuft in einer `while`-Schleife über den bereits
   * ersetzten String, und `interpolationMatcher` ist ein Getter, der jedes Mal ein
   * frisches RegExp mit `lastIndex = 0` liefert. Ein Parameterwert, der selbst
   * `{{…}}` enthält, wird dadurch ein zweites Mal aufgelöst — im Fall
   * `{{agreement}}` → `{{agreement}}` ändert sich der String nie und die Schleife
   * terminiert nicht (eingefrorener Browser-Tab).
   *
   * Constraint-Werte stammen nicht nur aus der UI, sondern auch aus
   * `GET /v1/policies/:id`. Deshalb die Invariante: an `translate()` darf weder als
   * Key noch als Parameterwert jemals ein Interpolations-Delimiter gelangen.
   */
  describe('Schutz vor Transloco-Parameter-Injection', () => {
    const HOSTILE = '{{agreement}}';

    function argumentsPassedTo(t: TranslocoService): string[] {
      const calls = (t.translate as unknown as MockedFunction<TranslocoService['translate']>).mock
        .calls;
      return calls.flatMap(([key, params]) => [
        String(key),
        ...(params ? Object.values(params).map((v) => String(v)) : []),
      ]);
    }

    const hostileConstraints: [string, Constraint][] = [
      ['FRAMEWORK_AGREEMENT.agreement', { type: 'FRAMEWORK_AGREEMENT', agreement: HOSTILE }],
      ['USE_CASE.useCases', { type: 'USE_CASE', useCases: [HOSTILE] }],
      ['DATE_RANGE.startDate', { type: 'DATE_RANGE', startDate: HOSTILE, endDate: '2027-01-01' }],
      ['DATE_RANGE.endDate', { type: 'DATE_RANGE', startDate: '2027-01-01', endDate: HOSTILE }],
    ];

    for (const [label, constraint] of hostileConstraints) {
      it(`reicht keinen Interpolations-Delimiter an Transloco weiter: ${label}`, () => {
        const t = makeTransloco();
        buildLegalDescription(draft('CONTRACT', [constraint]), t, 'de');

        for (const arg of argumentsPassedTo(t)) {
          expect(arg).not.toContain('{{');
          expect(arg).not.toContain('}}');
        }
      });
    }

    it('ersetzt einen unbekannten Rahmenvertrag durch den Platzhalter "—"', () => {
      const text = buildLegalDescription(
        draft('CONTRACT', [{ type: 'FRAMEWORK_AGREEMENT', agreement: 'FremderVertrag' }]),
        makeTransloco(),
      );
      expect(text).toContain('agreement=—');
    });

    it('ersetzt einen unbekannten Use-Case durch den Platzhalter "—"', () => {
      const text = buildLegalDescription(
        draft('CONTRACT', [{ type: 'USE_CASE', useCases: ['UC.gibt-es-nicht'] }]),
        makeTransloco(),
      );
      expect(text).toContain('list=—');
    });

    it('lässt bekannte Werte unverändert', () => {
      const text = buildLegalDescription(
        draft('CONTRACT', [
          { type: 'FRAMEWORK_AGREEMENT', agreement: FRAMEWORK_AGREEMENT_VALUE },
          { type: 'USE_CASE', useCases: ['UC.quality-assurance', 'UC.geodata'] },
        ]),
        makeTransloco(),
      );
      expect(text).toContain(`agreement=${FRAMEWORK_AGREEMENT_VALUE}`);
      expect(text).toContain('list=useCase.quality-assurance & useCase.geodata');
    });
  });
});

describe('buildLegalClauses — unbekannter Constraint-Typ aus der API', () => {
  const unknownConstraint = { type: 'FOO' } as unknown as Constraint;

  it('übergeht den unbekannten Typ, statt beim Metadaten-Zugriff zu werfen', () => {
    const { clauses } = buildLegalClauses(
      draft('CONTRACT', [unknownConstraint, { type: 'MEMBERSHIP', value: 'active' }]),
      makeTransloco(),
    );

    expect(clauses).toHaveLength(1);
    expect(clauses[0].title).toBe('constraint.MEMBERSHIP.label');
  });

  it('fällt auf den "unrestricted"-Text zurück, wenn nur unbekannte Typen übrig bleiben', () => {
    const { intro, clauses } = buildLegalClauses(
      draft('CONTRACT', [unknownConstraint]),
      makeTransloco(),
    );

    expect(intro).toBe('legalDescription.unrestricted');
    expect(clauses).toEqual([]);
  });
});

describe('hasDivergingLegalText', () => {
  const policy: Pick<Policy, 'category' | 'constraints' | 'legalText'> = {
    category: 'ACCESS',
    constraints: [{ type: 'MEMBERSHIP', value: 'active' }],
  };

  /** Genau der Text, den PolicyBuilderComponent.submit() beim Speichern mitschickt. */
  function derived(): string {
    return buildLegalDescription(policy, makeTransloco(), 'de');
  }

  it('meldet keine Abweichung, wenn der gespeicherte Text der abgeleitete ist', () => {
    expect(hasDivergingLegalText({ ...policy, legalText: derived() }, makeTransloco())).toBe(false);
  });

  it('meldet eine Abweichung, wenn der gespeicherte Text nicht zu den Constraints passt', () => {
    expect(
      hasDivergingLegalText(
        { ...policy, legalText: 'Die Nutzung der Daten ist uneingeschränkt gestattet.' },
        makeTransloco(),
      ),
    ).toBe(true);
  });

  it('meldet eine Abweichung, wenn die Constraints nachträglich verändert wurden', () => {
    // Gespeicherter Text passt zur MEMBERSHIP-Policy, die Constraints sagen inzwischen
    // etwas anderes — der Fall, den die Detailseite sonst stillschweigend überschreiben würde.
    expect(
      hasDivergingLegalText(
        {
          category: 'ACCESS',
          constraints: [{ type: 'FRAMEWORK_AGREEMENT', agreement: FRAMEWORK_AGREEMENT_VALUE }],
          legalText: derived(),
        },
        makeTransloco(),
      ),
    ).toBe(true);
  });

  it('meldet nichts, wenn kein Text gespeichert ist (ältere Datensätze)', () => {
    expect(hasDivergingLegalText(policy, makeTransloco())).toBe(false);
    expect(hasDivergingLegalText({ ...policy, legalText: undefined }, makeTransloco())).toBe(false);
  });

  it('behandelt einen leeren gespeicherten Text als Abweichung', () => {
    expect(hasDivergingLegalText({ ...policy, legalText: '' }, makeTransloco())).toBe(true);
  });
});
