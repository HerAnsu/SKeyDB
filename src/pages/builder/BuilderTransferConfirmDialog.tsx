import {ConfirmDialog} from '@/components/ui/ConfirmDialog';

export interface BuilderTransferConfirmDialogProps {
  readonly dialog: {
    readonly title: string;
    readonly message: string;
    readonly supportLabel?: string;
    readonly onSupport?: () => void;
    readonly onConfirm: () => void;
  } | null;
  readonly onCancel: () => void;
}

export function BuilderTransferConfirmDialog({
  dialog,
  onCancel,
}: BuilderTransferConfirmDialogProps) {
  if (!dialog) {
    return null;
  }

  return (
    <ConfirmDialog
      cancelLabel='Cancel'
      confirmLabel={dialog.supportLabel ? 'Move Instead' : 'Move'}
      message={dialog.message}
      onCancel={onCancel}
      onConfirm={dialog.onConfirm}
      onSecondary={dialog.onSupport}
      secondaryLabel={dialog.supportLabel}
      title={dialog.title}
    />
  );
}
