import { useState } from 'react'
import { api, setToken, setUser, ApiError } from '../api'
import Brand from '../components/Brand'

export default function AuthPage({ onAuthed }) {
  const [mode, setMode] = useState('login')
  const [form, setForm] = useState({ email: '', password: '', name: '' })
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  function update(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')
    setBusy(true)
    try {
      if (mode === 'login') {
        const data = await api.login({ email: form.email, password: form.password })
        setToken(data.access)
        setUser(data.user)
        onAuthed()
      } else {
        await api.signup({ email: form.email, password: form.password, name: form.name })
        const data = await api.login({ email: form.email, password: form.password })
        setToken(data.access)
        setUser(data.user)
        onAuthed()
      }
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Something went wrong.')
    } finally {
      setBusy(false)
    }
  }

  const inputClass =
    'w-full border border-line bg-paper px-3 py-2 text-sm placeholder:text-smoke focus:border-ink focus:outline-none'

  return (
    <div className="desk grid min-h-screen place-items-center p-4">
      <form
        onSubmit={handleSubmit}
        className="rise w-full max-w-sm border border-line bg-paper p-8 shadow-[0_1px_2px_rgba(0,0,0,0.05),0_16px_40px_rgba(0,0,0,0.10)]"
      >
        <div className="flex justify-center">
          <Brand />
        </div>
        <p className="mt-5 text-center font-mono text-[11px] uppercase tracking-[0.2em] text-smoke">
          {mode === 'login' ? 'Sign in' : 'Create account'}
        </p>

        {mode === 'signup' && (
          <label className="mt-6 block">
            <span className="text-xs text-smoke">Name</span>
            <input
              className={`mt-1.5 ${inputClass}`}
              value={form.name}
              onChange={(e) => update('name', e.target.value)}
              placeholder="Your name"
              required
            />
          </label>
        )}

        <label className="mt-4 block">
          <span className="text-xs text-smoke">Email</span>
          <input
            type="email"
            className={`mt-1.5 ${inputClass}`}
            value={form.email}
            onChange={(e) => update('email', e.target.value)}
            placeholder="you@example.com"
            required
          />
        </label>

        <label className="mt-4 block">
          <span className="text-xs text-smoke">Password</span>
          <input
            type="password"
            className={`mt-1.5 ${inputClass}`}
            value={form.password}
            onChange={(e) => update('password', e.target.value)}
            placeholder="••••••••"
            minLength={mode === 'signup' ? 8 : undefined}
            required
          />
        </label>

        {error && <p className="mt-4 text-center text-[13px] text-red-600">{error}</p>}

        <button
          type="submit"
          disabled={busy}
          className="mt-6 w-full bg-ink py-2.5 text-sm font-medium text-paper hover:bg-coal disabled:opacity-50"
        >
          {busy ? 'Please wait…' : mode === 'login' ? 'Sign in' : 'Create account'}
        </button>

        <p className="mt-4 text-center text-xs text-smoke">
          {mode === 'login' ? (
            <>
              Don&apos;t have an account?{' '}
              <button
                type="button"
                className="font-medium text-ink underline underline-offset-2 hover:text-smoke"
                onClick={() => setMode('signup')}
              >
                Sign up
              </button>
            </>
          ) : (
            <>
              Already have an account?{' '}
              <button
                type="button"
                className="font-medium text-ink underline underline-offset-2 hover:text-smoke"
                onClick={() => setMode('login')}
              >
                Sign in
              </button>
            </>
          )}
        </p>
      </form>
    </div>
  )
}