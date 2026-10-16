# CLAUDE.md — CI/CD, Docker & Deployment

Ergänzt die Root-`CLAUDE.md`. Details: `README.md` und `secrets/README.md` in diesem Ordner.

> Staging-Infrastruktur, **nicht** produktiv.

## Docker (lokal)

- **Root `docker-compose.yml`:** voller Stack ohne Mocks (Postgres + Backend + Frontend),
  `docker compose up --build`. Frontend `:4200` (Dev-Image mit Live-Mount), Backend `:8080`,
  Postgres `:5432`. Aus `frontend/` auch via `npm run docker:dev`. Der `frontend`-Service setzt
  `BACKEND_PROXY_TARGET=http://backend:8080` (siehe `frontend/proxy.conf.js`).
- **Dockerfiles:** `backend/Dockerfile`; Frontend `frontend/cicd/docker/Dockerfile.development` und
  `Dockerfile.production` (nginx, SPA-Fallback, Port 8080, `nginx.conf` daneben).

## GitHub Actions (`.github/workflows/`)

- **`test.yml`** (CI-Gate): `backend-test` (`./gradlew test`), `frontend-quality` (`lint`,
  `format:check`, `build:prod` inkl. Bundle-Budgets), `frontend-unit-test` (Vitest inkl.
  Coverage-Schwellen), `frontend-e2e-test` (Cypress gegen Mock-Modus). Trigger: PRs gegen `main`,
  Push auf `main` (ohne `deploy/**` und `**/*.md`), `workflow_dispatch`.
- **`build-and-publish.yml`:** baut Backend- & Frontend-Images, pusht nach
  `ghcr.io/project-construct-x/policy-hub-{backend,frontend}` (Tags `<short-sha>` + `main`) und
  **committet die neuen Image-Tags zurück** in `deploy/helm/policy-hub/values.yaml`
  (Commit `ci: … [skip ci]`). Trigger: Push auf `main` (ohne `deploy/**`, `**/*.md`).

## Deployment (GitOps)

- **ArgoCD** (auto-sync, self-heal) rendert das Umbrella-Helm-Chart `helm/policy-hub/` in Namespace
  `policyhub`: Postgres-StatefulSet, Backend- & Frontend-Deployment + Services, Ingress
  `policy-hub.staging.construct-x.net` (`/` → Frontend, `/api` → Backend).
- **Flow:** Push auf `main` → Images gebaut/gepusht → Tags in `values.yaml` gebumpt → ArgoCD rollt aus.
- Layout: `helm/policy-hub/` (Chart), `argocd/{project,application}.yaml`, `secrets/` (Doku).
- `argocd/application.yaml` wird per `kubectl apply` gebootstrappt und ist **nicht** selbst
  GitOps-verwaltet — nach Änderungen erneut applyen.

## Secrets (nicht production-ready — K8s-Secrets sind nur base64-kodiert)

- **DB-Passwort** erzeugt das Chart selbst (`templates/secrets.yaml`, `randAlphaNum 32`) — einmalig
  beim ersten Install, keine Rotation. Zwei Guards halten den Wert stabil und sind **beide**
  zwingend: der Helm-`lookup` im Template (deckt `helm upgrade`) **und** `ignoreDifferences` auf
  `/data/db-password` + `RespectIgnoreDifferences=true` in `argocd/application.yaml` (deckt ArgoCD,
  dessen repo-server ohne Cluster-Zugriff rendert). Fällt einer weg, rotiert das Passwort bei jedem
  Reconcile und das Backend bricht gegen das bestehende Postgres-PVC.
- **HTTP Basic Auth ist ein Provisorium** bis das echte Construct-X-Auth-Verfahren feststeht. Isoliert
  in `templates/secret-basic-auth.yaml` + `auth`-Block in `values.yaml` (Passwort absichtlich im
  Klartext in git), damit es in einem Zug entfernt werden kann — Anleitung im Kopf-Kommentar des
  Templates.
- Nur `ghcr-creds` wird noch manuell per `kubectl` angelegt.
