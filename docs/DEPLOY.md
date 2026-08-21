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
| `DEPLOY_SSH_KEY` | **Base64** of the OpenSSH private key (ed25519). Public half is in `aqeel`'s `~/.ssh/authorized_keys` on the server. |

```bash
base64 < /path/to/deploy_key | tr -d '\n' | gh secret set DEPLOY_SSH_KEY -R ahtishamk466/Elisen
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

## Troubleshooting

### Deploy fails with `Connection closed` / rsync 255
Usually SSH never authenticated within `LoginGraceTime` (~120s):

1. Confirm GitHub secret `DEPLOY_SSH_KEY` is the **full** OpenSSH private key (including `BEGIN`/`END` lines).
2. Confirm the matching public key is in `/home/aqeel/.ssh/authorized_keys` (comment `github-actions-elisen-tpmsv2`).
3. Clear fail2ban bans if Actions IPs were blocked: `sudo fail2ban-client unban --all`.

Workflow uses `webfactory/ssh-agent` so the key is loaded correctly (avoid `echo` mangling).
