import { useEffect, useState } from 'react'
import { api, type Granularity, type PublicStatus } from './api'
import { ago, duration, pct, since } from './format'
import { Logo } from './ui'

const OPTIONS: { id: Granularity; label: string; unit: string; today: string }[] = [
  { id: 'day', label: '1 day', unit: 'days', today: 'Today' },
  { id: 'week', label: '1 week', unit: 'weeks', today: 'This week' },
  { id: 'month', label: '1 month', unit: 'months', today: 'This month' },
]

function initialGranularity(): Granularity {
  const g = new URLSearchParams(location.search).get('granularity')
  return OPTIONS.some(o => o.id === g) ? (g as Granularity) : 'day'
}

export function StatusPage() {
  const [granularity, setGranularity] = useState<Granularity>(initialGranularity)
  const [data, setData] = useState<PublicStatus | null>(null)
  const [updated, setUpdated] = useState<string | null>(null)
  const [offline, setOffline] = useState(false)
  const [now, setNow] = useState(Date.now())

  useEffect(() => {
    const load = () => api.publicStatus(granularity).then(d => { setData(d); setUpdated(new Date().toISOString()); setOffline(false) }, () => setOffline(true))
    load()
    const poll = setInterval(load, 30_000)
    const clock = setInterval(() => setNow(Date.now()), 1000)
    return () => { clearInterval(poll); clearInterval(clock) }
  }, [granularity])

  const pick = (g: Granularity) => {
    setGranularity(g)
    history.replaceState(null, '', g === 'day' ? location.pathname : `?granularity=${g}`)
  }

  const monitors = data?.monitors ?? []
  const down = monitors.filter(m => m.status === 'DOWN').length
  const operational = monitors.filter(m => m.status === 'UP').length
  const level = !data ? 'idle' : down === 0 ? 'up' : down * 2 >= monitors.length ? 'major' : 'partial'
  const headline = { idle: 'Checking status…', up: 'All systems operational', partial: 'Partial outage', major: 'Major outage' }[level]
  const option = OPTIONS.find(o => o.id === granularity)!
  const active = data?.incidents.filter(i => !i.resolvedAt) ?? []
  const past = data?.incidents.filter(i => i.resolvedAt) ?? []

  return (
    <div className="public">
      <header className="public-mast">
        <div className="public-in">
          <span className="brand"><Logo /><span className="wordmark">Pulse</span></span>
          <span className="public-kind">Status</span>
          <a className="mast-link" href="/admin">Admin</a>
        </div>
      </header>

      <section className={`hero hero-${level === 'up' || level === 'idle' ? level : 'down'}`} data-testid="status-banner">
        <div className="public-in">
          <div className="hero-line">
            <span className="hero-ico" aria-hidden />
            <h1>{headline}</h1>
          </div>
          <p>
            {offline
              ? 'Status is temporarily unavailable. Retrying.'
              : !data ? 'Loading.'
              : monitors.length === 0 ? 'No services are published yet.'
              : `${operational} of ${monitors.length} services operational`}
            {updated && !offline && <> · Updated {ago(updated, now)}</>}
          </p>
        </div>
      </section>

      <main className="public-in public-main">
        <div className="public-incidents">
          {active.length > 0 && (
            <section className="psec" aria-labelledby="active-title">
              <div className="psec-head"><h2 id="active-title">Active incidents</h2></div>
              <div className="pcard">
                {active.map(i => (
                  <article className="inc" key={i.id}>
                    <div className="inc-head">
                      <h3>{i.monitor} outage</h3>
                      <span className="inc-tags"><span className="tag tag-red">Outage</span><span className="tag tag-amber">Ongoing</span></span>
                    </div>
                    <p className="inc-meta">{fmtDateTime(i.startedAt)} · {i.monitor}</p>
                    <div className="inc-update">
                      <i aria-hidden />
                      <div>
                        <strong>Detected</strong> <span className="muted">· {since(i.startedAt, now)} ago</span>
                        <p>Automated checks are failing for {i.monitor}. We're looking into it and will update this page when it recovers.</p>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            </section>
          )}
        </div>

        <section className="psec" aria-labelledby="services-title">
          <div className="psec-head">
            <h2 id="services-title">Services</h2>
            <div className="psec-meta">
              {monitors.length > 0 && <span>{operational} of {monitors.length} operational</span>}
              <div className="tabs" role="tablist" aria-label="Bar size">
                {OPTIONS.map(o => (
                  <button key={o.id} role="tab" aria-selected={granularity === o.id} onClick={() => pick(o.id)}>{o.label}</button>
                ))}
              </div>
            </div>
          </div>
          {data && monitors.length === 0 ? (
            <div className="pcard"><p className="table-note">No services are published yet.</p></div>
          ) : (
            <>
              <div className="pcard">
                {monitors.map(m => (
                  <article className="svc" key={m.id} data-testid="service" data-status={m.status}>
                    <span className={`svc-ico svc-ico-${m.status.toLowerCase()}`} aria-hidden />
                    <h3>{m.name}</h3>
                    <span className="sr-only">{m.status === 'UP' ? 'Operational' : m.status === 'DOWN' ? `Down for ${since(m.statusSince, now)}` : 'Checking'}</span>
                    <div className="segs" role="img" aria-label={`${m.name}: uptime per ${granularity}`}>
                      {m.buckets.map(b => (
                        <span key={b.start} className={`seg ${segClass(b.uptime)}`}>
                          <span className="seg-tip">{bucketLabel(granularity, b.start)} · {b.uptime == null ? 'No data' : pct(b.uptime)}</span>
                        </span>
                      ))}
                    </div>
                    <span className="svc-pct">{pct(m.uptime)}</span>
                  </article>
                ))}
              </div>
              {monitors.length > 0 && (
                <div className="svc-axis" aria-hidden>
                  <span className="axis"><span>{monitors[0].buckets.length} {option.unit} ago</span><span>{option.today}</span></span>
                </div>
              )}
            </>
          )}
          <p className="pnote">Each bar shows uptime for one {granularity}. Hover a bar for the details.</p>
        </section>

        {past.length > 0 && (
          <section className="psec public-incidents" aria-labelledby="past-title">
            <div className="psec-head"><h2 id="past-title">Past incidents</h2></div>
            <div className="pcard past">
              {past.map(i => (
                <article className="inc" key={i.id}>
                  <div>
                    <h3>{i.monitor} outage</h3>
                    <p className="inc-meta">{fmtDateTime(i.startedAt)} · lasted {duration((Date.parse(i.resolvedAt!) - Date.parse(i.startedAt)) / 1000)}</p>
                  </div>
                  <span className="tag tag-green">Resolved</span>
                </article>
              ))}
            </div>
          </section>
        )}
      </main>

      <footer className="public-foot">
        <div className="public-in"><span>Powered by Pulse · UTC</span></div>
      </footer>
    </div>
  )
}

function fmtDateTime(iso: string) {
  return new Date(iso).toLocaleString([], { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' })
}

function bucketLabel(g: Granularity, start: string) {
  const d = new Date(start + 'T00:00:00Z')
  const f = (x: Date, o: Intl.DateTimeFormatOptions) => x.toLocaleDateString([], { ...o, timeZone: 'UTC' })
  if (g === 'day') return f(d, { month: 'short', day: 'numeric', year: 'numeric' })
  if (g === 'week') return `${f(d, { month: 'short', day: 'numeric' })} – ${f(new Date(d.getTime() + 6 * 864e5), { month: 'short', day: 'numeric' })}`
  return f(d, { month: 'long', year: 'numeric' })
}

function segClass(u: number | null) {
  if (u == null) return 'seg-empty'
  if (u >= 99.9) return 'seg-up'
  if (u >= 99) return 'seg-minor'
  if (u >= 95) return 'seg-warn'
  return 'seg-down'
}
