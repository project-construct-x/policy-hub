# Construct-X Policy Hub

[![ci](https://img.shields.io/github/actions/workflow/status/project-construct-x/policy-hub/test.yml?branch=main&logo=GitHub&style=flat-square&label=ci)](https://github.com/project-construct-x/policy-hub/actions/workflows/test.yml?query=branch%3Amain)
[![build-and-publish](https://img.shields.io/github/actions/workflow/status/project-construct-x/policy-hub/build-and-publish.yml?branch=main&logo=GitHub&style=flat-square&label=build-and-publish)](https://github.com/project-construct-x/policy-hub/actions/workflows/build-and-publish.yml)
[![license](https://img.shields.io/badge/license-Apache%202.0-blue?style=flat-square&logo=apache)](./LICENSE)

---

> [!WARNING]
> This repository is under heavy development and **not** intended for productive use. The
> policy model and its constraint types are provisional and may change without notice.

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
| `frontend/` | Angular app. See [frontend/README.md](./frontend/README.md).                 |
| `backend/`  | Spring Boot service (PostgreSQL-backed). See [backend/README.md](./backend/README.md). |
| `docs/`     | Design brief, screens and the Pencil design source.                          |
| `deploy/`   | GitOps deployment (Helm chart + ArgoCD) for the staging environment. See [deploy/README.md](./deploy/README.md). |

## Status

- **Frontend and backend are integrated.** Policies created, edited and deleted in the UI are
  persisted by the Spring Boot backend in PostgreSQL — the full create/read/update/delete flow
  works end to end.
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

- Docker (runs the full stack)
- [Node.js](https://nodejs.org/) 20+ and npm 11+ (for frontend-only development)
- [Java](https://adoptium.net/) 21 (JDK) (for backend-only development)

### Full stack (frontend + backend + PostgreSQL) via Docker Compose

```sh
git clone https://github.com/project-construct-x/policy-hub.git
cd policy-hub
docker compose up --build
```

This starts PostgreSQL (`:5432`), the Spring Boot backend (`:8080`) and the Angular dev server
(`:4200`), talking to each other. The app is served at
[http://localhost:4200](http://localhost:4200).

For running frontend or backend on their own (e.g. for faster local iteration), see
[frontend/README.md](./frontend/README.md) and [backend/README.md](./backend/README.md). The
frontend also has a mock-data mode (MirageJS) for developing the UI without a running backend —
this is a development convenience only and is not part of the shipped application.

## Tech stack

| Layer      | Stack                                                                              |
| ---------- | ----------------------------------------------------------------------------------- |
| Frontend   | Angular 21 (standalone, Signals), Angular Material 21, Transloco (i18n), Vitest, Cypress |
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
