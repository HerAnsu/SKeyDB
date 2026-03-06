import {ConfirmDialog} from '@/components/ui/ConfirmDialog';
import {BuilderTransferConfirmDialog} from '@/pages/builder/BuilderTransferConfirmDialog';

export interface BuilderConfirmDialogsProps {
  readonly deleteDialog: {
    readonly title: string;
    readonly message: string;
    readonly onConfirm: () => void;
  } | null;
  readonly onCancelDelete: () => void;
  readonly transferDialog: {
    readonly title: string;
    readonly message: string;
    readonly onConfirm: () => void;
  } | null;
  readonly onCancelTransfer: () => void;
  readonly resetDialog: {
    readonly title: string;
    readonly message: string;
    readonly onConfirm: () => void;
  } | null;
  readonly onCancelReset: () => void;
  readonly resetTeamDialog: {
    readonly title: string;
    readonly message: string;
    readonly onConfirm: () => void;
  } | null;
  readonly onCancelResetTeam: () => void;
}

export function BuilderConfirmDialogs({
  deleteDialog,
  onCancelDelete,
  transferDialog,
  onCancelTransfer,
  resetDialog,
  onCancelReset,
  resetTeamDialog,
  onCancelResetTeam,
}: BuilderConfirmDialogsProps) {
  return (
    <>
      {deleteDialog ? (
        <ConfirmDialog
          cancelLabel='Cancel'
          confirmLabel='Delete Team'
          message={deleteDialog.message}
          onCancel={onCancelDelete}
          onConfirm={deleteDialog.onConfirm}
          title={deleteDialog.title}
        />
      ) : null}
      <BuilderTransferConfirmDialog
        dialog={transferDialog}
        onCancel={onCancelTransfer}
      />
      {resetDialog ? (
        <ConfirmDialog
          cancelLabel='Cancel'
          confirmLabel='Reset'
          message={resetDialog.message}
          onCancel={onCancelReset}
          onConfirm={resetDialog.onConfirm}
          title={resetDialog.title}
          confirmVariant='danger'
        />
      ) : null}
      {resetTeamDialog ? (
        <ConfirmDialog
          cancelLabel='Cancel'
          confirmLabel='Reset Team'
          message={resetTeamDialog.message}
          onCancel={onCancelResetTeam}
          onConfirm={resetTeamDialog.onConfirm}
          title={resetTeamDialog.title}
          confirmVariant='danger'
        />
      ) : null}
    </>
  );
}
