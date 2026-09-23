#!/usr/bin/env node
// Prints the facts the adoption procedure branches on, as JSON.
// Reads only: it never writes to the target. Uses no dependencies so it runs
// before anything is installed in the target.
//
// Usage: node scripts/diagnose.mjs <target-dir>

import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs'
import { join, resolve } from 'node:path'

// The stack this version of cc-web-stack recommends. Keep in sync with
// templates/stack/package.json.
const RECOMMENDED_MAJOR = { next: 16, react: 19, typescript: 7 }

const LOCKFILES = [
  ['pnpm-lock.yaml', 'pnpm'],
  ['package-lock.json', 'npm'],
  ['yarn.lock', 'yarn'],
  ['bun.lock', 'bun'],
  ['bun.lockb', 'bun'],
]

const ESLINT_CONFIGS = [
  'eslint.config.js',
  'eslint.config.mjs',
  'eslint.config.cjs',
  'eslint.config.ts',
  '.eslintrc',
  '.eslintrc.js',
  '.eslintrc.cjs',
  '.eslintrc.json',
  '.eslintrc.yml',
]

const MANAGED_FILES = [
  'AGENTS.md',
  'CLAUDE.md',
  '.claude/settings.json',
  'tsconfig.json',
  'next.config.ts',
  'next.config.js',
  'next.config.mjs',
  'biome.json',
  'cc-web-stack.json',
]

function readJson(path) {
  try {
    return JSON.parse(readFileSync(path, 'utf8'))
  } catch {
    return null
  }
}

// Returns the major version a dependency spec pins, following npm aliases
// (`npm:typescript@7.0.2`). Returns null when it cannot tell (ranges like `*`).
function majorOf(spec) {
  if (typeof spec !== 'string') return null
  const alias = spec.match(/^npm:(@?[^@]+)@(.+)$/)
  const version = alias ? alias[2] : spec
  const m = version.match(/(\d+)(?:\.\d+)?/)
  return m ? Number(m[1]) : null
}

function aliasTarget(spec) {
  const m = typeof spec === 'string' && spec.match(/^npm:(@?[^@]+)@/)
  return m ? m[1] : null
}

function diagnose(targetArg) {
  const target = resolve(targetArg)
  const exists = existsSync(target)
  const isDir = exists && statSync(target).isDirectory()
  const entries = isDir ? readdirSync(target).filter(n => n !== '.git' && n !== '.DS_Store') : []
  const has = rel => existsSync(join(target, rel))

  const pkg = isDir ? readJson(join(target, 'package.json')) : null
  const deps = { ...(pkg?.dependencies ?? {}), ...(pkg?.devDependencies ?? {}) }

  const lockfiles = LOCKFILES.filter(([f]) => has(f))
  const packageManagerField = pkg?.packageManager?.split('@')[0] ?? null
  const packageManager = packageManagerField ?? lockfiles[0]?.[1] ?? null

  // TypeScript can be installed plainly, or side by side via aliases.
  const tsSpec = deps.typescript ?? null
  const tsNativeSpec = deps['@typescript/native'] ?? null
  const typescript = {
    typescriptSpec: tsSpec,
    nativeSpec: tsNativeSpec,
    sideBySide:
      aliasTarget(tsSpec) === '@typescript/typescript6' && aliasTarget(tsNativeSpec) === 'typescript',
    compilerMajor: tsNativeSpec ? majorOf(tsNativeSpec) : majorOf(tsSpec),
  }

  const versions = {
    next: majorOf(deps.next),
    react: majorOf(deps.react),
    typescript: typescript.compilerMajor,
  }

  const mode = !exists || (isDir && entries.length === 0) ? 'new' : 'existing'

  // Findings the procedure must stop on. Each needs a human decision.
  const blockers = []
  // ESLint 10 requires ^20.19.0 || ^22.13.0 || >=24, which also covers
  // Next.js 16's >=20.9.
  const [nodeMajor, nodeMinor] = process.versions.node.split('.').map(Number)
  const nodeSupported =
    nodeMajor >= 24 ||
    (nodeMajor === 22 && nodeMinor >= 13) ||
    (nodeMajor === 20 && nodeMinor >= 19)
  if (!nodeSupported) blockers.push(`node-unsupported:${process.versions.node}`)
  if (exists && !isDir) blockers.push('target-is-not-a-directory')
  if (mode === 'existing' && !pkg) blockers.push('existing-target-without-package-json')
  if (mode === 'existing' && pkg) {
    if (versions.next === null) blockers.push('not-a-nextjs-project')
    for (const [name, major] of Object.entries(RECOMMENDED_MAJOR)) {
      if (versions[name] !== null && versions[name] < major) {
        blockers.push(`${name}-major-below-recommended:${versions[name]}<${major}`)
      }
    }
    if (lockfiles.length > 1) blockers.push('multiple-lockfiles')
  }

  return {
    target,
    mode,
    exists,
    isGitRepository: has('.git'),
    nodeVersion: process.versions.node,
    packageManager,
    lockfiles: lockfiles.map(([f]) => f),
    versions,
    typescript,
    eslintConfigs: ESLINT_CONFIGS.filter(has),
    presentManagedFiles: MANAGED_FILES.filter(has),
    previousAdoption: readJson(join(target, 'cc-web-stack.json')),
    blockers,
  }
}

const targetArg = process.argv[2]
if (!targetArg) {
  process.stderr.write('Usage: node scripts/diagnose.mjs <target-dir>\n')
  process.exit(2)
}
process.stdout.write(JSON.stringify(diagnose(targetArg), null, 2) + '\n')
