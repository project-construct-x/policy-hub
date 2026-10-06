/// <reference types="cypress" />

// Kernablauf: bestehende Policy bearbeiten und die Änderung verifizieren.

// zugriff-konsortium-mitglieder: ACCESS mit einer MEMBERSHIP-Bedingung.
const POLICY_ID = '00000000-0000-0000-0000-000000000002';
const ORIGINAL_SLUG = 'zugriff-konsortium-mitglieder';

describe('Policy – Bearbeiten', () => {
  it('ändert die policyId und zeigt die aktualisierte Policy im Detail', () => {
    const updatedId = 'zugriff-konsortium-mitglieder-v2';

    cy.visitWithMode(`/policies/${POLICY_ID}/edit`, 'few');

    // Vorbefüllung prüfen, dann überschreiben.
    cy.getByCy('policyId-input').should('have.value', ORIGINAL_SLUG);
    cy.getByCy('policyId-input').clear().type(updatedId);

    cy.getByCy('submit-policy').click();

    cy.getByCy('policy-title').should('have.text', updatedId);
    cy.getByCy('snackbar-success').should('exist');
    cy.location('pathname').should('eq', `/policies/${POLICY_ID}`);
  });

  it('fügt eine weitere Bedingung hinzu (FRAMEWORK_AGREEMENT)', () => {
    cy.visitWithMode(`/policies/${POLICY_ID}/edit`, 'few');

    cy.getByCy('palette-FRAMEWORK_AGREEMENT').click();
    cy.getByCy('constraint-card-FRAMEWORK_AGREEMENT').should('exist');

    cy.getByCy('submit-policy').click();

    cy.getByCy('policy-title').should('exist');
    cy.get('app-constraint-card').should('have.length', 2); // MEMBERSHIP + FRAMEWORK_AGREEMENT
  });
});
