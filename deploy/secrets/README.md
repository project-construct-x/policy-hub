# Secrets

Two secrets must exist in the `policy-hub` namespace before the pods start. They
are created **once, out-of-band, with `kubectl`** — never committed to git.
Secrets are the standard exception to GitOps; ArgoCD manages everything else.

The Helm chart only references them by name (`values.yaml → secret.name` and
`imagePullSecrets`); it never creates them.

## 1. Application secret — DB + basic-auth passwords

Keys must match `values.yaml → secret.keys` (`db-password`, `security-user-password`):

```sh
kubectl create secret generic policy-hub-secrets \
  --namespace policy-hub \
  --from-literal=db-password='<strong-db-password>' \
  --from-literal=security-user-password='<strong-admin-password>'
```

Used by the postgres StatefulSet (`POSTGRES_PASSWORD`) and the backend
(`DB_PASSWORD` + `SPRING_SECURITY_USER_PASSWORD`).

## 2. Image pull secret — private ghcr.io images

Name must match `values.yaml → imagePullSecrets` (`ghcr-creds`). Use a GitHub
token (classic PAT or fine-grained) with `read:packages`:

```sh
kubectl create secret docker-registry ghcr-creds \
  --namespace policy-hub \
  --docker-server=ghcr.io \
  --docker-username=<github-user> \
  --docker-password=<github-token-with-read:packages>
```

## Notes

- Run these once per namespace, after it exists (`kubectl create namespace policy-hub`,
  or let ArgoCD create it and add the secrets right after — pods stay in
  `CreateContainerConfigError` / `ImagePullBackOff` until the secrets exist, then
  recover on their own).
- **Rotation**: re-create with
  `kubectl create secret ... --dry-run=client -o yaml | kubectl apply -f -`, then
  restart the affected workloads (`kubectl rollout restart deploy -n policy-hub`).
- **Why not GitHub Actions secrets?** They are write-only — no API returns the
  plaintext value, so nothing outside a running workflow (neither ArgoCD nor the
  cluster) can read them. Using them would require the CI to push secrets into the
  cluster, which needs cluster credentials in CI and a reachable cluster API.
