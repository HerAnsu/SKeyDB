import type {Tag} from '@/domain/tags'

import type {PopoverAnchorElement} from './popover-anchor'

export type SkillTokenNavigationRequest = Readonly<{
  kind: 'skill'
  name: string
  anchorElement: PopoverAnchorElement
}>

export type TagTokenNavigationRequest = Readonly<{
  kind: 'tag'
  tag: Tag
  anchorElement: PopoverAnchorElement
}>

export type ScalingTokenNavigationRequest = Readonly<{
  kind: 'scaling'
  values: number[]
  suffix: string
  stat: string | null
  anchorElement: PopoverAnchorElement
}>

export type TokenNavigationRequest =
  | SkillTokenNavigationRequest
  | TagTokenNavigationRequest
  | ScalingTokenNavigationRequest
