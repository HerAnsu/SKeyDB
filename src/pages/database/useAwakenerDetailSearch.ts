import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
} from 'react'

import {type Awakener} from '@/domain/awakeners'
import {searchAwakeners} from '@/domain/awakeners-search'
import {type DatabaseAwakenerTab} from '@/domain/database-paths'
import {getSearchCaptureAction} from '@/pages/search-capture'

interface UseAwakenerDetailSearchOptions {
  activeTab: DatabaseAwakenerTab
  awakeners: Awakener[]
  onSelectAwakener?: (awakener: Awakener, tab: DatabaseAwakenerTab) => void
}

export function useAwakenerDetailSearch({
  activeTab,
  awakeners,
  onSelectAwakener,
}: UseAwakenerDetailSearchOptions) {
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchActiveIndex, setSearchActiveIndex] = useState(0)
  const searchContainerRef = useRef<HTMLDivElement>(null)
  const searchInputRef = useRef<HTMLInputElement>(null)
  const searchResults = useMemo(
    () => (searchQuery.trim().length > 0 ? searchAwakeners(awakeners, searchQuery) : []),
    [awakeners, searchQuery],
  )
  const activeSearchIndex =
    searchResults.length === 0 ? 0 : Math.min(searchActiveIndex, searchResults.length - 1)

  const focusSearchInput = useCallback(() => {
    searchInputRef.current?.focus()
  }, [])

  const openSearch = useCallback(() => {
    setIsSearchOpen(true)
  }, [])

  const closeSearch = useCallback((blurInput = false) => {
    setIsSearchOpen(false)
    if (blurInput) {
      searchInputRef.current?.blur()
    }
  }, [])

  const clearSearch = useCallback(() => {
    setIsSearchOpen(false)
    setSearchQuery('')
    setSearchActiveIndex(0)
  }, [])

  const handleSelectAwakenerFromSearch = useCallback(
    (nextAwakener: Awakener) => {
      onSelectAwakener?.(nextAwakener, activeTab)
      clearSearch()
      searchInputRef.current?.blur()
    },
    [activeTab, clearSearch, onSelectAwakener],
  )

  const handleSearchQueryChange = useCallback((value: string) => {
    setIsSearchOpen(true)
    setSearchQuery(value)
    setSearchActiveIndex(0)
  }, [])

  useEffect(() => {
    function handleGlobalSearchCapture(event: KeyboardEvent) {
      const action = getSearchCaptureAction({
        currentSearchValue: searchInputRef.current?.value ?? searchQuery,
        event,
      })
      if (!action) {
        return
      }

      event.preventDefault()

      if (action.kind === 'delete') {
        setSearchQuery((previous) => previous.slice(0, -1))
        setIsSearchOpen(true)
        focusSearchInput()
        return
      }

      if (action.kind === 'character') {
        setSearchQuery((previous) => previous + action.key)
        setIsSearchOpen(true)
        focusSearchInput()
      }
    }

    window.addEventListener('keydown', handleGlobalSearchCapture)
    return () => {
      window.removeEventListener('keydown', handleGlobalSearchCapture)
    }
  }, [focusSearchInput, searchQuery])

  const handleSearchInputKeyDown = useCallback(
    (event: ReactKeyboardEvent<HTMLInputElement>) => {
      if (event.key === 'ArrowDown') {
        if (searchResults.length === 0) {
          return
        }
        event.preventDefault()
        setSearchActiveIndex((previous) => (previous + 1) % searchResults.length)
        return
      }
      if (event.key === 'ArrowUp') {
        if (searchResults.length === 0) {
          return
        }
        event.preventDefault()
        setSearchActiveIndex((previous) =>
          previous === 0 ? searchResults.length - 1 : previous - 1,
        )
        return
      }
      if (event.key === 'Enter') {
        if (searchResults.length === 0) {
          return
        }
        const nextAwakener = searchResults[activeSearchIndex]
        event.preventDefault()
        handleSelectAwakenerFromSearch(nextAwakener)
      }
    },
    [activeSearchIndex, handleSelectAwakenerFromSearch, searchResults],
  )

  return {
    activeSearchIndex,
    clearSearch,
    closeSearch,
    handleSearchInputKeyDown,
    handleSearchQueryChange,
    handleSelectAwakenerFromSearch,
    isSearchOpen,
    openSearch,
    searchContainerRef,
    searchInputRef,
    searchQuery,
    searchResults,
  }
}
