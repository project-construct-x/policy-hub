/// <reference types="cypress" />

// Kernablauf: Policy ansehen (Detailseite) inkl. Constraints, Rechtstext und ODRL-Ausgabe.

// geodaten-bis-2027: CONTRACT mit 2 Bedingungen (MEMBERSHIP + DATE_RANGE).
const POLICY_ID = '00000000-0000-0000-0000-000000000004';
const POLICY_SLUG = 'geodaten-bis-2027';

describe('Policy – Detailansicht', () => {
  beforeEach(() => {
    cy.visitWithMode(`/policies/${POLICY_ID}`, 'few');
  });

  it('zeigt Titel und Kategorie der Policy', () => {
    cy.getByCy('policy-title').should('have.text', POLICY_SLUG);
    cy.contains('.pd__info-value', 'Vertragspolicy').should('exist');
  });

  it('listet die Bedingungen der Policy auf', () => {
    cy.get('app-constraint-card').should('have.length', 2);
  });

  it('lädt und zeigt die vom Backend erzeugte ODRL-Ausgabe', () => {
    cy.getByCy('odrl-panel-header').click();
    cy.getByCy('odrl-json')
      .should('contain', 'PolicyDefinition')
      .and('contain', 'DataUsageStartDate')
      .and('contain', 'DataUsageEndDate')
      .and('contain', 'Membership');
  });

  it('zeigt einen generierten Rechtstext als Liste (ein Unterpunkt je Bedingung) an', () => {
    cy.getByCy('legal-text').invoke('text').should('have.length.greaterThan', 0);
    // MEMBERSHIP + DATE_RANGE → zwei nummerierte Unterpunkte, kein Block-Text.
    cy.getByCy('legal-text').find('ol li').should('have.length', 2);
  });

  it('navigiert per Klick auf eine Tabellenzeile in die Detailansicht', () => {
    cy.visitWithMode('/policies', 'few');
    cy.getByCy('policy-row').first().click();
    cy.location('pathname').should('match', /\/policies\/.+/);
    cy.getByCy('policy-title').should('exist');
  });
});
