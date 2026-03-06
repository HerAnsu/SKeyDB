import {ConfirmDialog} from '@/components/ui/ConfirmDialog';
import {ExportCodeDialog} from '@/components/ui/ExportCodeDialog';
import {ImportCodeDialog} from '@/components/ui/ImportCodeDialog';
import {ImportStrategyDialog} from '@/components/ui/ImportStrategyDialog';
import type {ImportConflict} from '@/pages/builder/import-planner';
import type {Team} from '@/pages/builder/types';

export interface BuilderImportExportDialogsProps {
  readonly isImportDialogOpen: boolean;
  readonly onCancelImport: () => void;
  readonly onSubmitImport: (code: string) => void;
  readonly pendingDuplicateOverrideImport: object | null;
  readonly onCancelDuplicateOverrideImport: () => void;
  readonly onConfirmDuplicateOverrideImport: () => void;
  readonly pendingReplaceImport: {
    readonly teams: readonly Team[];
    readonly activeTeamIndex: number;
  } | null;
  readonly onCancelReplaceImport: () => void;
  readonly onConfirmReplaceImport: () => void;
  readonly pendingStrategyImport: {
    readonly team: Team;
    readonly conflicts: readonly ImportConflict[];
  } | null;
  readonly pendingStrategyConflictSummary: string;
  readonly onCancelStrategyImport: () => void;
  readonly onMoveStrategyImport: () => void;
  readonly onSkipStrategyImport: () => void;
  readonly exportDialog: {
    readonly title: string;
    readonly code: string;
    readonly kind: 'standard' | 'ingame';
    readonly duplicateWarning?: string;
  } | null;
  readonly onCloseExportDialog: () => void;
}

const ingameSupportContactNote = (
  <>
    If something seems incorrect, PLEASE do let me know, @fjant(fjantsa) on
    discord.
    <br />
    Ping in maincord, university or send a DM.
  </>
);

function renderIngameImportWarning() {
  return (
    <p className='text-xs text-rose-300'>
      In-game `@@...@@` import is work in progress. Covenants and posse slots
      are NOT supported yet and will import as empty when using import codes
      from the game.
      <br />
      <br />
      {ingameSupportContactNote}
    </p>
  );
}

function renderIngameExportWarning() {
  return (
    <p className='text-xs text-rose-300'>
      In-game export is work in progress. Covenants and posses are NOT supported
      yet.
      <br />
      <br />
      {ingameSupportContactNote}
    </p>
  );
}

export function BuilderImportExportDialogs({
  isImportDialogOpen,
  onCancelImport,
  onSubmitImport,
  pendingDuplicateOverrideImport,
  onCancelDuplicateOverrideImport,
  onConfirmDuplicateOverrideImport,
  pendingReplaceImport,
  onCancelReplaceImport,
  onConfirmReplaceImport,
  pendingStrategyImport,
  pendingStrategyConflictSummary,
  onCancelStrategyImport,
  onMoveStrategyImport,
  onSkipStrategyImport,
  exportDialog,
  onCloseExportDialog,
}: BuilderImportExportDialogsProps) {
  return (
    <>
      {isImportDialogOpen ? (
        <ImportCodeDialog
          onCancel={onCancelImport}
          onSubmit={onSubmitImport}
          warning={renderIngameImportWarning()}
        />
      ) : null}

      {pendingReplaceImport ? (
        <ConfirmDialog
          cancelLabel='Cancel'
          confirmLabel='Replace'
          message='This import will replace your current builder setup.'
          onCancel={onCancelReplaceImport}
          onConfirm={onConfirmReplaceImport}
          title='Replace Current Teams?'
        />
      ) : null}

      {pendingDuplicateOverrideImport ? (
        <ConfirmDialog
          cancelLabel='Cancel'
          confirmLabel='Enable and Import'
          message='This import contains duplicate units, wheels, or posses. Enable Allow Dupes and continue?'
          onCancel={onCancelDuplicateOverrideImport}
          onConfirm={onConfirmDuplicateOverrideImport}
          title='Import Uses Duplicates'
        />
      ) : null}

      {pendingStrategyImport ? (
        <ImportStrategyDialog
          conflictSummary={pendingStrategyConflictSummary}
          onCancel={onCancelStrategyImport}
          onMove={onMoveStrategyImport}
          onSkip={onSkipStrategyImport}
        />
      ) : null}

      {exportDialog ? (
        <ExportCodeDialog
          code={exportDialog.code}
          helperText={
            exportDialog.kind === 'ingame'
              ? 'Copy this code and use it with the in-game team import feature.'
              : undefined
          }
          onClose={onCloseExportDialog}
          title={exportDialog.title}
          warning={
            exportDialog.kind === 'ingame' || exportDialog.duplicateWarning ? (
              <div className='space-y-2'>
                {exportDialog.kind === 'ingame'
                  ? renderIngameExportWarning()
                  : null}
                {exportDialog.duplicateWarning ? (
                  <p className='text-xs text-rose-300'>
                    {exportDialog.duplicateWarning}
                  </p>
                ) : null}
              </div>
            ) : undefined
          }
        />
      ) : null}
    </>
  );
}
