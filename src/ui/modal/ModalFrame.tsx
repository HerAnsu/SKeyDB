import {useCallback, useRef, type ReactNode} from 'react'

import {FaXmark} from 'react-icons/fa6'

import {useNativeModalDialog} from './useNativeModalDialog'

interface ModalFrameProps {
  title: string
  children: ReactNode
  footer?: ReactNode
  ariaLabel?: string
  onClose?: () => void
  overlayClassName?: string
  panelClassName?: string
}

export function ModalFrame({
  title,
  children,
  footer,
  ariaLabel,
  onClose,
  overlayClassName = 'ui-modal-overlay',
  panelClassName = 'ui-modal-panel max-w-xl',
}: ModalFrameProps) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const handleCancel = useCallback(
    (event: Event) => {
      if (!onClose) {
        event.preventDefault()
        return
      }

      event.preventDefault()
      onClose()
    },
    [onClose],
  )
  const handleDialogClick = useCallback(
    (event: MouseEvent) => {
      if (event.target === event.currentTarget) {
        onClose?.()
      }
    },
    [onClose],
  )
  useNativeModalDialog({
    dialogRef,
    onCancel: handleCancel,
    onClick: handleDialogClick,
  })

  return (
    <dialog
      aria-label={ariaLabel ?? title}
      className='m-0 h-dvh max-h-none w-screen max-w-none border-0 bg-transparent p-0 text-inherit open:block'
      data-modal-frame-dialog=''
      ref={dialogRef}
    >
      <div className={overlayClassName}>
        <div className={panelClassName}>
          <div className='mb-3 flex items-start justify-between gap-3 border-b border-[var(--ui-border-subtle)] pb-3'>
            <h4 className='ui-title text-lg text-[var(--ui-accent-gold-soft)] sm:text-xl'>
              {title}
            </h4>
            {onClose ? (
              <button
                aria-label='Close dialog'
                className='inline-flex size-8 shrink-0 items-center justify-center border border-[var(--ui-control-border-subtle)] bg-[var(--ui-control-surface)] text-[var(--ui-control-text)] transition-colors hover:border-[var(--ui-control-border-hover)] hover:text-[var(--ui-accent-gold-soft)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--ui-focus-ring)] motion-reduce:transition-none'
                onClick={onClose}
                type='button'
              >
                <FaXmark aria-hidden className='size-3.5' />
              </button>
            ) : null}
          </div>
          {children}
          {footer}
        </div>
      </div>
    </dialog>
  )
}
