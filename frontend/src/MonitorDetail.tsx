import { useEffect, useState } from 'react'
import { api, type Beat, type Incident, type MonitorView } from './api'
import { ago, duration, interval, ms, pct, percentile, since } from './format'
import { Icon, StatusMark, TideChart } from './ui'

const RANGES = [{ h: 1, label: '1 h' }, { h: 24, label: '24 h' }, { h: 168, label: '7 d' }, { h: 720, label: '30 d' }]

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
  const mine = incidents.filter(i => i.monitorId === m.id).slice(0, 6)
  const state = m.paused ? 'paused' : m.status.toLowerCase()
  const range = RANGES.find(r => r.h === hours)!.label

  return (
    <main className="detail">
      <button className="back" onClick={onClose}><Icon name="back" /> All monitors <kbd>Esc</kbd></button>

      <header className="detail-head">
        <div className="detail-title">
          <StatusMark status={m.status} paused={m.paused} />
          <div>
            <h2>{m.name}</h2>
            <a href={m.url} target="_blank" rel="noreferrer" className="url">{m.url} <Icon name="external" size={12} /></a>
          </div>
        </div>
        <div className="detail-actions">
          <button className="btn" disabled={busy} onClick={() => run(() => api.checkNow(m.id), 'Check complete')}><Icon name="refresh" /> Check now</button>
          <button className="btn" disabled={busy} onClick={() => run(() => api.pause(m.id, !m.paused), m.paused ? 'Monitoring resumed' : 'Monitoring paused')}>
            <Icon name={m.paused ? 'play' : 'pause'} /> {m.paused ? 'Resume' : 'Pause'}
          </button>
          <button className="btn" onClick={onEdit}><Icon name="edit" /> Edit</button>
          {confirmDelete
            ? <button className="btn btn-danger" disabled={busy} onClick={() => run(async () => { await api.deleteMonitor(m.id); onClose() }, 'Monitor deleted')}>Confirm delete</button>
            : <button className="btn btn-icon btn-danger-quiet" onClick={() => setConfirmDelete(true)} aria-label="Delete monitor" title="Delete monitor"><Icon name="trash" /></button>}
        </div>
      </header>

      <p className={`state-line state-${state}`}>
        <span className={`badge badge-${state}`}>
          {m.paused ? 'Paused' : m.status === 'PENDING' ? 'Waiting for first check' : `${m.status === 'UP' ? 'Up' : 'Down'} for ${since(m.statusSince, now)}`}
        </span>
        <span>Checked {ago(m.lastCheckedAt, now)}, every {interval(m.intervalSeconds)}</span>
        {!m.isPublic && <span><Icon name="lock" size={12} /> Private</span>}
      </p>

      {m.status === 'DOWN' && m.lastError && (
        <p className="alert-strip" role="alert"><Icon name="alert" /><span><b>{m.lastError}</b> on the last check, {ago(m.lastCheckedAt, now)}.</span></p>
      )}

      <dl className="ledger ledger-detail">
        {[
          [`Uptime, ${range}`, uptime == null ? null : pct(uptime)],
          ['Average', avg == null ? null : ms(avg)],
          ['95th percentile', ups.length ? ms(percentile(ups, 95)) : null],
          ['Fastest', ups.length ? ms(Math.min(...ups)) : null],
          ['Checks', history ? history.length.toLocaleString() : null],
          ['30 d uptime', view.uptime30d == null ? null : pct(view.uptime30d)],
        ].filter(([, v]) => v != null).map(([k, v]) => <div key={k}><dt>{k}</dt><dd>{v}</dd></div>)}
      </dl>

      <section className="panel">
        <div className="panel-head">
          <h3>Response time</h3>
          <div className="tabs" role="tablist" aria-label="Range">
            {RANGES.map(r => (
              <button key={r.h} role="tab" aria-selected={hours === r.h} onClick={() => setHours(r.h)}>{r.label}</button>
            ))}
          </div>
        </div>
        {history ? <TideChart beats={history} /> : <div className="chart-loading" />}
      </section>

      <div className="detail-cols">
        <section className="panel">
          <h3>Recent checks</h3>
          <table className="data">
            <thead><tr><th>Result</th><th className="num">Time</th><th>Detail</th><th className="num">When</th></tr></thead>
            <tbody>
              {(history ?? []).slice(-8).reverse().map(b => (
                <tr key={b.t}>
                  <td><span className={`pill ${b.up ? 'pill-up' : 'pill-down'}`}>{b.code ?? 'ERR'}</span></td>
                  <td className="num">{ms(b.ms)}</td>
                  <td className="ellipsis">{b.error ?? 'OK'}</td>
                  <td className="num">{ago(b.t, now)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {history?.length === 0 && <p className="table-note">No checks in this range yet.</p>}
        </section>
        <section className="panel">
          <h3>Incidents</h3>
          <table className="data">
            <thead><tr><th>State</th><th>Cause</th><th className="num">Duration</th></tr></thead>
            <tbody>
              {mine.map(i => (
                <tr key={i.id}>
                  <td><span className={`pill ${i.resolvedAt ? 'pill-up' : 'pill-down'}`}>{i.resolvedAt ? 'Resolved' : 'Ongoing'}</span></td>
                  <td className="ellipsis">{i.cause}</td>
                  <td className="num">{i.resolvedAt ? duration((Date.parse(i.resolvedAt) - Date.parse(i.startedAt)) / 1000) : since(i.startedAt, now)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {mine.length === 0 && <p className="table-note">No incidents for this monitor.</p>}
        </section>
      </div>
    </main>
  )
}
