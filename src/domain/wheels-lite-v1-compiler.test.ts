import {describe, expect, it} from 'vitest'

import awakenerOverlays from '@/data/awakeners/awakener-overlays.json'
import awakenerRoster from '@/data/awakeners/awakener-roster.json'
import wheelMainstatScaling from '@/data/wheels/wheel-mainstat-scaling.json'
import wheelSource from '@/data/wheels/wheel-source.json'

import {awakenerOverlaySchema, awakenerRosterSchema} from './awakener-source-schema'
import {wheelMainstatScalingSourceSchema, wheelSourceDatasetSchema} from './wheel-source-schema'
import {compileWheelsFullV1} from './wheels-full-v1-compiler'
import {compileWheelsLiteV1} from './wheels-lite-v1-compiler'

const parsedWheelSource = wheelSourceDatasetSchema.parse(wheelSource)
const parsedAwakenerRoster = awakenerRosterSchema.array().parse(awakenerRoster)
const parsedWheelMainstatScaling = wheelMainstatScalingSourceSchema.parse(wheelMainstatScaling)
const parsedAwakenerOverlays = awakenerOverlaySchema.array().parse(awakenerOverlays)

describe('compileWheelsLiteV1', () => {
  it('infers wheel tags from canonical overlay references during lite compile', () => {
    const fullRecords = compileWheelsFullV1({
      sourceRecords: parsedWheelSource,
      awakeners: parsedAwakenerRoster,
      mainstatScaling: parsedWheelMainstatScaling,
    })

    const compiled = compileWheelsLiteV1({
      fullRecords,
      overlayRecords: parsedAwakenerOverlays,
    })

    expect(compiled.find((record) => record.id === 'B03')?.tags).toEqual(
      expect.arrayContaining(['Caro', 'Embryo Fusion', 'STR', 'Vulnerable']),
    )
    expect(compiled.find((record) => record.id === 'B03')?.tags).not.toEqual(
      expect.arrayContaining(['Exalt']),
    )
    expect(compiled.find((record) => record.id === 'SR17')?.tags).toEqual(
      expect.arrayContaining(['Death Resistance', 'Poison']),
    )
    expect(compiled.find((record) => record.id === 'SR24')?.tags).toEqual(
      expect.arrayContaining(['Death Resistance']),
    )
    expect(compiled.find((record) => record.id === 'SR25')?.tags).toEqual(
      expect.arrayContaining(['Caro', 'Devour']),
    )
    expect(compiled.find((record) => record.id === 'O10')?.tags).toEqual(
      expect.arrayContaining(['Death Resistance']),
    )
    expect(compiled.find((record) => record.id === 'P10')?.tags).toEqual(
      expect.arrayContaining(['Astral Reign']),
    )
    expect(compiled.find((record) => record.id === 'P10')?.tags).not.toEqual(
      expect.arrayContaining(['Painted Orisons']),
    )
    expect(compiled.some((record) => record.tags.includes('Strike'))).toBe(false)
    expect(compiled.some((record) => record.tags.includes('Defense'))).toBe(false)
    expect(compiled.some((record) => record.tags.includes('Exalt'))).toBe(false)
  })
})
