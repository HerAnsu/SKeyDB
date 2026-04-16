import {execFileSync, execSync} from 'node:child_process'
import {existsSync} from 'node:fs'
import path from 'node:path'
import process from 'node:process'

const repoRoot = getRepoRoot()
const changedFiles = collectChangedFiles(repoRoot)
const prettierTargets = changedFiles.filter(isPrettierTarget)

if (prettierTargets.length === 0) {
  console.log('format-changed-files: no changed prettier targets')
  process.exit(0)
}

console.log(`format-changed-files: formatting ${prettierTargets.length} file(s)`)
runPrettier(prettierTargets, repoRoot)

function getRepoRoot() {
  return execGit(['rev-parse', '--show-toplevel']).trim()
}

function execGit(args) {
  return execFileSync('git', args, {
    cwd: process.cwd(),
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  })
}

function getNpxCommand() {
  return process.platform === 'win32' ? 'npx.cmd' : 'npx'
}

function runPrettier(targets, cwd) {
  if (process.platform === 'win32') {
    const quotedTargets = targets.map((target) => `"${target.replaceAll('"', '\\"')}"`).join(' ')
    execSync(`${getNpxCommand()} prettier --write ${quotedTargets}`, {
      cwd,
      stdio: 'inherit',
    })
    return
  }

  execFileSync(getNpxCommand(), ['prettier', '--write', ...targets], {
    cwd,
    stdio: 'inherit',
  })
}

function collectChangedFiles(cwd) {
  const fileSet = new Set()

  for (const args of [
    ['diff', '--name-only', '--diff-filter=ACMR'],
    ['diff', '--cached', '--name-only', '--diff-filter=ACMR'],
    ['ls-files', '--others', '--modified', '--exclude-standard'],
  ]) {
    for (const entry of execGit(args)
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean)) {
      const normalized = entry.replaceAll('\\', '/')
      const absolutePath = path.join(cwd, normalized)
      if (existsSync(absolutePath)) {
        fileSet.add(normalized)
      }
    }
  }

  return [...fileSet].sort()
}

function isPrettierTarget(filePath) {
  if (
    filePath === 'package.json' ||
    filePath === 'prettier.config.cjs' ||
    filePath === 'eslint.config.js' ||
    filePath === 'vite.config.ts' ||
    filePath === 'src/domain/persistence-contract.v1.json' ||
    filePath === 'tools/react-sidecar/package.json'
  ) {
    return true
  }

  const normalized = filePath.replaceAll('\\', '/')

  if (/^src\/.*\.(ts|tsx|css)$/.test(normalized)) {
    return true
  }

  if (/^scripts\/.*\.(js|mjs|cjs)$/.test(normalized)) {
    return true
  }

  if (/^src\/data\/.*\.json$/.test(normalized)) {
    return true
  }

  if (/^schemas\/.*\.json$/.test(normalized)) {
    return true
  }

  return false
}
