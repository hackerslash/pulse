import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { api, type Incident, type Monitor, type MonitorView } from './api'
import { duration, ms, pct, since } from './format'
import { MonitorCard } from './MonitorCard'
import { MonitorDetail } from './MonitorDetail'
import { MonitorForm } from './MonitorForm'
import { WebhooksPanel } from './WebhooksPanel'
import { Icon, Modal, useToasts } from './ui'

type Filter = 'all' | 'up' | 'down' | 'paused'

export function App() {
  const [views, setViews] = useState<MonitorView[] | null>(null)
  const [incidents, setIncidents] = useState<Incident[]>([])
  const [offline, setOffline] = useState(false)
  const [now, setNow] = useState(Date.now())
  const [form, setForm] = useState<{ edit?: Monitor } | null>(null)
  const [detailId, setDetailId] = useState<number | null>(null)
  const [hooksOpen, setHooksOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState<Filter>('all')
  const search = useRef<HTMLInputElement>(null)
  const toast = useToasts()

  const refresh = useCallback(async () => {
    try {
      const [v, i] = await Promise.all([api.monitors(), api.incidents()])
      setViews(v)
      setIncidents(i)
      setOffline(false)
    } catch {
      setOffline(true)
    }
  }, [])

  useEffect(() => {
    refresh()
    const poll = setInterval(refresh, 5000)
    const clock = setInterval(() => setNow(Date.now()), 1000)
    return () => { clearInterval(poll); clearInterval(clock) }
  }, [refresh])

  useEffect(() => {
    const move = (e: PointerEvent) => {
      const el = (e.target as Element).closest?.('.spot') as HTMLElement | null
      if (!el) return
      const r = el.getBoundingClientRect()
      el.style.setProperty('--mx', `${e.clientX - r.left}px`)
      el.style.setProperty('--my', `${e.clientY - r.top}px`)
    }
    const key = (e: KeyboardEvent) => {
      if (document.querySelector('dialog[open]') || (e.target as Element).matches('input, textarea')) return
      if (e.key === 'n') { e.preventDefault(); setForm({}) }
      if (e.key === '/') { e.preventDefault(); search.current?.focus() }
    }
    window.addEventListener('pointermove', move)
    window.addEventListener('keydown', key)
    return () => { window.removeEventListener('pointermove', move); window.removeEventListener('keydown', key) }
  }, [])

  const stats = useMemo(() => {
    const list = views ?? []
    const active = list.filter(v => !v.monitor.paused)
    const uptimes = active.map(v => v.uptime24h).filter((x): x is number => x != null)
    const lat = active.map(v => v.avgMs24h).filter((x): x is number => x != null)
    return {
      total: list.length,
      up: active.filter(v => v.monitor.status === 'UP').length,
      down: active.filter(v => v.monitor.status === 'DOWN').length,
      paused: list.length - active.length,
      uptime: uptimes.length ? uptimes.reduce((a, b) => a + b, 0) / uptimes.length : null,
      latency: lat.length ? lat.reduce((a, b) => a + b, 0) / lat.length : null,
    }
  }, [views])

  const shown = useMemo(() => {
    const q = query.trim().toLowerCase()
    const rank = (v: MonitorView) => (v.monitor.paused ? 3 : v.monitor.status === 'DOWN' ? 0 : v.monitor.status === 'PENDING' ? 1 : 2)
    return (views ?? [])
      .filter(v => !q || v.monitor.name.toLowerCase().includes(q) || v.monitor.url.toLowerCase().includes(q))
      .filter(v => filter === 'all' || (filter === 'paused' ? v.monitor.paused : !v.monitor.paused && v.monitor.status.toLowerCase() === filter))
      .sort((a, b) => rank(a) - rank(b) || a.monitor.name.localeCompare(b.monitor.name))
  }, [views, query, filter])

  const names = useMemo(() => new Map((views ?? []).map(v => [v.monitor.id, v.monitor.name])), [views])
  const detail = views?.find(v => v.monitor.id === detailId)
  const health = stats.down > 0 ? 'down' : stats.total === 0 ? 'idle' : 'up'

  return (
    <div className={`app health-${health}`}>
      <div className="aurora" aria-hidden><i /><i /><i /><i /></div>
      <div className="grain" aria-hidden />

      <header className="topbar">
        <div className="brand">
          <div className="logo glass">
            <svg viewBox="0 0 32 32" aria-hidden><path d="M3 17h7l3-8 5 15 3-7h8" /></svg>
          </div>
          <div>
            <h1>Pulse</h1>
            <span className="muted">Uptime monitoring</span>
          </div>
        </div>
        <div className={`health-pill glass health-pill-${health}`} data-testid="health">
          <span className="dot-live" />
          {health === 'down' ? `${stats.down} ${stats.down === 1 ? 'service' : 'services'} down` : health === 'idle' ? 'No monitors yet' : 'All systems operational'}
        </div>
        <div className="top-actions">
          <button className="btn ghost" onClick={() => setHooksOpen(true)} aria-label="Webhooks"><Icon name="bell" /> <span className="label">Webhooks</span></button>
          <button className="btn primary" onClick={() => setForm({})} aria-label="New monitor"><Icon name="plus" /> <span className="label">New monitor</span> <kbd>N</kbd></button>
        </div>
      </header>

      {offline && <div className="offline glass" role="alert">Can't reach the Pulse API — retrying every 5 seconds…</div>}

      <section className="hero glass spot">
        <div className="hero-main">
          <span className="metric-label">Overall uptime · 24h</span>
          <span className="hero-value" data-testid="overall-uptime">{pct(stats.uptime)}</span>
        </div>
        <div className="hero-stats">
          <HeroStat label="Monitors" value={String(stats.total)} />
          <HeroStat label="Up" value={String(stats.up)} tone="up" />
          <HeroStat label="Down" value={String(stats.down)} tone={stats.down ? 'down' : undefined} />
          <HeroStat label="Avg response" value={ms(stats.latency)} />
        </div>
      </section>

      <main className="layout">
        <section>
          <div className="toolbar">
            <label className="search glass">
              <Icon name="search" />
              <input ref={search} placeholder="Search monitors" value={query} onChange={e => setQuery(e.target.value)} aria-label="Search monitors" />
              <kbd>/</kbd>
            </label>
            <div className="segmented glass" role="tablist" aria-label="Filter">
              {(['all', 'up', 'down', 'paused'] as Filter[]).map(f => (
                <button key={f} role="tab" aria-selected={filter === f} className={filter === f ? 'on' : ''} onClick={() => setFilter(f)}>
                  {f[0].toUpperCase() + f.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {views === null && !offline && <div className="grid">{[0, 1, 2, 3].map(i => <div key={i} className="card glass shimmer skeleton" />)}</div>}

          {views?.length === 0 && (
            <div className="empty glass">
              <svg viewBox="0 0 300 60" className="empty-ecg" aria-hidden><path d="M0 30h90l10-18 16 40 14-52 14 46 10-16h146" /></svg>
              <h2>Nothing to watch yet</h2>
              <p className="muted">Add your first website or API and Pulse will check it around the clock.</p>
              <button className="btn primary" onClick={() => setForm({})}><Icon name="plus" /> Add your first monitor</button>
            </div>
          )}

          {views && views.length > 0 && shown.length === 0 && <p className="muted center">No monitors match.</p>}

          <div className="grid">
            {shown.map(v => <MonitorCard key={v.monitor.id} view={v} now={now} onOpen={() => setDetailId(v.monitor.id)} />)}
          </div>
        </section>

        <aside className="incidents glass">
          <h2><Icon name="shield" /> Incidents</h2>
          <ul>
            {incidents.slice(0, 12).map(i => (
              <li key={i.id} className={i.resolvedAt ? 'resolved' : 'ongoing'} data-testid="incident">
                <span className="inc-bar" />
                <div>
                  <strong>{names.get(i.monitorId) ?? 'Deleted monitor'}</strong>
                  <span className="muted ellipsis">{i.cause}</span>
                </div>
                <span className="inc-time">
                  {i.resolvedAt ? <>{duration((Date.parse(i.resolvedAt) - Date.parse(i.startedAt)) / 1000)}<small>{new Date(i.startedAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}</small></> : <>Ongoing<small>{since(i.startedAt, now)}</small></>}
                </span>
              </li>
            ))}
            {incidents.length === 0 && <li className="calm muted">No incidents recorded. Smooth sailing.</li>}
          </ul>
        </aside>
      </main>

      <Modal open={form !== null} onClose={() => setForm(null)} title={form?.edit ? 'Edit monitor' : 'New monitor'}>
        <MonitorForm
          initial={form?.edit}
          onCancel={() => setForm(null)}
          onDone={m => { setForm(null); toast.push(form?.edit ? 'Monitor updated' : `Now watching ${m.name}`); refresh() }}
        />
      </Modal>

      <Modal open={detail !== undefined && form === null} onClose={() => setDetailId(null)} title={detail?.monitor.name ?? 'Monitor'} wide>
        {detail && (
          <MonitorDetail
            view={detail}
            incidents={incidents}
            now={now}
            onClose={() => setDetailId(null)}
            onEdit={() => setForm({ edit: detail.monitor })}
            onChanged={refresh}
            toast={toast.push}
          />
        )}
      </Modal>

      <Modal open={hooksOpen} onClose={() => setHooksOpen(false)} title="Webhooks" wide>
        <WebhooksPanel onClose={() => setHooksOpen(false)} toast={toast.push} now={now} />
      </Modal>

      {toast.view}
    </div>
  )
}

function HeroStat({ label, value, tone }: { label: string; value: string; tone?: 'up' | 'down' }) {
  return (
    <div className={`hero-stat ${tone ? 'tone-' + tone : ''}`}>
      <span className="metric-label">{label}</span>
      <span className="metric-value">{value}</span>
    </div>
  )
}
