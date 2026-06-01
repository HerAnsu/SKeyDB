import {useEffect, useRef, type ReactNode} from 'react'

import {ModalFrame} from '@/ui/modal/ModalFrame'

import {Button} from './Button'

interface ExportCodeDialogProps {
  title: string
  code: string
  onClose: () => void
  warning?: ReactNode
  helperText?: string
}

export function ExportCodeDialog({
  title,
  code,
  onClose,
  warning,
  helperText,
}: ExportCodeDialogProps) {
  const inputRef = useRef<HTMLTextAreaElement | null>(null)

  useEffect(() => {
    inputRef.current?.focus()
    inputRef.current?.select()
  }, [])

  return (
    <ModalFrame onClose={onClose} title={title}>
      <p className='text-sm text-[var(--ui-text-main)]'>
        {helperText ?? 'Copy this code to share/import later.'}
      </p>
      {warning ? <div className='mt-2'>{warning}</div> : null}
      <textarea
        aria-label='Export code'
        className='ui-scrollbar mt-3 h-28 w-full resize-none border border-[var(--ui-control-border)] bg-[var(--ui-control-surface-strong)] p-2.5 text-xs text-[var(--ui-text-main)] transition-colors outline-none focus:border-[var(--ui-control-border-hover)] focus:ring-2 focus:ring-[var(--ui-focus-ring-support)] motion-reduce:transition-none'
        readOnly
        ref={inputRef}
        value={code}
      />
      <div className='mt-4 flex justify-end gap-2 border-t border-[var(--ui-border-subtle)] pt-3'>
        <Button onClick={onClose} variant='primary'>
          Close
        </Button>
      </div>
    </ModalFrame>
  )
}
