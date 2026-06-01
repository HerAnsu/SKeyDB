import {ModalFrame} from '@/ui/modal/ModalFrame'

import {Button, type ButtonVariant} from './Button'

interface ConfirmDialogProps {
  title: string
  message: string
  confirmLabel?: string
  cancelLabel?: string
  secondaryLabel?: string
  onConfirm: () => void
  onCancel: () => void
  onSecondary?: () => void
  overlayClassName?: string
  dialogClassName?: string
  confirmVariant?: ButtonVariant
}

export function ConfirmDialog({
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  secondaryLabel,
  onConfirm,
  onCancel,
  onSecondary,
  overlayClassName = 'ui-modal-overlay',
  dialogClassName = 'ui-modal-panel max-w-md',
  confirmVariant = 'primary',
}: ConfirmDialogProps) {
  return (
    <ModalFrame
      onClose={onCancel}
      overlayClassName={overlayClassName}
      panelClassName={dialogClassName}
      title={title}
    >
      <p className='text-sm text-[var(--ui-text-main)]'>{message}</p>
      <div className='mt-4 flex justify-end gap-2 border-t border-[var(--ui-border-subtle)] pt-3'>
        <Button onClick={onCancel} variant='secondary'>
          {cancelLabel}
        </Button>
        {secondaryLabel && onSecondary ? (
          <Button onClick={onSecondary} variant='secondary'>
            {secondaryLabel}
          </Button>
        ) : null}
        <Button onClick={onConfirm} variant={confirmVariant}>
          {confirmLabel}
        </Button>
      </div>
    </ModalFrame>
  )
}
