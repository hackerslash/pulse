import type { MonitorView } from './api'
import { ago, hostOf, interval, ms, pct, since } from './format'
import { Heartbeat, Icon, Sparkline, StatusDot } from './ui'

export function MonitorCard({ view, now, onOpen }: { view: MonitorView; now: number; onOpen: () => void }) {
  const m = view.monitor
  const state = m.paused ? 'paused' : m.status.toLowerCase()
  const label = m.paused ? 'Paused' : m.status === 'PENDING' ? 'Pending' : `${m.status === 'UP' ? 'Up' : 'Down'} · ${since(m.statusSince, now)}`
  return (
    <button className={`card glass spot card-${state}`} onClick={onOpen} data-testid="monitor-card" aria-label={`${m.name}, ${label}`}>
      <div className="card-head">
        <StatusDot status={m.status} paused={m.paused} />
        <div className="card-title">
          <h3>{m.name}{!m.isPublic && <span className="private" title="Hidden from the public status page"><Icon name="lock" size={12} /></span>}</h3>
          <span className="mono muted">{hostOf(m.url)}</span>
        </div>
        <span className={`badge badge-${state}`}>{label}</span>
      </div>

      <div className="card-metrics">
        <div>
          <span className="metric-label">Uptime 24h</span>
          <span className="metric-value">{pct(view.uptime24h)}</span>
        </div>
        <div>
          <span className="metric-label">Response</span>
          <span className="metric-value">{m.status === 'DOWN' ? '—' : ms(m.lastLatencyMs)}</span>
        </div>
        <Sparkline beats={view.beats} down={m.status === 'DOWN'} />
      </div>

      <Heartbeat beats={view.beats} slots={40} />

      <div className="card-foot">
        {m.status === 'DOWN' && m.lastError ? <span className="err">{m.lastError}</span> : <span>Checked {ago(m.lastCheckedAt, now)}</span>}
        <span>every {interval(m.intervalSeconds)}</span>
      </div>
    </button>
  )
}
