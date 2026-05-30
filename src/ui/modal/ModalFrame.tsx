import {useRef, type ReactNode} from 'react'

import {useNativeModalDialog} from './useNativeModalDialog'

interface ModalFrameProps {
  title: string
  children: ReactNode
  footer?: ReactNode
  ariaLabel?: string
  overlayClassName?: string
  panelClassName?: string
}

export function ModalFrame({
  title,
  children,
  footer,
  ariaLabel,
  overlayClassName = 'fixed inset-0 z-[900] flex items-center justify-center bg-slate-950/55 px-4 pointer-events-auto',
  panelClassName = 'relative z-[901] w-full max-w-lg border border-amber-200/55 bg-slate-950/96 p-4 shadow-[0_18px_50px_rgba(2,6,23,0.72)]',
}: ModalFrameProps) {
  const dialogRef = useRef<HTMLDialogElement>(null)

  useNativeModalDialog({dialogRef})

  return (
    <dialog
      aria-label={ariaLabel ?? title}
      className='m-0 h-dvh max-h-none w-screen max-w-none border-0 bg-transparent p-0 text-inherit open:block'
      data-modal-frame-dialog=''
      ref={dialogRef}
    >
      <div className={overlayClassName}>
        <div className={panelClassName}>
          <h4 className='ui-title text-xl text-amber-100'>{title}</h4>
          {children}
          {footer}
        </div>
      </div>
    </dialog>
  )
}
