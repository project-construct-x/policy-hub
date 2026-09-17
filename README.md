# Construct-X Policy Hub

[![ci](https://img.shields.io/github/actions/workflow/status/project-construct-x/policy-hub/test.yml?branch=main&logo=GitHub&style=flat-square&label=ci)](https://github.com/project-construct-x/policy-hub/actions/workflows/test.yml?query=branch%3Amain)
[![build-and-publish](https://img.shields.io/github/actions/workflow/status/project-construct-x/policy-hub/build-and-publish.yml?branch=main&logo=GitHub&style=flat-square&label=build-and-publish)](https://github.com/project-construct-x/policy-hub/actions/workflows/build-and-publish.yml)
[![license](https://img.shields.io/badge/license-Apache%202.0-blue?style=flat-square&logo=apache)](./LICENSE)

---

> [!WARNING]
> This repository is under heavy development and **not** intended for productive use. The
> policy model, the constraint types and the backend API contract are provisional and may
> change without notice.

An open source implementation of a **Policy Hub** for the [Construct-X](https://construct-x.de/)
project: a tool to create and manage data-sharing **policies** for the Construct-X dataspace
(construction industry, built on the Catena-X/EDC stack). Policies are expressed as
**ODRL/JSON-LD** ([EDC](https://github.com/eclipse-edc/Connector) `PolicyDefinition`) and can be
built through a guided policy editor without requiring ODRL knowledge from the user.

This content is produced in the scope of the Construct-X project, funded by the German Federal
Ministry for Economic Affairs and Energy (BMWE) under funding number 13IPC038F.

## Repository structure

This is a monorepo:

| Folder      | Contents                                                                    |
| ----------- | ---------------------------------------------------------------------------- |
| `frontend/` | Angular app — the primary, mock-first implementation. See [frontend/README.md](./frontend/README.md). |
| `backend/`  | Spring Boot service, built in parallel to the frontend. See [backend/README.md](./backend/README.md). |
| `docs/`     | Design brief, screens and the Pencil design source.                          |
| `deploy/`   | GitOps deployment (Helm chart + ArgoCD) for the staging environment. See [deploy/README.md](./deploy/README.md). |

## Status

- **The frontend is the source of truth.** It was deliberately built mock-first (using
  [MirageJS](https://miragejs.com/)) to establish the target UX; it has no hard dependency on the
  backend.
- **The backend is being built in parallel** and is converging on the frontend's data contract.
- **The policy model is provisional.** The current categories and constraint types exist to
  support development and are very likely to change once the final Construct-X policy model is
  defined.

## Documentation

- Developer conventions, architecture decisions and coding guidelines are documented in
  [CLAUDE.md](./CLAUDE.md) — the single source of truth for how this repository is built.
- UI/UX reference: [docs/design/policy-hub-design.md](./docs/design/policy-hub-design.md) and
  `docs/design/screens/`; the design source is a Pencil file
  (`docs/design/Policy_hub.pen`).
- Accessibility: [docs/accessibility.md](./docs/accessibility.md) documents the WCAG 2.2 AA
  target and known residual risks.

## Quick start

### Prerequisites

- [Node.js](https://nodejs.org/) 20+ and npm 11+ (frontend)
- [Java](https://adoptium.net/) 21 (JDK) and [Docker](https://www.docker.com/) (backend)
- Docker (for the full stack via Docker Compose)

### Frontend only, with mock data (fastest way to see the app)

```sh
git clone https://github.com/project-construct-x/policy-hub.git
cd policy-hub/frontend
npm install
npm start
```

The app is served at [http://localhost:4200](http://localhost:4200) using an in-browser mock API
(MirageJS) — no backend or database required. See
[frontend/README.md](./frontend/README.md) for lint/test/build commands.

### Full stack (frontend + backend + PostgreSQL) via Docker Compose

```sh
git clone https://github.com/project-construct-x/policy-hub.git
cd policy-hub
docker compose up --build
```

This starts PostgreSQL (`:5432`), the Spring Boot backend (`:8080`) and the Angular dev server
(`:4200`), wired together without mocks. See [backend/README.md](./backend/README.md) to run the
backend on its own against a local database.

## Tech stack

| Layer      | Stack                                                                              |
| ---------- | ----------------------------------------------------------------------------------- |
| Frontend   | Angular 21 (standalone, Signals), Angular Material 21, Transloco (i18n), MirageJS, Vitest, Cypress |
| Backend    | Java 21, Spring Boot 3.5, PostgreSQL 16, Flyway, springdoc-openapi, JUnit 5 + Testcontainers |
| Deployment | Docker, Helm, ArgoCD (GitOps)                                                       |

## CI/CD & Deployment

GitHub Actions (`.github/workflows/test.yml`) runs backend tests, frontend unit tests and Cypress
E2E tests on every pull request against `main`. On push to `main`,
`build-and-publish.yml` builds and publishes container images and updates the staging deployment.
The staging environment itself is deployed via ArgoCD from the `deploy/` folder — see
[deploy/README.md](./deploy/README.md) for details; it is **not** production-ready.

## Contributing

Contributions happen via GitHub Issues and Pull Requests against `main` — see
[CONTRIBUTING.md](./CONTRIBUTING.md) and our [Code of Conduct](./CODE_OF_CONDUCT.md).

## License

All code files are distributed under the Apache 2.0 license. See [LICENSE](./LICENSE) for more information.

All non-code files are distributed under the Creative Commons Attribution 4.0 International license. See [LICENSE_non-code](./LICENSE_non-code) for more information.

See [NOTICE.md](./NOTICE.md) for third-party content notices.
