import {z} from 'zod'

import {
  awakenerRosterSchema,
  awakenersEnlightenSchema,
  awakenerSkillSchema,
  awakenerTalentSchema,
  derivedSkillSchema,
  type AwakenerEnlightenRecord,
  type AwakenerKitRecord,
  type AwakenerRosterRecord,
  type AwakenerSkillRecord,
  type AwakenerTalentRecord,
  type DerivedSkillRecord,
} from './awakener-source-schema.ts'

const compiledAwakenerCardsSchema = z.object({
  C1: awakenerSkillSchema,
  C2: awakenerSkillSchema,
  C3: awakenerSkillSchema,
  C4: awakenerSkillSchema,
  C5: awakenerSkillSchema,
  Exalt: awakenerSkillSchema,
  OverExalt: awakenerSkillSchema.optional(),
  promotedExtras: z.array(derivedSkillSchema),
})

const compiledAwakenerTalentsSchema = z.object({
  T1: awakenerTalentSchema.optional(),
  T2: awakenerTalentSchema.optional(),
  T3: awakenerTalentSchema.optional(),
  T4: awakenerTalentSchema.optional(),
  extraTalents: z.array(awakenerTalentSchema),
})

const compiledAwakenerEnlightensSchema = z.object({
  E1: awakenersEnlightenSchema,
  E2: awakenersEnlightenSchema,
  E3: awakenersEnlightenSchema,
  AbsoluteAxiom: awakenersEnlightenSchema.optional(),
})

export const awakenerFullV2RecordSchema = awakenerRosterSchema.extend({
  cards: compiledAwakenerCardsSchema,
  talents: compiledAwakenerTalentsSchema,
  enlightens: compiledAwakenerEnlightensSchema,
  derivedSkills: z.array(derivedSkillSchema),
})

export const awakenersFullV2DatasetSchema = z.array(awakenerFullV2RecordSchema)

export type AwakenerFullV2Record = z.infer<typeof awakenerFullV2RecordSchema>

interface CompileAwakenersFullV2Input {
  roster: AwakenerRosterRecord[]
  kits: AwakenerKitRecord[]
  skills: AwakenerSkillRecord[]
  talents: AwakenerTalentRecord[]
  enlightens: AwakenerEnlightenRecord[]
  derivedSkills: DerivedSkillRecord[]
}

function indexByStringId<T extends {id: string}>(records: T[]): Map<string, T> {
  const byId = new Map<string, T>()
  for (const record of records) {
    byId.set(record.id, record)
  }
  return byId
}

function indexKitsByAwakenerId(records: AwakenerKitRecord[]): Map<number, AwakenerKitRecord> {
  const byAwakenerId = new Map<number, AwakenerKitRecord>()
  for (const record of records) {
    byAwakenerId.set(record.awakenerId, record)
  }
  return byAwakenerId
}

function requireRecord<T>(recordsById: Map<string, T>, recordId: string, message: string): T {
  const record = recordsById.get(recordId)
  if (!record) {
    throw new Error(message)
  }
  return record
}

export function compileAwakenersFullV2({
  roster,
  kits,
  skills,
  talents,
  enlightens,
  derivedSkills,
}: CompileAwakenersFullV2Input): AwakenerFullV2Record[] {
  const kitsByAwakenerId = indexKitsByAwakenerId(kits)
  const skillsById = indexByStringId(skills)
  const talentsById = indexByStringId(talents)
  const enlightensById = indexByStringId(enlightens)
  const derivedSkillsById = indexByStringId(derivedSkills)

  const compiled = roster.map((awakener: AwakenerRosterRecord) => {
    const kit = kitsByAwakenerId.get(awakener.id)
    if (!kit) {
      throw new Error(`Missing canonical kit record for awakener ${String(awakener.id)}.`)
    }

    const cards = {
      C1: requireRecord(
        skillsById,
        kit.cards.C1,
        `Missing canonical skill record "${kit.cards.C1}" for awakener ${String(awakener.id)} slot C1.`,
      ),
      C2: requireRecord(
        skillsById,
        kit.cards.C2,
        `Missing canonical skill record "${kit.cards.C2}" for awakener ${String(awakener.id)} slot C2.`,
      ),
      C3: requireRecord(
        skillsById,
        kit.cards.C3,
        `Missing canonical skill record "${kit.cards.C3}" for awakener ${String(awakener.id)} slot C3.`,
      ),
      C4: requireRecord(
        skillsById,
        kit.cards.C4,
        `Missing canonical skill record "${kit.cards.C4}" for awakener ${String(awakener.id)} slot C4.`,
      ),
      C5: requireRecord(
        skillsById,
        kit.cards.C5,
        `Missing canonical skill record "${kit.cards.C5}" for awakener ${String(awakener.id)} slot C5.`,
      ),
      Exalt: requireRecord(
        skillsById,
        kit.cards.Exalt,
        `Missing canonical skill record "${kit.cards.Exalt}" for awakener ${String(awakener.id)} slot Exalt.`,
      ),
      OverExalt: kit.cards.OverExalt
        ? requireRecord(
            skillsById,
            kit.cards.OverExalt,
            `Missing canonical skill record "${kit.cards.OverExalt}" for awakener ${String(awakener.id)} slot OverExalt.`,
          )
        : undefined,
      promotedExtras: kit.cards.promotedExtras.map((recordId) =>
        requireRecord(
          derivedSkillsById,
          recordId,
          `Missing canonical derived skill record "${recordId}" for awakener ${String(awakener.id)} promoted extra.`,
        ),
      ),
    }

    const compiledTalents = {
      T1: kit.talents.T1
        ? requireRecord(
            talentsById,
            kit.talents.T1,
            `Missing canonical talent record "${kit.talents.T1}" for awakener ${String(awakener.id)} slot T1.`,
          )
        : undefined,
      T2: kit.talents.T2
        ? requireRecord(
            talentsById,
            kit.talents.T2,
            `Missing canonical talent record "${kit.talents.T2}" for awakener ${String(awakener.id)} slot T2.`,
          )
        : undefined,
      T3: kit.talents.T3
        ? requireRecord(
            talentsById,
            kit.talents.T3,
            `Missing canonical talent record "${kit.talents.T3}" for awakener ${String(awakener.id)} slot T3.`,
          )
        : undefined,
      T4: kit.talents.T4
        ? requireRecord(
            talentsById,
            kit.talents.T4,
            `Missing canonical talent record "${kit.talents.T4}" for awakener ${String(awakener.id)} slot T4.`,
          )
        : undefined,
      extraTalents: kit.talents.extraTalentIds.map((recordId) =>
        requireRecord(
          talentsById,
          recordId,
          `Missing canonical talent record "${recordId}" for awakener ${String(awakener.id)} extra talent.`,
        ),
      ),
    }

    const compiledEnlightens = {
      E1: requireRecord(
        enlightensById,
        kit.enlightens.E1,
        `Missing canonical enlighten record "${kit.enlightens.E1}" for awakener ${String(awakener.id)} slot E1.`,
      ),
      E2: requireRecord(
        enlightensById,
        kit.enlightens.E2,
        `Missing canonical enlighten record "${kit.enlightens.E2}" for awakener ${String(awakener.id)} slot E2.`,
      ),
      E3: requireRecord(
        enlightensById,
        kit.enlightens.E3,
        `Missing canonical enlighten record "${kit.enlightens.E3}" for awakener ${String(awakener.id)} slot E3.`,
      ),
      AbsoluteAxiom: kit.enlightens.AbsoluteAxiom
        ? requireRecord(
            enlightensById,
            kit.enlightens.AbsoluteAxiom,
            `Missing canonical enlighten record "${kit.enlightens.AbsoluteAxiom}" for awakener ${String(awakener.id)} slot AbsoluteAxiom.`,
          )
        : undefined,
    }

    return {
      ...awakener,
      cards,
      talents: compiledTalents,
      enlightens: compiledEnlightens,
      derivedSkills: derivedSkills.filter((entry) => entry.ownerAwakenerId === awakener.id),
    }
  })

  return awakenersFullV2DatasetSchema.parse(compiled)
}
