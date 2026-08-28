import { describe, expect, it } from 'vitest';

import { emptyPage, normalizePage } from './page.helper';

describe('normalizePage', () => {
  it('übernimmt eine valide Page unverändert', () => {
    const body = {
      content: [{ id: '1' }],
      totalElements: 7,
      totalPages: 1,
      size: 8,
      number: 0,
      numberOfElements: 1,
      first: true,
      last: true,
      empty: false,
    };

    expect(normalizePage(body)).toEqual(body);
  });

  it('fällt auf eine leere Seite zurück, wenn `content` fehlt', () => {
    expect(normalizePage({ totalElements: 7 })).toEqual(emptyPage());
  });

  it('fällt auf eine leere Seite zurück, wenn `content` kein Array ist', () => {
    expect(normalizePage({ content: 'not-an-array' })).toEqual(emptyPage());
  });

  it('fällt auf eine leere Seite zurück, wenn der Body kein Objekt ist', () => {
    expect(normalizePage(null)).toEqual(emptyPage());
    expect(normalizePage(undefined)).toEqual(emptyPage());
    expect(normalizePage('kaputt')).toEqual(emptyPage());
    expect(normalizePage(42)).toEqual(emptyPage());
  });

  it('leitet fehlende Zähler aus `content` ab', () => {
    const result = normalizePage({ content: [{ id: '1' }, { id: '2' }] });

    expect(result.totalElements).toBe(2);
    expect(result.totalPages).toBe(1);
    expect(result.size).toBe(2);
    expect(result.number).toBe(0);
    expect(result.numberOfElements).toBe(2);
    expect(result.first).toBe(true);
    expect(result.last).toBe(true);
    expect(result.empty).toBe(false);
  });

  it('leitet `totalPages`/`empty` korrekt ab, wenn `content` leer ist', () => {
    const result = normalizePage({ content: [] });

    expect(result.totalElements).toBe(0);
    expect(result.totalPages).toBe(0);
    expect(result.empty).toBe(true);
  });
});
