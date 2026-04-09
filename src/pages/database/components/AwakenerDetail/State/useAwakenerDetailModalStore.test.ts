import {afterEach, describe, expect, it} from 'vitest'

import {
  resetAwakenerDetailModalStore,
  useAwakenerDetailModalStore,
} from './useAwakenerDetailModalStore'

afterEach(() => {
  localStorage.clear()
  resetAwakenerDetailModalStore()
})

describe('useAwakenerDetailModalStore', () => {
  it('updates modal state through store actions', () => {
    const store = useAwakenerDetailModalStore.getState()

    store.setActiveTab('builds')
    store.setAwakenerLevel(90)
    store.increasePsycheSurge()
    store.setSkillLevel(6)
    store.toggleScalingMenu()
    store.toggleTagsMenu()

    const nextState = useAwakenerDetailModalStore.getState()

    expect(nextState.activeTab).toBe('builds')
    expect(nextState.awakenerLevel).toBe(90)
    expect(nextState.psycheSurgeOffset).toBe(1)
    expect(nextState.skillLevel).toBe(6)
    expect(nextState.isScalingMenuOpen).toBe(true)
    expect(nextState.isTagsMenuOpen).toBe(true)
  })

  it('resets to the modal defaults and reloads persisted font scale', () => {
    const store = useAwakenerDetailModalStore.getState()

    store.setActiveTab('teams')
    store.setAwakenerLevel(1)
    store.increasePsycheSurge()
    store.setSkillLevel(4)
    store.setFontScale('large')
    store.toggleScalingMenu()
    store.toggleTagsMenu()

    expect(localStorage.getItem('modal-font-scale')).toBe('large')

    store.reset()

    const resetState = useAwakenerDetailModalStore.getState()
    expect(resetState.activeTab).toBe('cards')
    expect(resetState.awakenerLevel).toBe(60)
    expect(resetState.psycheSurgeOffset).toBe(0)
    expect(resetState.skillLevel).toBe(1)
    expect(resetState.fontScale).toBe('large')
    expect(resetState.isScalingMenuOpen).toBe(false)
    expect(resetState.isTagsMenuOpen).toBe(false)
  })

  it('clamps level and psyche surge values and closes menus explicitly', () => {
    const store = useAwakenerDetailModalStore.getState()

    store.setAwakenerLevel(999)
    for (let index = 0; index < 20; index += 1) {
      store.increasePsycheSurge()
    }
    store.toggleScalingMenu()
    store.toggleTagsMenu()
    store.closeScalingMenu()
    store.closeTagsMenu()
    store.toggleScalingMenu()
    store.toggleTagsMenu()
    store.closeMenus()

    const nextState = useAwakenerDetailModalStore.getState()
    expect(nextState.awakenerLevel).toBe(90)
    expect(nextState.psycheSurgeOffset).toBe(12)
    expect(nextState.isScalingMenuOpen).toBe(false)
    expect(nextState.isTagsMenuOpen).toBe(false)
  })

  it('falls back to the default font scale for invalid stored values during initialization', () => {
    localStorage.setItem('modal-font-scale', 'giant')

    useAwakenerDetailModalStore.getState().initialize()

    expect(useAwakenerDetailModalStore.getState().fontScale).toBe('small')
  })
})
