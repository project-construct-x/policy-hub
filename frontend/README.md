# Frontend

Modernes Angular-Frontend für Policy Hub, gebaut mit Angular 21, TypeScript und Angular Material.

## 📋 Voraussetzungen

- **Node.js**: Version 20 oder höher
- **npm**: Version 11 oder höher
- **Git**: Für Version Control

Prüfe deine Versionen mit:

```bash
node --version
npm --version
```

## 🚀 Getting Started

### Installation

1. Navigiere in das Frontend-Verzeichnis:

```bash
cd frontend
```

2. Installiere die Dependencies:

```bash
npm install
```

3. Starte den Entwicklungsserver:

```bash
npm start
```

Die Anwendung ist anschließend unter [http://localhost:4200] erreichbar und lädt automatisch neu, wenn du Dateien änderst.

## 📝 Verfügbare Befehle

### Entwicklung

```bash
npm start                              # Entwicklungsserver mit Mock-Daten (ng serve --configuration mocks)
npm run start:dev                      # ng serve (nutzt aktuell ebenfalls die mocks-Config als Default)
ng serve --configuration development   # Entwicklungsserver gegen echtes Backend (http://localhost:8080/api)
npm run watch                          # Build im Watch-Modus mit Development-Config
```

### Docker

```bash
npm run docker:mocks   # Docker-Container mit Mock-Konfiguration starten
npm run docker:dev     # Docker-Container mit Development-Konfiguration starten
```

### Code-Qualität

```bash
npm run lint          # ESLint ausführen und Fehler anzeigen
npm run format        # Code mit Prettier formatieren
npm run format:check  # Prüfe ob Code formatiert ist (ohne Änderungen)
```

### Testing

```bash
npm test              # Unit Tests (Vitest) headless ausführen
npm run test:watch    # Unit Tests im Watch-Modus
npm run e2e           # E2E Tests: startet Mock-Server automatisch, führt Cypress headless aus
npm run e2e:open      # E2E Tests interaktiv (startet Mock-Server automatisch)
npm run cy:run        # Nur Cypress (setzt bereits laufenden Dev-Server auf :4200 voraus)
```

### Build

```bash
npm run build         # Production Build erstellen (dist/ Ordner)
```

## 📁 Projektstruktur -> Work in Progress!

```
frontend/
├─ cypress/                                   # E2E Tests
│  ├─ e2e/                                    # Test-Dateien
│  ├─ support/                                # Test-Utilities (commands, e2e.ts)
│  └─ fixtures/                               # Mock-Daten
│
├─ src/
│  ├─ assets/                                 # Statische Dateien (Bilder, Fonts, etc.)
│  ├─ environments/                           # Umgebungskonfigurationen
│  ├─ index.html                              # HTML Entry Point
│  ├─ main.ts                                 # Angular Bootstrap
│  ├─ styles.scss                             # Globale Styles
│  │
│  └─ app/
│     ├─ app.component.ts                     # Root Component
│     ├─ app.config.ts                        # Angular App Konfiguration
│     ├─ app.routes.ts                        # Routing Definition
│     │
│     ├─ pages/                               # Page/Route-Komponenten (Selektor-Präfix app-)
│     │  ├─ home/                             # Home-Seite
│     │  └─ policies/                         # Policy Management Pages
│     │     ├─ policies-overview-page/        # Übersicht aller Policies
│     │     ├─ policy-detail-page/            # Detail-View einer Policy
│     │     └─ policy-editor-page/            # Policy erstellen/bearbeiten
│     │        └─ policy-builder/             # Kern-Feature: Wizard (components/metadata/validators/helpers)
│     │
│     ├─ ui/                                  # Wiederverwendbares Design-System (cx-*)
│     │  ├─ button/  category-badge/  empty-state/  snackbar/  policy-table/
│     │  ├─ confirm-delete-dialog/
│     │  ├─ header/                           # App-Header mit Navigation
│     │  └─ mock-data-switcher/               # Entwicklermenü (Mock-Daten-Umschalter)
│     │
│     ├─ services/                            # Business Logic & API
│     │  ├─ policies/                         # PolicyService (CRUD) + policy-mapper/ (ODRL/EDC-Mapping)
│     │  └─ notification/                     # NotificationService (MatSnackBar)
│     │
│     ├─ shared/                              # Gemeinsame Types & Utilities
│     │  ├─ types/                            # TypeScript-Interfaces (policy.model, constraint.model)
│     │  ├─ pipes/                            # Pipes (RelativeDatePipe, etc.)
│     │  └─ adapters/                         # z.B. CxDateAdapter
│     │
│     └─ mocks/                               # MirageJS-Server + Mock-Daten (empty/few/many)
│
├─ angular.json                               # Angular CLI Konfiguration
├─ cypress.config.ts                          # Cypress Konfiguration
├─ eslint.config.js                           # ESLint Konfiguration
├─ package.json                               # Dependencies & Scripts
├─ package-lock.json                          # Locked Dependencies (npm)
├─ tsconfig.json                              # TypeScript Basis-Config
├─ tsconfig.app.json                          # TypeScript App-Config
├─ tsconfig.spec.json                         # TypeScript Test-Config
└─ README.md                                  # Diese Datei
```

### 📖 Ordnerstruktur Erklärung

| Ordner            | Zweck                                                                              |
| ----------------- | ---------------------------------------------------------------------------------- |
| **pages/**        | Page-Komponenten für Routes (Selektor-Präfix `app-`). Jede Page ist eine Seite.    |
| **ui/**           | Wiederverwendbare, präsentationsnahe UI-Komponenten (Design-System, Präfix `cx-`). |
| **services/**     | Services für API-Calls & abgeleitete Logik (z.B. ODRL/EDC-Mapping).                |
| **shared/**       | Gemeinsame Types (String-Union-/Discriminated-Union-Modelle), Pipes, Adapters.     |
| **mocks/**        | MirageJS-Mock-Server samt Beispieldaten für die lokale Entwicklung.                |
| **assets/**       | Statische Dateien wie Icons, Logos, Fonts.                                         |
| **environments/** | Umgebungskonfigurationen (`environment.ts` / `.mocks.ts` / `.production.ts`).      |

### Code-Stil

Dieses Projekt nutzt **Prettier** für automatische Code-Formatierung. Code wird automatisch formatiert beim Commit (via Hooks, sofern konfiguriert).

```bash
# Vor dem Commit
npm run format  # Formatiere alle Dateien
npm run lint    # Prüfe auf Linting-Fehler
```

> **Konventionen & Erwartungen:** Verbindliche Code-Conventions, Architektur-Entscheidungen und
> Verhaltensregeln stehen in [`../CLAUDE.md`](../CLAUDE.md) (Single Source of Truth).

## 🧪 Testing

### Unit Tests (Vitest)

Der Unit-Test-Runner **Vitest** läuft über den Angular-Builder `@angular/build:unit-test`
(headless, jsdom). Ausführen mit `npm test` (bzw. `npm run test:watch`). Spec-Dateien liegen
**neben dem Code** als `*.spec.ts`:

```
src/
├── app/
│   ├── my.component.ts
│   └── my.component.spec.ts  # Test-Datei
```

Fokus (gezielt, kein flächendeckendes Testen) sind die kritischen reinen Funktionen:

- `services/policies/policy-mapper/policy-odrl.mapper.spec.ts` — ODRL/EDC-Mapping (alle
  Bedingungstypen + Kombinationen),
- `policy-builder/validators/constraint-validators.spec.ts` — Bedingungs-Prüfung
  (gültige/ungültige Eingaben),
- `policy-builder/metadata/constraint-metadata.spec.ts` — erlaubte Typen & Default-Bedingungen.

> Hinweis: `tsconfig.spec.json` ist für Vitest konfiguriert; die Cypress-Typen liegen getrennt in
> `cypress/tsconfig.json`.

### E2E Tests (Cypress)

```bash
npm run e2e           # startet den Mock-Server automatisch (start-server-and-test) + Cypress headless
npm run e2e:open      # dasselbe interaktiv (Cypress-UI)
npm run cy:run        # nur Cypress gegen einen bereits laufenden Dev-Server (:4200)
```

E2E-Tests laufen zuverlässig gegen den **Mock-Modus** (MirageJS, unabhängig vom Backend) und decken
die Kernabläufe ab (erstellen, ansehen, bearbeiten, löschen, durchsuchen/filtern). Sie befinden sich
in `cypress/`:

```
cypress/
├── e2e/               # Test-Dateien (*.cy.ts)
├── support/           # Custom Commands (getByCy, visitWithMode) + Typen
├── tsconfig.json      # TypeScript-Config für Cypress
└── fixtures/          # Mock-Daten
```

**Selektor-Konvention:** UI-Elemente werden in Tests über `data-cy="…"`-Attribute angesprochen
(entkoppelt Tests von CSS-Klassen und i18n-Text). Datensatzgröße wird deterministisch über
`cy.visitWithMode(path, 'empty' | 'few' | 'many')` gesteuert.

## 📚 Tech Stack

- **Framework**: [Angular 21](https://angular.io/)
- **Sprache**: [TypeScript 5.9](https://www.typescriptlang.org/)
- **Styling**: [SCSS](https://sass-lang.com/) mit CSS Custom Properties
- **UI Components**: [Angular Material 21](https://material.angular.io/) (M3 Theme)
- **i18n**: [@jsverse/transloco](https://jsverse.github.io/transloco/) (Deutsch)
- **Mock Server**: [MirageJS](https://miragejs.com/) (lokale API-Simulation)
- **State Management**: Angular Signals + RxJS
- **Routing**: Angular Router
- **Linting**: [ESLint](https://eslint.org/) + [Angular ESLint](https://github.com/angular-eslint/angular-eslint)
- **Formatierung**: [Prettier](https://prettier.io/)
- **Unit Testing**: [Vitest](https://vitest.dev/)
- **E2E Testing**: [Cypress](https://www.cypress.io/)
- **Build Tool**: Vite (via Angular Build)
