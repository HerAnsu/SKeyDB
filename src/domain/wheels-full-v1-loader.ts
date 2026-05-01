import {wheelFullV1RecordSchema} from './wheels-full-v1-compiler.ts'
import {resolveWheelFullV1Id, type WheelFullV1Record} from './wheels-full-v1.ts'

let wheelsFullV1Promise: Promise<WheelFullV1Record[]> | null = null
const wheelFullV1ByIdPromises = new Map<string, Promise<WheelFullV1Record | undefined>>()
const wheelFullV1RecordLoaders: Partial<Record<string, () => Promise<WheelFullV1Record>>> =
  import.meta.glob<WheelFullV1Record>('../data/wheels/compiled/wheels-full-v1-records/*.json', {
    import: 'default',
  })

function buildWheelFullV1RecordPath(wheelId: string): string {
  return `../data/wheels/compiled/wheels-full-v1-records/${wheelId}.json`
}

export function loadWheelsFullV1(): Promise<WheelFullV1Record[]> {
  if (wheelsFullV1Promise) {
    return wheelsFullV1Promise
  }

  wheelsFullV1Promise = import('./wheels-full-v1').then((module) => module.getWheelsFullV1())
  return wheelsFullV1Promise
}

export async function loadWheelFullV1ById(wheelId: string): Promise<WheelFullV1Record | undefined> {
  const fullV1Id = resolveWheelFullV1Id(wheelId)
  const cachedPromise = wheelFullV1ByIdPromises.get(fullV1Id)
  if (cachedPromise) {
    return cachedPromise
  }

  const loader = wheelFullV1RecordLoaders[buildWheelFullV1RecordPath(fullV1Id)]
  const recordPromise = loader
    ? loader().then((record) => wheelFullV1RecordSchema.parse(record))
    : Promise.resolve(undefined)

  wheelFullV1ByIdPromises.set(fullV1Id, recordPromise)
  return recordPromise
}
