import assert from 'node:assert/strict'
import fs from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import test from 'node:test'

import {syncFormattedJsonDirectory, writeFormattedJsonIfChanged} from './format-generated-json.mjs'

test('writeFormattedJsonIfChanged skips rewriting identical content', async () => {
  const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'momentb-format-json-'))
  const filePath = path.join(tmpDir, 'record.json')
  const originalContent = '{ "id": 1, "name": "Alpha" }\n'

  await fs.writeFile(filePath, originalContent, 'utf8')
  const beforeStat = await fs.stat(filePath)

  const result = await writeFormattedJsonIfChanged(filePath, {id: 1, name: 'Alpha'})
  const afterStat = await fs.stat(filePath)

  assert.equal(result.changed, false)
  assert.equal(result.formattedContent, originalContent)
  assert.equal(afterStat.mtimeMs, beforeStat.mtimeMs)
})

test('syncFormattedJsonDirectory only writes changed files and removes stale files', async () => {
  const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'momentb-sync-json-'))
  const outputDir = path.join(tmpDir, 'records')

  await fs.mkdir(outputDir, {recursive: true})
  await fs.writeFile(path.join(outputDir, '1.json'), '{ "id": 1, "name": "Alpha" }\n', 'utf8')
  await fs.writeFile(path.join(outputDir, 'stale.json'), '{ "stale": true }\n', 'utf8')

  const result = await syncFormattedJsonDirectory(outputDir, {
    '1.json': {id: 1, name: 'Alpha'},
    '2.json': {id: 2, name: 'Beta'},
  })

  assert.deepEqual(result, {
    written: ['2.json'],
    skipped: ['1.json'],
    removed: ['stale.json'],
  })
  assert.equal(
    await fs.readFile(path.join(outputDir, '2.json'), 'utf8'),
    '{ "id": 2, "name": "Beta" }\n',
  )
  await assert.rejects(fs.access(path.join(outputDir, 'stale.json')))
})
