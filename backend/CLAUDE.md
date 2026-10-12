# CLAUDE.md — Backend

Ergänzt die Root-`CLAUDE.md`. Setup, Konfiguration und Details: `README.md` in diesem Ordner.
Der gemeinsame Wire- und Fachvertrag steht in `../docs/api-contract.md`.

- **Stack:** Java 21, Gradle 8.14.4 (Kotlin DSL), Spring Boot 3.5.13, PostgreSQL 16, Flyway, Lombok,
  springdoc-openapi, JUnit 5 + Testcontainers.
- **Layering** (`org.constructx.policyhub`): Feature-Modul `policies/{api,application,domain,
  infrastructure}` plus `config/` und `core/` (security, exception).
- **Entscheidungen:**
  - 3-Typen-Grenze Entity → Domain-`record` → Response-DTO, handgeschriebene Mapper (kein MapStruct).
  - `constraints` als **JSONB** (GIN-Index) für die Domänen-Constraints, nicht das ODRL-Dokument.
    ODRL wird nur für `GET /{id}/odrl` on-the-fly gemappt.
  - **Flyway** statt Hibernate-DDL (`ddl-auto: validate`).
  - HTTP Basic + CSRF disabled; einheitliches Fehlerformat via `@RestControllerAdvice`.
- **Befehle** (aus `backend/`): `docker compose up -d` (nur Postgres), `./gradlew bootRun` (Port 8080,
  Dev-Login `admin/admin`, Swagger unter `/swagger-ui.html`), `./gradlew clean build` (Tests brauchen
  Docker/Testcontainers).

## CORS & Auth (Dev)

- Das Backend hat **keine CORS-Konfiguration**. Der Angular-Dev-Server proxied `/api` zum Backend
  (`frontend/proxy.conf.js`, Ziel aus `BACKEND_PROXY_TARGET`, Fallback `http://localhost:8080`;
  im Root-`docker-compose.yml` `http://backend:8080`).
- Die Dev-Credentials (`admin`/`admin`) hängt `basic-auth.interceptor.ts` an, nur wenn
  `environment.devBasicAuth` gesetzt ist. `environment.production.ts` setzt es bewusst nicht; das
  echte Auth-Verfahren für Produktion/Staging ist offen.
