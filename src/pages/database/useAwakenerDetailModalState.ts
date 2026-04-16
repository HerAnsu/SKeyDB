import {useCallback, useEffect} from 'react'

import {type Awakener} from '@/domain/awakeners'
import {type AwakenerFullV2Record} from '@/domain/awakeners-full-v2'
import {type DatabaseAwakenerTab} from '@/domain/database-paths'

import {useAwakenerDetailChrome} from './useAwakenerDetailChrome'
import {useAwakenerDetailDatabaseState} from './useAwakenerDetailDatabaseState'
import {useAwakenerDetailSearch} from './useAwakenerDetailSearch'
import {useDatabasePopoverController} from './useDatabasePopoverController'

interface UseAwakenerDetailModalStateOptions {
  activeTab: DatabaseAwakenerTab
  awakener: Awakener
  awakeners: Awakener[]
  fullDataV2: AwakenerFullV2Record
  onClose: () => void
  onSelectAwakener?: (awakener: Awakener, tab: DatabaseAwakenerTab) => void
  onTabChange: (tab: DatabaseAwakenerTab) => void
}

export function useAwakenerDetailModalState({
  activeTab,
  awakener,
  awakeners,
  fullDataV2,
  onClose,
  onSelectAwakener,
  onTabChange,
}: UseAwakenerDetailModalStateOptions) {
  const search = useAwakenerDetailSearch({activeTab, awakeners, onSelectAwakener})
  const databaseState = useAwakenerDetailDatabaseState({fullDataV2})
  const {
    actions: sessionActions,
    preferences: sessionPreferences,
    runtime: sessionRuntime,
  } = databaseState
  const {defaultSelection, fontScale, value: preferences} = sessionPreferences
  const {referenceLayer, resolvedControls, resolvedSelection, resolvedStats, shellView} =
    sessionRuntime

  const setActiveTab = useCallback(
    (nextTab: DatabaseAwakenerTab) => {
      onTabChange(nextTab)
    },
    [onTabChange],
  )

  const navigateToCards = useCallback(() => {
    setActiveTab('cards')
  }, [setActiveTab])

  const popoverController = useDatabasePopoverController({
    onNavigateToCards: navigateToCards,
    onToggleEnlightenSlot: sessionActions.toggleEnlightenSlot,
    referenceLayer,
    selectedEnlightenSlot: resolvedSelection.selectedEnlightenSlot,
    showTagIcons: preferences.showTagIcons,
    showVisibleScaling: preferences.showVisibleScaling,
    stats: shellView.stats,
  })
  const {
    hasOpenPopovers,
    closeAllPopovers,
    contextValue: popoverContextValue,
    popoverRootProps,
  } = popoverController

  const chrome = useAwakenerDetailChrome({
    awakenerId: awakener.id,
    awakenerTags: awakener.tags,
    clickOutsideClosesPopovers: preferences.clickOutsideClosesPopovers,
    closeAllPopovers,
    closeSearch: search.closeSearch,
    hasOpenPopovers,
    isSearchOpen: search.isSearchOpen,
    onClose,
    searchContainerRef: search.searchContainerRef,
  })
  const {clearSearch, closeSearch, searchInputRef, searchQuery} = search
  const {isSettingsOpen, setIsSettingsOpen} = chrome

  useEffect(() => {
    function handleEscape(event: KeyboardEvent) {
      if (event.key !== 'Escape') {
        return
      }

      const searchIsFocused = document.activeElement === searchInputRef.current
      if (searchIsFocused || searchQuery.trim().length > 0) {
        event.preventDefault()
        event.stopPropagation()
        if (searchQuery.trim().length > 0) {
          clearSearch()
          return
        }
        closeSearch(true)
        return
      }
      if (isSettingsOpen) {
        event.preventDefault()
        event.stopPropagation()
        setIsSettingsOpen(false)
        return
      }
      if (hasOpenPopovers) {
        event.preventDefault()
        event.stopPropagation()
        closeAllPopovers()
        return
      }
      onClose()
    }

    window.addEventListener('keydown', handleEscape)
    return () => {
      window.removeEventListener('keydown', handleEscape)
    }
  }, [
    clearSearch,
    closeAllPopovers,
    closeSearch,
    hasOpenPopovers,
    isSettingsOpen,
    onClose,
    searchInputRef,
    searchQuery,
    setIsSettingsOpen,
  ])

  return {
    activeSearchIndex: search.activeSearchIndex,
    activeTab,
    canExpandTags: chrome.canExpandTags,
    defaultSelection,
    fontScale,
    handleOverlayClick: chrome.handleOverlayClick,
    handlePanelKeyDown: chrome.handlePanelKeyDown,
    handleSearchInputKeyDown: search.handleSearchInputKeyDown,
    handleSearchQueryChange: search.handleSearchQueryChange,
    handleSelectAwakenerFromSearch: search.handleSelectAwakenerFromSearch,
    isMobileHeader: chrome.isMobileHeader,
    isSearchOpen: search.isSearchOpen,
    isSettingsOpen: chrome.isSettingsOpen,
    openSearch: search.openSearch,
    panelRef: chrome.panelRef,
    popoverContextValue,
    popoverRootProps,
    preferences,
    referenceLayer,
    resolvedControls,
    resolvedSelection,
    resolvedStats,
    searchContainerRef: search.searchContainerRef,
    searchInputRef: search.searchInputRef,
    searchQuery: search.searchQuery,
    searchResults: search.searchResults,
    setActiveTab,
    setIsSettingsOpen: chrome.setIsSettingsOpen,
    setShowAllTags: chrome.setShowAllTags,
    session: {
      actions: sessionActions,
      preferences: sessionPreferences,
      runtime: sessionRuntime,
    },
    settingsRef: chrome.settingsRef,
    showAllTags: chrome.showAllTags,
    tagsRef: chrome.tagsRef,
  }
}
