import { useState } from 'react'
import { api, setToken, setUser, ApiError } from '../lib/api'
import { inputClass } from '../lib/ui'
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
      let data
      if (mode === 'login') {
        data = await api.login({ email: form.email, password: form.password })
      } else {
        await api.signup({ email: form.email, password: form.password, name: form.name })
        data = await api.login({ email: form.email, password: form.password })
      }
      setToken(data.access)
      setUser(data.user)
      onAuthed()
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Something went wrong.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="desk grid min-h-screen place-items-center p-4">
      <form
        onSubmit={handleSubmit}
        className="rise w-full max-w-sm rounded-3xl border border-line bg-paper p-8 shadow-[0_1px_2px_rgba(62,15,141,0.04),0_24px_60px_rgba(62,15,141,0.16)]"
      >
        <div className="flex flex-col items-center">
          <Brand />
          <p className="mt-6 font-display text-xl font-semibold tracking-tight text-ink">
            {mode === 'login' ? 'Welcome back' : 'Create your account'}
          </p>
          <p className="mt-1 text-sm text-smoke">
            {mode === 'login'
              ? 'Sign in to get back to your documents.'
              : 'Start collaborating in minutes.'}
          </p>
        </div>

        {mode === 'signup' && (
          <label className="mt-7 block">
            <span className="text-xs font-medium text-smoke">Name</span>
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
          <span className="text-xs font-medium text-smoke">Email</span>
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
          <span className="text-xs font-medium text-smoke">Password</span>
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

        {error && (
          <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-center text-[13px] text-red-700">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={busy}
          className="mt-6 inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-ink text-sm font-semibold text-paper shadow-[0_10px_24px_rgba(62,15,141,0.28)] transition hover:bg-ink-600 disabled:opacity-50"
        >
          {busy ? 'Please wait…' : mode === 'login' ? 'Sign in' : 'Create account'}
          {!busy && (
            <svg className="size-4 text-sun" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
              <path d="M8.7 2.3a1 1 0 0 0-1.4 0l-3 3a1 1 0 1 0 1.4 1.4L7 5.4V13a1 1 0 1 0 2 0V5.4l1.3 1.3a1 1 0 0 0 1.4-1.4l-3-3Z" />
            </svg>
          )}
        </button>

        <p className="mt-4 text-center text-xs text-smoke">
          {mode === 'login' ? (
            <>
              Don&apos;t have an account?{' '}
              <button
                type="button"
                className="font-semibold text-ink underline underline-offset-2 hover:text-violet-600"
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
                className="font-semibold text-ink underline underline-offset-2 hover:text-violet-600"
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
