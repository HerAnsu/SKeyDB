import {useCallback, useEffect, useEffectEvent, useRef, useState} from 'react'

import {CollectionLevelStepButton} from './CollectionLevelStepButton'

interface AwakenerLevelControlProps {
  name: string
  level: number
  disabled: boolean
  onLevelChange: (nextLevel: number) => void
  onCommitOutsideClick?: (event: MouseEvent | PointerEvent) => void
}

function parseNumericLevel(rawValue: string): number | null {
  if (!rawValue.trim()) {
    return null
  }
  if (!/^\d+$/.test(rawValue)) {
    return null
  }
  return Number.parseInt(rawValue, 10)
}

export function AwakenerLevelControl({
  name,
  level,
  disabled,
  onLevelChange,
  onCommitOutsideClick,
}: AwakenerLevelControlProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [draftLevel, setDraftLevel] = useState('')
  const [isDraftDirty, setIsDraftDirty] = useState(false)
  const inputRef = useRef<HTMLInputElement | null>(null)
  const rootRef = useRef<HTMLDivElement | null>(null)
  const draftLevelRef = useRef('')
  const isDraftDirtyRef = useRef(false)
  const levelRef = useRef(level)
  const commitOutsidePointerLikeDown = useEffectEvent((event: MouseEvent | PointerEvent) => {
    // Outside click commits current draft. Ownership-hitbox suppression is handled
    // by the parent card, scoped to this awakener only.
    const rawDraft = isDraftDirtyRef.current ? draftLevelRef.current : String(levelRef.current)
    const parsed = parseNumericLevel(rawDraft)
    if (parsed !== null) {
      onLevelChange(parsed)
    }
    setIsEditing(false)
    onCommitOutsideClick?.(event)
  })

  const setInputRef = useCallback((element: HTMLInputElement | null) => {
    inputRef.current = element
    if (element) {
      element.focus()
      element.select()
    }
  }, [])

  useEffect(() => {
    if (!isEditing) {
      return
    }

    let swallowSyntheticMouseDown = false

    function handleOutsidePointerLikeDown(event: MouseEvent | PointerEvent) {
      if (event.type === 'mousedown' && swallowSyntheticMouseDown) {
        swallowSyntheticMouseDown = false
        return
      }
      if (event.type === 'pointerdown') {
        swallowSyntheticMouseDown = true
      }

      const target = event.target as Node | null
      if (target && rootRef.current?.contains(target)) {
        return
      }

      commitOutsidePointerLikeDown(event)
    }

    document.addEventListener('pointerdown', handleOutsidePointerLikeDown, true)
    document.addEventListener('mousedown', handleOutsidePointerLikeDown, true)
    return () => {
      document.removeEventListener('pointerdown', handleOutsidePointerLikeDown, true)
      document.removeEventListener('mousedown', handleOutsidePointerLikeDown, true)
    }
  }, [isEditing])

  function commitDraft() {
    const rawDraft = isDraftDirtyRef.current ? draftLevelRef.current : String(levelRef.current)
    const parsed = parseNumericLevel(rawDraft)
    if (parsed !== null) {
      onLevelChange(parsed)
    }
    setIsEditing(false)
    isDraftDirtyRef.current = false
    setIsDraftDirty(false)
  }

  function handleStep(delta: -1 | 1) {
    const parsedDraft = parseNumericLevel(isDraftDirtyRef.current ? draftLevelRef.current : '')
    const baseLevel = parsedDraft ?? levelRef.current
    const nextLevel = Math.min(90, Math.max(1, baseLevel + delta))
    const nextText = String(nextLevel)
    draftLevelRef.current = nextText
    isDraftDirtyRef.current = true
    levelRef.current = nextLevel
    setDraftLevel(nextText)
    setIsDraftDirty(true)
    onLevelChange(nextLevel)
  }

  if (!isEditing) {
    return (
      <button
        aria-label={`Edit awakener level for ${name}`}
        className='collection-awakener-level-trigger'
        disabled={disabled}
        onClick={() => {
          const nextDraftLevel = String(level)
          draftLevelRef.current = nextDraftLevel
          isDraftDirtyRef.current = false
          levelRef.current = level
          setDraftLevel(nextDraftLevel)
          setIsDraftDirty(false)
          setIsEditing(true)
        }}
        type='button'
      >
        <span className='collection-awakener-level-prefix'>Lv.</span>
        <span className='collection-awakener-level-value'>{level}</span>
      </button>
    )
  }

  return (
    <div className='collection-awakener-level-editor' ref={rootRef}>
      <label className='collection-awakener-level-input-row'>
        <span className='collection-awakener-level-prefix'>Lv.</span>
        <input
          aria-label={`Awakener level for ${name}`}
          className='collection-awakener-level-input'
          inputMode='numeric'
          onChange={(event) => {
            const nextDraftLevel = event.target.value.replace(/[^\d]/g, '')
            draftLevelRef.current = nextDraftLevel
            isDraftDirtyRef.current = true
            setDraftLevel(nextDraftLevel)
            setIsDraftDirty(true)
          }}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              commitDraft()
            }
            if (event.key === 'Escape') {
              setIsEditing(false)
              isDraftDirtyRef.current = false
            }
          }}
          ref={setInputRef}
          type='text'
          value={isDraftDirty ? draftLevel : String(level)}
        />
        <div className='collection-step-group collection-step-group-compact collection-level-inline-steps'>
          <CollectionLevelStepButton
            ariaLabel={`Increase awakener level for ${name}`}
            className='collection-step-btn collection-step-btn-compact'
            direction='up'
            disabled={level >= 90}
            glyphClassName='collection-step-glyph collection-step-glyph-compact'
            onStep={() => {
              handleStep(1)
            }}
          />
          <CollectionLevelStepButton
            ariaLabel={`Decrease awakener level for ${name}`}
            className='collection-step-btn collection-step-btn-compact'
            direction='down'
            disabled={level <= 1}
            glyphClassName='collection-step-glyph collection-step-glyph-compact'
            onStep={() => {
              handleStep(-1)
            }}
          />
        </div>
      </label>
    </div>
  )
}
