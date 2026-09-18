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

  it('blockiert das Speichern bei USE_CASE-Bedingung ohne Auswahl und zeigt einen Inline-Fehler', () => {
    cy.visitWithMode('/policies/new', 'few');

    cy.getByCy('policyId-input').type('e2e-usecase-ohne-auswahl');
    cy.getByCy('category-access').click();
    cy.getByCy('palette-USE_CASE').click();

    cy.getByCy('submit-policy').click();

    // Speichern ist blockiert → wir bleiben auf der Editor-Seite, Fehler wird sichtbar angezeigt.
    cy.location('pathname').should('eq', '/policies/new');
    cy.getByCy('usecase-error').should('be.visible');
  });

  it('erlaubt bei ZEITRAUM nur die Auswahl per Datepicker, kein manuelles Tippen im Feld', () => {
    cy.visitWithMode('/policies/new', 'few');

    cy.getByCy('policyId-input').type('e2e-zeitraum-nur-picker');
    cy.getByCy('category-access').click();
    cy.getByCy('palette-DATE_RANGE').click();

    // Die Felder sind `readonly` — Eingabe ist nur über den Kalender möglich, nicht per Tastatur.
    cy.getByCy('daterange-start-input').should('have.attr', 'readonly');
    cy.getByCy('daterange-end-input').should('have.attr', 'readonly');

    // Über den Kalender ausgewählte Werte müssen trotzdem ankommen.
    cy.get('.ce-card__field--datepicker mat-datepicker-toggle button').click();
    cy.get('.mat-calendar-body-cell:not(.mat-calendar-body-disabled)').first().click();
    cy.get('.mat-calendar-body-cell:not(.mat-calendar-body-disabled)').last().click();

    cy.getByCy('daterange-start-input').invoke('val').should('not.be.empty');
    cy.getByCy('daterange-end-input').invoke('val').should('not.be.empty');
  });

  it('öffnet den Datepicker bei Klick auf die gesamte ZEITRAUM-Leiste, nicht nur auf das Icon', () => {
    cy.visitWithMode('/policies/new', 'few');

    cy.getByCy('category-access').click();
    cy.getByCy('palette-DATE_RANGE').click();

    cy.get('.mat-calendar').should('not.exist');
    // Klick auf die Leiste selbst (nicht auf das Kalender-Icon) muss den Picker öffnen.
    cy.getByCy('daterange-field').click();
    cy.get('.mat-calendar').should('be.visible');
  });

  it('erlaubt es, das Startdatum nach einer vollständigen Auswahl erneut zu ändern', () => {
    cy.visitWithMode('/policies/new', 'few');

    cy.getByCy('category-access').click();
    cy.getByCy('palette-DATE_RANGE').click();

    // Erste vollständige Auswahl (Start + Ende).
    cy.getByCy('daterange-field').click();
    cy.get('.mat-calendar-body-cell:not(.mat-calendar-body-disabled)').eq(0).click();
    cy.get('.mat-calendar-body-cell:not(.mat-calendar-body-disabled)').eq(1).click();

    cy.getByCy('daterange-start-input')
      .invoke('val')
      .then((firstStart) => {
        // Erneut öffnen und ein komplett anderes Datumspaar wählen — das Startdatum darf nicht
        // an der ersten Auswahl "kleben bleiben".
        cy.getByCy('daterange-field').click();
        cy.get('.mat-calendar-body-cell:not(.mat-calendar-body-disabled)').eq(5).click();
        cy.get('.mat-calendar-body-cell:not(.mat-calendar-body-disabled)').eq(6).click();

        cy.getByCy('daterange-start-input').invoke('val').should('not.eq', firstStart);
      });
  });
});
