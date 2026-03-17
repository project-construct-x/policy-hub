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
npm start              # Entwicklungsserver starten (ng serve)
npm run watch         # Build im Watch-Modus mit Development-Config
```

### Code-Qualität
```bash
npm run lint          # ESLint ausführen und Fehler anzeigen
npm run format        # Code mit Prettier formatieren
npm run format:check  # Prüfe ob Code formatiert ist (ohne Änderungen)
```

### Testing
```bash
npm test              # Unit Tests mit Vitest ausführen
npm run e2e           # E2E Tests mit Cypress ausführen
npm run e2e:open      # Cypress Test Runner öffnen (interaktiv)
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
│     ├─ pages/                               # Page/Route-Komponenten
│     │  ├─ home/                             # Home-Seite
│     │  └─ policies/                         # Policy Management Pages
│     │     ├─ policies-overview-page/        # Übersicht aller Policies
│     │     ├─ policy-detail-page/            # Detail-View einer Policy
│     │     └─ policy-editor-page/            # Policy bearbeiten/erstellen
│     │
│     ├─ ui/                                  # Wiederverwendbare UI-Komponenten
│     │  ├─ atoms/                            # Basis-Komponenten (Button, Icon, Badge)
│     │  ├─ form/                             # Form UI (FormField, Select, Validation)
│     │  └─ dialog/                           # Dialog Shell & Dialogs
│     │
│     ├─ services/                            # Business Logic & API
│     │  ├─ policies/                         # Policies-Service (API, Mapping, State/Facade)
│     │  ├─ policy-builder/                   # Adapter/Wrapper zur Builder-Library
│     │  └─ notification/                     # Notification-Service (MatSnackBar)
│     │
│     ├─ core/                                # App-weit Singular-Services
│     │  ├─ guards/                           # Route Guards (Auth, etc.)
│     │  ├─ interceptors/                     # HTTP Interceptors
│     │  └─ config/                           # Globale Konfiguration
│     │
│     └─ shared/                              # Gemeinsame Utilities & Types
│        ├─ types/                            # Gemeinsame TypeScript Interfaces
│        └─ utils/                            # Helper-Funktionen
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

| Ordner | Zweck |
|--------|-------|
| **pages/** | Page-Komponenten für Routes. Jede Page ist eine Seite in der Anwendung. |
| **ui/** | Wiederverwendbare, dumb UI-Komponenten (keine Business Logic). Sind ein Design System. |
| **services/** | Smart Services für API-Calls, State Management & Business Logic. |
| **core/** | Singleton-Services, die app-weit genau einmal instanziiert werden (Guards, Interceptors). |
| **shared/** | Gemeinsame Types, Enums & Utility-Funktionen. |
| **assets/** | Statische Dateien wie Icons, Logos, Fonts. |
| **environments/** | Umgebungsspezifische Konfigurationen (dev, test, prod). |


### Code-Stil
Dieses Projekt nutzt **Prettier** für automatische Code-Formatierung. Code wird automatisch formatiert beim Commit (via Hooks, sofern konfiguriert).

```bash
# Vor dem Commit
npm run format  # Formatiere alle Dateien
npm run lint    # Prüfe auf Linting-Fehler
```

## 🧪 Testing

### Unit Tests
```bash
npm test              # Tests ausführen
npm test -- --watch   # Watch-Modus
npm test -- --coverage  # Mit Coverage-Report
```

Unit Tests befinden sich neben dem Code:
```
src/
├── app/
│   ├── my.component.ts
│   └── my.component.spec.ts  # Test-Datei
```

### E2E Tests
```bash
npm run e2e           # Tests headless ausführen
npm run e2e:open      # Cypress IDE öffnen
```

E2E Tests befinden sich in `cypress/`:
```
cypress/
├── e2e/               # Test-Dateien
├── support/           # Test-Utilities
└── fixtures/          # Mock-Daten
```


## 📚 Tech Stack

- **Framework**: [Angular 21](https://angular.io/)
- **Sprache**: [TypeScript 5.9](https://www.typescriptlang.org/)
- **Styling**: [SCSS](https://sass-lang.com/)
- **UI Components**: [Angular Material](https://material.angular.io/)
- **State Management**: RxJS
- **Routing**: Angular Router
- **Linting**: [ESLint](https://eslint.org/) + [Angular ESLint](https://github.com/angular-eslint/angular-eslint)
- **Formatierung**: [Prettier](https://prettier.io/)
- **Unit Testing**: [Vitest](https://vitest.dev/)
- **E2E Testing**: [Cypress](https://www.cypress.io/)
- **Build Tool**: Vite (via Angular Build)