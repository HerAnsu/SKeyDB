import type {
  AwakenerEnlightenRecord,
  AwakenerOverlayRecord,
  AwakenerRosterRecord,
  AwakenerSkillRecord,
  AwakenerTalentRecord,
  DerivedSkillRecord,
} from './awakener-source-schema'
import type {PublicV2UpgradeEntry} from './public-v2-schema'

export type PublicV2RecordUpgrade = PublicV2UpgradeEntry

export type PublicV2UpgradeableSkillRecord = AwakenerSkillRecord & {
  upgrades?: PublicV2RecordUpgrade[]
}

export type PublicV2UpgradeableDerivedSkillRecord = DerivedSkillRecord & {
  upgrades?: PublicV2RecordUpgrade[]
}

export type PublicV2UpgradeableOverlayRecord = AwakenerOverlayRecord & {
  upgrades?: PublicV2RecordUpgrade[]
}

export interface AwakenerFullV2Record extends AwakenerRosterRecord {
  cards: {
    C1: PublicV2UpgradeableSkillRecord
    C2: PublicV2UpgradeableSkillRecord
    C3: PublicV2UpgradeableSkillRecord
    C4: PublicV2UpgradeableSkillRecord
    C5: PublicV2UpgradeableSkillRecord
    Exalt: PublicV2UpgradeableSkillRecord
    OverExalt?: PublicV2UpgradeableSkillRecord
    promotedExtras: PublicV2UpgradeableDerivedSkillRecord[]
  }
  talents: {
    T1?: AwakenerTalentRecord
    T2?: AwakenerTalentRecord
    T3?: AwakenerTalentRecord
    T4?: AwakenerTalentRecord
    extraTalents: AwakenerTalentRecord[]
  }
  enlightens: {
    E1: AwakenerEnlightenRecord
    E2: AwakenerEnlightenRecord
    E3: AwakenerEnlightenRecord
    OverExalt?: AwakenerEnlightenRecord
    AbsoluteAxiom?: AwakenerEnlightenRecord
  }
  derivedSkills: PublicV2UpgradeableDerivedSkillRecord[]
  overlays?: PublicV2UpgradeableOverlayRecord[]
}

export function getAwakenerFullV2ById(
  awakenerId: number,
  records: AwakenerFullV2Record[],
): AwakenerFullV2Record | undefined {
  return records.find((entry) => entry.id === awakenerId)
}
