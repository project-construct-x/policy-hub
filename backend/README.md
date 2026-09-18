# Policy Hub — Backend

Spring Boot Backend für die Policy Hub Anwendung.

## Voraussetzungen

- **Java 21** (JDK)
- **Docker** (für PostgreSQL via Docker Compose)
- **Gradle 8.14+** (wird über den Gradle Wrapper bereitgestellt)

## Lokale Datenbank starten

Docker Compose liegt zentral im Repo-Root (`../docker-compose.yml`) als Monorepo-Stack für Frontend + Backend + Postgres. Alle folgenden Befehle vom **Repo-Root** aus ausführen.

Nur die Datenbank starten:

```bash
docker compose up -d postgres
```

Stoppt die Datenbank (ohne Datenverlust):

```bash
docker compose stop postgres
```

Vollständig aufräumen inkl. Volumes:

```bash
docker compose down -v
```

Das Backend zusätzlich im Container starten (baut das Image; Postgres wird als Abhängigkeit mitgestartet):

```bash
docker compose up --build backend
```

### Verbindungsdaten (Dev)

| Parameter | Wert |
|---|---|
| Host | `localhost` |
| Port | `5432` |
| Datenbank | `policyhub` |
| Benutzername | `policyhub` |
| Passwort | `policyhub` |
| JDBC URL | `jdbc:postgresql://localhost:5432/policyhub` |

## Projekt bauen

```bash
./gradlew clean build
```

Auf Windows:

```cmd
gradlew.bat clean build
```

> **Hinweis:** Der Build führt Integrationstests mit Testcontainers aus — Docker muss laufen.

## Anwendung starten (Dev-Profil)

1. Zuerst Docker Compose starten (siehe oben)
2. Dann:

```bash
./gradlew bootRun
```

Die Anwendung startet mit dem `dev`-Profil, verbindet sich mit der PostgreSQL-Datenbank und führt Flyway-Migrationen automatisch aus.

## Verfügbare Endpunkte (Dev)

| Endpunkt | Beschreibung | Auth |
|---|---|---|
| `GET /api/v1/policies` | Alle Policies abrufen | Basic Auth |
| `GET /actuator/health` | Health-Check | Frei |
| `GET /actuator/info` | App-Info | Frei |
| `GET /swagger-ui.html` | Swagger UI (API-Dokumentation) | Frei |
| `GET /v3/api-docs` | OpenAPI-Spezifikation (JSON) | Frei |

## Authentifizierung (Dev)

Basic Auth mit folgenden Zugangsdaten:

- **Benutzername:** `admin`
- **Passwort:** `admin`

Beispiel mit curl:

```bash
curl -u admin:admin http://localhost:8080/api/v1/policies
```

## Swagger UI (Dev)

- URL: http://localhost:8080/swagger-ui.html
- OpenAPI JSON: http://localhost:8080/v3/api-docs

## Projektstruktur

```
src/main/java/org/constructx/policyhub/
├── PolicyHubApplication.java          # Spring Boot Entry Point
├── config/                            # Technische Konfiguration
│   ├── OpenApiConfig.java
│   └── JacksonConfig.java
├── core/                              # Querschnittsthemen
│   ├── security/SecurityConfig.java
│   └── exception/
│       ├── GlobalExceptionHandler.java
│       └── ErrorResponse.java
├── policies/                          # Fachmodul: Policies
│   ├── api/                           # REST-Controller + DTOs
│   ├── application/                   # Anwendungslogik (Services)
│   ├── domain/                        # Fachliche Modelle & Regeln
│   └── infrastructure/                # JPA-Entity, Repository, Mapper
└── shared/                            # Modulübergreifende Typen
```

## Datenbank-Migrationen (Flyway)

Migrationen liegen unter `src/main/resources/db/migration/`:

| Migration | Inhalt |
|---|---|
| `V1__create_policy_tables.sql` | `policies`-Tabelle mit UUID-PK, JSONB-Inhalt, Timestamps |
| `V2__align_policy_schema_with_frontend.sql` | Schema an den Frontend-Vertrag angeglichen (`name`, `description`, `status`, `content` entfernt; `policy_id`, `category`, `constraints`, `legal_text`) |

**Migrationen enthalten nur Schema, keine Daten.** Ein frisch gestartetes Backend hat eine leere
`policies`-Tabelle. Beispiel-Policies existieren ausschließlich im Frontend-Mock-Modus
(MirageJS, in-memory) — bitte keine Seed-Migration ergänzen, sie würde in allen Profilen laufen
und damit auch im Cluster Daten anlegen.

## Profile

| Profil | Datenbank | Beschreibung |
|---|---|---|
| `dev` (Standard) | PostgreSQL (Docker Compose) | Lokale Entwicklung |
| `prod` | PostgreSQL (via Env-Vars) | Produktionsumgebung |

Für `prod` müssen folgende Umgebungsvariablen gesetzt sein:

| Variable | Beschreibung |
|---|---|
| `DB_HOST` | Datenbankhost (default: `localhost`) |
| `DB_PORT` | Datenbankport (default: `5432`) |
| `DB_NAME` | Datenbankname (default: `policyhub`) |
| `DB_USERNAME` | Datenbankbenutzer |
| `DB_PASSWORD` | Datenbankpasswort |
| `SPRING_SECURITY_USER_NAME` | HTTP Basic Auth Benutzername |
| `SPRING_SECURITY_USER_PASSWORD` | HTTP Basic Auth Passwort |

## Technologie-Stack

- **Framework:** Spring Boot 3.5
- **Sprache:** Java 21
- **Build:** Gradle (Kotlin DSL)
- **Security:** Spring Security (Basic Auth)
- **API-Doku:** SpringDoc OpenAPI / Swagger UI
- **Persistenz:** PostgreSQL 16 + Spring Data JPA / Hibernate
- **Migration:** Flyway
- **Tests:** JUnit 5 + Testcontainers (PostgreSQL)
- **Logging:** SLF4J + Logback (strukturiert)
