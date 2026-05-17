import {useEffect, useMemo, useRef} from 'react'

import {useSearchParams} from 'react-router-dom'

import {getBrowserLocalStorage, type StorageLike} from '@/domain/storage'
import {
  isAllowedMigrationSourceOrigin,
  isAllowedMigrationTargetOrigin,
  type MigrationBridgeMessage,
} from '@/domain/storage-migration/migrationBridgeProtocol'
import {
  createDomainStorageMigrationSnapshot,
  type DomainStorageMigrationSnapshot,
} from '@/domain/storage-migration/storageMigrationSnapshot'

type MigrationMessageTarget = {
  postMessage: (message: MigrationBridgeMessage, targetOrigin: string) => void
} | null

interface MigrationExportPageProps {
  storage?: StorageLike | null
  locationLike?: Pick<Location, 'origin' | 'pathname'>
  messageTarget?: MigrationMessageTarget
  allowLocalOrigins?: boolean
}

type ExportStatus = 'sent' | 'manual' | 'error'

export function MigrationExportPage({
  storage = getBrowserLocalStorage(),
  locationLike = window.location,
  messageTarget,
  allowLocalOrigins = import.meta.env.DEV,
}: MigrationExportPageProps) {
  const [searchParams] = useSearchParams()
  const sentRequestKeyRef = useRef<string | null>(null)
  const nonce = searchParams.get('nonce') ?? ''
  const targetOrigin = searchParams.get('targetOrigin') ?? ''
  const targetAllowed = isAllowedMigrationTargetOrigin(targetOrigin, {allowLocalOrigins})
  const sourceAllowed = isAllowedMigrationSourceOrigin(locationLike.origin, {allowLocalOrigins})
  const resolvedMessageTarget = messageTarget === undefined ? getWindowOpener() : messageTarget
  const snapshot = useMemo<DomainStorageMigrationSnapshot | null>(() => {
    if (!storage) {
      return null
    }
    return createDomainStorageMigrationSnapshot(storage, locationLike)
  }, [storage, locationLike])
  const serializedSnapshot = snapshot ? JSON.stringify(snapshot) : ''
  const error = resolveExportError({nonce, snapshot, sourceAllowed, targetAllowed, targetOrigin})
  const status = resolveExportStatus(error, resolvedMessageTarget)

  useEffect(() => {
    const requestKey = `${nonce}:${targetOrigin}`
    if (sentRequestKeyRef.current === requestKey) {
      return
    }
    if (!nonce || !targetOrigin || !targetAllowed || !sourceAllowed || !resolvedMessageTarget) {
      return
    }

    sentRequestKeyRef.current = requestKey
    if (!snapshot) {
      const message: MigrationBridgeMessage = {
        type: 'skeydb:migration-error:v1',
        nonce,
        error: 'storage_unavailable',
      }
      resolvedMessageTarget.postMessage(message, targetOrigin)
      return
    }

    if (snapshot.entries.length === 0) {
      const message: MigrationBridgeMessage = {
        type: 'skeydb:migration-error:v1',
        nonce,
        error: 'snapshot_empty',
      }
      resolvedMessageTarget.postMessage(message, targetOrigin)
      return
    }

    const message: MigrationBridgeMessage = {
      type: 'skeydb:migration-snapshot:v1',
      nonce,
      snapshot,
    }
    resolvedMessageTarget.postMessage(message, targetOrigin)
  }, [nonce, resolvedMessageTarget, snapshot, sourceAllowed, targetAllowed, targetOrigin])

  return (
    <section className='mx-auto max-w-2xl space-y-4 px-2 py-8 text-slate-100'>
      <div className='space-y-2'>
        <h2 className='text-xl font-semibold'>SKeyDB domain transfer</h2>
        <p className='text-sm text-slate-300'>
          {status === 'sent'
            ? 'Transfer sent. Return to the new SKeyDB tab to review it.'
            : 'Preparing saved data for transfer.'}
        </p>
      </div>

      {error ? (
        <p className='rounded border border-rose-400/50 bg-rose-950/40 px-3 py-2 text-sm text-rose-100'>
          {error}
        </p>
      ) : null}

      {status === 'manual' && serializedSnapshot ? (
        <div className='space-y-2'>
          <label className='block text-sm font-medium text-slate-200' htmlFor='migration-snapshot'>
            Transfer code
          </label>
          <textarea
            className='min-h-40 w-full rounded border border-slate-600 bg-slate-950 p-3 font-mono text-xs text-slate-100'
            id='migration-snapshot'
            readOnly
            value={serializedSnapshot}
          />
        </div>
      ) : null}
    </section>
  )
}

function getWindowOpener(): MigrationMessageTarget {
  const opener: unknown = window.opener
  return isMigrationMessageTarget(opener) ? opener : null
}

function isMigrationMessageTarget(value: unknown): value is Exclude<MigrationMessageTarget, null> {
  return (
    !!value &&
    typeof value === 'object' &&
    'postMessage' in value &&
    typeof value.postMessage === 'function'
  )
}

function resolveExportError({
  nonce,
  snapshot,
  sourceAllowed,
  targetAllowed,
  targetOrigin,
}: {
  nonce: string
  snapshot: DomainStorageMigrationSnapshot | null
  sourceAllowed: boolean
  targetAllowed: boolean
  targetOrigin: string
}): string | null {
  if (!nonce || !targetOrigin) {
    return 'This transfer link is missing required details.'
  }
  if (!sourceAllowed) {
    return 'This transfer source is not allowed.'
  }
  if (!targetAllowed) {
    return 'This transfer target is not allowed.'
  }
  if (!snapshot) {
    return 'Saved data is unavailable in this browser.'
  }
  if (snapshot.entries.length === 0) {
    return 'No saved SKeyDB data was found on GitHub Pages.'
  }
  return null
}

function resolveExportStatus(
  error: string | null,
  messageTarget: MigrationMessageTarget,
): ExportStatus {
  if (error) {
    return 'error'
  }
  return messageTarget ? 'sent' : 'manual'
}
