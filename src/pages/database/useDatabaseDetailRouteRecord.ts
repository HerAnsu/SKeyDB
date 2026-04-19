import {useEffect, useState} from 'react'

import {useLocation, useNavigate} from 'react-router-dom'

interface UseDatabaseDetailRouteRecordOptions<TId, TRecord> {
  id: TId
  loadRecord: (id: TId) => Promise<TRecord | undefined>
  missingPathname: string
}

export function useDatabaseDetailRouteRecord<TId, TRecord>({
  id,
  loadRecord,
  missingPathname,
}: UseDatabaseDetailRouteRecordOptions<TId, TRecord>) {
  const location = useLocation()
  const navigate = useNavigate()
  const [record, setRecord] = useState<TRecord | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let isCancelled = false

    setIsLoading(true)
    setRecord(null)

    void loadRecord(id).then((nextRecord) => {
      if (isCancelled) {
        return
      }

      if (nextRecord) {
        setRecord(nextRecord)
        setIsLoading(false)
        return
      }

      setIsLoading(false)
      void navigate(
        {
          pathname: missingPathname,
          search: location.search,
        },
        {replace: true},
      )
    })

    return () => {
      isCancelled = true
    }
  }, [id, loadRecord, location.search, missingPathname, navigate])

  return {isLoading, record}
}
