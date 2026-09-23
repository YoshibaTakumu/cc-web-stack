# {{PROJECT_NAME}}

This repository is set up with [cc-web-stack](https://github.com/YoshibaTakumu/cc-web-stack) so that Claude Code can operate it autonomously. The adoption record is in `cc-web-stack.json`.

## Commands

The package manager is {{PACKAGE_MANAGER}}. Do not use another one.

| Command | What it does |
|---|---|
| `{{PACKAGE_MANAGER}} typecheck` | Type check with TypeScript 7 (`tsc --noEmit`) |
| `{{PACKAGE_MANAGER}} lint` | Type-aware lint with typescript-eslint |
| `{{PACKAGE_MANAGER}} build` | Production build with Next.js |
| `{{PACKAGE_MANAGER}} verify` | All of the above, in that order |

## Definition of done

- Work is done only when `{{PACKAGE_MANAGER}} verify` passes. Report a layer as passing only if you ran it.
- Fix warnings your change introduced before reporting.

## Rules

- Do not disable a lint rule, add an exemption, or loosen `tsconfig.json` to make a check pass. Propose the change and its reason to a human instead.
- Do not run destructive or irreversible operations (deleting data, force push, mass dependency upgrades) without explicit human approval.
- TypeScript is installed side by side: `@typescript/native` is TypeScript 7 (the `tsc` gate), and `typescript` is an alias of `@typescript/typescript6` for typescript-eslint and `next build`. Keep both until TypeScript 7 ships an API that typescript-eslint supports.
