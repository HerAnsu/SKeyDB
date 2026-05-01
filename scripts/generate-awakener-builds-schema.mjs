import fs from 'node:fs/promises'
import path from 'node:path'
import {fileURLToPath} from 'node:url'

import mainstats from '../src/data/mainstats.json' with {type: 'json'}
import awakenersLite from '../src/data/public-v2/lite/awakeners.json' with {type: 'json'}
import covenantsLite from '../src/data/public-v2/lite/covenants.json' with {type: 'json'}
import possesLite from '../src/data/public-v2/lite/posses.json' with {type: 'json'}
import wheelsLite from '../src/data/public-v2/lite/wheels.json' with {type: 'json'}

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const repoRoot = path.resolve(__dirname, '..')
const schemaOutputPath = path.join(repoRoot, 'schemas', 'awakener-builds.schema.json')

const WHEEL_TIERS = ['BIS_SSR', 'ALT_SSR', 'BIS_SR', 'GOOD']
const WHEEL_MAINSTAT_KEYS = [
  'CRIT_RATE',
  'CRIT_DMG',
  'REALM_MASTERY',
  'DMG_AMP',
  'ALIEMUS_REGEN',
  'KEYFLARE_REGEN',
  'SIGIL_YIELD',
  'DEATH_RESISTANCE',
]

function createConstOptions(values) {
  return values.map((value) => ({const: value}))
}

function createAwakenerOptions() {
  return awakenersLite.records.map((awakener) => ({
    const: awakener.id,
    title: awakener.name,
    description: `${awakener.rarity} · ${awakener.realm} · ${awakener.type}`,
  }))
}

function createAwakenerNameOptions() {
  return awakenersLite.records.map((awakener) => ({
    const: awakener.name,
    title: awakener.name,
    description: `${awakener.rarity} · ${awakener.realm} · ${awakener.type} · id ${String(awakener.id)}`,
  }))
}

function createWheelOptions() {
  const mainstatLabelByKey = new Map(mainstats.map((mainstat) => [mainstat.key, mainstat.label]))

  return wheelsLite.records.map((wheel) => ({
    const: wheel.id,
    title: wheel.name,
    description: `${wheel.rarity} · ${wheel.realm} · ${wheel.ownerAwakenerName ?? 'neutral'} · ${mainstatLabelByKey.get(wheel.mainstatKey) ?? wheel.mainstatKey}`,
  }))
}

function createCovenantOptions() {
  return covenantsLite.records.map((covenant) => ({
    const: covenant.id,
    title: covenant.name,
    description: covenant.assetId,
  }))
}

function createPosseOptions() {
  return possesLite.records.map((posse) => ({
    const: posse.id,
    title: posse.name,
    description: `${posse.realm} · ${posse.ownerAwakenerName ?? 'shared'}`,
  }))
}

function createMainstatOptions(keys) {
  const mainstatByKey = new Map(mainstats.map((mainstat) => [mainstat.key, mainstat]))

  return keys.map((key) => ({
    const: key,
    title: mainstatByKey.get(key)?.label ?? key,
  }))
}

export function buildAwakenerBuildsSchema() {
  return {
    $schema: 'https://json-schema.org/draft/2020-12/schema',
    title: 'Awakener Builds Public V2 Lite',
    type: 'object',
    additionalProperties: false,
    required: ['schemaVersion', 'scope', 'recordCount', 'records'],
    properties: {
      schemaVersion: {type: 'integer', minimum: 1},
      scope: {const: 'awakener-builds'},
      recordCount: {type: 'integer', minimum: 0},
      records: {
        type: 'array',
        items: {$ref: '#/$defs/entry'},
      },
    },
    $defs: {
      entryId: {
        type: 'string',
        pattern: '^awakener-build-\\d{4}$',
      },
      awakenerId: {
        oneOf: createAwakenerOptions(),
      },
      awakenerName: {
        oneOf: createAwakenerNameOptions(),
      },
      buildId: {
        type: 'string',
        minLength: 1,
      },
      summary: {
        type: 'string',
        minLength: 1,
      },
      note: {
        type: 'string',
        minLength: 1,
      },
      mainstatKey: {
        oneOf: createMainstatOptions(mainstats.map((mainstat) => mainstat.key)),
      },
      wheelMainstatKey: {
        oneOf: createMainstatOptions(WHEEL_MAINSTAT_KEYS),
      },
      wheelTier: {
        oneOf: createConstOptions(WHEEL_TIERS),
      },
      wheelId: {
        oneOf: createWheelOptions(),
      },
      covenantId: {
        oneOf: createCovenantOptions(),
      },
      posseId: {
        oneOf: createPosseOptions(),
      },
      substatPriorityGroup: {
        type: 'array',
        minItems: 1,
        uniqueItems: true,
        items: {$ref: '#/$defs/mainstatKey'},
      },
      recommendedWheelGroup: {
        type: 'object',
        additionalProperties: false,
        required: ['tier', 'wheelIds'],
        properties: {
          tier: {$ref: '#/$defs/wheelTier'},
          wheelIds: {
            type: 'array',
            minItems: 1,
            uniqueItems: true,
            items: {$ref: '#/$defs/wheelId'},
          },
        },
      },
      build: {
        type: 'object',
        additionalProperties: false,
        required: [
          'id',
          'label',
          'substatPriorityGroups',
          'recommendedWheels',
          'recommendedCovenantIds',
        ],
        properties: {
          id: {$ref: '#/$defs/buildId'},
          label: {type: 'string', minLength: 1},
          summary: {$ref: '#/$defs/summary'},
          note: {$ref: '#/$defs/note'},
          substatPriorityGroups: {
            type: 'array',
            minItems: 1,
            items: {$ref: '#/$defs/substatPriorityGroup'},
          },
          recommendedWheelMainstats: {
            type: 'array',
            minItems: 1,
            uniqueItems: true,
            items: {$ref: '#/$defs/wheelMainstatKey'},
          },
          recommendedWheels: {
            type: 'array',
            minItems: 1,
            items: {$ref: '#/$defs/recommendedWheelGroup'},
          },
          recommendedCovenantIds: {
            type: 'array',
            minItems: 1,
            uniqueItems: true,
            items: {$ref: '#/$defs/covenantId'},
          },
        },
      },
      entry: {
        type: 'object',
        additionalProperties: false,
        required: ['id', 'awakenerId', 'builds'],
        properties: {
          id: {$ref: '#/$defs/entryId'},
          awakenerId: {$ref: '#/$defs/awakenerId'},
          awakenerName: {$ref: '#/$defs/awakenerName'},
          primaryBuildId: {$ref: '#/$defs/buildId'},
          recommendedPosseIds: {
            type: 'array',
            minItems: 1,
            uniqueItems: true,
            items: {$ref: '#/$defs/posseId'},
          },
          builds: {
            type: 'array',
            minItems: 1,
            items: {$ref: '#/$defs/build'},
          },
        },
      },
    },
  }
}

export async function writeAwakenerBuildsSchema() {
  await fs.mkdir(path.dirname(schemaOutputPath), {recursive: true})
  await fs.writeFile(schemaOutputPath, `${JSON.stringify(buildAwakenerBuildsSchema(), null, 2)}\n`)
}

async function main() {
  await writeAwakenerBuildsSchema()
  console.log(`Wrote ${schemaOutputPath}`)
}

const invokedPath = process.argv[1] ? path.resolve(process.argv[1]) : null
if (invokedPath === __filename) {
  main().catch((error) => {
    console.error(error)
    process.exitCode = 1
  })
}
