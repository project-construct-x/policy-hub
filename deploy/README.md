# Deployment

GitOps deployment of Policy Hub: GitHub Actions builds & publishes images to
GitHub Packages, then ArgoCD deploys the Helm chart into the staging cluster.

## Flow

```
push to main
   │
   ▼
GitHub Actions (.github/workflows/build-and-publish.yml)
   ├─ build & push  ghcr.io/project-construct-x/policy-hub-backend:<sha>
   ├─ build & push  ghcr.io/project-construct-x/policy-hub-frontend:<sha>
   └─ commit-back   deploy/helm/policy-hub/values.yaml  (image tags = <sha>)
   │
   ▼
ArgoCD (auto-sync, self-heal)  →  namespace "policyhub"
   ├─ postgres StatefulSet + headless Service
   ├─ backend  Deployment + Service   (Spring Boot, prod profile)
   ├─ frontend Deployment + Service   (nginx)
   └─ Ingress  policy-hub.staging.construct-x.net
        /      → frontend
        /api   → backend
```

## Layout

| Path | Purpose |
|------|---------|
| `helm/policy-hub/` | Umbrella Helm chart (backend, frontend, in-cluster postgres, ingress) |
| `argocd/project.yaml` | ArgoCD `AppProject` `policyhub` |
| `argocd/application.yaml` | Workload `Application` → `helm/policy-hub` |
| `secrets/` | Manual `kubectl` secret creation (see `secrets/README.md`) |

## Prerequisites in the cluster

- **ingress-nginx** controller and **cert-manager** with a `ClusterIssuer`
  (set `ingress.clusterIssuer` in `values.yaml` — currently `letsencrypt-staging`).
- The two secrets (`policy-hub-secrets`, `ghcr-creds`) created in the namespace
  (see `secrets/README.md`).
- ArgoCD has read access to `github.com/project-construct-x/policy-hub`
  (add a repo credential in ArgoCD if the repo is private).

## First-time bootstrap

```sh
# 1. Namespace + secrets (once, out-of-band — see deploy/secrets/README.md).
kubectl create namespace policyhub
kubectl create secret generic policy-hub-secrets -n policyhub \
  --from-literal=db-password='<db-pw>' \
  --from-literal=security-user-password='<admin-pw>'
kubectl create secret docker-registry ghcr-creds -n policyhub \
  --docker-server=ghcr.io --docker-username=<user> --docker-password=<token>

# 2. Register the ArgoCD project + application.
kubectl apply -f deploy/argocd/project.yaml
kubectl apply -f deploy/argocd/application.yaml
```

ArgoCD then syncs everything. Subsequent deploys are fully automatic: a push to
`main` publishes new images and bumps the tags, and ArgoCD rolls them out.

## Local testing

The images are the same ones deployed. To smoke-test locally:

```sh
# Frontend production image (nginx, SPA fallback, port 8080)
docker build -f frontend/cicd/docker/Dockerfile.production -t ph-frontend frontend
docker run --rm -p 8080:8080 ph-frontend      # http://localhost:8080

# Backend against a throwaway postgres (prod profile)
docker build -f backend/Dockerfile -t ph-backend backend
```

The `docker-compose.yml` at the repo root remains the fast path for the full dev
stack (`docker compose up --build`).

## Notes / next steps

- **Postgres** runs as a self-contained StatefulSet with the official
  `postgres:16-alpine` image (not the Bitnami subchart — Bitnami moved its free
  images to `bitnamilegacy` in 2025). Switch to an external DB by setting
  `postgresql.enabled: false` and pointing `database.*` at it.
- **Recommended next step:** add a test gate to CI before publishing —
  frontend `npm run lint` + `npm test`, backend `./gradlew build` (Testcontainers
  work on GitHub-hosted runners).
