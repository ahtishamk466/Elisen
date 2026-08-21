# Deploy — TPMS V2 (`tpmsv2.elisen.com`)

Auto-deploys the Vite SPA to `154.53.38.1` on every push to `main`.

## Pipeline

Two jobs — **deploy never runs if build fails**.

1. **build** — `npm ci` (missing / mismatched packages fail here) → `tsc --noEmit` → `vite build` → assert `dist/index.html` + assets exist → upload artifact
2. **deploy** (`needs: build`) — download artifact → `rsync` to `/var/www/tpmsv2/` → smoke-check `https://tpmsv2.elisen.com` (HTTP 200 + `#root`)

Apache serves the static files (SPA fallback via `FallbackResource`).

Workflow: [`.github/workflows/deploy.yml`](../.github/workflows/deploy.yml)

## Required GitHub secret

| Secret | Value |
|--------|--------|
| `DEPLOY_SSH_KEY` | Private key for the CI deploy user (ed25519). Public half is in `aqeel`'s `~/.ssh/authorized_keys` on the server. |

Repo admin must set it (Settings → Secrets and variables → Actions), or:

```bash
gh secret set DEPLOY_SSH_KEY -R ahtishamk466/Elisen < /path/to/deploy_key
```

Never commit the private key.

## Server layout

| Item | Path / value |
|------|----------------|
| Host | `154.53.38.1` |
| User | `aqeel` |
| Docroot | `/var/www/tpmsv2` |
| Vhost | `/etc/apache2/sites-available/tpmsv2.conf` (+ Let’s Encrypt SSL) |
| URL | https://tpmsv2.elisen.com |

## Manual one-shot deploy

```bash
npm ci && npm run build
rsync -az --delete -e "ssh -i ~/.ssh/id_rsa" dist/ aqeel@154.53.38.1:/var/www/tpmsv2/
```

## DNS

`tpmsv2.elisen.com` / `tpmsV2.elisen.com` → A `154.53.38.1` (already configured).
