import path from 'node:path'
import {fileURLToPath} from 'node:url'

import enlightens from '../src/data/awakeners/awakener-enlightens.json' with {type: 'json'}
import kits from '../src/data/awakeners/awakener-kits.json' with {type: 'json'}
import roster from '../src/data/awakeners/awakener-roster.json' with {type: 'json'}
import skills from '../src/data/awakeners/awakener-skills.json' with {type: 'json'}
import talents from '../src/data/awakeners/awakener-talents.json' with {type: 'json'}
import derivedSkills from '../src/data/awakeners/derived-skills.json' with {type: 'json'}
import {compileAwakenersFullV2} from '../src/domain/awakeners-full-v2-compiler.ts'
import {syncFormattedJsonDirectory, writeFormattedJsonIfChanged} from './format-generated-json.mjs'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const repoRoot = path.resolve(__dirname, '..')
const outputPath = path.join(
  repoRoot,
  'src',
  'data',
  'awakeners',
  'compiled',
  'awakeners-full.v2.json',
)
const recordsOutputDir = path.join(
  repoRoot,
  'src',
  'data',
  'awakeners',
  'compiled',
  'awakeners-full-v2-records',
)

async function main() {
  const compiled = compileAwakenersFullV2({
    roster,
    kits,
    skills,
    talents,
    enlightens,
    derivedSkills,
  })

  const topLevelResult = await writeFormattedJsonIfChanged(outputPath, compiled)
  const recordResults = await syncFormattedJsonDirectory(
    recordsOutputDir,
    Object.fromEntries(compiled.map((record) => [`${String(record.id)}.json`, record])),
  )
  console.log(`${topLevelResult.changed ? 'Wrote' : 'Kept'} ${path.relative(repoRoot, outputPath)}`)
  console.log(
    `${recordResults.written.length > 0 || recordResults.removed.length > 0 ? 'Synced' : 'Kept'} ${
      compiled.length
    } full V2 records in ${path.relative(repoRoot, recordsOutputDir)}`,
  )
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
