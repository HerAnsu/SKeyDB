import {useEffect, useRef, useState, type ReactNode} from 'react'

import {ModalFrame} from '@/ui/modal/ModalFrame'

import {Button} from './Button'

interface ImportCodeDialogProps {
  initialValue?: string
  onCancel: () => void
  onSubmit: (code: string) => void
  warning?: ReactNode
}

export function ImportCodeDialog({
  initialValue = '',
  onCancel,
  onSubmit,
  warning,
}: ImportCodeDialogProps) {
  const [value, setValue] = useState(initialValue)
  const inputRef = useRef<HTMLTextAreaElement | null>(null)

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  return (
    <ModalFrame ariaLabel='Import teams' onClose={onCancel} title='Import Teams'>
      <p className='text-sm text-[var(--ui-text-main)]'>
        Paste a `t1.`, `mt1.` or `@@...@@` code to import.
      </p>
      {warning ? <div className='mt-2'>{warning}</div> : null}
      <textarea
        aria-label='Import code'
        className='ui-scrollbar mt-3 h-36 w-full resize-y border border-[var(--ui-control-border)] bg-[var(--ui-control-surface-strong)] p-2.5 text-xs text-[var(--ui-text-main)] transition-colors outline-none placeholder:text-[var(--ui-text-faint)] focus:border-[var(--ui-control-border-hover)] focus:ring-2 focus:ring-[var(--ui-focus-ring-support)] motion-reduce:transition-none'
        onChange={(event) => {
          setValue(event.target.value)
        }}
        onKeyDown={(event) => {
          if (event.key !== 'Enter' || event.shiftKey) {
            return
          }

          const trimmed = value.trim()
          if (!trimmed) {
            return
          }

          event.preventDefault()
          onSubmit(trimmed)
        }}
        placeholder='Paste import code here'
        ref={inputRef}
        value={value}
      />
      <div className='mt-4 flex justify-end gap-2 border-t border-[var(--ui-border-subtle)] pt-3'>
        <Button onClick={onCancel} variant='secondary'>
          Cancel
        </Button>
        <Button
          disabled={value.trim().length === 0}
          onClick={() => {
            onSubmit(value.trim())
          }}
          variant='primary'
        >
          Import
        </Button>
      </div>
    </ModalFrame>
  )
}
