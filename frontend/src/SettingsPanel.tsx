import { useEffect, useState } from 'react'
import { api, type Granularity } from './api'
import { OPTIONS } from './granularity'
import { Icon } from './ui'

export function SettingsPanel({ onClose, toast }: { onClose: () => void; toast: (t: string, k?: 'ok' | 'err') => void }) {
  const [value, setValue] = useState<Granularity | null>(null)
  const [busy, setBusy] = useState(false)

  useEffect(() => { api.settings().then(s => setValue(s.granularity), e => toast(e.message, 'err')) }, [])

  const pick = async (g: Granularity) => {
    const previous = value
    setValue(g)
    setBusy(true)
    try {
      await api.saveSettings(g)
      toast(`Status page now shows ${OPTIONS.find(o => o.id === g)!.span}`)
    } catch (e) {
      setValue(previous)
      toast((e as Error).message, 'err')
    } finally {
      setBusy(false)
    }
  }

  const current = OPTIONS.find(o => o.id === value)

  return (
    <div>
      <header className="dialog-head">
        <div>
          <h2>Settings</h2>
          <p>Choose how much history the public status page shows. Visitors can't change it.</p>
        </div>
        <button className="btn btn-icon" onClick={onClose} aria-label="Close"><Icon name="close" /></button>
      </header>

      <div className="field">
        <span id="window-label">Status page window</span>
        <div className="segmented" role="radiogroup" aria-labelledby="window-label">
          {OPTIONS.map(o => (
            <button type="button" role="radio" aria-checked={value === o.id} key={o.id} className={value === o.id ? 'on' : ''} disabled={busy || value === null} onClick={() => pick(o.id)}>
              {o.label}
            </button>
          ))}
        </div>
        <small className="muted">{current ? `Last ${current.span}, one bar per ${current.cell}. Periods with no checks are grey.` : 'Loading…'}</small>
      </div>
    </div>
  )
}
