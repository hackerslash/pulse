import { useEffect, useState } from 'react'
import { api } from './api'
import { App } from './App'
import { Icon, Logo } from './ui'

export function Admin() {
  const [state, setState] = useState<'checking' | 'in' | 'out'>('checking')

  useEffect(() => {
    api.me().then(() => setState('in'), () => setState('out'))
    const out = () => setState('out')
    window.addEventListener('pulse:unauthorized', out)
    return () => window.removeEventListener('pulse:unauthorized', out)
  }, [])

  if (state === 'checking') return <div className="shell" />
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
    <main className="login-page">
      <form className="login" onSubmit={submit}>
        <span className="brand"><Logo /><span className="wordmark">Pulse</span></span>
        <h1>Sign in to Pulse</h1>
        <p>Enter the admin password set in <code>PULSE_PASSWORD</code> to manage monitors and webhooks.</p>
        <label className="field">
          <span>Password</span>
          <input type="password" name="password" autoComplete="current-password" autoFocus required value={password}
            onChange={e => setPassword(e.target.value)} aria-invalid={!!error} />
        </label>
        {error && <p className="form-error" role="alert">{error}</p>}
        <button className="btn btn-primary btn-block" disabled={busy}>{busy ? 'Signing in…' : 'Sign in'}</button>
        <a className="login-alt" href="/"><Icon name="globe" size={14} /> View the public status page</a>
      </form>
    </main>
  )
}
