import type { MonitorView } from './api'
import { ago, hostOf, interval, ms, pct, since } from './format'
import { Icon, StatusMark, Ticks } from './ui'

export function MonitorRow({ view, now, onOpen }: { view: MonitorView; now: number; onOpen: () => void }) {
  const m = view.monitor
  const state = m.paused ? 'paused' : m.status === 'UP' && m.degraded ? 'degraded' : m.status.toLowerCase()
  const label = m.paused ? 'Paused' : m.status === 'PENDING' ? 'Pending' : `${m.status === 'UP' ? (m.degraded ? 'Degraded' : 'Up') : 'Down'} · ${since(m.statusSince, now)}`
  return (
    <button className={`row row-${state}`} onClick={onOpen} data-testid="monitor-card" role="listitem" aria-label={`${m.name}, ${label}`}>
      <StatusMark status={m.status} degraded={m.degraded} paused={m.paused} />
      <span className="cell-service">
        <strong>{m.name}{!m.isPublic && <span className="private" title="Hidden from the public status page"><Icon name="lock" size={12} /></span>}</strong>
        <span className="host">{m.status === 'DOWN' && m.lastError ? <em>{m.lastError}</em> : m.lastDetail ? `${hostOf(m.url)} · ${m.lastDetail}` : hostOf(m.url)}</span>
      </span>
      <span className={`badge badge-${state}`}>{label}</span>
      <span className="num cell-uptime">{pct(view.uptime24h)}</span>
      <span className="num cell-ms">{m.status === 'DOWN' ? '—' : ms(m.lastLatencyMs)}</span>
      <Ticks beats={view.beats} />
      <span className="num cell-checked">{ago(m.lastCheckedAt, now)}<small>every {interval(m.intervalSeconds)}</small></span>
    </button>
  )
}
