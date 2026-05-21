import assert from 'node:assert/strict'
import fs from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import test from 'node:test'

import {
  applyWebpConversionPlan,
  createWebpConversionPlan,
  parseArgs,
  rewriteConvertedPngReferences,
} from './convert-png-assets-to-webp.mjs'

async function writeFixture(rootDir, relativePath, size) {
  const filePath = path.join(rootDir, relativePath)
  await fs.mkdir(path.dirname(filePath), {recursive: true})
  await fs.writeFile(filePath, Buffer.alloc(size, 1))
  return filePath
}

test('parseArgs defaults to Photoshop-like lossy webp settings', () => {
  const options = parseArgs(['--dry-run'])

  assert.equal(options.dryRun, true)
  assert.equal(options.quality, 90)
  assert.equal(options.effort, 6)
  assert.equal(options.minSavingsRatio, 0)
})

test('createWebpConversionPlan skips an entire folder when any png is not smaller', async () => {
  const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'momentb-webp-plan-'))
  const assetsDir = path.join(tmpDir, 'assets')
  await writeFixture(assetsDir, 'icons/smaller.png', 100)
  await writeFixture(assetsDir, 'icons/larger.png', 100)

  const plan = await createWebpConversionPlan({
    assetsDir,
    encodeWebp: async (_input, pngPath) => {
      return Buffer.alloc(pngPath.endsWith('smaller.png') ? 80 : 120, 2)
    },
  })

  assert.equal(plan.pngCount, 2)
  assert.equal(plan.convertCount, 0)
  assert.equal(plan.skipCount, 2)
  assert.equal(plan.folders[0].status, 'skip')
  assert.deepEqual(
    plan.folders[0].blockers.map((blocker) => path.basename(blocker.pngPath)),
    ['larger.png'],
  )
})

test('applyWebpConversionPlan replaces pngs only for convertible folders', async () => {
  const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'momentb-webp-apply-'))
  const assetsDir = path.join(tmpDir, 'assets')
  const convertPng = await writeFixture(assetsDir, 'convert/a.png', 100)
  const skipPng = await writeFixture(assetsDir, 'skip/b.png', 100)

  const plan = await createWebpConversionPlan({
    assetsDir,
    encodeWebp: async (_input, pngPath) => {
      return Buffer.alloc(pngPath === convertPng ? 80 : 120, 2)
    },
  })

  const converted = await applyWebpConversionPlan(plan)

  assert.deepEqual(converted, [
    {
      from: convertPng,
      to: convertPng.replace(/\.png$/i, '.webp'),
    },
  ])
  await assert.rejects(fs.access(convertPng))
  assert.equal((await fs.readFile(convertPng.replace(/\.png$/i, '.webp'))).byteLength, 80)
  assert.equal((await fs.readFile(skipPng)).byteLength, 100)
})

test('rewriteConvertedPngReferences updates exact imports and folder globs', async () => {
  const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'momentb-webp-rewrite-'))
  const assetsDir = path.join(tmpDir, 'src', 'assets')
  const sourcePath = path.join(tmpDir, 'src', 'domain', 'icons.ts')
  const from = path.join(assetsDir, 'icons', 'Battle_Card_Buff_001.png')
  const to = path.join(assetsDir, 'icons', 'Battle_Card_Buff_001.webp')

  await fs.mkdir(path.dirname(sourcePath), {recursive: true})
  await fs.writeFile(
    sourcePath,
    [
      "import icon from '@/assets/icons/Battle_Card_Buff_001.png'",
      "const icons = import.meta.glob<string>('../assets/icons/*.webp')",
      '',
    ].join('\n'),
    'utf8',
  )

  const changed = await rewriteConvertedPngReferences({
    rootDir: tmpDir,
    assetsDir,
    converted: [{from, to}],
  })

  assert.deepEqual(changed, [sourcePath])
  assert.equal(
    await fs.readFile(sourcePath, 'utf8'),
    [
      "import icon from '@/assets/icons/Battle_Card_Buff_001.webp'",
      "const icons = import.meta.glob<string>('../assets/icons/*.webp')",
      '',
    ].join('\n'),
  )
})
