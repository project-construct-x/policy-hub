# Policy Hub — Backend

Spring Boot Backend für die Policy Hub Anwendung.

## Voraussetzungen

- **Java 21** (JDK)
- **Gradle 8.14+** (wird über den Gradle Wrapper bereitgestellt)

## Projekt bauen

```bash
./gradlew clean build
```

Auf Windows:

```cmd
gradlew.bat clean build
```

## Anwendung starten (Dev-Profil)

```bash
./gradlew bootRun
```

Die Anwendung startet standardmäßig mit dem `dev`-Profil und nutzt eine **H2 in-memory Datenbank**.

## Verfügbare Endpunkte (Dev)

| Endpunkt | Beschreibung | Auth |
|---|---|---|
| `GET /api/v1/policies` | Beispiel-Endpunkt (Alive-Nachweis) | Basic Auth |
| `GET /actuator/health` | Health-Check | Frei |
| `GET /actuator/info` | App-Info | Frei |
| `GET /swagger-ui.html` | Swagger UI (API-Dokumentation) | Frei |
| `GET /v3/api-docs` | OpenAPI-Spezifikation (JSON) | Frei |
| `GET /h2-console` | H2 Datenbank-Konsole | Frei |

## Authentifizierung (Dev)

Basic Auth mit folgenden Zugangsdaten:

- **Benutzername:** `admin`
- **Passwort:** `admin`

Beispiel mit curl:

```bash
curl -u admin:admin http://localhost:8080/api/v1/policies
```

## H2-Konsole (Dev)

- URL: http://localhost:8080/h2-console
- JDBC URL: `jdbc:h2:mem:policyhub`
- User: `sa`
- Passwort: *(leer)*

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
│   └── infrastructure/                # JPA, Repositories, Mapper
└── shared/                            # Modulübergreifende Typen
```

## Profile

| Profil | Datenbank | Beschreibung |
|---|---|---|
| `dev` (Standard) | H2 in-memory | Lokale Entwicklung |
| `prod` | Platzhalter (PostgreSQL o.ä.) | Produktionsumgebung |

## Technologie-Stack

- **Framework:** Spring Boot 3.5
- **Sprache:** Java 21
- **Build:** Gradle (Kotlin DSL)
- **Security:** Spring Security (Basic Auth)
- **API-Doku:** SpringDoc OpenAPI / Swagger UI
- **Persistenz (Dev):** H2 in-memory
- **Migration:** Flyway (derzeit deaktiviert)
- **Logging:** SLF4J + Logback (strukturiert)
