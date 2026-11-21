import { useEffect, useState } from 'react'
import { api, type Beat, type Incident, type MonitorView } from './api'
import { ago, duration, interval, ms, pct, percentile, since } from './format'
import { Icon, LatencyChart, StatusDot } from './ui'

const RANGES = [{ h: 1, label: '1h' }, { h: 24, label: '24h' }, { h: 168, label: '7d' }, { h: 720, label: '30d' }]

interface Props {
  view: MonitorView
  incidents: Incident[]
  now: number
  onClose: () => void
  onEdit: () => void
  onChanged: () => void
  toast: (text: string, kind?: 'ok' | 'err') => void
}

export function MonitorDetail({ view, incidents, now, onClose, onEdit, onChanged, toast }: Props) {
  const m = view.monitor
  const [hours, setHours] = useState(24)
  const [history, setHistory] = useState<Beat[] | null>(null)
  const [busy, setBusy] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)

  useEffect(() => {
    let live = true
    api.history(m.id, hours).then(h => live && setHistory(h)).catch(() => live && setHistory([]))
    return () => { live = false }
  }, [m.id, hours, m.lastCheckedAt])

  const run = async (fn: () => Promise<unknown>, ok: string) => {
    setBusy(true)
    try {
      await fn()
      toast(ok)
      onChanged()
    } catch (e) {
      toast((e as Error).message, 'err')
    } finally {
      setBusy(false)
    }
  }

  const ups = history?.filter(b => b.up).map(b => b.ms) ?? []
  const uptime = history?.length ? (100 * history.filter(b => b.up).length) / history.length : null
  const avg = ups.length ? ups.reduce((a, b) => a + b, 0) / ups.length : null
  const mine = incidents.filter(i => i.monitorId === m.id).slice(0, 5)
  const state = m.paused ? 'paused' : m.status.toLowerCase()

  return (
    <div className="detail">
      <header className="modal-head">
        <div className="detail-title">
          <StatusDot status={m.status} paused={m.paused} size={14} />
          <div>
            <h2>{m.name}</h2>
            <a href={m.url} target="_blank" rel="noreferrer" className="mono muted link">{m.url} <Icon name="external" size={12} /></a>
          </div>
        </div>
        <button className="icon-btn" onClick={onClose} aria-label="Close"><Icon name="close" /></button>
      </header>

      <div className="detail-actions">
        <span className={`badge badge-${state} badge-lg`}>
          {m.paused ? 'Paused' : m.status === 'PENDING' ? 'Waiting for first check' : `${m.status === 'UP' ? 'Up' : 'Down'} for ${since(m.statusSince, now)}`}
        </span>
        <div className="spacer" />
        <button className="btn ghost" disabled={busy} onClick={() => run(() => api.checkNow(m.id), 'Check complete')}><Icon name="refresh" /> Check now</button>
        <button className="btn ghost" disabled={busy} onClick={() => run(() => api.pause(m.id, !m.paused), m.paused ? 'Monitoring resumed' : 'Monitoring paused')}>
          <Icon name={m.paused ? 'play' : 'pause'} /> {m.paused ? 'Resume' : 'Pause'}
        </button>
        <button className="btn ghost" onClick={onEdit}><Icon name="edit" /> Edit</button>
        {confirmDelete
          ? <button className="btn danger" disabled={busy} onClick={() => run(async () => { await api.deleteMonitor(m.id); onClose() }, 'Monitor deleted')}>Confirm delete</button>
          : <button className="btn ghost danger-text" onClick={() => setConfirmDelete(true)} aria-label="Delete monitor"><Icon name="trash" /></button>}
      </div>

      {m.status === 'DOWN' && m.lastError && (
        <div className="alert-strip"><Icon name="bolt" /> {m.lastError} · last checked {ago(m.lastCheckedAt, now)}</div>
      )}

      <div className="stat-grid">
        <Stat label={`Uptime ${RANGES.find(r => r.h === hours)!.label}`} value={pct(uptime)} accent />
        <Stat label="Avg response" value={ms(avg)} />
        <Stat label="p95" value={ms(percentile(ups, 95))} />
        <Stat label="Fastest" value={ups.length ? ms(Math.min(...ups)) : '—'} />
        <Stat label="Checks" value={history ? history.length.toLocaleString() : '—'} />
        <Stat label="Interval" value={interval(m.intervalSeconds)} />
      </div>

      <section className="panel-sub">
        <div className="panel-sub-head">
          <h3>Response time</h3>
          <div className="segmented small" role="tablist">
            {RANGES.map(r => (
              <button key={r.h} role="tab" aria-selected={hours === r.h} className={hours === r.h ? 'on' : ''} onClick={() => setHours(r.h)}>{r.label}</button>
            ))}
          </div>
        </div>
        {history ? <LatencyChart beats={history} /> : <div className="chart-empty shimmer" />}
      </section>

      <div className="detail-cols">
        <section className="panel-sub">
          <h3>Recent checks</h3>
          <ul className="check-list">
            {(history ?? []).slice(-8).reverse().map(b => (
              <li key={b.t}>
                <span className={`pill ${b.up ? 'pill-up' : 'pill-down'}`}>{b.code ?? 'ERR'}</span>
                <span className="mono">{ms(b.ms)}</span>
                <span className="muted ellipsis">{b.error ?? 'OK'}</span>
                <span className="muted">{ago(b.t, now)}</span>
              </li>
            ))}
            {history?.length === 0 && <li className="muted">No checks in this range yet.</li>}
          </ul>
        </section>
        <section className="panel-sub">
          <h3>Incidents</h3>
          <ul className="check-list">
            {mine.map(i => (
              <li key={i.id}>
                <span className={`pill ${i.resolvedAt ? 'pill-up' : 'pill-down'}`}>{i.resolvedAt ? 'Resolved' : 'Ongoing'}</span>
                <span className="muted ellipsis">{i.cause}</span>
                <span className="muted">{i.resolvedAt ? duration((Date.parse(i.resolvedAt) - Date.parse(i.startedAt)) / 1000) : since(i.startedAt, now)}</span>
              </li>
            ))}
            {mine.length === 0 && <li className="muted">No incidents. Lovely.</li>}
          </ul>
        </section>
      </div>
    </div>
  )
}

function Stat({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className={`stat ${accent ? 'stat-accent' : ''}`}>
      <span className="metric-label">{label}</span>
      <span className="metric-value">{value}</span>
    </div>
  )
}
