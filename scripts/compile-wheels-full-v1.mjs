import path from 'node:path'
import {fileURLToPath} from 'node:url'

import awakenerRoster from '../src/data/awakeners/awakener-roster.json' with {type: 'json'}
import wheelMainstatScaling from '../src/data/wheels/wheel-mainstat-scaling.json' with {type: 'json'}
import wheelSource from '../src/data/wheels/wheel-source.json' with {type: 'json'}
import {compileWheelsFullV1} from '../src/domain/wheels-full-v1-compiler.ts'
import {syncFormattedJsonDirectory, writeFormattedJsonIfChanged} from './format-generated-json.mjs'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const repoRoot = path.resolve(__dirname, '..')
const outputPath = path.join(repoRoot, 'src', 'data', 'wheels', 'compiled', 'wheels-full.v1.json')
const recordsOutputDir = path.join(
  repoRoot,
  'src',
  'data',
  'wheels',
  'compiled',
  'wheels-full-v1-records',
)

async function main() {
  const compiled = compileWheelsFullV1({
    sourceRecords: wheelSource,
    awakeners: awakenerRoster,
    mainstatScaling: wheelMainstatScaling,
  })

  const topLevelResult = await writeFormattedJsonIfChanged(outputPath, compiled)
  const recordResults = await syncFormattedJsonDirectory(
    recordsOutputDir,
    Object.fromEntries(compiled.map((record) => [`${record.id}.json`, record])),
  )

  console.log(`${topLevelResult.changed ? 'Wrote' : 'Kept'} ${path.relative(repoRoot, outputPath)}`)
  console.log(
    `${recordResults.written.length > 0 || recordResults.removed.length > 0 ? 'Synced' : 'Kept'} ${
      compiled.length
    } full wheel records in ${path.relative(repoRoot, recordsOutputDir)}`,
  )
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
