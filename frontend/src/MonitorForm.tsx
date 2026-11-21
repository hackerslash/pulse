import { useState } from 'react'
import { api, type Monitor } from './api'
import { interval } from './format'
import { Icon } from './ui'

const INTERVALS = [30, 60, 300, 900, 3600]

export function MonitorForm({ initial, onDone, onCancel }: { initial?: Monitor; onDone: (m: Monitor) => void; onCancel: () => void }) {
  const [name, setName] = useState(initial?.name ?? '')
  const [url, setUrl] = useState(initial?.url ?? 'https://')
  const [every, setEvery] = useState(initial?.intervalSeconds ?? 60)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setBusy(true)
    setError(null)
    try {
      const form = { name: name.trim() || hostGuess(url), url: url.trim(), intervalSeconds: every }
      onDone(initial ? await api.updateMonitor(initial.id, form) : await api.createMonitor(form))
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <form className="form" onSubmit={submit}>
      <header className="modal-head">
        <div>
          <h2>{initial ? 'Edit monitor' : 'New monitor'}</h2>
          <p className="muted">We'll send an HTTP GET and treat anything under 400 as up.</p>
        </div>
        <button type="button" className="icon-btn" onClick={onCancel} aria-label="Close"><Icon name="close" /></button>
      </header>

      <label className="field">
        <span>URL</span>
        <input name="url" type="url" required autoFocus value={url} onChange={e => setUrl(e.target.value)} placeholder="https://example.com/health" className="mono" />
      </label>
      <label className="field">
        <span>Name <em>optional</em></span>
        <input name="name" value={name} maxLength={80} onChange={e => setName(e.target.value)} placeholder={hostGuess(url) || 'My API'} />
      </label>
      <div className="field">
        <span>Check every</span>
        <div className="segmented" role="radiogroup" aria-label="Check interval">
          {INTERVALS.map(s => (
            <button type="button" role="radio" aria-checked={every === s} key={s} className={every === s ? 'on' : ''} onClick={() => setEvery(s)}>
              {interval(s)}
            </button>
          ))}
        </div>
      </div>

      {error && <p className="form-error" role="alert">{error}</p>}

      <footer className="modal-foot">
        <button type="button" className="btn ghost" onClick={onCancel}>Cancel</button>
        <button type="submit" className="btn primary" disabled={busy}>{busy ? 'Saving…' : initial ? 'Save changes' : 'Start monitoring'}</button>
      </footer>
    </form>
  )
}

function hostGuess(url: string) {
  try {
    return new URL(url).hostname.replace(/^www\./, '')
  } catch {
    return ''
  }
}
