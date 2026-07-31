import { useNavigate } from 'react-router-dom'
import { Footer } from '@/shared/components'

type LegalLayoutProps = {
  title: string
  updated: string
  children: React.ReactNode
}

/** Marco común de las páginas legales: header con volver, columna de lectura y footer. */
export function LegalLayout({ title, updated, children }: LegalLayoutProps) {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--color-noche)' }}>
      <header
        className="fixed top-0 w-full z-50 flex items-center gap-3 px-5 h-16 border-b backdrop-blur-xl"
        style={{ backgroundColor: 'rgba(255,255,255,0.85)', borderColor: 'var(--color-line)' }}
      >
        <button
          onClick={() => navigate(-1)}
          className="w-9 h-9 flex items-center justify-center rounded-xl active:scale-90 transition-all"
          style={{ backgroundColor: 'var(--color-noche)', color: 'var(--color-nieve)' }}
          aria-label="Volver"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5M12 5l-7 7 7 7" />
          </svg>
        </button>
        <p className="font-black text-sm" style={{ color: 'var(--color-nieve)', letterSpacing: '-0.01em' }}>{title}</p>
      </header>

      <main className="pt-24 pb-4 px-6 max-w-2xl mx-auto">
        <h1 className="text-3xl font-black mb-2" style={{ color: 'var(--color-nieve)', letterSpacing: '-0.03em', fontFamily: 'var(--font-display)' }}>
          {title}
        </h1>
        <p className="text-xs mb-10" style={{ color: 'var(--color-muted)' }}>Última actualización: {updated}</p>
        <div className="space-y-7">{children}</div>
      </main>

      <Footer />
    </div>
  )
}

export function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="font-bold text-base mb-2" style={{ color: 'var(--color-nieve)' }}>{title}</h2>
      <div className="text-sm leading-relaxed space-y-3" style={{ color: 'var(--color-muted)' }}>{children}</div>
    </section>
  )
}
