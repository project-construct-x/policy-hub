# Implementierungsplan: Policy Builder — Construct-X Policy Hub

> **Zweck dieses Dokuments:** Vollständiger Implementierungsplan für einen neuen Chat-/Coding-Agenten.
> Alle Entscheidungen sind final, alle offenen Fragen beantwortet.
> **Implementierung kann sofort starten — alle Phasen nacheinander, ohne Tests, Review am Ende.**

---

## 1. Ausgangslage

### 1.1 ADR-Entscheidung (genehmigt durch Leitungskreis)

Der Construct-X Policy Hub erhält einen **selbst gebauten Policy Builder** (Eigenentwicklung), der konzeptionell auf einem internen Policy Builder basiert. Das **`legalText`-Konzept pro Constraint** aus dem Catena-X Policy Builder wird als fachliche Referenz übernommen. Der Catena-X Policy Builder selbst wird **nicht** als Codebasis integriert.

### 1.2 Tech-Stack Policy Hub Frontend (IST)

| Technologie | Version |
|---|---|
| Angular | 21.2.0 |
| Angular Material | 21.2.2 |
| Transloco | 8.3 |
| MirageJS | 0.2-alpha |
| Cypress | 15.12 |

### 1.3 Bestehendes Frontend (IST-Zustand)

**Workspace-Pfad:** `c:\Projekte DataSpaces\policy-hub\frontend`

**Relevante Dateien:**

| Pfad | Zustand |
|---|---|
| `src/app/shared/types/policy.model.ts` | Flaches Mock-Modell mit `name`, `description`, `useCaseContext`, `purpose`, `permittedUsage`, `restrictions`, `content` (ODRL-String), `legalText` (Freitext), `createdAt`, `updatedAt`, `status` |
| `src/app/services/policies/policy.service.ts` | REST CRUD gegen `${environment.backendUrl}/v1/policies` |
| `src/app/app.routes.ts` | Lazy-loaded: `/policies`, `/policies/new`, `/policies/:id`, `/policies/:id/edit` |
| `src/app/pages/policies/policy-editor-page/` | **Stub** — nur `isEditMode`-Flag, kein Form |
| `src/app/pages/policies/policy-detail-page/` | Zeigt Hero + purpose/permittedUsage/restrictions/legalText als Fließtext |
| `src/app/pages/policies/policies-overview-page/` | Signals, Search, useCaseContext-Filter, Pagination |
| `src/app/ui/policy-table/cx-policy-table.component.ts` | Generisch mit `policies: input.required<Policy[]>()` |
| `src/app/mocks/mock.service.ts` | MirageJS Routes (GET/POST/PUT/DELETE `/v1/policies`) |
| `src/app/mocks/data/policies/mocked-policies.ts` | 3 Modi: `empty`/`few`/`many` mit Construct-X Beispielen |

### 1.4 Referenz: Eigenentwicklung (htx-connectorui)

**Workspace-Pfad:** `c:\Projekte DataSpaces\htx-connectorui`

**Konzeptionell übernommene Patterns (nicht 1:1 Code-Copy):**

- Discriminated Union für `Constraint`
- `PolicyType`-Enum mit explizitem `ALWAYS_TRUE`
- `PolicyRole` (access / usage)
- Constraint-Metadata als zentrale Registry
- Palette/Chip/Popover UX-Konzept
- ODRL-Mapper-Pattern (`constraintToOdrlPayload`, `atomicApiToConstraint`)
- CX-0152-Namespace (`https://w3id.org/catenax/2025/9/policy/`)

**Was NICHT übernommen wird:**
- `AdessoPolicyApiAdapter` und jegliche adesso-API-Logik
- `LegacyPolicyApiAdapter` und `PolicyApiService`
- `PolicyApiPort` (abstrakte Portklasse)
- `@htx/`-Path-Aliases
- `@adesso/dataspace-api-client`
- Feature-Flags `environment.useAdessoApi.*`

---

## 2. Finale Entscheidungen (alle offenen Fragen beantwortet)

### 2.1 Kein Lebenszyklus / Status

**Entscheidung:** Es gibt **keinen Policy-Lifecycle (kein DRAFT/ACTIVE/ARCHIVED)**. Die htx-connectorui hat keinen Status — das Policy-Hub-Frontend bekommt auch keinen. Das bestehende `status`-Feld im Mock-Modell wird **komplett entfernt**.

### 2.2 Use-Case-Katalog

**Entscheidung:** Use Cases werden **gemockt** mit Bauwesen-bezogenen Werten. Die richtigen Use Cases werden nachgezogen. Initiale Mock-Werte:

```typescript
type UseCaseId = 'UC.bim-coordination' | 'UC.quality-assurance' | 'UC.material-testing' | 'UC.site-documentation' | 'UC.geodata';
```

### 2.3 Framework Agreements

**Entscheidung:** Orientierung an der htx-connectorui → ein einzelner statischer Wert:

```typescript
const STATIC_FRAMEWORK_VALUE = 'DataExchangeGovernance';
```

### 2.4 ODRL-Namespace / @context

**Entscheidung:** 100% Orientierung an htx-connectorui:

```json
{
  "@vocab": "https://w3id.org/edc/v0.0.1/ns/",
  "edc": "https://w3id.org/edc/v0.0.1/ns/",
  "odrl": "http://www.w3.org/ns/odrl/2/"
}
```

CX Policy Namespace für leftOperands: `https://w3id.org/catenax/2025/9/policy/`

### 2.5 Category × PolicyType Matrix

**Entscheidung:** Orientierung an htx-connectorui. Alle 5 Policy-Arten sind für beide Kategorien verfügbar (Einschränkung kommt erst, wenn fachlich begründet).

### 2.6 legalText

**Entscheidung:** Mock-Texte verwenden (Platzhalter). Ein Jurist formuliert die finalen Texte später. Pro Constraint-Definition ein fester Text über Transloco-Keys.

### 2.7 Always-True-UX

**Entscheidung:** Keine Constraints. Wird beschrieben als "erlaubt alles". In der UI nur erklärender Text, keine Eingabefelder.

### 2.8 EDC-Validation

**Entscheidung:** **Draußen lassen und ignorieren.** Kein Bestandteil des MVP.

### 2.9 Unsaved-Changes-Schutz

**Entscheidung:** Nicht benötigt.

### 2.10 Edit-Verhalten (Category/Type änderbar?)

**Entscheidung:** Orientierung an htx-connectorui.

### 2.11 Mehrere Constraints / Kombinationen

**Entscheidung:** Orientierung an htx-connectorui. Pro PolicyType eine feste Constraint-Struktur.

### 2.12 Eigenentwicklung als Referenz

**Entscheidung:** Konzeptionell übernehmen, Code wird etwas anders als bei HTX. Kein 1:1-Copy.

### 2.13 Backend

**Entscheidung:** Komplett mit Mock-Daten arbeiten. Das komplette Frontend wird fertig gebaut. Backend wird final nachgezogen.

### 2.14 MVP-Scope (5 Typen)

**Entscheidung:** Vorerst bei den 5 MVP-Typen bleiben. Erweiterung kommt später.

---

## 3. Zielmodell

### 3.1 Enums und Typen

```typescript
// policy-category.ts
export type PolicyCategory = 'ACCESS' | 'CONTRACT';

// "Contract" ist die umbenannte "Usage Policy" (per ADR)
export type PolicyType =
  | 'ALWAYS_TRUE'
  | 'MEMBERSHIP_STATIC'
  | 'USE_CASE_MEMBERSHIP'
  | 'END_DATE'
  | 'FRAMEWORK_AGREEMENT';

export type ConstraintType = 'MEMBERSHIP' | 'USE_CASE' | 'END_DATE' | 'FRAMEWORK_AGREEMENT';

export type Operator = 'eq' | 'isAnyOf';
```

### 3.2 Constraint (Discriminated Union)

```typescript
export type Constraint =
  | { type: 'MEMBERSHIP'; value: 'active' }
  | { type: 'USE_CASE'; useCases: string[] }
  | { type: 'END_DATE'; endDate: string }  // ISO-8601
  | { type: 'FRAMEWORK_AGREEMENT'; agreement: string };
```

### 3.3 Policy

```typescript
export interface Policy {
  id: string;
  name: string;
  description: string;
  category: PolicyCategory;
  type: PolicyType;
  constraints: Constraint[];
  createdAt: string;
  updatedAt: string;
}
```

**Kein `status`-Feld!** Kein Lifecycle. Kein `summary`-Feld (wird in der UI dynamisch generiert). Kein `technicalRepresentation`-Feld im Modell — JSON-LD wird bei Bedarf berechnet.

### 3.4 Constraint-Metadata (Registry)

```typescript
export interface ConstraintMetadata {
  type: ConstraintType;
  labelKey: string;           // Transloco key
  descriptionKey: string;     // Transloco key
  legalTextKey: string;       // Transloco key
  icon: string;               // Material icon name
  defaultOperator: Operator;
  allowedIn: PolicyCategory[];
}
```

### 3.5 PolicyType-Metadata (Registry)

```typescript
export interface PolicyTypeMetadata {
  type: PolicyType;
  labelKey: string;
  descriptionKey: string;
  allowedCategories: PolicyCategory[];
  requiredConstraints: ConstraintType[];  // leer bei ALWAYS_TRUE
}
```

---

## 4. Zielstruktur

```
frontend/src/app/
├── pages/policies/
│   ├── policies-overview-page/        [ANPASSEN]
│   ├── policy-detail-page/            [ANPASSEN]
│   └── policy-editor-page/            [NEU AUFBAUEN - war Stub]
├── shared/
│   └── types/
│       ├── policy.model.ts            [ERSETZEN durch neues Modell]
│       └── constraint.model.ts        [NEU]
├── services/policies/
│   ├── policy.service.ts              [ANPASSEN - neue Typen]
│   └── policy-mapper/                 [NEU]
│       └── policy-odrl.mapper.ts
├── features/policies/builder/         [NEU]
│   ├── components/
│   │   ├── policy-builder/
│   │   ├── constraint-card/
│   │   ├── constraint-input/
│   │   ├── inputs/
│   │   │   ├── membership-input/
│   │   │   ├── use-case-input/
│   │   │   ├── end-date-input/
│   │   │   └── framework-agreement-input/
│   │   ├── legal-text-block/
│   │   └── policy-summary-card/
│   ├── metadata/
│   │   ├── constraint-metadata.ts
│   │   ├── policy-type-metadata.ts
│   │   └── use-case-options.data.ts
│   └── validators/
│       └── constraint-validators.ts
├── mocks/
│   ├── mock.service.ts                [ANPASSEN]
│   └── data/policies/
│       └── mocked-policies.ts         [NEU SCHREIBEN]
└── ui/
    ├── policy-table/                  [ANPASSEN - Spalten]
    └── category-badge/                [NEU]
```

---

## 5. UI-Konzept

### 5.1 Policy Builder (Editor-Page)

Single-Page-Form mit Progressive Disclosure (kein mehrseitiger Wizard):

1. **Grunddaten:** Name (Pflicht) + Beschreibung (optional)
2. **Kategorie:** Radio-Buttons "Access Policy" / "Contract Policy"
3. **Policy-Art:** Cards/Dropdown, gefiltert nach Kategorie
4. **Konfiguration:** Dynamisch je Policy-Art
   - Always True → kein Input, erklärender Text "Diese Policy erlaubt alles"
   - Membership Static → kein Input, erklärender Text
   - Use Case Membership → Multi-Select aus Use-Case-Katalog
   - End Date → Material Datepicker
   - Framework Agreement → statischer Wert (readonly-Anzeige)
5. **legalText-Block:** Unterhalb der Konfiguration, fest hinterlegter juristischer Hinweis
6. **Aktionen:** Speichern / Abbrechen

### 5.2 Detailseite

- Hero mit Name, Beschreibung, Kategorie-Badge, PolicyType-Badge
- Fachliche Zusammenfassung (auto-generiert)
- Constraint-Cards mit Icon, Label, Wert, legalText als Akkordeon
- "Technische Details"-Expander (zusammengeklappt) mit JSON-LD

### 5.3 Übersichtsseite

- Spalten: Name, Kategorie (Badge), Policy-Art, Aktualisiert am, Aktionen
- Filter: Kategorie, Policy-Art, Suchfeld
- Bestehender useCaseContext-Filter wird entfernt

---

## 6. ODRL-Mapping

Orientierung zu 100% an der htx-connectorui.

### 6.1 Namespaces

```typescript
const CX_POLICY_NS = 'https://w3id.org/catenax/2025/9/policy/';
const ODRL_NS = 'http://www.w3.org/ns/odrl/2/';
const EDC_NS = 'https://w3id.org/edc/v0.0.1/ns/';
```

### 6.2 leftOperand-Mapping

| ConstraintType | leftOperand IRI |
|---|---|
| `MEMBERSHIP` | `https://w3id.org/catenax/2025/9/policy/Membership` |
| `USE_CASE` | `https://w3id.org/catenax/2025/9/policy/UsagePurpose` |
| `END_DATE` | `https://w3id.org/catenax/2025/9/policy/DataUsageEndDate` |
| `FRAMEWORK_AGREEMENT` | `https://w3id.org/catenax/2025/9/policy/FrameworkAgreement` |

### 6.3 Action-Mapping

| PolicyCategory | Action IRI |
|---|---|
| `ACCESS` | `https://w3id.org/catenax/2025/9/policy/access` |
| `CONTRACT` | `odrl:use` |

### 6.4 Constraint-zu-ODRL Beispiel

```json
{
  "odrl:leftOperand": "https://w3id.org/catenax/2025/9/policy/Membership",
  "odrl:operator": { "@id": "odrl:eq" },
  "odrl:rightOperand": "active"
}
```

Bei mehreren Constraints → `odrl:and` (flach, kein Nesting).

---

## 7. Mock-Daten

### 7.1 Beispiel-Policies (mindestens diese im `few`-Modus)

1. **Access + Always True:** "Öffentlicher Zugriff auf Projektdokumentation"
2. **Access + Membership Static:** "Zugriff nur für Konsortium-Mitglieder"
3. **Contract + Use Case Membership:** "Baustellendaten für Qualitätsprüfungen"
4. **Contract + End Date:** "Geodaten bis Projektende 2027"
5. **Contract + Framework Agreement:** "Datenaustausch unter DEG-Rahmenvertrag"
6. **Access + End Date:** "Temporärer Zugriff bis Quartalsende"

### 7.2 Use-Case-Werte (gemockt, Bauwesen)

```typescript
export const USE_CASE_OPTIONS = [
  { id: 'UC.bim-coordination', labelKey: 'useCase.bim-coordination' },
  { id: 'UC.quality-assurance', labelKey: 'useCase.quality-assurance' },
  { id: 'UC.material-testing', labelKey: 'useCase.material-testing' },
  { id: 'UC.site-documentation', labelKey: 'useCase.site-documentation' },
  { id: 'UC.geodata', labelKey: 'useCase.geodata' },
];
```

### 7.3 Framework-Agreement-Wert

```typescript
export const FRAMEWORK_AGREEMENT_VALUE = 'DataExchangeGovernance';
```

---

## 8. i18n (Transloco)

### 8.1 Neue Translation-Keys (Struktur)

```
policyBuilder.title.create
policyBuilder.title.edit
policyBuilder.steps.basics
policyBuilder.steps.category
policyBuilder.steps.policyType
policyBuilder.steps.configuration
policyBuilder.field.name
policyBuilder.field.description

policyCategory.ACCESS.label = "Access Policy"
policyCategory.ACCESS.description = "Regelt wer auf die Daten zugreifen darf"
policyCategory.CONTRACT.label = "Contract Policy"
policyCategory.CONTRACT.description = "Regelt unter welchen Bedingungen Daten genutzt werden dürfen"

policyType.ALWAYS_TRUE.label = "Unbeschränkt"
policyType.ALWAYS_TRUE.description = "Erlaubt den Zugriff/die Nutzung ohne Einschränkungen"
policyType.MEMBERSHIP_STATIC.label = "Mitgliedschaft"
policyType.MEMBERSHIP_STATIC.description = "Nur für aktive Dataspace-Mitglieder"
policyType.USE_CASE_MEMBERSHIP.label = "Use Case"
policyType.USE_CASE_MEMBERSHIP.description = "Eingeschränkt auf bestimmte Anwendungsfälle"
policyType.END_DATE.label = "Zeitlich begrenzt"
policyType.END_DATE.description = "Gültig bis zu einem bestimmten Datum"
policyType.FRAMEWORK_AGREEMENT.label = "Rahmenvertrag"
policyType.FRAMEWORK_AGREEMENT.description = "Erfordert die Zustimmung zum Rahmenvertrag"

constraint.MEMBERSHIP.label = "Mitgliedschaft"
constraint.MEMBERSHIP.legalText = "[MOCK] Der Datenkonsument muss ein aktives Mitglied des Datenraums sein."
constraint.USE_CASE.label = "Anwendungsfall"
constraint.USE_CASE.legalText = "[MOCK] Die Datennutzung ist auf die ausgewählten Anwendungsfälle beschränkt."
constraint.END_DATE.label = "Enddatum"
constraint.END_DATE.legalText = "[MOCK] Die Nutzungsberechtigung erlischt zum angegebenen Datum."
constraint.FRAMEWORK_AGREEMENT.label = "Rahmenvertrag"
constraint.FRAMEWORK_AGREEMENT.legalText = "[MOCK] Der Datenkonsument muss dem DataExchangeGovernance-Rahmenvertrag zugestimmt haben."

useCase.bim-coordination = "BIM-Koordination"
useCase.quality-assurance = "Qualitätssicherung"
useCase.material-testing = "Materialprüfung"
useCase.site-documentation = "Baustellendokumentation"
useCase.geodata = "Geodaten"

validation.nameRequired = "Name ist erforderlich"
validation.endDateRequired = "Enddatum ist erforderlich"
validation.endDateInPast = "Enddatum muss in der Zukunft liegen"
validation.useCaseRequired = "Mindestens ein Anwendungsfall muss gewählt werden"
```

---

## 9. Validierung

### 9.1 Strukturelle Validierung

| Regel | Fehler |
|---|---|
| `name` nicht leer | nameRequired |
| `name` max 200 Zeichen | nameTooLong |
| `category` muss gesetzt sein | categoryRequired |
| `type` muss gesetzt sein | policyTypeRequired |

### 9.2 Constraint-spezifische Validierung

| ConstraintType | Regel |
|---|---|
| END_DATE | Datum nicht leer, nicht in Vergangenheit |
| USE_CASE | Mindestens 1 Use Case gewählt |
| MEMBERSHIP | Automatisch `active` — keine Validierung nötig |
| FRAMEWORK_AGREEMENT | Automatisch `DataExchangeGovernance` — keine Validierung nötig |
| (ALWAYS_TRUE) | Keine Constraints, keine Validierung |

---

## 10. Implementierungsphasen

**Alle Phasen nacheinander implementieren. Keine Tests. Review nach kompletter Implementierung.**

### Phase 1: Zielmodell definieren

**Aufgaben:**
- `shared/types/policy.model.ts` komplett ersetzen durch neues Modell (`Policy`, `PolicyCategory`, `PolicyType`, `Constraint`)
- `shared/types/constraint.model.ts` neu: Discriminated Union
- `features/policies/builder/metadata/constraint-metadata.ts` neu
- `features/policies/builder/metadata/policy-type-metadata.ts` neu
- `features/policies/builder/metadata/use-case-options.data.ts` neu

**Kein Status/Lifecycle!**

### Phase 2: Mock-Daten migrieren

**Aufgaben:**
- `mocked-policies.ts` komplett neu schreiben (6 Beispiele, siehe Abschnitt 7)
- `mock.service.ts` anpassen auf neues Modell
- `policy.service.ts` auf neue Typen umstellen

### Phase 3: Übersichtsseite anpassen

**Aufgaben:**
- `CxPolicyTableComponent`: Spalten Kategorie + PolicyType ergänzen (Badges), useCaseContext-Spalte entfernen
- `PoliciesOverviewPageComponent`: Filter auf Kategorie + PolicyType umstellen, useCaseContext-Filter entfernen
- `CategoryBadgeComponent` neu bauen (generisch für Kategorie + PolicyType)

### Phase 4: Policy-Builder Grundstruktur

**Aufgaben:**
- `PolicyBuilderComponent` neu (Single-Page-Form)
- Sektion Grunddaten (Name, Beschreibung)
- Sektion Kategorie (Radio-Group)
- Sektion Policy-Art (Cards/Dropdown, gefiltert nach Kategorie)
- `PolicyEditorPageComponent` orchestriert Builder (Create + Edit)

### Phase 5: Constraint-Inputs + legalText

**Aufgaben:**
- `ConstraintInputComponent` (Wrapper mit Switch auf ConstraintType)
- `MembershipInputComponent` (readonly, erklärender Text)
- `UseCaseInputComponent` (Multi-Select)
- `EndDateInputComponent` (MatDatepicker)
- `FrameworkAgreementInputComponent` (readonly, fester Wert)
- `LegalTextBlockComponent` (Akkordeon mit Rechtshinweis)
- Validatoren in `constraint-validators.ts`

### Phase 6: ODRL-Mapper + Summary

**Aufgaben:**
- `policy-odrl.mapper.ts`: `toOdrl(policy: Policy): object` (JSON-LD-Erzeugung)
- `PolicySummaryCardComponent` (auto-generierter Klartext)
- Integration in Builder (Zusammenfassungs-Sektion)

### Phase 7: Detailseite anpassen

**Aufgaben:**
- HTML/SCSS komplett überarbeiten
- `ConstraintCardComponent` neu bauen (Icon + Label + Wert + legalText-Akkordeon)
- `PolicySummaryCardComponent` einbetten
- "Technische Details"-Expander mit JSON-LD (zusammengeklappt)
- Kategorie/Type-Badges im Header

### Phase 8: i18n vervollständigen

**Aufgaben:**
- Alle neuen Translation-Keys in `de.json` und `en.json`
- legalText-Platzhalter mit `[MOCK]`-Prefix markieren

### Phase 9: Linting + Cleanup

**Aufgaben:**
- Alte Felder aus `policy.model.ts` entfernen (purpose, permittedUsage, restrictions, content, status, useCaseContext)
- Tote Imports entfernen
- `ng lint` durchlaufen
- Konsistenz prüfen

---

## 11. Wichtige Regeln für die Implementierung

1. **Kein Status/Lifecycle** — weder im Modell noch in der UI
2. **Terminologie:** "Access Policy" und "Contract Policy" (nie "Usage Policy")
3. **Nur 5 Policy-Arten** im MVP
4. **Nur `eq` und `isAnyOf`** als Operatoren
5. **Nur AND-Logik** (kein Or, kein Nesting)
6. **Kein EDC-Validation**
7. **Keine adesso-API-Logik** — nie im Policy Hub
8. **legalText pro Constraint-Definition** (Transloco-Key), nicht pro Instanz
9. **ODRL/JSON-LD direkt persistieren** — kein eigenes Schema
10. **Framework Agreement:** statischer Wert `DataExchangeGovernance`
11. **Use Cases:** gemockte Bauwesen-Werte, werden nachgezogen
12. **Always True:** keine Constraints, beschrieben als "erlaubt alles"
13. **Keine Tests** in dieser Implementierungsrunde
14. **Code wird etwas anders als htx-connectorui** — konzeptionelle Orientierung, kein Copy-Paste
15. **ODRL-Namespaces:** zu 100% wie htx-connectorui (CX 2025/9 policy NS)
16. **MirageJS** bleibt als Mock-Backend
17. **Kein Unsaved-Changes-Schutz** nötig

---

## 12. Referenz-Werte aus htx-connectorui

### ODRL Context

```json
{
  "@vocab": "https://w3id.org/edc/v0.0.1/ns/",
  "edc": "https://w3id.org/edc/v0.0.1/ns/",
  "odrl": "http://www.w3.org/ns/odrl/2/"
}
```

### CX Policy Namespace

```
https://w3id.org/catenax/2025/9/policy/
```

### leftOperand IRIs

- Membership: `…/Membership`
- UsagePurpose: `…/UsagePurpose`
- DataUsageEndDate: `…/DataUsageEndDate`
- FrameworkAgreement: `…/FrameworkAgreement`

### Actions

- Access: `https://w3id.org/catenax/2025/9/policy/access`
- Contract/Usage: `odrl:use`

### Framework Agreement

Statischer Wert: `DataExchangeGovernance`

---

## 13. Erwartetes Ergebnis

Nach Implementierung aller Phasen:

- Policies in den Kategorien **Access** und **Contract** erstellen, bearbeiten, löschen
- 5 Policy-Arten auswählen mit passender Constraint-Konfiguration
- Pro Constraint einen fest hinterlegten Rechtshinweis (legalText) sehen
- Policies in der Übersicht mit Kategorie/Typ-Badges filtern und suchen
- Fachlich verständliche Detailseite mit zurückhaltendem JSON-LD-Expander
- Mock-Backend (MirageJS) CRUD-fähig
- Intern ODRL/JSON-LD-Struktur erzeugen (vorbereitet für späteres Backend)

**Betroffene Routen:**
- `/policies` — angepasst
- `/policies/new` — vollständig neu
- `/policies/:id` — angepasst
- `/policies/:id/edit` — vollständig neu
