# cc-web-stack

This is a meta-repository. Agents read it to turn a web system repository into one that Claude Code can operate fully autonomously. What it is and why: [docs/principles/0-what-is-cc-web-stack](docs/principles/0-what-is-cc-web-stack/README.md).

## What to do

- **The human asks you to adopt (introduce, apply) cc-web-stack into a repository** → follow [docs/adoption/README.md](docs/adoption/README.md) exactly, step by step. Do not improvise: when a check fails or a case is not covered, stop and send the Blocked report.
- **The human asks you to change cc-web-stack itself** → follow [Changing this repository](#changing-this-repository).
- **Anything else** → answer from [docs/principles/](docs/principles/).

## Layout

| Path | Contents |
|---|---|
| `docs/principles/` | What cc-web-stack is and the decisions behind it |
| `docs/adoption/` | The adoption procedure agents follow |
| `scripts/` | Dependency-free Node scripts the procedure runs (`diagnose.mjs`, `apply-template.mjs`) |
| `templates/stack/` | Files for a new repository (Next.js 16, React 19, TypeScript 7), versions pinned |
| `templates/lint/` | Type-aware ESLint config |
| `templates/agent-entry/` | `AGENTS.md` and `CLAUDE.md` placed in the target |

## Changing this repository

- Pinned versions in `templates/stack/package.json`, the procedure, and `scripts/diagnose.mjs` (`RECOMMENDED_MAJOR`) must agree. Change them together.
- After changing templates, scripts, or the procedure, run the adoption procedure in new mode against an empty directory and confirm step 6 passes. Do not change pinned versions without this.
- Every `README.md` under `docs/` has a Japanese `README.ja.md`. Update both in the same change. The English version is the source of truth.
- Scripts stay dependency-free: they run before anything is installed in the target.
