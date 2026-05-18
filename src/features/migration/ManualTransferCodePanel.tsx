import {useState} from 'react'

import {FaClipboard} from 'react-icons/fa6'

interface ManualTransferCodePanelProps {
  transferCode: string
}

type CopyStatus = 'idle' | 'copied' | 'failed'

const SECONDARY_ACTION_CLASS =
  'inline-flex items-center gap-2 rounded border border-slate-500 bg-slate-800/70 px-3 py-1.5 text-sm text-slate-100 hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-50'

export function ManualTransferCodePanel({transferCode}: ManualTransferCodePanelProps) {
  const [copyStatus, setCopyStatus] = useState<CopyStatus>('idle')

  const copyTransferCode = async () => {
    try {
      await navigator.clipboard.writeText(transferCode)
      setCopyStatus('copied')
    } catch {
      setCopyStatus('failed')
    }
  }

  return (
    <div className='space-y-3 rounded border border-slate-700 bg-slate-950/35 p-3'>
      <div className='space-y-1'>
        <h3 className='text-base font-semibold text-slate-100'>Copy this transfer code</h3>
        <p className='text-sm text-slate-300'>
          Open skeydb.com, paste this code into the box there, then review the transfer.
        </p>
      </div>

      <label className='block text-sm font-medium text-slate-200' htmlFor='migration-snapshot'>
        Transfer code
      </label>
      <textarea
        className='min-h-40 w-full rounded border border-slate-600 bg-slate-950 p-3 font-mono text-xs text-slate-100'
        id='migration-snapshot'
        readOnly
        value={transferCode}
      />
      <div className='flex flex-wrap items-center gap-3'>
        <button
          className={SECONDARY_ACTION_CLASS}
          onClick={() => {
            void copyTransferCode()
          }}
          type='button'
        >
          <FaClipboard aria-hidden='true' />
          Copy code
        </button>
        {copyStatus === 'copied' ? (
          <p className='text-sm text-emerald-100'>Copied. Paste it on skeydb.com.</p>
        ) : null}
        {copyStatus === 'failed' ? (
          <p className='text-sm text-amber-100'>Select the code and copy it manually.</p>
        ) : null}
      </div>
      <p className='inline-flex items-center gap-2 text-xs text-slate-400'>
        <FaClipboard aria-hidden='true' />
        This code only contains SKeyDB data saved in this browser.
      </p>
    </div>
  )
}
