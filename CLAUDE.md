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
| `deploy/`   | GitOps-Deployment: Helm-Chart + ArgoCD (siehe §5)  |

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
- `services/` — u.a. `services/policies/policy.service.ts` (HTTP-CRUD),
  `services/policies/policy-mapper/policy-odrl.mapper.ts` (Domänenmodell → ODRL/EDC) und
  `services/http/` (`http-error.interceptor.ts` loggt fehlgeschlagene Requests,
  `http-error.helper.ts` wählt den i18n-Key nach Statuscode).
- `shared/` — `types/` (Modelle), `pipes/`, `adapters/`.
- `mocks/` — MirageJS-Server + Mock-Daten.
- `src/fonts/` — selbst gehostete Schriften (Montserrat, Material Icons), eingebunden über
  `src/styles/_fonts.scss`. **Keine** Google-Fonts-Links in `index.html` (Herkunft & Lizenzen:
  `src/fonts/README.md`).

Routing ist **lazy** (`app.routes.ts`). **Pfad-Aliase** statt Relativimporte:
`@pages/* @ui/* @services/* @shared/* @mocks/* @env @features/policies/builder/*`.

### Code-Conventions (aus dem Code abgeleitet, ESLint-gestützt)
- **Modernes Angular durchgängig:** standalone (kein `NgModule`), `ChangeDetectionStrategy.OnPush`,
  `inject()` statt Constructor-DI, `input()/input.required()/output()` statt `@Input/@Output`,
  `signal()/computed()/effect()`, `toSignal()` an der RxJS-Grenze. Templates: `@if/@for` mit `track`
  (kein `*ngIf/*ngFor`).
  - **OnPush ist ESLint-`error`** (`@angular-eslint/prefer-on-push-component-change-detection`),
    nicht nur Konvention — alle Komponenten laufen mit OnPush. Zustand deshalb ausschließlich über
    Signals, `async`-Pipe oder Direktiven halten, die selbst `markForCheck()` rufen.
  - **`console.log` ist ESLint-`error`** (`no-console`, erlaubt sind nur `warn`/`error`).
- **Selektoren & Namen (ESLint erzwingt Präfixe `app` und `con-x`, kebab-case):**
  - `app-` = Pages/Features. Page-Dateien `*-page.component.ts`, Klasse `*PageComponent`.
  - `con-x-` = Design-System-UI. Klassen `ConX*Component`.
- **Dateisuffixe:** `*.component/.service/.model/.mapper/.helper/.data/.pipe/.adapter.ts`,
  `*-metadata.ts`, `*-validators.ts`.
- **Typisierung:** `strict` (+ verschärfte Flags, u.a. `noUnusedLocals`, `noUnusedParameters`,
  `noPropertyAccessFromIndexSignature`, `noImplicitReturns`). **String-Union-Types statt `enum`**;
  Domänentypen als **Discriminated Unions** in `shared/types/*.model.ts`, Diskriminante via
  exhaustivem `switch`.
- **Muster:**
  - Transformationen als **pure functions** in `*.mapper.ts` / `*.helper.ts` / `*-validators.ts`
    (Validators liefern `{ field, messageKey }`).
  - **Metadata-Registry** (`constraint-metadata.ts`, `*.data.ts`) enthält **nur i18n-Keys**, keine
    literalen Strings.
  - HTTP-Services: `providedIn:'root'`, `inject(HttpClient)`, `baseUrl` aus `@env`, dünne CRUD-Methoden
    → `Observable<T>`, **keine** Business-Logik.
- **i18n:** **keine literalen UI-Strings** — alles über Transloco-Keys (verschachteltes camelCase-
  Namespacing in `de.json`/`en.json`).
  - **Im Template übersetzen, nicht im Component.** `TranslocoService.translate()` ist keine
    Signal-Abhängigkeit: in einem `computed()` friert der Text in der Sprache ein, die beim letzten
    Neuberechnen aktiv war. Parameter als Signal berechnen und im Template über `t(key, params)`
    auflösen.
- **Styling:** SCSS pro Komponente; globale `--con-x-*`-Tokens in `styles.scss`; BEM-artige
  `con-x-`-Klassen. Geteilte Mixins liegen in `src/styles/_mixins.scss` und werden über
  `stylePreprocessorOptions.includePaths` aufgelöst → `@use 'mixins' as *;` (keine relativen Pfade).
  Den Fokus-Ring **immer** über `@include focus-ring($offset)` setzen, nie literal.
- **Format:** Prettier `printWidth 100`, single quotes, 2 Spaces.
- **Bundle-Budgets:** initial `700kB` Warnung / `1MB` Fehler (`angular.json`). `npm run build:prod`
  schlägt bei Überschreitung fehl — vor dem Hinzufügen schwerer Dependencies prüfen.

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

### Sicherheits-Konventionen

Aus dem OWASP-Top-10-Audit abgeleitet; bitte einhalten, sonst kommen die Befunde zurück.

- **Ein HTTP-Response ist Eingabe.** `http.get<Policy>()` prüft zur Laufzeit nichts — der Typ
  ist ein Compile-Zeit-Versprechen. Daten aus der API vor der Verwendung validieren:
  unbekannte Constraint-Typen über `keepKnownConstraints()` / `isKnownConstraintType()`
  aussortieren (ein Index-Zugriff mit unbekanntem Typ liefert `undefined` und wirft beim
  Rendern).
- **Nie ungeprüfte Werte als Transloco-Parameter.** Transloco durchsucht das Ergebnis einer
  Ersetzung erneut nach Platzhaltern; ein Wert mit `{{…}}` wird ein zweites Mal aufgelöst und
  kann die Schleife zum Nicht-Terminieren bringen. Werte gegen die Metadaten-Registry prüfen
  (`USE_CASE_OPTIONS`, `FRAMEWORK_AGREEMENT_VALUE`), sonst `'—'`.
- **i18n-Keys nie aus Daten zusammensetzen** — immer aus der Registry entnehmen.
- **`encodeURIComponent` für jeden Wert in einer URL,** auch für Route-Parameter: Angular
  dekodiert `%2F`/`%2E`, der Browser normalisiert anschließend `..` im Pfad.
- **`policyId` ist ein Identifier** (wird zum JSON-LD-`@id`) — Zeichensatz-Validierung in
  `constraint-validators.ts` beibehalten.
- **HTTP-Fehler nie verwerfen:** `error: (err: unknown) => …` mit
  `httpErrorMessageKey(err, '<fachlicher Fallback>')`. Nie Request-/Response-Bodies loggen.
- **Dev-Werkzeug gehört nicht ins Prod-Bundle.** `@if` steuert nur das Rendern; das Bundling
  entscheiden die `import`-Statements. Neue Mock-/Debug-Komponenten über `fileReplacements`
  ausschließen — dabei eine **Barrel-Datei** ersetzen, nicht die Komponente selbst
  (Angular behält die `templateUrl`-Zuordnung am Pfad, sonst bricht der AOT-Build mit
  `TS2339` ab; Muster: `ui/mock-data-switcher/index.ts`).
- **Keine externen Laufzeit-Ressourcen** (Fonts, Skripte, Styles von fremden Domains) —
  sie übertragen die Nutzer-IP und machen Builds vom Netz abhängig.
- **Produktion baut mit `security.autoCsp` und `subresourceIntegrity`.** Wer an Critical-CSS
  oder `index.html` schraubt, prüft das Ergebnis **im Browser** gegen den Prod-Build
  (Stylesheet aktiv? CSP-Violations?), nicht nur im HTML-Quelltext.

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
  `cypress/e2e/*.cy.ts` (aktuell **20 Tests** in 6 Specs). (`npm run cy:run` fährt nur Cypress
  gegen einen bereits laufenden Server.)
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
  - **Coverage-Gate:** `npm test` erzwingt Schwellen (statements 90 / branches 85 / functions 95 /
    lines 90) über `coverageInclude` in `angular.json`. Der Include ist bewusst als Glob über die
    Logik-Suffixe formuliert (`*.mapper.ts`, `*.helper.ts`, `*-validators.ts`, `*-metadata.ts`) —
    **jede neue Datei mit diesen Suffixen zählt automatisch mit und braucht Tests.**
- **CI-Gates** (`.github/workflows/test.yml`): Job `frontend-quality` fährt `lint`, `format:check`
  und `build:prod` (inkl. Bundle-Budgets), `frontend-unit-test` die Vitest-Suite inkl. Coverage-
  Schwellen, `frontend-e2e-test` Cypress. Alle laufen auf Node 22 (wie das Docker-Build-Image).
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

## 5. CI/CD, Docker & Deployment

> ⚠️ Staging-Infrastruktur, **nicht** produktiv. Details in `deploy/README.md`.

### Docker (lokal)
- **Root `docker-compose.yml`** — voller Stack **ohne** Mocks (Postgres + Backend + Frontend):
  `docker compose up --build`. Frontend `:4200` (Dev-Image mit Live-Mount), Backend `:8080`,
  Postgres `:5432`. Aus `frontend/` auch via `npm run docker:dev`.
- **Dockerfiles:** Backend `backend/Dockerfile`; Frontend `frontend/cicd/docker/Dockerfile.development`
  (Dev) und `Dockerfile.production` (nginx, SPA-Fallback, Port 8080, `nginx.conf` daneben).

### GitHub Actions (`.github/workflows/`)
- **`test.yml`** — CI-Gate: `backend-test` (`./gradlew test`, JUnit 5 + Testcontainers/Docker),
  `frontend-unit-test` (`npm test`, Vitest), `frontend-e2e-test` (`npm run e2e`, Cypress gegen
  Mock-Modus). Trigger: PRs gegen `main`, Push auf `main` (ignoriert `deploy/**` und `**/*.md`),
  `workflow_dispatch`.
- **`build-and-publish.yml`** — baut Backend- & Frontend-Images, pusht nach
  `ghcr.io/project-construct-x/policy-hub-{backend,frontend}` (Tags `<short-sha>` + `main`) und
  **committet die neuen Image-Tags zurück** in `deploy/helm/policy-hub/values.yaml`
  (Commit `ci: … [skip ci]`). Trigger: Push auf `main` (ohne `deploy/**`, `**/*.md`).

### Deployment (GitOps)
- **ArgoCD** (auto-sync, self-heal) rendert das Umbrella-Helm-Chart `deploy/helm/policy-hub/`
  in Namespace `policyhub`: Postgres-StatefulSet, Backend- & Frontend-Deployment + Services, Ingress
  `policy-hub.staging.construct-x.net` (`/` → Frontend, `/api` → Backend).
- **Flow:** Push auf `main` → Images gebaut/gepusht → Tags in `values.yaml` gebumpt → ArgoCD rollt aus.
- Layout: `helm/policy-hub/` (Chart), `argocd/{project,application}.yaml`, `secrets/` (Doku zum
  Secret-Handling, siehe `secrets/README.md`).
- **Secrets (⚠️ nicht production-ready — K8s-Secrets sind nur base64-kodiert, nicht verschlüsselt):**
  - **DB-Passwort** erzeugt das Chart selbst (`templates/secrets.yaml`, `randAlphaNum 32`) — **einmalig
    beim ersten Install, keine automatische Rotation**. Zwei Guards halten den Wert stabil und sind
    beide zwingend: der Helm-`lookup` im Template (deckt `helm upgrade` ab) **und**
    `ignoreDifferences` auf `/data/db-password` + `RespectIgnoreDifferences=true` in
    `argocd/application.yaml` (deckt ArgoCD ab, dessen repo-server ohne Cluster-Zugriff rendert).
    Fällt einer weg, rotiert das Passwort bei jedem Reconcile und das Backend bricht gegen das
    bestehende Postgres-PVC.
  - **HTTP Basic Auth ist ein Provisorium** bis das echte Construct-X-Auth-Verfahren feststeht.
    Bewusst isoliert in `templates/secret-basic-auth.yaml` + `auth`-Block in `values.yaml`
    (Passwort **absichtlich im Klartext in git**), damit es in einem Zug entfernt werden kann — die
    Ausbau-Anleitung steht im Kopf-Kommentar des Templates.
  - Nur `ghcr-creds` wird noch manuell per `kubectl` angelegt.
- `argocd/application.yaml` wird per `kubectl apply` gebootstrappt, ist also **nicht** selbst
  GitOps-verwaltet — nach Änderungen daran erneut applyen.

## 6. Beitrag & Git-Konventionen

- PRs gegen `main`; jeden PR möglichst an ein Issue verlinken (Templates unter `.github/`).
- **Conventional Commits** (bevorzugt), **signierte Commits** (bevorzugt), **License-Header** pro Datei.
- Branch-Namen: `feature/*`, `fix/*`.
- Dual-License: Apache-2.0 (Code) / CC-BY-4.0 (Non-Code).

## 7. Dokumentation

- UI-Referenz: `docs/design/policy-hub-design.md` + `docs/design/screens/`.
- Barrierefreiheit: `docs/accessibility.md` (WCAG-2.2-AA-Stand + bekannte Restrisiken).
- Design-Quelle: `docs/design/Policy_hub.pen` (Pencil).
- Backend-Details: `backend/README.md`. Frontend-Details: `frontend/README.md`.
  Deployment-Details: `deploy/README.md`.

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
- Keine `console.log` im Production-Code? (ESLint erzwingt das inzwischen)
- TypeScript-Types vollständig?
- **Kein `any`** im Code.
- Neue Datei mit Logik-Suffix (`*.mapper/.helper/-validators/-metadata.ts`) → Tests vorhanden?
  Sie fällt automatisch unter das Coverage-Gate.

### Weitere Erwartungen
- **i18n:** Neue UI-Strings nie literal — immer als Transloco-Key in **beiden** Dateien
  `de.json` UND `en.json` ergänzen.
- **Dependencies:** Vor dem Hinzufügen neuer Dependencies Rücksprache halten/begründen — keine
  ungefragten Pakete.
- **Imports:** Keine `../`-Relativimporte — immer die konfigurierten `@`-Pfad-Aliase nutzen.
