/**
 * Indirektion für den Mock-Data-Switcher, damit `fileReplacements` ihn aus dem
 * Produktions-Build heraushalten kann.
 *
 * Ersetzt wird bewusst diese Barrel-Datei und nicht die Komponente selbst: Angulars
 * `fileReplacements` behält die Zuordnung zwischen einer `templateUrl` und dem Pfad der
 * Komponentendatei bei. Wird eine Komponente mit externem Template direkt ersetzt, prüft
 * der AOT-Compiler das Original-Template weiter gegen die Stub-Klasse und der Build bricht
 * mit `TS2339: Property 'isExpanded' does not exist` ab. Eine Barrel-Datei hat kein Template
 * und ist deshalb unproblematisch.
 *
 * Ohne diese Trennung landen der komplette Mock-Datensatz und der `localStorage`-Zugriff
 * auf Modul-Ebene im eager `main-*.js`: `@if (useMocks)` steuert nur das Rendern, das
 * Bundling entscheiden die `import`-Statements.
 */
export { MockDataSwitcherComponent } from './mock-data-switcher.component';
