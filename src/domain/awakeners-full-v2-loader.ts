import {type AwakenerFullV2Record} from './awakeners-full-v2'
import {awakenerFullV2RecordSchema} from './awakeners-full-v2-compiler'

let awakenersFullV2Promise: Promise<AwakenerFullV2Record[]> | null = null
const awakenerFullV2ByIdPromises = new Map<number, Promise<AwakenerFullV2Record | undefined>>()
const awakenerFullV2RecordLoaders: Partial<Record<string, () => Promise<AwakenerFullV2Record>>> =
  import.meta.glob<AwakenerFullV2Record>(
    '../data/awakeners/compiled/awakeners-full-v2-records/*.json',
    {
      import: 'default',
    },
  )

function buildAwakenerFullV2RecordPath(awakenerId: number): string {
  return `../data/awakeners/compiled/awakeners-full-v2-records/${String(awakenerId)}.json`
}

export function loadAwakenersFullV2(): Promise<AwakenerFullV2Record[]> {
  if (awakenersFullV2Promise) {
    return awakenersFullV2Promise
  }

  awakenersFullV2Promise = import('./awakeners-full-v2').then((module) =>
    module.getAwakenersFullV2(),
  )

  return awakenersFullV2Promise
}

export async function loadAwakenerFullV2ById(
  awakenerId: number,
): Promise<AwakenerFullV2Record | undefined> {
  const cachedPromise = awakenerFullV2ByIdPromises.get(awakenerId)
  if (cachedPromise) {
    return cachedPromise
  }

  const loader = awakenerFullV2RecordLoaders[buildAwakenerFullV2RecordPath(awakenerId)]
  const recordPromise = loader
    ? loader().then((record) => awakenerFullV2RecordSchema.parse(record))
    : Promise.resolve(undefined)
  awakenerFullV2ByIdPromises.set(awakenerId, recordPromise)

  return recordPromise
}
