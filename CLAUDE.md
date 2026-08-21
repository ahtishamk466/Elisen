# Claude — Project Rules

Standing rules for all work on Elisen. These override defaults.

1. Before ANY UI work, read [/docs/DESIGN.md](docs/DESIGN.md) in full. It overrides your defaults.
2. Never write raw styled elements. Import from `/components/ui`. If a needed component doesn't exist, STOP and propose it (name, variants, props) before building.
3. Before building any screen, check [/docs/COMPONENTS.md](docs/COMPONENTS.md) and list which existing components you will use.
4. Only semantic tokens in components. No primitives, no arbitrary values, no default Tailwind palette.
5. Every screen ships with loading, empty, and error states, and works at all breakpoints defined in tokens.css. Missing any of these = not done. Do not present it as done.
6. **ACCESSIBILITY IS NON-NEGOTIABLE:**
   - Semantic HTML only: real `<button>`, `<nav>`, `<main>`, `<label>` — never clickable divs.
   - Every input has an associated label. Every image has alt text.
   - Visible focus states on all interactive elements, styled with tokens.
   - Full keyboard navigability: tab order, Enter/Escape on modals, focus trapped in dialogs and returned on close.
   - Color contrast meets WCAG AA; never communicate meaning by color alone.
   - ARIA only when semantic HTML can't do the job.
7. **PERFORMANCE FLOOR:** lazy-load images and thumbnails, always set width/height to prevent layout shift. Use the framework's image/font optimization where it exists; otherwise self-hosted fonts with system fallbacks.
8. Component bookkeeping — both parts required in the same change:
   a. Update `/docs/COMPONENTS.md` whenever a component is added or modified.
   b. Every component in `/components/ui` ships with a Storybook story covering all variants, sizes, and states (default, hover, focus, disabled, error). A component without a story is incomplete.
9. **FORM STANDARD** — every side drawer and form follows Storybook's
   `Patterns / DrawerFormStandard`; read it before building a new one:
   a. Every control is the full width of the field column. A short value does not
      earn a short box.
   b. Every field has a placeholder — a concrete example where the value has a
      format, a prompt where it doesn't. Where a value can be derived, the
      placeholder is the suggestion and a blank submit takes it.
   c. One short line of help, or none. What the reader needs to fill the field
      in — never how the system is built, never what is still pending.
   d. `active` is an `ActiveSelect` dropdown, never a checkbox.
10. Log significant decisions in `/docs/DECISIONS.md` with date and reasoning.
11. After completing UI work, summarize: what you built, which components you used, and any deviation from DESIGN.md and why.
12. When my request conflicts with DESIGN.md, flag the conflict — don't silently pick one.
13. Keep solutions minimal. No speculative props, no premature abstraction.
14. If you create temporary/scratch files, delete them before finishing.
15. Follow `/docs/SECURITY.md` at all times. Security violations are bugs, even in prototypes.
16. At the end of every working session, remind me to review and commit, and propose a descriptive commit message. Never push without my say-so.
17. **TOKEN DISCIPLINE** — work efficiently without cutting quality:
    a. Don't re-read files you've already read this session unless you've modified them or I've told you they changed.
    b. When reading large files, read only the relevant sections — not the whole file — unless full context is genuinely needed.
    c. When editing, change only the lines needed. Never rewrite a whole file to change one section.
    d. Don't echo file contents back to me after writing them. Tell me the filename and a one-line summary; I can open it myself.
    e. Summaries stay short: what changed, where, what to check. No restating the plan, no celebrating.
    f. Batch related small edits into one pass instead of many round trips.
    g. NEVER economize on: reading DESIGN.md before UI work, building all component states, accessibility, or the self-audit steps. Quality rules always win over token savings.

## Import direction

A component may only import from its own layer or below (features → patterns → ui). Never sideways.

If a file exceeds ~200 lines, propose a split before continuing.
