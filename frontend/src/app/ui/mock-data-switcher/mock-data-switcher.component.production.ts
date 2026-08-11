import { ChangeDetectionStrategy, Component } from '@angular/core';

/**
 * Produktions-Ersatz für {@link MockDataSwitcherComponent} (analog zu
 * `mock.service.production.ts`), eingesetzt über `fileReplacements`.
 *
 * `@if (useMocks)` in `app.component.html` verhindert nur das **Rendern** — was im Bundle
 * landet, entscheiden die `import`-Statements. `App` importiert die Switcher-Komponente
 * statisch, diese wiederum `@mocks/mock-data-config` und `@mocks/data/policies/mocked-policies`.
 * Ohne diesen Stub landen daher der komplette Mock-Datensatz und die deutschen Dev-Labels
 * im eager `main-*.js` — und der `localStorage`-Zugriff auf Modul-Ebene wird in Produktion
 * beim Laden des Bundles ausgeführt.
 *
 * Der Stub übernimmt Selektor und Standalone-Charakter, rendert aber nichts und zieht keine
 * Mock-Module nach.
 */
@Component({
  selector: 'app-mock-data-switcher',
  template: '',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MockDataSwitcherComponent {}
