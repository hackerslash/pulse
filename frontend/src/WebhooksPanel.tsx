import { useEffect, useState } from 'react'
import { api, type Webhook } from './api'
import { ago } from './format'
import { Icon } from './ui'

export function WebhooksPanel({ onClose, toast, now }: { onClose: () => void; toast: (t: string, k?: 'ok' | 'err') => void; now: number }) {
  const [hooks, setHooks] = useState<Webhook[] | null>(null)
  const [name, setName] = useState('')
  const [url, setUrl] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState<number | 'new' | null>(null)

  const load = () => api.webhooks().then(setHooks).catch(e => setError(e.message))
  useEffect(() => { load() }, [])

  const add = async (e: React.FormEvent) => {
    e.preventDefault()
    setBusy('new')
    setError(null)
    try {
      await api.createWebhook({ name: name.trim() || 'Webhook', url: url.trim(), enabled: true })
      setName('')
      setUrl('')
      toast('Webhook added')
      await load()
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setBusy(null)
    }
  }

  const act = async (id: number, fn: () => Promise<unknown>, ok?: string) => {
    setBusy(id)
    try {
      await fn()
      if (ok) toast(ok)
    } catch (e) {
      toast((e as Error).message, 'err')
    } finally {
      setBusy(null)
      load()
    }
  }

  const test = (w: Webhook) => act(w.id, async () => {
    const r = await api.testWebhook(w.id)
    toast(r.lastError ? `Test failed: ${r.lastError}` : `Test delivered (HTTP ${r.lastStatusCode})`, r.lastError ? 'err' : 'ok')
  })

  return (
    <div>
      <header className="dialog-head">
        <div>
          <h2>Outage webhooks</h2>
          <p className="muted">Every enabled webhook gets a JSON <code>POST</code> when a monitor goes down or recovers.</p>
        </div>
        <button className="btn btn-icon" onClick={onClose} aria-label="Close"><Icon name="close" /></button>
      </header>

      <ul className="hook-list">
        {hooks?.map(w => (
          <li key={w.id} className={`hook ${w.enabled ? '' : 'hook-off'}`} data-testid="webhook">
            <label className="switch" title={w.enabled ? 'Enabled' : 'Disabled'}>
              <input type="checkbox" checked={w.enabled} aria-label={`Enable ${w.name}`}
                onChange={e => {
                  const enabled = e.target.checked
                  setHooks(hs => hs!.map(h => (h.id === w.id ? { ...h, enabled } : h)))
                  act(w.id, () => api.updateWebhook(w.id, { name: w.name, url: w.url, enabled }))
                }} />
              <span />
            </label>
            <div className="hook-main">
              <strong>{w.name}</strong>
              <span className="mono muted ellipsis">{w.url}</span>
              <span className={`hook-status ${w.lastError ? 'err' : w.lastSentAt ? 'ok' : ''}`}>
                {w.lastSentAt
                  ? <><Icon name={w.lastError ? 'alert' : 'check'} size={13} /> {w.lastError ?? 'Delivered'} · {ago(w.lastSentAt, now)}</>
                  : 'Never sent'}
              </span>
            </div>
            <button className="btn btn-small" disabled={busy === w.id} onClick={() => test(w)}><Icon name="send" size={14} /> {busy === w.id ? 'Sending…' : 'Test'}</button>
            <button className="btn btn-icon btn-danger-quiet" disabled={busy === w.id} onClick={() => act(w.id, () => api.deleteWebhook(w.id), 'Webhook removed')} aria-label={`Delete ${w.name}`}><Icon name="trash" /></button>
          </li>
        ))}
        {hooks?.length === 0 && <li className="hook-empty muted">No webhooks yet. Add one below to get pinged on outages.</li>}
      </ul>

      <form className="hook-form" onSubmit={add}>
        <input aria-label="Webhook name" placeholder="Name (e.g. Slack #ops)" value={name} maxLength={80} onChange={e => setName(e.target.value)} />
        <input aria-label="Webhook URL" type="url" required placeholder="https://hooks.slack.com/services/…" className="mono" value={url} onChange={e => setUrl(e.target.value)} />
        <button className="btn btn-primary" disabled={busy === 'new'}><Icon name="plus" /> Add</button>
      </form>
      {error && <p className="form-error" role="alert">{error}</p>}

      <details className="payload">
        <summary><Icon name="chevron" size={14} /> Payload format · works with Slack, Discord, Telegram</summary>
        <pre className="mono">{`{
  "event": "down",            // "down" | "up" | "test"
  "text": "🔴 API is DOWN — HTTP 502\\nhttps://…",   // Slack, Telegram
  "content": "…same text…",   // Discord
  "monitor": { "id": 1, "name": "API", "url": "https://…" },
  "error": "HTTP 502",        // on down
  "downtimeSeconds": 312,     // on up
  "at": "2026-11-22T10:00:00Z"
}`}</pre>
        <p className="muted">Telegram: use <code className="mono">https://api.telegram.org/bot&lt;token&gt;/sendMessage?chat_id=&lt;id&gt;</code></p>
      </details>
    </div>
  )
}
