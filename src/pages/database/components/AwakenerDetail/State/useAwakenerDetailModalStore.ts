import {create} from 'zustand'

import {
  clampAwakenerDatabaseLevel,
  clampAwakenerDatabasePsycheSurgeOffset,
} from '@/domain/awakener-level-scaling'

import type {TabId} from '../../../constants'
import {readFontScale, writeFontScale, type FontScale} from '../../../utils/font-scale'

type AwakenerDetailModalStoreState = Readonly<{
  activeTab: TabId
  awakenerLevel: number
  psycheSurgeOffset: number
  skillLevel: number
  fontScale: FontScale
  isScalingMenuOpen: boolean
  isTagsMenuOpen: boolean
}>

type AwakenerDetailModalStoreActions = Readonly<{
  initialize: () => void
  setActiveTab: (tab: TabId) => void
  setAwakenerLevel: (level: number) => void
  increasePsycheSurge: () => void
  decreasePsycheSurge: () => void
  setSkillLevel: (level: number) => void
  setFontScale: (fontScale: FontScale) => void
  toggleScalingMenu: () => void
  toggleTagsMenu: () => void
  closeScalingMenu: () => void
  closeTagsMenu: () => void
  closeMenus: () => void
  reset: () => void
}>

type AwakenerDetailModalStore = AwakenerDetailModalStoreState & AwakenerDetailModalStoreActions

const BASE_MODAL_UI_STATE: Omit<AwakenerDetailModalStoreState, 'fontScale'> = {
  activeTab: 'cards',
  awakenerLevel: 60,
  psycheSurgeOffset: 0,
  skillLevel: 1,
  isScalingMenuOpen: false,
  isTagsMenuOpen: false,
}

function buildInitialState(): AwakenerDetailModalStoreState {
  return {
    ...BASE_MODAL_UI_STATE,
    fontScale: readFontScale(),
  }
}

export const useAwakenerDetailModalStore = create<AwakenerDetailModalStore>()((set) => ({
  ...buildInitialState(),
  initialize: () => {
    set(buildInitialState())
  },
  setActiveTab: (tab) => {
    set({activeTab: tab})
  },
  setAwakenerLevel: (level) => {
    set({awakenerLevel: clampAwakenerDatabaseLevel(level)})
  },
  increasePsycheSurge: () => {
    set((state) => ({
      psycheSurgeOffset: clampAwakenerDatabasePsycheSurgeOffset(state.psycheSurgeOffset + 1),
    }))
  },
  decreasePsycheSurge: () => {
    set((state) => ({
      psycheSurgeOffset: clampAwakenerDatabasePsycheSurgeOffset(state.psycheSurgeOffset - 1),
    }))
  },
  setSkillLevel: (level) => {
    set({skillLevel: level})
  },
  setFontScale: (fontScale) => {
    writeFontScale(fontScale)
    set({fontScale})
  },
  toggleScalingMenu: () => {
    set((state) => ({isScalingMenuOpen: !state.isScalingMenuOpen}))
  },
  toggleTagsMenu: () => {
    set((state) => ({isTagsMenuOpen: !state.isTagsMenuOpen}))
  },
  closeScalingMenu: () => {
    set({isScalingMenuOpen: false})
  },
  closeTagsMenu: () => {
    set({isTagsMenuOpen: false})
  },
  closeMenus: () => {
    set({isScalingMenuOpen: false, isTagsMenuOpen: false})
  },
  reset: () => {
    set(buildInitialState())
  },
}))

export function resetAwakenerDetailModalStore(): void {
  useAwakenerDetailModalStore.getState().reset()
}
