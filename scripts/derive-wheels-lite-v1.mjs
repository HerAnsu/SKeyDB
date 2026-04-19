import path from 'node:path'
import {fileURLToPath} from 'node:url'

import awakenerOverlays from '../src/data/awakeners/awakener-overlays.json' with {type: 'json'}
import compiledWheelsFullV1 from '../src/data/wheels/compiled/wheels-full.v1.json' with {type: 'json'}
import {compileWheelsLiteV1} from '../src/domain/wheels-lite-v1-compiler.ts'
import {writeFormattedJsonIfChanged} from './format-generated-json.mjs'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const repoRoot = path.resolve(__dirname, '..')
const outputPath = path.join(repoRoot, 'src', 'data', 'wheels', 'compiled', 'wheels-lite.v1.json')

async function main() {
  const compiled = compileWheelsLiteV1({
    fullRecords: compiledWheelsFullV1,
    overlayRecords: awakenerOverlays,
  })
  const result = await writeFormattedJsonIfChanged(outputPath, compiled)
  console.log(`${result.changed ? 'Wrote' : 'Kept'} ${path.relative(repoRoot, outputPath)}`)
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
