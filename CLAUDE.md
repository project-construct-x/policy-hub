# CLAUDE.md — Construct-X Policy Hub

Orientierung für Claude Code beim Arbeiten in diesem Repo. Kompakt und operativ gehalten.
**Diese Datei ist Single Source of Truth für Konventionen** — bei Änderungen bitte aktuell halten
(siehe [Anweisungen & Erwartungen](#anweisungen--erwartungen)).

## 1. Projektüberblick

Der **Construct-X Policy Hub** ist ein Open-Source-Tool zum Erstellen und Verwalten von
Data-Sharing-**Policies** für den Construct-X-Dataspace (Bauwesen, auf Basis des Catena-X/EDC-Stacks).
Policies werden als **ODRL/JSON-LD** (EDC `PolicyDefinition`) ausgedrückt.

> ⚠️ Under heavy development — **nicht** für den produktiven Einsatz.

Monorepo:

| Ordner      | Inhalt                                             |
| ----------- | -------------------------------------------------- |
| `frontend/` | Angular-21-App (Hauptfokus, siehe unten)           |
| `backend/`  | Spring-Boot-Service (Java 21, wird parallel gebaut) |
| `docs/`     | Design-Brief, Screens, Pencil-Quelle               |

Maßgebliche fachliche Referenz: `docs/design/policy-hub-design.md` + `docs/design/screens/`.
(Die Root-`README.md` und `docs/README.md` sind aktuell nur Platzhalter.)

## 2. Arbeitsmodus & Status (wichtig)

- **Das Frontend ist Source of Truth / Zielbild.** Es wurde bewusst **mock-first** (MirageJS) gebaut,
  um die Zielrichtung festzulegen. Es besteht **kein Backend-Integrationszwang**.
- **Das Backend wird parallel nachgezogen** (Stand: TBD). Triff **keine** Annahmen über einen finalen
  Backend-Vertrag; wenn Frontend und Backend abweichen, gilt das Frontend als Ziel.
- **⚠️ Policy-Modell & Constraints sind PROVISORISCH.** Die aktuellen Kategorien (`ACCESS`/`CONTRACT`)
  und Constraint-Typen dienen nur der Entwicklung und werden im finalen Construct-X sehr wahrscheinlich
  ersetzt. Nicht als stabile Domäne behandeln — Code auf Änderbarkeit auslegen.

---

## 3. Frontend

### Stack
Angular **21.2** (standalone-only), Angular Material 21, **Signals** (kein NgRx), **Transloco 8**
(i18n, `de`/`en`, default `de`), **MirageJS** (Mocks), **Vitest** (Unit) + **Cypress** (E2E,
`start-server-and-test`), SCSS. Package-Manager `npm@11`.

### Befehle (aus `frontend/`)
```bash
npm install
npm start                              # Dev mit Mocks (MirageJS), http://localhost:4200
ng serve --configuration development   # Dev gegen echtes Backend (http://localhost:8080/api)
npm run build:prod                     # Produktions-Build
npm run lint                           # ESLint
npm run format                         # Prettier schreiben  (format:check zum Prüfen)
npm test                               # Vitest Unit-Tests headless (test:watch für Watch)
npm run e2e                            # Cypress headless, startet Mock-Server selbst (e2e:open für UI)
```
Environments: `src/environments/environment.ts` (`useMocks:false`), `environment.mocks.ts`
(`useMocks:true`), `environment.production.ts` (`backendUrl:'/api'`).

### Projektstruktur (`src/app/`)
- `pages/` — Routen-Ziele: `home`, `policies/{policies-overview-page, policy-detail-page,
  policy-editor-page}`; darunter `policy-editor-page/policy-builder/` (**Kern-Feature**, Wizard mit
  `components/`, `metadata/`, `validators/`, `helpers/`).
- `ui/` — wiederverwendbares Design-System auf Angular Material (`con-x-*`-Komponenten).
- `services/` — u.a. `services/policies/policy.service.ts` (HTTP-CRUD) und
  `services/policies/policy-mapper/policy-odrl.mapper.ts` (Domänenmodell → ODRL/EDC).
- `shared/` — `types/` (Modelle), `pipes/`, `adapters/`.
- `mocks/` — MirageJS-Server + Mock-Daten.

Routing ist **lazy** (`app.routes.ts`). **Pfad-Aliase** statt Relativimporte:
`@pages/* @ui/* @services/* @shared/* @mocks/* @env @features/policies/builder/*`.

### Code-Conventions (aus dem Code abgeleitet, ESLint-gestützt)
- **Modernes Angular durchgängig:** standalone (kein `NgModule`), `ChangeDetectionStrategy.OnPush`,
  `inject()` statt Constructor-DI, `input()/input.required()/output()` statt `@Input/@Output`,
  `signal()/computed()/effect()`, `toSignal()` an der RxJS-Grenze. Templates: `@if/@for` mit `track`
  (kein `*ngIf/*ngFor`).
- **Selektoren & Namen (ESLint erzwingt Präfixe `app` und `con-x`, kebab-case):**
  - `app-` = Pages/Features. Page-Dateien `*-page.component.ts`, Klasse `*PageComponent`.
  - `con-x-` = Design-System-UI. Klassen `ConX*Component`.
- **Dateisuffixe:** `*.component/.service/.model/.mapper/.helper/.data/.pipe/.adapter.ts`,
  `*-metadata.ts`, `*-validators.ts`.
- **Typisierung:** `strict` (+ verschärfte Flags). **String-Union-Types statt `enum`**; Domänentypen
  als **Discriminated Unions** in `shared/types/*.model.ts`, Diskriminante via exhaustivem `switch`.
- **Muster:**
  - Transformationen als **pure functions** in `*.mapper.ts` / `*.helper.ts` / `*-validators.ts`
    (Validators liefern `{ field, messageKey }`).
  - **Metadata-Registry** (`constraint-metadata.ts`, `*.data.ts`) enthält **nur i18n-Keys**, keine
    literalen Strings.
  - HTTP-Services: `providedIn:'root'`, `inject(HttpClient)`, `baseUrl` aus `@env`, dünne CRUD-Methoden
    → `Observable<T>`, **keine** Business-Logik.
- **i18n:** **keine literalen UI-Strings** — alles über Transloco-Keys (verschachteltes camelCase-
  Namespacing in `de.json`/`en.json`).
- **Styling:** SCSS pro Komponente; globale `--con-x-*`-Tokens in `styles.scss`; BEM-artige `con-x-`-Klassen.
- **Format:** Prettier `printWidth 100`, single quotes, 2 Spaces.

### Barrierefreiheit (a11y) — Konventionen
Zielniveau **WCAG 2.2 AA** (Grundausstattung). Details & Restrisiken: `docs/accessibility.md`.
- **Keine literalen a11y-Texte:** alle `aria-label`/versteckten Texte/Seitentitel als Transloco-Keys
  im Namespace **`a11y`** (in `de.json` UND `en.json`).
- **`.con-x-sr-only`** (in `styles.scss`) für visuell versteckte, aber vorlesbare Texte nutzen.
- **Seitentitel** pro Route über `ConXTitleStrategy` (`services/a11y/`), Titel-Key in `app.routes.ts`
  (`title: 'a11y.pageTitle.*'`). `<html lang>` wird in `App` bei Sprachwechsel gesetzt.
- **Ansagen** dynamischer Änderungen (Routenwechsel, Formularfehler) via CDK **`LiveAnnouncer`**
  (`@angular/cdk/a11y`); Fokus-Trap in Dialogen liefert Angular Material.
- **Muster:** dekorative Icons `aria-hidden="true"`; Icon-only-Buttons brauchen `aria-label`
  (Dev-Guard in `con-x-button` warnt); Toggle-Zustände über `aria-pressed`/`aria-checked`/
  `aria-current`; Lade-/Fehlerzustände als `role="status"`/`role="alert"`; sichtbare
  `:focus-visible`-Indikatoren (nie `outline:none` ohne Ersatz); globaler
  `prefers-reduced-motion`-Guard; Layouts reflow-fähig (320px / 400% Zoom).
- **Marken-Orange `#e53d17`** bleibt bewusst unverändert → einige Text-Kontraste unter AA 1.4.3
  (dokumentiertes Restrisiko in `docs/accessibility.md`).
- **Prüfung:** `templateAccessibility`-Regeln laufen in `npm run lint`; ergänzend manuell
  (Tastatur, NVDA, Zoom, axe/Lighthouse).

### Architektur-Entscheidungen
- **Signal-first State** — kein externes State-Management.
- **Trennung Domänenmodell ↔ externes ODRL/EDC-Format.** Die Übersetzung ist isoliert im
  `policy-odrl.mapper.ts` (CX-Namespace `https://w3id.org/catenax/2025/9/policy/`).
- **Mock-first:** `policy.service.ts` ruft echte HTTP-CRUD-Endpunkte auf; MirageJS fängt exakt diese
  ab, wenn `useMocks` gesetzt ist. Ein Mock-Data-Switcher bietet Datensatzgrößen `empty`/`few`/`many`.
- **`con-x-`-Design-System** als dünne, tokenbasierte Schicht über Angular Material.
- **Deutsch ist rechtlich maßgeblich** (z.B. generierter legalText wird immer auf Deutsch erzeugt),
  unabhängig von der aktiven UI-Sprache.

### Testing-Strategie

- **E2E (primär): Cypress** — `npm run e2e` / `e2e:open`, `baseUrl http://localhost:4200`. `npm run e2e`
  startet den Mock-Server selbst (via `start-server-and-test`), wartet auf `:4200`, fährt Cypress
  headless und stoppt danach. Deckt die **Hauptflüsse** gegen den Mock-Modus ab: Policy erstellen,
  ansehen, bearbeiten, löschen, Liste durchsuchen/filtern; inkl. empty-/no-results-States. Specs in
  `cypress/e2e/*.cy.ts`. (`npm run cy:run` fährt nur Cypress gegen einen bereits laufenden Server.)
  - **Selektor-Konvention:** UI-Elemente werden über `data-cy="…"`-Attribute angesprochen
    (entkoppelt von CSS-Klassen & i18n-Text). Custom-Commands in `cypress/support/commands.ts`:
    `cy.getByCy(sel)` und `cy.visitWithMode(path, 'empty'|'few'|'many')` (setzt
    `localStorage['mock-policy-mode']` deterministisch — Mirage-State wird bei jedem Reload aus dem
    Modus neu erzeugt, daher Verifikation nach Create/Edit/Delete über In-App-Navigation).
- **Unit-Tests (Vitest, nur kritische Logik):** `npm test` (bzw. `test:watch`) über den Angular-21-
  Builder `@angular/build:unit-test` (headless, jsdom). **Fokus auf pure Functions & kritische
  Business-Logik,** NICHT auf jede Kleinigkeit: `policy-odrl.mapper.ts` (ODRL/EDC-Mapping, alle
  Bedingungstypen + Kombinationen), `constraint-validators.ts` (gültige/ungültige Eingaben),
  Metadata-Helper (`buildDefaultConstraint`, `getAllowedConstraintTypes`). UI-Komponenten, einfache
  Getter, triviale Helper: **nicht** unit-testen (E2E deckt das ab). Spec-Dateien liegen als
  `*.spec.ts` **neben dem Code** und importieren `describe/it/expect` aus `'vitest'`.
  `tsconfig.spec.json` ist für Vitest konfiguriert; Cypress-Types liegen getrennt in
  `cypress/tsconfig.json`.
- **Umgebungs-Hinweis (Windows/Electron-Terminals):** Wird Cypress aus einem Electron-basierten
  Terminal (VSCode/Claude-Code) gestartet und bricht mit `bad option: --smoke-test` bzw. Exit-Code
  `3221225501` ab, ist `ELECTRON_RUN_AS_NODE=1` gesetzt. Vor dem E2E-Lauf entfernen (Bash:
  `unset ELECTRON_RUN_AS_NODE`; PowerShell: `Remove-Item Env:ELECTRON_RUN_AS_NODE`). In normalen
  Dev-/CI-Shells ist die Variable nicht gesetzt.

---

## 4. Backend (parallel in Arbeit — TBD)

Kompakter Überblick; Details in `backend/README.md`.

- **Stack:** Java 21, Gradle 8.14.4 (Kotlin DSL), Spring Boot 3.5.13, PostgreSQL 16, Flyway, Lombok,
  springdoc-openapi, JUnit 5 + Testcontainers.
- **Layering** (`org.constructx.policyhub`): Feature-Modul `policies/{api,application,domain,
  infrastructure}` plus `config/` und `core/` (security, exception).
- **Entscheidungen:** 3-Typen-Grenze Entity → Domain-`record` → Response-DTO (handgeschriebene Mapper,
  kein MapStruct); `content` als **JSONB** (GIN-Index) für flexibles Policy-Format; **Flyway** statt
  Hibernate-DDL (`ddl-auto: validate`); HTTP Basic + CSRF disabled; einheitliches Fehlerformat via
  `@RestControllerAdvice`.
- **Befehle** (aus `backend/`): `docker compose up -d` (nur Postgres), `./gradlew bootRun` (Port 8080,
  dev-Login `admin/admin`, Swagger unter `/swagger-ui.html`), `./gradlew clean build` (Tests benötigen
  Docker/Testcontainers).
- Hinweis: Das Backend hat noch ein `status`-Feld, das nicht dem Frontend-Zielbild entspricht — wird
  beim Nachziehen angeglichen.

---

## 5. Beitrag & Git-Konventionen

- PRs gegen `main`; jeden PR möglichst an ein Issue verlinken (Templates unter `.github/`).
- **Conventional Commits** (bevorzugt), **signierte Commits** (bevorzugt), **License-Header** pro Datei.
- Branch-Namen: `feature/*`, `fix/*`.
- Dual-License: Apache-2.0 (Code) / CC-BY-4.0 (Non-Code).

## 6. Dokumentation

- UI-Referenz: `docs/design/policy-hub-design.md` + `docs/design/screens/`.
- Barrierefreiheit: `docs/accessibility.md` (WCAG-2.2-AA-Stand + bekannte Restrisiken).
- Design-Quelle: `docs/design/Policy_hub.pen` (Pencil).
- Backend-Details: `backend/README.md`. Frontend-Details: `frontend/README.md`.

---

## Anweisungen & Erwartungen

Verhaltensregeln für Claude beim Arbeiten in diesem Repo.

### Automatische Tasks nach Feature-Implementation
- Nach jedem neuen Feature automatisch `npm run lint` und alle vorhandenen Tests ausführen.
- Auftretende Fehler beheben, **bevor** die Arbeit als „done" gilt.
- **Tests & Barrierefreiheit sind Teil der Feature-Completion:**
  - **Unit-Tests nur für kritische Business-Logik** (Mapper, Validatoren, pure Functions — siehe Testing-Strategie). Nicht für jede UI-Komponente oder Kleinigkeit.
  - **E2E-Tests für User-Journeys** aktualisieren (`npm run e2e` grün).
  - **Barrierefreiheit (WCAG 2.2 AA) einplanen:** `aria-label`/`aria-hidden`/semantisches HTML/Keyboard-Support/Live-Regions/i18n-a11y-Keys etc. (siehe Abschnitt „Barrierefreiheit").
  - Ein Feature ist nur dann DONE, wenn **Lint grün**, **E2E grün**, **a11y-Anforderungen erfüllt** sind (Unit-Tests nach Bedarf für kritische Logik).

### CLAUDE.md selbst aktuell halten
Diese Datei immer aktualisieren, wenn:
- neue Folder/Komponenten hinzukommen,
- sich Conventions ändern,
- neue Dependencies hinzugefügt werden,
- Architektur-Entscheidungen getroffen werden.

### Code-Review vor Submission
Immer prüfen:
- Naming-Conventions eingehalten (Selektor-Präfixe `app`/`con-x`, Dateisuffixe, `*PageComponent`/`ConX*`)?
- Error Handling vorhanden (HTTP-Fehlerpfade, Nutzer-Feedback via NotificationService/Snackbar)?
- Keine `console.log` im Production-Code?
- TypeScript-Types vollständig?
- **Kein `any`** im Code.

### Weitere Erwartungen
- **i18n:** Neue UI-Strings nie literal — immer als Transloco-Key in **beiden** Dateien
  `de.json` UND `en.json` ergänzen.
- **Dependencies:** Vor dem Hinzufügen neuer Dependencies Rücksprache halten/begründen — keine
  ungefragten Pakete.
- **Imports:** Keine `../`-Relativimporte — immer die konfigurierten `@`-Pfad-Aliase nutzen.
