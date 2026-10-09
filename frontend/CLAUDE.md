# CLAUDE.md — Frontend

Ergänzt die Root-`CLAUDE.md` (Status, Git- und Verhaltensregeln). Setup und Details: `README.md` in
diesem Ordner. Der gemeinsame API-Vertrag steht in `../docs/api-contract.md`.

## Stack & Befehle

Angular **21.2** (standalone-only), Angular Material, **Signals** (kein NgRx), **Transloco 8**
(`de`/`en`, default `de`), **MirageJS**, **Vitest** + **Cypress**, SCSS, `npm@11`.

```bash
npm start                              # Dev mit Mocks, http://localhost:4200
ng serve --configuration development   # Dev gegen echtes Backend (http://localhost:8080/api)
npm run lint | format | format:check   # ESLint / Prettier
npm test                               # Vitest headless (inkl. Coverage-Gate)
npm run e2e                            # Cypress headless, startet Mock-Server selbst
npm run build:prod                     # Prod-Build (Bundle-Budgets: 700kB Warnung / 1MB Fehler)
```
Environments: `environment.ts` (`useMocks:false`), `environment.mocks.ts` (`useMocks:true`),
`environment.production.ts` (`backendUrl:'/api'`).

## Struktur (`src/app/`)

- `pages/` (Routen, lazy in `app.routes.ts`); Kern-Feature: `policies/policy-editor-page/policy-builder/`
  (Wizard mit `components/`, `metadata/`, `validators/`, `helpers/`).
- `ui/` Design-System (`con-x-*`), `services/` (u.a. `policies/policy.service.ts` HTTP-CRUD,
  `policies/policy-mapper/policy-odrl.mapper.ts` Domänenmodell → ODRL, `http/` Interceptors/Helper),
  `shared/` (`types/`, `pipes/`, `adapters/`), `mocks/`.
- Schriften sind selbst gehostet (`src/fonts/`, Details `src/fonts/README.md`) — **keine**
  Google-Fonts-Links.
- **Pfad-Aliase statt `../`-Importen:** `@pages/* @ui/* @services/* @shared/* @mocks/* @env
  @features/policies/builder/*`.

## Code-Conventions

- ESLint erzwingt (nicht manuell prüfen): Selektor-Präfixe `app-` (Pages/Features) und `con-x-`
  (Design-System, `ConX*Component`), OnPush, kein `console.log`.
- Modernes Angular: standalone, `inject()`, `input()/output()`, `signal()/computed()/effect()`,
  `toSignal()` an der RxJS-Grenze, `@if/@for` mit `track`.
- **Typisierung strict, kein `any`.** String-Unions statt `enum`; Domänentypen als Discriminated
  Unions in `shared/types/*.model.ts` mit exhaustivem `switch`.
- **Dateisuffixe:** `*.component/.service/.model/.mapper/.helper/.data/.pipe/.adapter.ts`,
  `*-metadata.ts`, `*-validators.ts`; Pages `*-page.component.ts` / `*PageComponent`.
- **Muster:** Transformationen als pure functions in `*.mapper.ts`/`*.helper.ts`/`*-validators.ts`
  (Validators liefern `{ field, messageKey }`); Metadata-Registry enthält nur i18n-Keys; HTTP-Services
  sind dünn (`providedIn:'root'`, `baseUrl` aus `@env`, keine Business-Logik).
- **i18n:** keine literalen UI-Strings — immer Transloco-Key in `de.json` **und** `en.json`.
  **Im Template übersetzen** (`t(key, params)`), nicht im Component: `TranslocoService.translate()`
  ist keine Signal-Abhängigkeit und friert in `computed()` die Sprache ein.
- **Styling:** SCSS pro Komponente, `--con-x-*`-Tokens aus `styles.scss`. Mixins per
  `@use 'mixins' as *;` (kein relativer Pfad), Fokus-Ring immer via `@include focus-ring($offset)`.
- Prettier: `printWidth 100`, single quotes, 2 Spaces.

## Barrierefreiheit (WCAG 2.2 AA, Details `docs/accessibility.md`)

- Neue UI folgt diesen Regeln (inkl. `a11y`-Keys in `de` und `en`).
- Keine literalen a11y-Texte: `aria-label`, versteckte Texte, Seitentitel als Transloco-Keys im
  Namespace `a11y`. Seitentitel pro Route via `ConXTitleStrategy` (`title: 'a11y.pageTitle.*'`).
  Visuell versteckte Texte mit `.con-x-sr-only`.
- Dynamische Änderungen via CDK `LiveAnnouncer` ansagen; Lade-/Fehlerzustände als
  `role="status"`/`role="alert"`.
- Dekorative Icons `aria-hidden="true"`; Icon-only-Buttons brauchen `aria-label`; Toggle-Zustände
  über `aria-pressed`/`aria-checked`/`aria-current`; nie `outline:none` ohne Ersatz.
- Marken-Orange `#e53d17` bleibt bewusst unverändert (dokumentiertes Kontrast-Restrisiko).

## Sicherheits-Konventionen (aus OWASP-Audit — einhalten, sonst kommen die Befunde zurück)

- **Ein HTTP-Response ist Eingabe.** `http.get<T>()` prüft zur Laufzeit nichts: unbekannte
  Constraint-Typen mit `keepKnownConstraints()` / `isKnownConstraintType()` aussortieren.
- **Nie ungeprüfte Werte als Transloco-Parameter** (Transloco ersetzt rekursiv; `{{…}}` im Wert kann
  die Schleife nicht terminieren lassen). Gegen die Registry prüfen (`USE_CASE_OPTIONS`,
  `FRAMEWORK_AGREEMENT_VALUE`), sonst `'—'`. **i18n-Keys nie aus Daten zusammensetzen.**
- **`encodeURIComponent` für jeden Wert in einer URL**, auch Route-Parameter.
- **`policyId` wird zum JSON-LD-`@id`** — Zeichensatz-Validierung in `constraint-validators.ts`
  beibehalten.
- **HTTP-Fehler nie verwerfen:** `error: (err: unknown) => …` mit
  `httpErrorMessageKey(err, '<Fallback>')`. Nie Request-/Response-Bodies loggen.
- **Dev-Werkzeug nicht ins Prod-Bundle:** `@if` verhindert nur das Rendern, das Bundling entscheiden
  die `import`s. Neue Mock-/Debug-Komponenten per `fileReplacements` ausschließen, dabei eine
  **Barrel-Datei** ersetzen, nicht die Komponente (sonst `TS2339` im AOT-Build; Muster:
  `ui/mock-data-switcher/index.ts`).
- **Keine externen Laufzeit-Ressourcen** (Fonts, Skripte, Styles fremder Domains).
- **Prod baut mit `security.autoCsp` + `subresourceIntegrity`:** Änderungen an Critical-CSS oder
  `index.html` im Browser gegen den Prod-Build prüfen (CSP-Violations, Stylesheet aktiv).

## Architektur-Entscheidungen

- Signal-first State, kein externes State-Management.
- Domänenmodell ist vom ODRL/EDC-Format getrennt; Übersetzung nur in `policy-odrl.mapper.ts`
  (CX-Namespace `https://w3id.org/catenax/2025/9/policy/`).
- Mock-first: `policy.service.ts` ruft echte HTTP-Endpunkte auf, MirageJS fängt sie bei `useMocks` ab.
  Der Mock-Data-Switcher bietet `empty`/`few`/`many`.
- Pagination ist serverseitig (`getPolicyPage()`); das Backend kennt keine Such-/Filterparameter,
  daher wirken Suche/Filter nur auf die geladene Seite (Hinweis `policies.pagination.filteredInfo`).
- **Deutsch ist rechtlich maßgeblich:** generierter `legalText` ist immer deutsch, unabhängig von der
  UI-Sprache.

## Tests

- **E2E (Cypress, primär):** Hauptflüsse im Mock-Modus, Specs in `cypress/e2e/*.cy.ts`. Elemente
  über `data-cy="…"`; Commands `cy.getByCy(sel)` und `cy.visitWithMode(path, 'empty'|'few'|'many')`
  (Mirage-State wird bei jedem Reload neu erzeugt — Verifikation nach Create/Edit/Delete über
  In-App-Navigation).
- **Unit (Vitest) nur für kritische Logik:** Mapper, Validators, Metadata-Helper — nicht für
  UI-Komponenten oder triviale Helper. Specs liegen als `*.spec.ts` neben dem Code und importieren
  aus `'vitest'`.
- **Coverage-Gate** (`npm test`): Jede neue Datei mit den Suffixen `*.mapper.ts`, `*.helper.ts`,
  `*-validators.ts`, `*-metadata.ts` zählt automatisch mit und braucht Tests.
- **Windows/Electron-Terminals:** Bricht Cypress mit `bad option: --smoke-test` bzw. Exit-Code
  `3221225501` ab, ist `ELECTRON_RUN_AS_NODE=1` gesetzt — vorher entfernen (PowerShell:
  `Remove-Item Env:ELECTRON_RUN_AS_NODE`).
- **CI** (`.github/workflows/test.yml`) führt `lint`, `format:check`, `build:prod`, Unit- und
  E2E-Tests bei jedem PR aus.
