# Secrets

Two secrets must exist in the `policyhub` namespace before the pods start. They
are created **once, out-of-band, with `kubectl`** — never committed to git.
Secrets are the standard exception to GitOps; ArgoCD manages everything else.

The Helm chart only references them by name (`values.yaml → secret.name` and
`imagePullSecrets`); it never creates them.

## 1. Application secret — DB + basic-auth passwords

Keys must match `values.yaml → secret.keys` (`db-password`, `security-user-password`):

```sh
kubectl create secret generic policy-hub-secrets \
  --namespace policyhub \
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
  --namespace policyhub \
  --docker-server=ghcr.io \
  --docker-username=<github-user> \
  --docker-password=<github-token-with-read:packages>
```

## Notes

- Run these once per namespace, after it exists (`kubectl create namespace policyhub`,
  or let ArgoCD create it and add the secrets right after — pods stay in
  `CreateContainerConfigError` / `ImagePullBackOff` until the secrets exist, then
  recover on their own).
- **Rotation**: re-create with
  `kubectl create secret ... --dry-run=client -o yaml | kubectl apply -f -`, then
  restart the affected workloads (`kubectl rollout restart deploy -n policyhub`).
- **Why not GitHub Actions secrets?** They are write-only — no API returns the
  plaintext value, so nothing outside a running workflow (neither ArgoCD nor the
  cluster) can read them. Using them would require the CI to push secrets into the
  cluster, which needs cluster credentials in CI and a reachable cluster API.

## Alternative: creating the Secrets via ArgoCD (no kubectl needed)

Not finalized — an interim option for anyone without direct cluster/kubectl
access but with ArgoCD UI access. The chart can create both Secrets itself
(`templates/secrets.yaml`), gated behind `create: false` defaults so nothing
changes for the values already committed to `values.yaml`.

In the ArgoCD UI, open the `policy-hub` Application -> App Details ->
Parameters, and add overrides (do **not** commit these to `values.yaml`):

```
secret.create=true
secret.dbPassword=<strong-db-password>
secret.authPassword=<strong-admin-password>
ghcrCreds.create=true
ghcrCreds.username=<github-user>
ghcrCreds.password=<github-token-with-read:packages>
```

Caveat: these parameters live in the Application object in-cluster, not in
git — but they're plaintext there too, visible to anyone with read access to
the Application in ArgoCD. This is not a substitute for a real secrets
manager (Sealed Secrets, External Secrets Operator, …), just a way to avoid
needing a direct kubectl context for the one-time setup.
