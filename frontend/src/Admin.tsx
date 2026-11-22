import { useEffect, useState } from 'react'
import { api } from './api'
import { App } from './App'
import { Backdrop, Icon, Logo } from './ui'

export function Admin() {
  const [state, setState] = useState<'checking' | 'in' | 'out'>('checking')

  useEffect(() => {
    api.me().then(() => setState('in'), () => setState('out'))
    const out = () => setState('out')
    window.addEventListener('pulse:unauthorized', out)
    return () => window.removeEventListener('pulse:unauthorized', out)
  }, [])

  if (state === 'checking') return <div className="app"><Backdrop /></div>
  if (state === 'out') return <Login onIn={() => setState('in')} />
  return <App onLogout={() => api.logout().finally(() => setState('out'))} />
}

function Login({ onIn }: { onIn: () => void }) {
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setBusy(true)
    setError(null)
    try {
      await api.login(password)
      onIn()
    } catch (err) {
      setError((err as Error).message)
      setPassword('')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="app login-wrap">
      <Backdrop />
      <form className={`login glass ${error ? 'shake' : ''}`} onSubmit={submit} key={error ?? 'ok'}>
        <Logo />
        <h1>Sign in to Pulse</h1>
        <p className="muted">Enter the admin password to manage monitors.</p>
        <label className="field">
          <span>Password</span>
          <input type="password" name="password" autoComplete="current-password" autoFocus required value={password} onChange={e => setPassword(e.target.value)} />
        </label>
        {error && <p className="form-error" role="alert">{error}</p>}
        <button className="btn primary login-btn" disabled={busy}>{busy ? 'Signing in…' : 'Sign in'}</button>
        <a className="muted back" href="/"><Icon name="globe" size={14} /> View public status page</a>
      </form>
    </div>
  )
}
