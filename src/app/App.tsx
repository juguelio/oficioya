import { Suspense } from 'react'
import { RouterProvider } from 'react-router-dom'
import { router } from './Router'

function PageSkeleton() {
  return (
    <div className="min-h-screen bg-[--color-noche] p-4 space-y-4 max-w-lg mx-auto pt-16">
      <div className="animate-pulse rounded-[--radius-lg] bg-[--color-sombra] h-12 w-2/3" />
      <div className="animate-pulse rounded-[--radius-lg] bg-[--color-sombra] h-6 w-1/2" />
      <div className="grid grid-cols-2 gap-3 pt-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="animate-pulse rounded-[--radius-lg] bg-[--color-sombra] h-20" />
        ))}
      </div>
    </div>
  )
}

export function App() {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <RouterProvider router={router} />
    </Suspense>
  )
}
