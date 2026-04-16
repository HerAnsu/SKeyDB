import path from 'node:path'
import {fileURLToPath} from 'node:url'

import overlays from '../src/data/awakeners/awakener-overlays.json' with {type: 'json'}
import compiledAwakenersFullV2 from '../src/data/awakeners/compiled/awakeners-full.v2.json' with {type: 'json'}
import {compileAwakenersLiteV2} from '../src/domain/awakeners-lite-v2-compiler.ts'
import {writeFormattedJsonIfChanged} from './format-generated-json.mjs'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const repoRoot = path.resolve(__dirname, '..')
const outputPath = path.join(
  repoRoot,
  'src',
  'data',
  'awakeners',
  'compiled',
  'awakeners-lite.v2.json',
)

async function main() {
  const compiled = compileAwakenersLiteV2({
    fullRecords: compiledAwakenersFullV2,
    overlayRecords: overlays,
  })

  const result = await writeFormattedJsonIfChanged(outputPath, compiled)
  console.log(`${result.changed ? 'Wrote' : 'Kept'} ${path.relative(repoRoot, outputPath)}`)
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
