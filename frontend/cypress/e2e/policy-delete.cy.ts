/// <reference types="cypress" />

// Kernablauf: Policy löschen (mit Bestätigungsdialog) sowie Abbrechen des Löschvorgangs.

const POLICY_ID = '00000000-0000-0000-0000-000000000002';
const POLICY_SLUG = 'zugriff-konsortium-mitglieder';

describe('Policy – Löschen', () => {
  it('löscht eine Policy nach Bestätigung und entfernt sie aus der Liste', () => {
    cy.visitWithMode(`/policies/${POLICY_ID}`, 'few');

    cy.getByCy('delete-policy').click();
    cy.getByCy('delete-confirm').click();

    // Weiterleitung zur Übersicht + Erfolgs-Snackbar.
    cy.location('pathname').should('eq', '/policies');
    cy.getByCy('snackbar-success').should('exist');

    // Policy ist weg (In-App-State nach client-seitiger Navigation erhalten).
    cy.getByCy('policy-row').should('have.length', 6);
    cy.get(`[data-cy="policy-row"][aria-label="${POLICY_SLUG}"]`).should('not.exist');
  });

  it('bricht das Löschen ab und behält die Policy', () => {
    cy.visitWithMode(`/policies/${POLICY_ID}`, 'few');

    cy.getByCy('delete-policy').click();
    cy.getByCy('delete-cancel').click();

    // Dialog geschlossen, weiterhin auf der Detailseite.
    cy.getByCy('delete-confirm').should('not.exist');
    cy.getByCy('policy-title').should('have.text', POLICY_SLUG);
  });
});
