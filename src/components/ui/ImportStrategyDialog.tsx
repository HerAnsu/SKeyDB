import {ModalFrame} from '@/ui/modal/ModalFrame'

import {Button} from './Button'

interface ImportStrategyDialogProps {
  conflictSummary: string
  onCancel: () => void
  onMove: () => void
  onSkip: () => void
}

export function ImportStrategyDialog({
  conflictSummary,
  onCancel,
  onMove,
  onSkip,
}: ImportStrategyDialogProps) {
  return (
    <ModalFrame
      ariaLabel='Resolve import conflicts'
      onClose={onCancel}
      title='Resolve Import Conflicts'
    >
      <p className='text-sm text-[var(--ui-text-main)]'>{conflictSummary}</p>
      <p className='mt-2 text-xs text-[var(--ui-text-muted)]'>
        Move: remove duplicates from existing teams. Skip: keep existing teams and drop duplicates
        from import.
      </p>
      <div className='mt-4 flex flex-wrap justify-end gap-2 border-t border-[var(--ui-border-subtle)] pt-3'>
        <Button onClick={onCancel} variant='secondary'>
          Cancel
        </Button>
        <Button onClick={onSkip} variant='secondary'>
          Skip Duplicates
        </Button>
        <Button onClick={onMove} variant='primary'>
          Move To Imported Team
        </Button>
      </div>
    </ModalFrame>
  )
}
