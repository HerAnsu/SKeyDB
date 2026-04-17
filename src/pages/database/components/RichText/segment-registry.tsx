import React from 'react'

import type {AwakenerFullStats} from '@/domain/awakeners-full'
import type {RichSegment} from '@/domain/rich-text'

import {type TokenNavigationRequest} from '../RichTextPopovers/core/popover-navigation'
import {
  RichMechanicSegmentView,
  RichRealmSegmentView,
  RichScalingSegmentView,
  RichSkillSegmentView,
  RichStatSegmentView,
} from './RichSegmentViews'

export interface SegmentRendererProps<T extends RichSegment['type']> {
  segment: Extract<RichSegment, {type: T}>
  skillLevel: number
  stats: AwakenerFullStats | null
  variant: 'inline' | 'popover'
  onTokenNavigate?: (request: TokenNavigationRequest) => void
}

export const SEGMENT_RENDERERS: Record<
  string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  React.ComponentType<any> | undefined
> = {
  skill: RichSkillSegmentView,
  stat: RichStatSegmentView,
  mechanic: RichMechanicSegmentView,
  realm: RichRealmSegmentView,
  scaling: RichScalingSegmentView,
}
