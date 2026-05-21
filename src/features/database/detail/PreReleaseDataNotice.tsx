export const PRE_RELEASE_DATA_NOTICE_TEXT =
  'All scaling, text, and effects are based on pre-release information and may change before or after release.'

export function PreReleaseDataNotice() {
  return (
    <div className='mb-3 max-w-2xl border border-amber-500/30 bg-amber-950/20 px-3 py-2.5'>
      <p className='text-[11px] leading-relaxed text-amber-100/75'>
        <strong className='font-semibold text-amber-200/90'>Pre-release data:</strong>{' '}
        {PRE_RELEASE_DATA_NOTICE_TEXT}
      </p>
    </div>
  )
}
