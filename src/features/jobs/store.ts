import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Job, Quote, JobStatus, QuoteStatus } from '@/features/jobs/types'
import { mockJobs, mockQuotes } from '@/data/mock-jobs'

type JobStore = {
  jobs: Job[]
  quotes: Quote[]
  addJob: (data: Omit<Job, 'id' | 'createdAt' | 'status'>) => string
  addQuote: (data: Omit<Quote, 'id' | 'createdAt' | 'status'>) => void
  acceptQuote: (quoteId: string, jobId: string) => void
}

let jCounter = mockJobs.length + 1
let qCounter = mockQuotes.length + 1

export const useJobStore = create<JobStore>()(
  persist(
    (set) => ({
      jobs: mockJobs,
      quotes: mockQuotes,

      addJob: (data) => {
        const id = `j${jCounter++}`
        const job: Job = { ...data, id, status: 'open' as JobStatus, createdAt: new Date().toISOString() }
        set(s => ({ jobs: [job, ...s.jobs] }))
        return id
      },

      addQuote: (data) => {
        const id = `q${qCounter++}`
        const quote: Quote = { ...data, id, status: 'pending' as QuoteStatus, createdAt: new Date().toISOString() }
        set(s => ({ quotes: [...s.quotes, quote] }))
      },

      acceptQuote: (quoteId, jobId) => {
        set(s => ({
          quotes: s.quotes.map(q => ({
            ...q,
            status: (
              q.id === quoteId ? 'accepted'
              : q.jobId === jobId && q.status === 'pending' ? 'rejected'
              : q.status
            ) as QuoteStatus,
          })),
          jobs: s.jobs.map(j =>
            j.id === jobId ? { ...j, status: 'in_progress' as JobStatus } : j
          ),
        }))
      },
    }),
    { name: 'oficio-jobs' }
  )
)
