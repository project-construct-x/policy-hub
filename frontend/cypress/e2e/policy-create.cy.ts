/// <reference types="cypress" />

// Kernablauf: neue Policy erstellen und anschließend in der Übersicht wiederfinden.
// Wichtig: Mirage-State lebt nur innerhalb einer Seiten-Session → Verifikation über
// In-App-Navigation (Klick), nicht über ein erneutes cy.visit.

const POLICY_ID_PREFIX = 'con-x-ph-';

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
    cy.getByCy('policy-title').should('have.text', `${POLICY_ID_PREFIX}${newId}`);
    cy.getByCy('snackbar-success').should('exist');

    // In der Übersicht wiederfinden (In-App-Navigation, damit Mirage-State erhalten bleibt).
    cy.getByCy('back-to-overview').click();
    cy.getByCy('policy-row').should('have.attr', 'aria-label', `${POLICY_ID_PREFIX}${newId}`);
    cy.getByCy('policy-row').should('have.length', 7); // 6 + 1 neu
  });

  it('zeigt den festen Präfix vor dem ID-Feld und kann ihn nicht verändern', () => {
    cy.visitWithMode('/policies/new', 'few');

    cy.getByCy('policyId-prefix').should('have.text', POLICY_ID_PREFIX);
    cy.getByCy('policyId-input').should('have.value', '');

    // Das Präfix ist kein Teil des Eingabefelds: Löschen im Input lässt es unberührt.
    cy.getByCy('policyId-input').type('abc{selectall}{backspace}');
    cy.getByCy('policyId-input').should('have.value', '');
    cy.getByCy('policyId-prefix').should('have.text', POLICY_ID_PREFIX);
  });

  it('blockiert das Speichern, wenn hinter dem Präfix nichts steht', () => {
    cy.visitWithMode('/policies/new', 'few');

    cy.getByCy('policyId-input').type('   ');
    cy.getByCy('submit-policy').click();

    cy.location('pathname').should('eq', '/policies/new');
    cy.getByCy('policyId-error').should('be.visible');
  });

  it('blockiert das Speichern bei leerer policyId und zeigt einen Inline-Fehler', () => {
    cy.visitWithMode('/policies/new', 'few');

    cy.getByCy('submit-policy').click();

    // Speichern ist blockiert → wir bleiben auf der Editor-Seite, Fehler wird sichtbar angezeigt.
    cy.location('pathname').should('eq', '/policies/new');
    cy.getByCy('policyId-error').should('be.visible');
  });

  it('blockiert das Speichern bei ZEITRAUM-Bedingung ohne Auswahl und zeigt einen Inline-Fehler', () => {
    cy.visitWithMode('/policies/new', 'few');

    cy.getByCy('policyId-input').type('e2e-zeitraum-ohne-auswahl');
    cy.getByCy('category-access').click();
    cy.getByCy('palette-DATE_RANGE').click();

    cy.getByCy('submit-policy').click();

    // Speichern ist blockiert → wir bleiben auf der Editor-Seite, Fehler wird sichtbar angezeigt.
    cy.location('pathname').should('eq', '/policies/new');
    cy.getByCy('daterange-start-error').should('be.visible');
  });

  it('erlaubt bei ZEITRAUM nur die Auswahl per Datepicker, kein manuelles Tippen im Feld', () => {
    cy.visitWithMode('/policies/new', 'few');

    cy.getByCy('policyId-input').type('e2e-zeitraum-nur-picker');
    cy.getByCy('category-access').click();
    cy.getByCy('palette-DATE_RANGE').click();

    // Die Felder sind `readonly` — Eingabe ist nur über den Kalender möglich, nicht per Tastatur.
    cy.getByCy('daterange-start-input').should('have.attr', 'readonly');
    cy.getByCy('daterange-end-input').should('have.attr', 'readonly');

    // Über den Kalender ausgewählte Werte müssen trotzdem ankommen (je Feld ein eigener Picker).
    cy.getByCy('daterange-start-field').find('mat-datepicker-toggle button').click();
    cy.get('.mat-calendar-body-cell:not(.mat-calendar-body-disabled)').first().click();
    cy.getByCy('daterange-end-field').find('mat-datepicker-toggle button').click();
    cy.get('.mat-calendar-body-cell:not(.mat-calendar-body-disabled)').last().click();

    cy.getByCy('daterange-start-input').invoke('val').should('not.be.empty');
    cy.getByCy('daterange-end-input').invoke('val').should('not.be.empty');
  });

  it('öffnet den Datepicker bei Klick auf das gesamte Start- bzw. End-Feld, nicht nur auf das Icon', () => {
    cy.visitWithMode('/policies/new', 'few');

    cy.getByCy('category-access').click();
    cy.getByCy('palette-DATE_RANGE').click();

    cy.get('.mat-calendar').should('not.exist');
    // Klick auf das Feld selbst (nicht auf das Kalender-Icon) muss den jeweiligen Picker öffnen.
    cy.getByCy('daterange-start-field').click();
    cy.get('.mat-calendar').should('be.visible');
    cy.get('body').type('{esc}');
    cy.get('.mat-calendar').should('not.exist');

    cy.getByCy('daterange-end-field').click();
    cy.get('.mat-calendar').should('be.visible');
  });

  it('sperrt vergangene Tage für den Start und Tage vor dem Start für das Ende', () => {
    cy.visitWithMode('/policies/new', 'few');

    cy.getByCy('category-access').click();
    cy.getByCy('palette-DATE_RANGE').click();

    // Ein Monat weiter: der ganze Monat liegt in der Zukunft, der Start ist der 2. des Monats.
    cy.getByCy('daterange-start-field').click();
    cy.get('.mat-calendar-next-button').click();
    cy.get('.mat-calendar-body-cell:not(.mat-calendar-body-disabled)').eq(1).click();

    // Der End-Picker öffnet im Monat des Starts; der 1. (vor dem Start) ist gesperrt.
    cy.getByCy('daterange-end-field').click();
    cy.get('.mat-calendar-body-cell').first().should('have.class', 'mat-calendar-body-disabled');
    cy.get('.mat-calendar-body-cell:not(.mat-calendar-body-disabled)')
      .first()
      .should('contain.text', '2');
  });

  it('erlaubt es, das Startdatum nach einer vollständigen Auswahl erneut zu ändern', () => {
    cy.visitWithMode('/policies/new', 'few');

    cy.getByCy('category-access').click();
    cy.getByCy('palette-DATE_RANGE').click();

    // Immer einen Monat weiterblättern, damit die Auswahl unabhängig vom heutigen Datum im selben
    // (vollständigen) Monat liegt und der Test nicht am Monatsende flaky wird.
    cy.getByCy('daterange-start-field').click();
    cy.get('.mat-calendar-next-button').click();
    cy.get('.mat-calendar-body-cell:not(.mat-calendar-body-disabled)').eq(0).click();
    cy.getByCy('daterange-end-field').click();
    cy.get('.mat-calendar-body-cell:not(.mat-calendar-body-disabled)').eq(1).click();

    cy.getByCy('daterange-start-input')
      .invoke('val')
      .then((firstStart) => {
        // Erneut öffnen und einen anderen Start wählen — das Startdatum darf nicht an der ersten
        // Auswahl "kleben bleiben".
        cy.getByCy('daterange-start-field').click();
        cy.get('.mat-calendar-body-cell:not(.mat-calendar-body-disabled)').eq(3).click();

        cy.getByCy('daterange-start-input').invoke('val').should('not.eq', firstStart);
      });
  });
});
