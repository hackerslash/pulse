import { useEffect, useState } from 'react'
import { api, type PublicStatus } from './api'
import { ago, duration, pct, since } from './format'
import { Logo, StatusMark } from './ui'

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
  const detail = { idle: '', up: `All ${monitors.length} services are responding normally.`, partial: `${down} of ${monitors.length} services are not responding.`, major: `${down} of ${monitors.length} services are not responding.` }[level]

  return (
    <div className="public">
      <header className="public-mast">
        <span className="brand"><Logo /><span className="wordmark">Pulse</span></span>
        <span className="public-kind">Service status<span className="kind-date"> · {new Date(now).toLocaleDateString([], { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</span></span>
      </header>

      <section className={`verdict-block verdict-block-${level}`} data-testid="status-banner">
        <StatusMark status={level === 'up' ? 'UP' : level === 'idle' ? 'PENDING' : 'DOWN'} />
        <div>
          <h1>{headline}</h1>
          <p>
            {detail && <>{detail} </>}
            <span className="stamp">{offline ? 'Status is temporarily unavailable. Retrying.' : updated ? `Updated ${ago(updated, now)}.` : 'Loading.'}</span>
          </p>
        </div>
      </section>

      <section className="public-section" aria-labelledby="services-title">
        <div className="public-section-head">
          <h2 id="services-title">Services</h2>
          <span>Daily uptime, last 30 days</span>
        </div>
        {data && monitors.length === 0 && <p className="table-note">No services are published yet.</p>}
        {monitors.map(m => (
          <article className="service" key={m.id} data-testid="service">
            <div className="service-head">
              <StatusMark status={m.status} />
              <h3>{m.name}</h3>
              <span className={`service-state service-${m.status.toLowerCase()}`}>
                {m.status === 'UP' ? 'Operational' : m.status === 'DOWN' ? `Down for ${since(m.statusSince, now)}` : 'Checking'}
              </span>
              <span className="service-uptime">{pct(m.uptime30d)}</span>
            </div>
            <div className="days" role="img" aria-label={`${m.name}: daily uptime for the last 30 days`}>
              {m.days.map(d => (
                <span key={d.date} className={`day ${dayClass(d.uptime)}`}>
                  <span className="day-tip">{fmtDay(d.date)} · {d.uptime == null ? 'No data' : pct(d.uptime)}</span>
                </span>
              ))}
            </div>
            <div className="day-dates" aria-hidden>
              {m.days.map((d, i) => <span key={d.date}>{i === m.days.length - 1 ? 'Today' : i % 7 === 0 && i <= 21 ? fmtDay(d.date) : ''}</span>)}
            </div>
          </article>
        ))}
        <p className="legend" aria-hidden>
          <span><i className="swatch day-up" /> 99.9% or more</span>
          <span><i className="swatch day-minor" /> 99–99.9%</span>
          <span><i className="swatch day-warn" /> 95–99%</span>
          <span><i className="swatch day-down" /> under 95%</span>
          <span><i className="swatch day-empty" /> no data</span>
        </p>
      </section>

      <section className="public-section" aria-labelledby="incidents-title">
        <div className="public-section-head"><h2 id="incidents-title">Recent incidents</h2></div>
        {data?.incidents.length === 0 && <p className="table-note">No incidents reported.</p>}
        {!!data?.incidents.length && (
          <table className="data public-incidents">
            <thead><tr><th>Started</th><th>Service</th><th>Status</th><th className="num">Duration</th></tr></thead>
            <tbody>
              {data.incidents.map(i => (
                <tr key={i.id}>
                  <td className="num-left">{new Date(i.startedAt).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</td>
                  <td><strong>{i.monitor} outage</strong></td>
                  <td><span className={`pill ${i.resolvedAt ? 'pill-up' : 'pill-down'}`}>{i.resolvedAt ? 'Resolved' : 'Ongoing'}</span></td>
                  <td className="num">{i.resolvedAt ? duration((Date.parse(i.resolvedAt) - Date.parse(i.startedAt)) / 1000) : `${since(i.startedAt, now)} so far`}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      <footer className="public-foot">
        <span>Checked continuously by Pulse. Times shown in your local time zone; days are UTC.</span>
        <a href="/admin">Admin</a>
      </footer>
    </div>
  )
}

function fmtDay(date: string) {
  return new Date(date + 'T00:00:00Z').toLocaleDateString([], { month: 'short', day: 'numeric', timeZone: 'UTC' })
}

function dayClass(u: number | null) {
  if (u == null) return 'day-empty'
  if (u >= 99.9) return 'day-up'
  if (u >= 99) return 'day-minor'
  if (u >= 95) return 'day-warn'
  return 'day-down'
}
