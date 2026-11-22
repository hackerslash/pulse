import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { api, type Incident, type Monitor, type MonitorView } from './api'
import { duration, ms, pct, since } from './format'
import { MonitorDetail } from './MonitorDetail'
import { MonitorForm } from './MonitorForm'
import { MonitorRow } from './MonitorRow'
import { WebhooksPanel } from './WebhooksPanel'
import { Icon, Logo, Modal, StatusMark, useToasts } from './ui'

type Filter = 'all' | 'up' | 'down' | 'paused'

const idFromHash = () => {
  const m = /^#monitor-(\d+)$/.exec(location.hash)
  return m ? Number(m[1]) : null
}

export function App({ onLogout }: { onLogout: () => void }) {
  const [views, setViews] = useState<MonitorView[] | null>(null)
  const [incidents, setIncidents] = useState<Incident[]>([])
  const [offline, setOffline] = useState(false)
  const [now, setNow] = useState(Date.now())
  const [form, setForm] = useState<{ edit?: Monitor } | null>(null)
  const [detailId, setDetailId] = useState<number | null>(idFromHash)
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

  const openDetail = (id: number) => { location.hash = `monitor-${id}` }
  const closeDetail = useCallback(() => {
    if (location.hash) history.pushState(null, '', location.pathname)
    setDetailId(null)
  }, [])

  useEffect(() => {
    refresh()
    const poll = setInterval(refresh, 5000)
    const clock = setInterval(() => setNow(Date.now()), 1000)
    const hash = () => setDetailId(idFromHash())
    window.addEventListener('hashchange', hash)
    window.addEventListener('popstate', hash)
    return () => { clearInterval(poll); clearInterval(clock); window.removeEventListener('hashchange', hash); window.removeEventListener('popstate', hash) }
  }, [refresh])

  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      if (document.querySelector('dialog[open]')) return
      if (e.key === 'Escape' && detailId != null) { closeDetail(); return }
      if ((e.target as Element).matches('input, textarea')) return
      if (e.key === 'n') { e.preventDefault(); setForm({}) }
      if (e.key === '/' && detailId == null) { e.preventDefault(); search.current?.focus() }
    }
    window.addEventListener('keydown', key)
    return () => window.removeEventListener('keydown', key)
  }, [detailId, closeDetail])

  useEffect(() => { window.scrollTo(0, 0) }, [detailId])

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
    <div className="shell">
      <header className="bar">
        <a className="brand" href="/admin" onClick={e => { e.preventDefault(); closeDetail() }}>
          <Logo />
          <h1 className="wordmark">Pulse</h1>
        </a>
        <p className={`verdict verdict-${health}`} data-testid="health">
          <StatusMark status={health === 'down' ? 'DOWN' : health === 'up' ? 'UP' : 'PENDING'} paused={health === 'idle'} />
          {health === 'down' ? `${stats.down} ${stats.down === 1 ? 'service' : 'services'} down` : health === 'idle' ? 'No monitors yet' : 'All systems operational'}
        </p>
        <nav className="bar-actions" aria-label="Main">
          <a className="btn btn-quiet" href="/" target="_blank" rel="noreferrer" aria-label="Public status page"><Icon name="globe" /><span className="label">Status page</span></a>
          <button className="btn btn-quiet" onClick={() => setHooksOpen(true)} aria-label="Webhooks"><Icon name="bell" /><span className="label">Webhooks</span></button>
          <button className="btn btn-primary" onClick={() => setForm({})} aria-label="New monitor"><Icon name="plus" /><span className="label">New monitor</span><kbd>N</kbd></button>
          <button className="btn btn-icon" onClick={onLogout} aria-label="Log out" title="Log out"><Icon name="logout" /></button>
        </nav>
      </header>

      {offline && <p className="notice" role="alert"><Icon name="alert" /> Can't reach the Pulse API. Retrying every 5 seconds.</p>}

      {detailId != null && detail ? (
        <MonitorDetail
          view={detail}
          incidents={incidents}
          now={now}
          onClose={closeDetail}
          onEdit={() => setForm({ edit: detail.monitor })}
          onChanged={refresh}
          toast={toast.push}
        />
      ) : (
        <main className="workspace">
          <section className="monitors" aria-labelledby="monitors-title">
            <div className="section-head">
              <h2 id="monitors-title">Monitors</h2>
              <dl className="ledger">
                <div><dt>24 h uptime</dt><dd data-testid="overall-uptime">{pct(stats.uptime)}</dd></div>
                <div><dt>Monitors</dt><dd>{stats.total}</dd></div>
                <div><dt>Up</dt><dd>{stats.up}</dd></div>
                <div className={stats.down ? 'ledger-alert' : ''}><dt>Down</dt><dd>{stats.down}</dd></div>
                <div><dt>Avg response</dt><dd>{ms(stats.latency)}</dd></div>
              </dl>
            </div>

            <div className="toolbar">
              <label className="search">
                <Icon name="search" />
                <input ref={search} placeholder="Search by name or URL" value={query} onChange={e => setQuery(e.target.value)} aria-label="Search monitors" />
                <kbd>/</kbd>
              </label>
              <div className="tabs" role="tablist" aria-label="Filter">
                {(['all', 'up', 'down', 'paused'] as Filter[]).map(f => (
                  <button key={f} role="tab" aria-selected={filter === f} onClick={() => setFilter(f)}>
                    {f[0].toUpperCase() + f.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            <div className="table" role="list" aria-label="Monitors">
              <div className="row row-head" aria-hidden>
                <span />
                <span>Service</span>
                <span>Status</span>
                <span className="num">24 h</span>
                <span className="num">Response</span>
                <span>Last 40 checks</span>
                <span className="num">Checked</span>
              </div>

              {views === null && !offline && [0, 1, 2].map(i => <div key={i} className="row row-skeleton" />)}

              {views?.length === 0 && (
                <div className="empty">
                  <h3>Nothing to watch yet</h3>
                  <p>Add a website or API and Pulse checks it on a schedule, records every result, and alerts your webhooks when it goes down.</p>
                  <button className="btn btn-primary" onClick={() => setForm({})}><Icon name="plus" /> Add your first monitor</button>
                </div>
              )}

              {views && views.length > 0 && shown.length === 0 && <p className="table-note">No monitors match.</p>}

              {shown.map(v => <MonitorRow key={v.monitor.id} view={v} now={now} onOpen={() => openDetail(v.monitor.id)} />)}
            </div>
          </section>

          <aside className="log" aria-labelledby="log-title">
            <h2 id="log-title">Incident log</h2>
            <ol>
              {incidents.slice(0, 12).map(i => (
                <li key={i.id} className={i.resolvedAt ? 'resolved' : 'ongoing'} data-testid="incident">
                  <div className="log-main">
                    <strong>{names.get(i.monitorId) ?? 'Deleted monitor'}</strong>
                    <span>{i.cause}</span>
                  </div>
                  <div className="log-when">
                    <b>{i.resolvedAt ? duration((Date.parse(i.resolvedAt) - Date.parse(i.startedAt)) / 1000) : 'Ongoing'}</b>
                    <span>{i.resolvedAt ? new Date(i.startedAt).toLocaleDateString([], { month: 'short', day: 'numeric' }) : `for ${since(i.startedAt, now)}`}</span>
                  </div>
                </li>
              ))}
            </ol>
            {incidents.length === 0 && <p className="log-empty">No incidents recorded. Outages and recoveries will be listed here.</p>}
          </aside>
        </main>
      )}

      <Modal open={form !== null} onClose={() => setForm(null)} title={form?.edit ? 'Edit monitor' : 'New monitor'}>
        <MonitorForm
          initial={form?.edit}
          onCancel={() => setForm(null)}
          onDone={m => { setForm(null); toast.push(form?.edit ? 'Monitor updated' : `Now watching ${m.name}`); refresh() }}
        />
      </Modal>

      <Modal open={hooksOpen} onClose={() => setHooksOpen(false)} title="Webhooks" wide>
        <WebhooksPanel onClose={() => setHooksOpen(false)} toast={toast.push} now={now} />
      </Modal>

      {toast.view}
    </div>
  )
}
