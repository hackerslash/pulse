import { useEffect, useState } from 'react'
import { api, type PublicStatus } from './api'
import { ago, duration, pct, since } from './format'
import { Backdrop, Icon, Logo } from './ui'

export function StatusPage() {
  const [data, setData] = useState<PublicStatus | null>(null)
  const [updated, setUpdated] = useState<string | null>(null)
  const [offline, setOffline] = useState(false)
  const [now, setNow] = useState(Date.now())

  useEffect(() => {
    const load = () => api.publicStatus().then(d => { setData(d); setUpdated(new Date().toISOString()); setOffline(false) }, () => setOffline(true))
    load()
    const poll = setInterval(load, 30_000)
    const clock = setInterval(() => setNow(Date.now()), 1000)
    return () => { clearInterval(poll); clearInterval(clock) }
  }, [])

  const monitors = data?.monitors ?? []
  const down = monitors.filter(m => m.status === 'DOWN').length
  const level = !data ? 'idle' : down === 0 ? 'up' : down * 2 >= monitors.length ? 'major' : 'partial'
  const headline = { idle: 'Checking status…', up: 'All systems operational', partial: 'Partial outage', major: 'Major outage' }[level]

  return (
    <div className={`app status-page health-${level === 'up' || level === 'idle' ? level : 'down'}`}>
      <Backdrop />
      <header className="topbar">
        <div className="brand">
          <Logo />
          <div>
            <h1>Pulse</h1>
            <span className="muted">System status</span>
          </div>
        </div>
      </header>

      <section className={`status-banner glass spot banner-${level}`} data-testid="status-banner">
        <div className="banner-icon"><Icon name={level === 'up' ? 'check' : level === 'idle' ? 'refresh' : 'alert'} size={30} /></div>
        <div>
          <h2>{headline}</h2>
          <p className="muted">
            {offline ? 'Status temporarily unavailable — retrying…' : updated ? `Updated ${ago(updated, now)} · refreshes every 30 seconds` : 'Loading…'}
          </p>
        </div>
      </section>

      <section className="status-list glass">
        <div className="status-list-head">
          <h3>Services</h3>
          <span className="muted">Uptime over the last 30 days</span>
        </div>
        {data && monitors.length === 0 && <p className="muted center pad">No services are published yet.</p>}
        {monitors.map(m => (
          <div className="service" key={m.id} data-testid="service">
            <div className="service-head">
              <span className={`dot dot-${m.status.toLowerCase()}`} style={{ width: 10, height: 10 }} />
              <strong>{m.name}</strong>
              <span className="spacer" />
              <span className={`service-state state-${m.status.toLowerCase()}`}>
                {m.status === 'UP' ? 'Operational' : m.status === 'DOWN' ? `Down for ${since(m.statusSince, now)}` : 'Checking'}
              </span>
            </div>
            <div className="days" role="img" aria-label={`${m.name} daily uptime`}>
              {m.days.map(d => (
                <span key={d.date} className={`day ${dayClass(d.uptime)}`}
                  data-tip={`${new Date(d.date + 'T00:00:00Z').toLocaleDateString([], { month: 'short', day: 'numeric', timeZone: 'UTC' })} · ${d.uptime == null ? 'No data' : pct(d.uptime)}`} />
              ))}
            </div>
            <div className="days-legend">
              <span>30 days ago</span>
              <span className="days-uptime">{pct(m.uptime30d)} uptime</span>
              <span>Today</span>
            </div>
          </div>
        ))}
      </section>

      <section className="status-list glass">
        <div className="status-list-head"><h3>Recent incidents</h3></div>
        {data?.incidents.length === 0 && <p className="muted center pad">No incidents reported. Everything's been running smoothly.</p>}
        <ul className="public-incidents">
          {data?.incidents.map(i => (
            <li key={i.id} className={i.resolvedAt ? 'resolved' : 'ongoing'}>
              <span className={`pill ${i.resolvedAt ? 'pill-up' : 'pill-down'}`}>{i.resolvedAt ? 'Resolved' : 'Ongoing'}</span>
              <div>
                <strong>{i.monitor} outage</strong>
                <span className="muted">
                  {i.resolvedAt
                    ? `Lasted ${duration((Date.parse(i.resolvedAt) - Date.parse(i.startedAt)) / 1000)}`
                    : `Started ${since(i.startedAt, now)} ago — we're on it`}
                </span>
              </div>
              <time className="muted">{new Date(i.startedAt).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</time>
            </li>
          ))}
        </ul>
      </section>

      <footer className="status-foot muted">
        Powered by Pulse · <a href="/admin">Admin</a>
      </footer>
    </div>
  )
}

function dayClass(u: number | null) {
  if (u == null) return 'day-empty'
  if (u >= 99.9) return 'day-up'
  if (u >= 99) return 'day-minor'
  if (u >= 95) return 'day-warn'
  return 'day-down'
}
