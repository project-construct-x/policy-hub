# CLAUDE.md — Construct-X Policy Hub

Übergreifende Regeln für das gesamte Repo. Bereichsspezifische Details stehen in
`frontend/CLAUDE.md`, `backend/CLAUDE.md` und `deploy/CLAUDE.md` (werden geladen, sobald dort
gearbeitet wird).

## 1. Projektüberblick

Der **Construct-X Policy Hub** erstellt und verwaltet Data-Sharing-**Policies** für den
Construct-X-Dataspace (Bauwesen, Catena-X/EDC-Stack). Policies werden als **ODRL/JSON-LD** (EDC
`PolicyDefinition`) ausgedrückt. ⚠️ Under heavy development — nicht für den produktiven Einsatz.

| Ordner      | Inhalt                                                          |
| ----------- | --------------------------------------------------------------- |
| `frontend/` | Angular-21-App (Hauptfokus) — `frontend/CLAUDE.md`              |
| `backend/`  | Spring-Boot-Service (Java 21, parallel in Arbeit) — `backend/CLAUDE.md` |
| `deploy/`   | GitOps: Helm-Chart + ArgoCD, Docker, CI — `deploy/CLAUDE.md`    |
| `docs/`     | API-Vertrag, Design-Brief, Barrierefreiheit                     |

## 2. Arbeitsmodus & Status

- **Frontend und Backend sind gleichwertige Produktbestandteile.** Das Frontend wurde zuerst gebaut
  und mit MirageJS unabhängig vom noch nicht fertigen Backend entwickelt. Diese Reihenfolge begründet
  keine Vorrangstellung. Bei Abweichungen gilt der gemeinsame [API-Vertrag](docs/api-contract.md);
  unklare oder breaking Änderungen vor der Umsetzung abstimmen.
- **⚠️ Policy-Modell & Constraints sind PROVISORISCH.** Kategorien (`ACCESS`/`CONTRACT`) und
  Constraint-Typen sind nur für die Entwicklung und werden im finalen Construct-X sehr
  wahrscheinlich ersetzt. Code auf Änderbarkeit auslegen.
- **Sprache:** Deutsch ist rechtlich maßgeblich (z.B. generierter `legalText`), unabhängig von der
  UI-Sprache.

## 3. Git & Beitrag

- PRs gegen `main`, möglichst an ein Issue verlinkt. Conventional Commits und signierte Commits
  (bevorzugt), License-Header pro Datei, Branches `feature/*` / `fix/*`.
  Dual-License: Apache-2.0 (Code) / CC-BY-4.0 (Non-Code).
- **Niemals eigenständig** `git commit`, `git push` oder `gh pr create` ausführen. Immer vorher
  nachfragen und die Bestätigung abwarten — auch wenn früher in der Session schon bestätigt wurde.

## 4. Verhalten von Claude

### Keine automatischen Checks
Lint, Tests, E2E, Build und Format **nicht** von selbst ausführen. Am Ende einer Änderung in
**einem Satz** vorschlagen, welche Checks sinnvoll wären (Styling/Text: keine; neue Logik: Lint +
Unit-Tests; geänderte User-Journey: zusätzlich E2E), und nur nach Zustimmung ausführen; Fehler der
ausgeführten Checks dann beheben. Die CI (`.github/workflows/test.yml`) prüft jeden PR ohnehin.

### Qualität (was ESLint nicht abdeckt)
- Fehlerpfade vorhanden (HTTP-Fehler, Nutzer-Feedback)?
- **Neue Dependencies nur nach Rücksprache** mit Begründung.

### CLAUDE.md pflegen
Nur bei Architektur- oder Konventionsänderungen anpassen — nicht bei jeder neuen Datei oder
Komponente. Kurz halten: keine Inhalte aufnehmen, die sich aus Code, ESLint oder READMEs ergeben.
Bereichsspezifisches gehört in die jeweilige Datei, nur Übergreifendes hierher.

### Token-sparsam arbeiten
- Gezielt lesen (`Grep`/Zeilenbereiche) statt ganze Dateien. Nicht lesen, ohne dass es die Aufgabe
  verlangt: `package-lock.json`, `de.json`/`en.json` komplett, `docs/design/Policy_hub.pen`,
  READMEs, `dist/`, `coverage/`, `.angular/`, `build/`.
- Kleine Änderungen minimal halten: keine Refactorings, keine zusätzlichen Dokus oder Tests nebenbei.
