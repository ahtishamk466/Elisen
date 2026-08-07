# Security Baseline

Frontend security rules for Elisen. Security violations are bugs, even in prototypes.

1. **SECRETS:** No API keys, tokens, or credentials in client code, ever. All secrets in `.env.local`. Keep `.env.example` updated with placeholders. Never put secrets in env vars with the framework's public prefix (`VITE_`) — those ship to the browser.
2. **GIT HYGIENE:** `.gitignore` must include `.env*`, `node_modules`, and build output BEFORE the first commit.
3. **RENDERING:** Never use `dangerouslySetInnerHTML` or `eval()`. If rendering external content is unavoidable, propose a sanitization approach (e.g. DOMPurify) and wait for approval.
4. **LINKS:** All external links get `rel="noopener noreferrer"`.
5. **INPUTS:** Validate and constrain every input (type, length, format) even in prototypes — patterns copied later become production code.
6. **STORAGE:** No sensitive or personal data in localStorage, sessionStorage, or URL parameters. Ever.
7. **DEPENDENCIES:** No new packages without proposal (name, downloads, why). Commit the lockfile. Prefer zero-dependency solutions.
8. **AUTH ILLUSIONS:** Client-side route guards are UI convenience, not security. Flag any real gating as "needs server enforcement" in DECISIONS.md.
9. **NO FAKE TRUST:** Never hardcode real-looking user data, emails, or keys as placeholders. Use obviously fake data (`jane@example.com`).
