/// <reference types="cypress" />

// Kernablauf: neue Policy erstellen und anschließend in der Übersicht wiederfinden.
// Wichtig: Mirage-State lebt nur innerhalb einer Seiten-Session → Verifikation über
// In-App-Navigation (Klick), nicht über ein erneutes cy.visit.

describe('Policy – Erstellen', () => {
  it('erstellt eine Policy mit MEMBERSHIP-Bedingung und zeigt sie im Detail', () => {
    const newId = 'e2e-neue-policy';

    cy.visitWithMode('/policies/new', 'few');

    cy.getByCy('policyId-input').type(newId);
    cy.getByCy('category-access').click();
    // MEMBERSHIP benötigt keine weitere Eingabe → stabiler Kern-Flow.
    cy.getByCy('palette-MEMBERSHIP').click();
    cy.getByCy('constraint-card-MEMBERSHIP').should('exist');

    cy.getByCy('submit-policy').click();

    // Erfolg: Weiterleitung auf die Detailseite der neuen Policy + Erfolgs-Snackbar.
    cy.getByCy('policy-title').should('have.text', newId);
    cy.getByCy('snackbar-success').should('exist');

    // In der Übersicht wiederfinden (In-App-Navigation, damit Mirage-State erhalten bleibt).
    cy.getByCy('back-to-overview').click();
    cy.getByCy('policy-row').should('have.attr', 'aria-label', newId);
    cy.getByCy('policy-row').should('have.length', 8); // 7 + 1 neu
  });

  it('blockiert das Speichern bei leerer policyId und zeigt einen Inline-Fehler', () => {
    cy.visitWithMode('/policies/new', 'few');

    cy.getByCy('submit-policy').click();

    // Speichern ist blockiert → wir bleiben auf der Editor-Seite, Fehler wird sichtbar angezeigt.
    cy.location('pathname').should('eq', '/policies/new');
    cy.getByCy('policyId-error').should('be.visible');
  });
});
