import {useEffect, useEffectEvent, useLayoutEffect, type RefObject} from 'react'

interface UseNativeModalDialogOptions {
  dialogRef: RefObject<HTMLDialogElement | null>
  initialFocusRef?: RefObject<HTMLElement | null>
  lockBodyScroll?: boolean
  onCancel?: (event: Event) => void
  onClick?: (event: MouseEvent) => void
  onKeyDown?: (event: KeyboardEvent) => void
  restoreFocus?: boolean
}

interface PageScrollLockSnapshot {
  bodyLeft: string
  bodyOverflow: string
  bodyPosition: string
  bodyRight: string
  bodyTop: string
  bodyWidth: string
  documentOverflow: string
  scrollX: number
  scrollY: number
}

const activePageScrollLocks = new Set<symbol>()
let pageScrollLockSnapshot: PageScrollLockSnapshot | null = null

function openDialog(dialog: HTMLDialogElement) {
  if (dialog.open) {
    return
  }

  if (typeof dialog.showModal === 'function') {
    dialog.showModal()
    return
  }

  dialog.setAttribute('open', '')
}

function closeDialog(dialog: HTMLDialogElement) {
  if (!dialog.open) {
    return
  }

  if (typeof dialog.close === 'function') {
    dialog.close()
    return
  }

  dialog.removeAttribute('open')
}

function getTopmostOpenDialog(): HTMLDialogElement | null {
  const openDialogs = document.querySelectorAll<HTMLDialogElement>('dialog[open]')
  return openDialogs[openDialogs.length - 1] ?? null
}

function acquirePageScrollLock(): symbol {
  const lockToken = Symbol('page-scroll-lock')

  if (activePageScrollLocks.size === 0) {
    const scrollX = window.scrollX
    const scrollY = window.scrollY

    pageScrollLockSnapshot = {
      bodyLeft: document.body.style.left,
      bodyOverflow: document.body.style.overflow,
      bodyPosition: document.body.style.position,
      bodyRight: document.body.style.right,
      bodyTop: document.body.style.top,
      bodyWidth: document.body.style.width,
      documentOverflow: document.documentElement.style.overflow,
      scrollX,
      scrollY,
    }

    document.body.style.overflow = 'hidden'
    document.body.style.position = 'fixed'
    document.body.style.top = `-${String(scrollY)}px`
    document.body.style.left = `-${String(scrollX)}px`
    document.body.style.right = '0'
    document.body.style.width = '100%'
    document.documentElement.style.overflow = 'hidden'
  }

  activePageScrollLocks.add(lockToken)
  return lockToken
}

function releasePageScrollLock(lockToken: symbol) {
  activePageScrollLocks.delete(lockToken)
  if (activePageScrollLocks.size > 0 || !pageScrollLockSnapshot) {
    return
  }

  const snapshot = pageScrollLockSnapshot
  pageScrollLockSnapshot = null
  document.body.style.overflow = snapshot.bodyOverflow
  document.body.style.position = snapshot.bodyPosition
  document.body.style.top = snapshot.bodyTop
  document.body.style.left = snapshot.bodyLeft
  document.body.style.right = snapshot.bodyRight
  document.body.style.width = snapshot.bodyWidth
  document.documentElement.style.overflow = snapshot.documentOverflow
  if (snapshot.scrollX !== 0 || snapshot.scrollY !== 0) {
    try {
      window.scrollTo(snapshot.scrollX, snapshot.scrollY)
    } catch {
      // Some test environments expose scrollTo without implementing it.
    }
  }
}

export function useNativeModalDialog({
  dialogRef,
  initialFocusRef,
  lockBodyScroll = false,
  onCancel,
  onClick,
  onKeyDown,
  restoreFocus = true,
}: UseNativeModalDialogOptions) {
  const handleCancelEvent = useEffectEvent((event: Event) => {
    if (!onCancel) {
      event.preventDefault()
      return
    }

    onCancel(event)
  })
  const handleClickEvent = useEffectEvent((event: MouseEvent) => {
    onClick?.(event)
  })
  const handleKeyDownEvent = useEffectEvent((event: KeyboardEvent) => {
    onKeyDown?.(event)
  })

  useLayoutEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) {
      return undefined
    }

    const previousFocusedElement =
      document.activeElement instanceof HTMLElement ? document.activeElement : null

    openDialog(dialog)

    initialFocusRef?.current?.focus()

    return () => {
      closeDialog(dialog)

      if (restoreFocus) {
        previousFocusedElement?.focus()
      }
    }
  }, [dialogRef, initialFocusRef, restoreFocus])

  useEffect(() => {
    if (!lockBodyScroll) {
      return undefined
    }

    const lockToken = acquirePageScrollLock()

    return () => {
      releasePageScrollLock(lockToken)
    }
  }, [lockBodyScroll])

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) {
      return undefined
    }

    function handleCancel(event: Event) {
      handleCancelEvent(event)
    }

    dialog.addEventListener('cancel', handleCancel)
    return () => {
      dialog.removeEventListener('cancel', handleCancel)
    }
  }, [dialogRef])

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) {
      return undefined
    }

    function handleClick(event: MouseEvent) {
      handleClickEvent(event)
    }

    function handleKeyDown(event: KeyboardEvent) {
      handleKeyDownEvent(event)
    }

    dialog.addEventListener('click', handleClick)
    dialog.addEventListener('keydown', handleKeyDown)
    return () => {
      dialog.removeEventListener('click', handleClick)
      dialog.removeEventListener('keydown', handleKeyDown)
    }
  }, [dialogRef])

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog || typeof dialog.showModal === 'function') {
      return undefined
    }
    const fallbackDialog = dialog

    function handleFallbackEscape(event: KeyboardEvent) {
      if (event.key !== 'Escape' || getTopmostOpenDialog() !== fallbackDialog) {
        return
      }

      const cancelEvent = new Event('cancel', {cancelable: true})
      fallbackDialog.dispatchEvent(cancelEvent)
      if (cancelEvent.defaultPrevented) {
        event.preventDefault()
        event.stopPropagation()
      }
    }

    window.addEventListener('keydown', handleFallbackEscape, true)
    return () => {
      window.removeEventListener('keydown', handleFallbackEscape, true)
    }
  }, [dialogRef])
}
