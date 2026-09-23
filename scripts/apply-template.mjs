#!/usr/bin/env node
// Copies a template directory into the target, replacing {{VAR}} placeholders.
// Never overwrites: a file that already exists in the target is left as is and
// reported, so the agent can hand the conflict to a human instead of merging.
// Prints a JSON report of what was created and what was skipped.
//
// Usage: node scripts/apply-template.mjs <template-dir> <target-dir> [VAR=value ...]

import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join, relative, resolve } from 'node:path'

const [templateArg, targetArg, ...varArgs] = process.argv.slice(2)
if (!templateArg || !targetArg) {
  process.stderr.write('Usage: node scripts/apply-template.mjs <template-dir> <target-dir> [VAR=value ...]\n')
  process.exit(2)
}

const vars = Object.fromEntries(
  varArgs.map(arg => {
    const i = arg.indexOf('=')
    if (i <= 0) {
      process.stderr.write(`Invalid variable: ${arg} (expected VAR=value)\n`)
      process.exit(2)
    }
    return [arg.slice(0, i), arg.slice(i + 1)]
  }),
)

const templateDir = resolve(templateArg)
const targetDir = resolve(targetArg)

function listFiles(dir) {
  return readdirSync(dir, { withFileTypes: true }).flatMap(entry => {
    const path = join(dir, entry.name)
    return entry.isDirectory() ? listFiles(path) : [path]
  })
}

const created = []
const skipped = []
const unresolved = new Set()

for (const source of listFiles(templateDir)) {
  const rel = relative(templateDir, source)
  const dest = join(targetDir, rel)
  if (existsSync(dest)) {
    skipped.push(rel)
    continue
  }
  const content = readFileSync(source, 'utf8').replace(/\{\{([A-Z_]+)\}\}/g, (match, name) => {
    if (name in vars) return vars[name]
    unresolved.add(name)
    return match
  })
  mkdirSync(dirname(dest), { recursive: true })
  writeFileSync(dest, content)
  created.push(rel)
}

const report = { template: templateDir, target: targetDir, created, skipped, unresolvedVariables: [...unresolved] }
process.stdout.write(JSON.stringify(report, null, 2) + '\n')
// A placeholder left in a written file is a defect in the call, not a conflict.
process.exit(unresolved.size > 0 ? 1 : 0)
