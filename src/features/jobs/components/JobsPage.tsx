import { useState, useMemo } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { ciudades, rubros } from '@/design-system/tokens'
import { useCityStore } from '@/features/search/store'
import { useJobStore } from '@/features/jobs/store'
import { useJobs } from '@/features/jobs/hooks'
import { Logo } from '@/shared/components'
import { cn } from '@/shared/utils/cn'
import { formatARS } from '@/shared/utils/formatARS'
import type { CiudadId, RubroId } from '@/design-system/tokens'
import type { Job } from '@/features/jobs/types'

function timeAgo(iso: string): string {
  const diff  = Date.now() - new Date(iso).getTime()
  const mins  = Math.floor(diff / 60000)
  if (mins < 60)  return `hace ${mins}m`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `hace ${hours}h`
  return `hace ${Math.floor(hours / 24)}d`
}

const STATUS_LABEL: Record<Job['status'], string> = {
  open:        'Abierto',
  in_progress: 'En proceso',
  closed:      'Cerrado',
}
const STATUS_COLOR: Record<Job['status'], string> = {
  open:        'var(--color-bosque-lt)',
  in_progress: '#E8A020',
  closed:      'var(--color-muted)',
}

const RUBRO_MAP = Object.fromEntries(rubros.map(r => [r.id, r]))

// ─── JobsPage ─────────────────────────────────────────────────────────────────

export function JobsPage() {
  const ciudadId  = useCityStore(s => s.ciudadId)
  const setCiudad = useCityStore(s => s.setCiudad)
  const navigate  = useNavigate()

  const [rubroFilter, setRubroFilter] = useState<RubroId | null>(null)

  // Para calcular rubros activos usamos todos los jobs de la ciudad (sin filtro de rubro)
  const allJobsInCity = useJobStore(s =>
    ciudadId ? s.jobs.filter(j => j.ciudad === ciudadId) : s.jobs
  )

  const activeRubros = useMemo(() => {
    const ids = new Set(allJobsInCity.map(j => j.rubro))
    return rubros.filter(r => ids.has(r.id as RubroId))
  }, [allJobsInCity])

  const { jobs, quoteCountByJob } = useJobs({
    ciudad: ciudadId,
    rubro:  rubroFilter,
  })

  const ciudadData = ciudades.find(c => c.id === ciudadId)

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--color-noche)' }}>

      {/* ── Header ─────────────────────────────────────────────────────────────── */}
      <header
        className="fixed top-0 w-full z-50 flex items-center justify-between px-5 h-14 border-b"
        style={{ backgroundColor: 'var(--color-sombra)', borderColor: 'var(--color-line)' }}
      >
        <button onClick={() => navigate('/')} className="active:scale-95 transition-transform" aria-label="Inicio">
          <Logo size={26} withWordmark />
        </button>
        <Link
          to="/trabajos/nuevo"
          className="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full text-white active:scale-95 transition-all"
          style={{ backgroundColor: 'var(--color-bosque-lt)' }}
        >
          <span className="text-base leading-none font-black">+</span> Publicar
        </Link>
      </header>

      <main className="pt-14 pb-28">

        {/* ── Ciudad selector ──────────────────────────────────────────────────── */}
        <section className="px-5 pt-5 pb-1">
          <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: 'var(--color-muted)' }}>
            {ciudadId ? 'Trabajos en' : '¿En qué ciudad?'}
          </p>
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
            {ciudades.map(c => (
              <button
                key={c.id}
                onClick={() => { setCiudad(c.id as CiudadId); setRubroFilter(null) }}
                className="px-4 py-2.5 rounded-xl text-sm font-bold whitespace-nowrap transition-all shrink-0 border active:scale-95"
                style={
                  ciudadId === c.id
                    ? { backgroundColor: 'var(--color-bosque-lt)', borderColor: 'var(--color-bosque-lt)', color: '#fff' }
                    : { backgroundColor: 'var(--color-sombra)', borderColor: 'var(--color-line)', color: 'var(--color-muted)' }
                }
              >
                {c.label}
              </button>
            ))}
          </div>
        </section>

        {/* ── Rubro filter chips ────────────────────────────────────────────────── */}
        {ciudadId && activeRubros.length > 0 && (
          <section className="px-5 pt-3 pb-1">
            <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
              <button
                onClick={() => setRubroFilter(null)}
                className="px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap shrink-0 border transition-all active:scale-95"
                style={
                  !rubroFilter
                    ? { backgroundColor: 'var(--color-nieve)', borderColor: 'var(--color-nieve)', color: 'var(--color-sombra)' }
                    : { backgroundColor: 'var(--color-sombra)', borderColor: 'var(--color-line)', color: 'var(--color-muted)' }
                }
              >
                Todos
              </button>
              {activeRubros.map(r => (
                <button
                  key={r.id}
                  onClick={() => setRubroFilter(rubroFilter === r.id ? null : r.id as RubroId)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap shrink-0 border transition-all active:scale-95"
                  style={
                    rubroFilter === r.id
                      ? { backgroundColor: 'var(--color-bosque-lt)', borderColor: 'var(--color-bosque-lt)', color: '#fff' }
                      : { backgroundColor: 'var(--color-sombra)', borderColor: 'var(--color-line)', color: 'var(--color-muted)' }
                  }
                >
                  <span>{r.icon}</span> {r.label}
                </button>
              ))}
            </div>
          </section>
        )}

        {/* ── Lista ─────────────────────────────────────────────────────────────── */}
        <section className="px-5 pt-5">
          {ciudadId ? (
            <>
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-black text-lg" style={{ color: 'var(--color-nieve)', letterSpacing: '-0.02em' }}>
                  {rubroFilter
                    ? `${RUBRO_MAP[rubroFilter]?.label ?? ''} en ${ciudadData?.label}`
                    : `Trabajos en ${ciudadData?.label}`
                  }
                </h2>
                <span className="text-xs font-black" style={{ color: 'var(--color-bosque-lt)', fontFamily: 'var(--font-mono)' }}>
                  {jobs.length}
                </span>
              </div>

              {jobs.length > 0 ? (
                <div className="space-y-3">
                  {jobs.map(j => (
                    <JobCard
                      key={j.id}
                      job={j}
                      quotesCount={quoteCountByJob[j.id] ?? 0}
                      onPress={() => navigate(`/trabajos/${j.id}`)}
                    />
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center py-16 text-center">
                  <span className="text-5xl mb-4">📋</span>
                  <p className="font-bold text-base mb-1" style={{ color: 'var(--color-nieve)' }}>
                    Sin trabajos publicados
                  </p>
                  <p className="text-sm mb-6" style={{ color: 'var(--color-muted)' }}>
                    Sé el primero en publicar un trabajo en {ciudadData?.label}
                  </p>
                  <Link
                    to="/trabajos/nuevo"
                    className="px-6 py-3 rounded-full font-bold text-sm text-white active:scale-95 transition-all"
                    style={{ backgroundColor: 'var(--color-bosque-lt)' }}
                  >
                    Publicar trabajo
                  </Link>
                </div>
              )}
            </>
          ) : (
            <div className="flex flex-col items-center py-16 text-center">
              <span className="text-5xl mb-4">🏔️</span>
              <p className="font-bold text-base mb-1" style={{ color: 'var(--color-nieve)' }}>
                Elegí tu ciudad
              </p>
              <p className="text-sm" style={{ color: 'var(--color-muted)' }}>
                Para ver los trabajos disponibles y publicar el tuyo
              </p>
            </div>
          )}
        </section>

      </main>

      {/* ── Bottom Nav ─────────────────────────────────────────────────────────── */}
      <nav
        className="fixed bottom-0 left-0 w-full z-50 flex justify-around items-center px-4 py-2 border-t"
        style={{ backgroundColor: 'var(--color-sombra)', borderColor: 'var(--color-line)' }}
      >
        <NavTab icon={<IconExplore />} label="Explorar" onClick={() => navigate('/')} />
        <button
          onClick={() => navigate('/emergencias')}
          className="flex flex-col items-center gap-1 active:scale-90 transition-all"
        >
          <span
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider"
            style={{ backgroundColor: 'var(--color-emergency)', color: '#fff' }}
          >
            <span className="w-1.5 h-1.5 bg-white/80 rounded-full animate-pulse" />
            Urgencias
          </span>
        </button>
        <NavTab icon={<IconBriefcase active />} label="Trabajos" active />
        <Link
          to="/planes"
          className="flex flex-col items-center gap-1 active:scale-90 transition-all"
          style={{ color: 'var(--color-muted)' }}
        >
          <IconPerson />
          <span className="text-[10px] font-semibold uppercase tracking-widest">Prestador</span>
        </Link>
      </nav>

    </div>
  )
}

// ─── JobCard ──────────────────────────────────────────────────────────────────

type JobCardProps = { job: Job; quotesCount: number; onPress: () => void }

function JobCard({ job, quotesCount, onPress }: JobCardProps) {
  const rubro = RUBRO_MAP[job.rubro]

  return (
    <button
      onClick={onPress}
      className={cn('w-full text-left rounded-xl border active:scale-[0.99] transition-all overflow-hidden')}
      style={{ backgroundColor: 'var(--color-sombra)', borderColor: 'var(--color-line)' }}
    >
      <div className="p-4">
        <div className="flex items-center gap-2 mb-2 flex-wrap">
          <span
            className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider"
            style={{ backgroundColor: 'var(--color-brand-tint)', color: 'var(--color-bosque-lt)' }}
          >
            {rubro?.icon} {rubro?.label}
          </span>
          <span
            className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full"
            style={{ color: STATUS_COLOR[job.status], backgroundColor: 'rgba(0,0,0,0.05)' }}
          >
            {STATUS_LABEL[job.status]}
          </span>
          <span className="ml-auto text-[10px]" style={{ color: 'var(--color-muted)' }}>
            {timeAgo(job.createdAt)}
          </span>
        </div>
        <p className="font-bold text-sm leading-tight mb-1 line-clamp-1" style={{ color: 'var(--color-nieve)' }}>
          {job.title}
        </p>
        <p className="text-xs leading-relaxed line-clamp-2" style={{ color: 'var(--color-muted)' }}>
          {job.description}
        </p>
      </div>

      <div
        className="flex items-center gap-3 px-4 py-2.5 border-t"
        style={{ borderColor: 'var(--color-line)', backgroundColor: 'rgba(0,0,0,0.02)' }}
      >
        <span className="flex items-center gap-1 text-xs" style={{ color: 'var(--color-muted)' }}>
          <IconPin />
          {job.barrio ? `${job.barrio}, ` : ''}{ciudades.find(c => c.id === job.ciudad)?.label?.split(' ')[0]}
        </span>

        {(job.budgetMin || job.budgetMax) && (
          <span className="text-xs font-bold" style={{ color: 'var(--color-nieve)', fontFamily: 'var(--font-mono)' }}>
            {job.budgetMin && job.budgetMax
              ? `${formatARS(job.budgetMin)} – ${formatARS(job.budgetMax)}`
              : job.budgetMax
              ? `hasta ${formatARS(job.budgetMax)}`
              : `desde ${formatARS(job.budgetMin!)}`}
          </span>
        )}

        <span
          className="ml-auto flex items-center gap-1 text-xs font-bold"
          style={{ color: quotesCount > 0 ? 'var(--color-bosque-lt)' : 'var(--color-muted)' }}
        >
          <IconChat />
          {quotesCount > 0 ? `${quotesCount} presupuesto${quotesCount !== 1 ? 's' : ''}` : 'Sin presupuestos'}
        </span>
      </div>
    </button>
  )
}

// ─── NavTab ───────────────────────────────────────────────────────────────────

type NavTabProps = { icon: React.ReactNode; label: string; active?: boolean; onClick?: () => void }
function NavTab({ icon, label, active = false, onClick }: NavTabProps) {
  return (
    <button onClick={onClick} className="flex flex-col items-center gap-1 px-3 py-1 rounded-xl transition-all active:scale-90" style={{ color: active ? 'var(--color-bosque-lt)' : 'var(--color-muted)' }}>
      {icon}
      <span className="text-[10px] font-semibold uppercase tracking-widest">{label}</span>
    </button>
  )
}

// ─── Icons ────────────────────────────────────────────────────────────────────

function IconExplore() {
  return <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"/></svg>
}
function IconBriefcase({ active = false }: { active?: boolean }) {
  return <svg width="22" height="22" viewBox="0 0 24 24" fill={active ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>
}
function IconPerson() {
  return <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
}
function IconPin() {
  return <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg>
}
function IconChat() {
  return <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z"/></svg>
}
