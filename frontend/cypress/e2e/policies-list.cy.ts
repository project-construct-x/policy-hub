/// <reference types="cypress" />

// Kernablauf: Übersicht rendern, durchsuchen, filtern, Paginierung, Empty-States.
// Läuft ausschließlich gegen den MirageJS-Mock-Modus (deterministische Datensätze).

describe('Policies – Übersicht, Suche & Filter', () => {
  it('zeigt bei leerem Datensatz den Empty-State', () => {
    cy.visitWithMode('/policies', 'empty');
    cy.getByCy('empty-state').should('exist');
    cy.getByCy('policy-row').should('not.exist');
  });

  it('rendert alle Policies des "few"-Datensatzes', () => {
    cy.visitWithMode('/policies', 'few');
    cy.getByCy('policy-row').should('have.length', 7);
  });

  it('filtert per Suche nach policyId-Substring', () => {
    cy.visitWithMode('/policies', 'few');
    cy.getByCy('search-input').type('geodaten');
    cy.getByCy('policy-row').should('have.length', 1);
    cy.getByCy('policy-row').should('have.attr', 'aria-label', 'geodaten-bis-2027');
  });

  it('filtert nach Kategorie ACCESS bzw. CONTRACT', () => {
    cy.visitWithMode('/policies', 'few');
    cy.getByCy('category-filter').select('ACCESS');
    cy.getByCy('policy-row').should('have.length', 3);
    cy.getByCy('category-filter').select('CONTRACT');
    cy.getByCy('policy-row').should('have.length', 4);
  });

  it('zeigt den "keine Treffer"-Empty-State bei Suche+Filter ohne Ergebnis', () => {
    cy.visitWithMode('/policies', 'few');
    // geodaten-bis-2027 ist CONTRACT – kombiniert mit ACCESS-Filter bleibt nichts übrig.
    cy.getByCy('search-input').type('geodaten');
    cy.getByCy('category-filter').select('ACCESS');
    cy.getByCy('no-results').should('exist');
    cy.getByCy('policy-row').should('not.exist');
  });

  it('paginiert den "many"-Datensatz (pageSize 8 → 2 Seiten)', () => {
    cy.visitWithMode('/policies', 'many');
    cy.getByCy('policy-row').should('have.length', 8);
    cy.get('.pagination').should('exist');
    cy.get('.pagination .page-btn').contains('2').click();
    cy.getByCy('policy-row').should('have.length', 2);
  });
});
