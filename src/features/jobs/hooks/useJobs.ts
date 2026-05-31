import { useMemo } from 'react'
import { useJobStore } from '@/features/jobs/store'
import type { CiudadId, RubroId } from '@/design-system/tokens'
import type { Job } from '@/features/jobs/types'

type UseJobsFilters = {
  ciudad?: CiudadId | null
  rubro?: RubroId | null
  status?: Job['status']
}

export function useJobs(filters: UseJobsFilters = {}) {
  const allJobs   = useJobStore(s => s.jobs)
  const allQuotes = useJobStore(s => s.quotes)

  const jobs = useMemo(() => {
    let result = allJobs
    if (filters.ciudad) result = result.filter(j => j.ciudad === filters.ciudad)
    if (filters.rubro)  result = result.filter(j => j.rubro === filters.rubro)
    if (filters.status) result = result.filter(j => j.status === filters.status)
    return [...result].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )
  }, [allJobs, filters.ciudad, filters.rubro, filters.status])

  const quoteCountByJob = useMemo<Record<string, number>>(() => {
    const counts: Record<string, number> = {}
    for (const q of allQuotes) {
      counts[q.jobId] = (counts[q.jobId] ?? 0) + 1
    }
    return counts
  }, [allQuotes])

  return { jobs, quoteCountByJob, total: jobs.length }
}

export function useJob(jobId: string) {
  const job    = useJobStore(s => s.jobs.find(j => j.id === jobId))
  const quotes = useJobStore(s =>
    s.quotes.filter(q => q.jobId === jobId)
             .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  )
  return { job, quotes }
}
