# Adoption procedure

English | [日本語](README.ja.md)

This is the procedure an agent follows to adopt cc-web-stack into a target repository. The English version is the source of truth; agents follow this file.

## How to follow this procedure

- Run the steps in order. Do not skip, reorder, or add steps.
- Every step ends with a **Check**. Do not start the next step until the check passes.
- If a check fails, or you hit a situation this procedure does not cover, **stop** and send the Blocked report (see [Reports](#reports)). Do not improvise a fix.
- Never modify the cc-web-stack repository itself during adoption.
- Never overwrite a file that already exists in the target. The scripts enforce this; do not work around them.
- Do not commit or push in the target unless the human told you to.

Below, `<meta>` is the absolute path of this cc-web-stack checkout, and `<target>` is the absolute path of the target repository.

## Step 1. Identify the target

- Get `<target>` from the human's request. If it is missing or ambiguous, ask.
- Project name: the name the human gave, otherwise the last path segment of `<target>`, lowercased. If it is not a valid npm package name, ask.

**Check**: you can state `<target>` and the project name.

## Step 2. Diagnose

```bash
node <meta>/scripts/diagnose.mjs <target>
```

Keep the JSON output; the report includes it.

**Check**: `blockers` is an empty array. If not, stop and send the Blocked report listing each blocker.

## Step 3. Prepare the working state

- If `mode` is `new`:
  - Create `<target>` if it does not exist.
  - Run `pnpm -v`. If pnpm is not installed, stop (installing tools on the host needs human approval).
  - If `isGitRepository` is false, run `git -C <target> init -b main`.
- If `mode` is `existing`:
  - If `isGitRepository` is true, `git -C <target> status --porcelain` must print nothing. If it prints anything, stop.
  - If `isGitRepository` is true, create a branch: `git -C <target> switch -c cc-web-stack/adopt`.
- Record `<meta>`'s commit: `git -C <meta> rev-parse HEAD`.

**Check**: the target exists, the working tree is clean (existing mode), and you have the meta commit hash.

## Step 4. Apply the stack

### New mode

```bash
node <meta>/scripts/apply-template.mjs <meta>/templates/stack <target> PROJECT_NAME=<project-name>
node <meta>/scripts/apply-template.mjs <meta>/templates/lint <target>
cd <target> && pnpm install
```

**Check**: both reports have `skipped: []` and `unresolvedVariables: []`, and `pnpm install` exits with 0.

pnpm 11 holds back packages published too recently. If a pinned version is that new, `pnpm install` writes `minimumReleaseAgeExclude` entries into `pnpm-workspace.yaml`. Keep that file as pnpm wrote it; do not edit it.

### Existing mode

Use the package manager from the diagnosis (`packageManager`). Its add command is:

| packageManager | Add exact dev dependencies |
|---|---|
| pnpm | `pnpm add -D -E <specs>` |
| npm | `npm install -D --save-exact <specs>` |
| yarn | `yarn add -D --exact <specs>` |
| bun | `bun add -d --exact <specs>` |

1. **TypeScript side by side.** If `typescript.sideBySide` is true, skip. Otherwise add:
   `@typescript/native@npm:typescript@7.0.2 typescript@npm:@typescript/typescript6@6.0.2`
2. **Lint.** If `eslintConfigs` is not empty, skip and record `existing-eslint-config-kept`. Otherwise add
   `eslint@10.11.0 typescript-eslint@8.70.1`, then run
   `node <meta>/scripts/apply-template.mjs <meta>/templates/lint <target>`.
3. **Scripts.** For each of `typecheck` = `tsc --noEmit`, `lint` = `eslint .`, and `verify` = `<pm> run typecheck && <pm> run lint && <pm> run build`: run `npm pkg get scripts.<name> --prefix <target>`. If it prints `{}`, set it with `npm pkg set scripts.<name>="<command>" --prefix <target>`. If the script already exists, keep it and record `existing-script-kept:<name>`.

**Check**: every command exits with 0, and every skip is recorded.

## Step 5. Add the agent entry

```bash
node <meta>/scripts/apply-template.mjs <meta>/templates/agent-entry <target> PROJECT_NAME=<project-name> PACKAGE_MANAGER=<pm>
```

`<pm>` is `pnpm` in new mode, otherwise the diagnosed `packageManager`.

If `skipped` is not empty, the target already has its own `AGENTS.md` or `CLAUDE.md`. Do not merge. Record `existing-agent-entry-kept:<file>` and list it in the report for a human to reconcile.

**Check**: `unresolvedVariables` is empty.

## Step 6. Verify

```bash
cd <target> && <pm> run verify
```

**Check**: exits with 0. If it fails, do not change lint rules, `tsconfig.json`, or the templates to make it pass. Stop and send the Blocked report with the failing output.

## Step 7. Record the adoption

Write `<target>/cc-web-stack.json` with exactly these fields:

```json
{
  "metaRepository": "https://github.com/YoshibaTakumu/cc-web-stack",
  "metaCommit": "<commit hash from step 3>",
  "mode": "new",
  "adoptedAt": "<ISO 8601 date, e.g. 2026-09-23>",
  "packageManager": "<pm>",
  "skips": ["<every skip recorded in steps 4-5>"],
  "verify": "passed"
}
```

**Check**: `node -e "JSON.parse(require('fs').readFileSync('<target>/cc-web-stack.json','utf8'))"` exits with 0.

## Reports

### Done report

```
cc-web-stack adoption: done
- Target: <target> (<mode>)
- Meta commit: <hash>
- Created files: <from the apply-template reports>
- Skips: <list, or "none">
- Verify: passed (<pm> run verify)
- For a human: <files to reconcile, or "nothing">
- Not committed. Branch: <branch, or "none">
```

### Blocked report

```
cc-web-stack adoption: blocked at step <n>
- Target: <target>
- Reason: <blocker or failed check>
- Evidence: <diagnosis JSON or command output>
- Changes made so far: <list, or "none">
- Decision needed: <the question for the human>
```
