import {useCallback, useEffect, useMemo, useState} from 'react'

import {getBrowserLocalStorage, type StorageLike} from '@/domain/storage'
import {
  createLegacyMigrationExportUrl,
  createMigrationNonce,
  DEFAULT_LEGACY_MIGRATION_SOURCE_ORIGINS,
  isAllowedMigrationSourceOrigin,
  parseMigrationBridgeMessage,
  resolveLegacyMigrationExportUrlForCurrentOrigin,
} from '@/domain/storage-migration/migrationBridgeProtocol'
import {
  applyDomainStorageMigrationPlan,
  planDomainStorageMigration,
  type DomainStorageMigrationDecision,
  type DomainStorageMigrationPlan,
} from '@/domain/storage-migration/migrationImportPolicy'

interface MigrationReceivePageProps {
  storage?: StorageLike | null
  locationLike?: Pick<Location, 'origin' | 'hostname' | 'protocol' | 'port'>
  openWindow?: (url: string, target: string) => unknown
  createNonce?: () => string
  allowLocalOrigins?: boolean
  configuredLegacyExportUrl?: string
}

type ReceiveStatus = 'idle' | 'waiting' | 'ready' | 'complete' | 'error'

export function MigrationReceivePage({
  storage = getBrowserLocalStorage(),
  locationLike = window.location,
  openWindow = (url, target) => window.open(url, target),
  createNonce = createMigrationNonce,
  allowLocalOrigins = import.meta.env.DEV,
  configuredLegacyExportUrl = getConfiguredLegacyExportUrl(),
}: MigrationReceivePageProps) {
  const [status, setStatus] = useState<ReceiveStatus>('idle')
  const [nonce, setNonce] = useState<string | null>(null)
  const [plan, setPlan] = useState<DomainStorageMigrationPlan | null>(null)
  const [copyConflictKeys, setCopyConflictKeys] = useState<Set<string>>(() => new Set())
  const [error, setError] = useState<string | null>(null)
  const [manualPayload, setManualPayload] = useState('')
  const [fallbackExportUrl, setFallbackExportUrl] = useState<string | null>(null)
  const conflictItems = useMemo(
    () => plan?.items.filter((item) => item.status === 'conflict') ?? [],
    [plan],
  )

  const reviewSnapshot = useCallback(
    (snapshot: unknown) => {
      const nextPlan = planDomainStorageMigration(snapshot, storage)
      if (!nextPlan.ok) {
        setPlan(null)
        setCopyConflictKeys(new Set())
        setError('Transfer code is invalid.')
        setStatus('error')
        return
      }
      if (
        !isAllowedMigrationSourceOrigin(nextPlan.snapshot.sourceOrigin, {
          allowLocalOrigins,
        })
      ) {
        setPlan(null)
        setCopyConflictKeys(new Set())
        setError('Transfer code came from an unsupported source.')
        setStatus('error')
        return
      }

      setPlan(nextPlan)
      setError(null)
      setCopyConflictKeys(new Set())
      setStatus('ready')
    },
    [allowLocalOrigins, storage],
  )

  const startTransfer = useCallback(() => {
    const nextNonce = createNonce()
    const legacyExportUrl = resolveLegacyMigrationExportUrlForCurrentOrigin(
      locationLike,
      configuredLegacyExportUrl,
      import.meta.env.DEV,
    )
    const transferUrl = createLegacyMigrationExportUrl({
      nonce: nextNonce,
      targetOrigin: locationLike.origin,
      legacyExportUrl,
    })

    setNonce(nextNonce)
    setStatus('waiting')
    setPlan(null)
    setError(null)
    setCopyConflictKeys(new Set())
    setFallbackExportUrl(transferUrl)
    const openedWindow = openWindow(transferUrl, 'skeydb-domain-migration')
    if (!openedWindow) {
      setNonce(null)
      setError(
        'Could not open the GitHub Pages tab. Use the link below, then paste the transfer code here.',
      )
      setStatus('error')
    }
  }, [configuredLegacyExportUrl, createNonce, locationLike, openWindow])

  useEffect(() => {
    if (!nonce) {
      return
    }

    const handleMessage = (event: MessageEvent) => {
      const message = parseMigrationBridgeMessage(event.data, {
        expectedNonce: nonce,
        eventOrigin: event.origin,
        allowedOrigins: DEFAULT_LEGACY_MIGRATION_SOURCE_ORIGINS,
        allowLocalOrigins,
      })
      if (!message) {
        return
      }

      if (message.type === 'skeydb:migration-error:v1') {
        setError(resolveBridgeErrorMessage(message.error))
        setNonce(null)
        setStatus('error')
        return
      }

      if (message.type !== 'skeydb:migration-snapshot:v1') {
        return
      }

      reviewSnapshot(message.snapshot)
      setNonce(null)
    }

    window.addEventListener('message', handleMessage)
    return () => {
      window.removeEventListener('message', handleMessage)
    }
  }, [allowLocalOrigins, nonce, reviewSnapshot])

  const reviewManualPayload = () => {
    try {
      reviewSnapshot(JSON.parse(manualPayload))
      setNonce(null)
    } catch {
      setPlan(null)
      setCopyConflictKeys(new Set())
      setNonce(null)
      setError('Transfer code is invalid.')
      setStatus('error')
    }
  }

  const applyMigration = () => {
    if (!plan) {
      return
    }

    const decisions = Object.fromEntries(
      conflictItems.map((item) => [
        item.key,
        copyConflictKeys.has(item.key) ? 'copy-source' : 'keep-target',
      ]),
    ) as Record<string, DomainStorageMigrationDecision>
    const result = applyDomainStorageMigrationPlan(plan, storage, decisions)

    if (!result.ok) {
      setError(resolveApplyErrorMessage(result.error, result.key))
      setStatus('error')
      return
    }

    setStatus('complete')
    setNonce(null)
  }

  return (
    <section className='mx-auto max-w-3xl space-y-5 px-2 py-8 text-slate-100'>
      <div className='space-y-2'>
        <h2 className='text-xl font-semibold'>SKeyDB domain transfer</h2>
        <p className='text-sm text-slate-300'>
          Bring over saved Builder and Collection data from GitHub Pages.
        </p>
      </div>

      <button
        className='rounded border border-cyan-300/50 bg-cyan-400/15 px-4 py-2 text-sm font-semibold text-cyan-100 hover:bg-cyan-400/25'
        onClick={startTransfer}
        type='button'
      >
        Start transfer
      </button>

      <div className='space-y-2'>
        <label className='block text-sm font-medium text-slate-200' htmlFor='manual-payload'>
          Transfer code
        </label>
        <textarea
          className='min-h-28 w-full rounded border border-slate-600 bg-slate-950 p-3 font-mono text-xs text-slate-100'
          id='manual-payload'
          onChange={(event) => {
            setManualPayload(event.target.value)
          }}
          value={manualPayload}
        />
        <button
          className='rounded border border-slate-500 bg-slate-800/70 px-3 py-1.5 text-sm text-slate-100 hover:bg-slate-700'
          disabled={!manualPayload.trim()}
          onClick={reviewManualPayload}
          type='button'
        >
          Review transfer code
        </button>
      </div>

      {status === 'waiting' ? (
        <p className='text-sm text-slate-300'>Waiting for the GitHub Pages tab...</p>
      ) : null}

      {error ? (
        <p className='rounded border border-rose-400/50 bg-rose-950/40 px-3 py-2 text-sm text-rose-100'>
          {error}
        </p>
      ) : null}

      {fallbackExportUrl && (status === 'waiting' || status === 'error') ? (
        <p className='text-sm text-slate-300'>
          <a
            className='font-semibold text-cyan-100 underline decoration-cyan-200/60 underline-offset-4 hover:text-cyan-50'
            href={fallbackExportUrl}
            rel='noreferrer'
            target='_blank'
          >
            Open GitHub Pages transfer page
          </a>
        </p>
      ) : null}

      {plan && status === 'ready' ? (
        <div className='space-y-4'>
          <dl className='grid grid-cols-3 gap-2 text-sm'>
            <SummaryItem label='New' value={plan.summary.copy} />
            <SummaryItem label='Same' value={plan.summary.unchanged} />
            <SummaryItem label='Review' value={plan.summary.conflict} />
          </dl>

          {conflictItems.length ? (
            <fieldset className='space-y-2 rounded border border-slate-600 p-3'>
              <legend className='px-1 text-sm font-medium text-slate-200'>Existing data</legend>
              {conflictItems.map((item) => (
                <label className='flex items-center gap-2 text-sm text-slate-200' key={item.key}>
                  <input
                    checked={copyConflictKeys.has(item.key)}
                    onChange={(event) => {
                      setCopyConflictKeys((current) => {
                        const next = new Set(current)
                        if (event.target.checked) {
                          next.add(item.key)
                        } else {
                          next.delete(item.key)
                        }
                        return next
                      })
                    }}
                    type='checkbox'
                  />
                  <span>Replace {item.key}</span>
                </label>
              ))}
            </fieldset>
          ) : null}

          <button
            className='rounded border border-emerald-300/50 bg-emerald-400/15 px-4 py-2 text-sm font-semibold text-emerald-100 hover:bg-emerald-400/25'
            onClick={applyMigration}
            type='button'
          >
            Apply transfer
          </button>
        </div>
      ) : null}

      {status === 'complete' ? (
        <p className='rounded border border-emerald-300/50 bg-emerald-950/35 px-3 py-2 text-sm text-emerald-100'>
          Transfer complete. Refresh SKeyDB if the current view was already open.
        </p>
      ) : null}
    </section>
  )
}

function SummaryItem({label, value}: {label: string; value: number}) {
  return (
    <div className='rounded border border-slate-700 bg-slate-950/40 px-3 py-2'>
      <dt className='text-xs text-slate-400 uppercase'>{label}</dt>
      <dd className='text-lg font-semibold text-slate-100'>{value}</dd>
    </div>
  )
}

function getConfiguredLegacyExportUrl(): string | undefined {
  const configuredUrl: unknown = import.meta.env.VITE_SKEYDB_LEGACY_MIGRATION_URL
  return typeof configuredUrl === 'string' ? configuredUrl : undefined
}

function resolveBridgeErrorMessage(
  error: 'storage_unavailable' | 'snapshot_empty' | 'invalid_target_origin',
): string {
  if (error === 'storage_unavailable') {
    return 'GitHub Pages storage is unavailable in this browser.'
  }
  if (error === 'snapshot_empty') {
    return 'No saved SKeyDB data was found on GitHub Pages.'
  }
  return 'The migration target was rejected.'
}

function resolveApplyErrorMessage(error: string, key: string | undefined): string {
  if (error === 'storage_unavailable') {
    return 'Local storage is unavailable on this domain.'
  }
  if (error === 'backup_failed') {
    return 'Could not create a backup before writing the transfer.'
  }
  if (error === 'write_failed') {
    return key ? `Could not write ${key}.` : 'Could not write the transfer.'
  }
  return 'Could not apply the transfer.'
}
