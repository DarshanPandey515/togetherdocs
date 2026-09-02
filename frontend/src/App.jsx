import { useEffect, useState } from 'react'
import { getToken, getUser, clearAuth } from './lib/api'
import AuthPage from './pages/AuthPage'
import Dashboard from './pages/Dashboard'
import Editor from './pages/Editor'

export default function App() {
  const [authed, setAuthed] = useState(() => Boolean(getToken()))
  const [view, setView] = useState({ name: 'dashboard' })

  useEffect(() => {
    const onUnauthorized = () => setAuthed(false)
    window.addEventListener('auth:unauthorized', onUnauthorized)
    return () => window.removeEventListener('auth:unauthorized', onUnauthorized)
  }, [])

  function handleAuthed() {
    setAuthed(true)
    setView({ name: 'dashboard' })
  }

  function handleLogout() {
    clearAuth()
    setAuthed(false)
    setView({ name: 'dashboard' })
  }

  if (!authed) {
    return <AuthPage onAuthed={handleAuthed} />
  }

  if (view.name === 'editor') {
    return <Editor docId={view.docId} onBack={() => setView({ name: 'dashboard' })} />
  }

  return (
    <Dashboard
      user={getUser()}
      onOpen={(docId) => setView({ name: 'editor', docId })}
      onLogout={handleLogout}
    />
  )
}