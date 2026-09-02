import { useEffect, useState } from 'react'
import { api, ApiError } from '../lib/api'
import DashboardHeader from '../components/DashboardHeader'
import DocCard from '../components/DocCard'

export default function Dashboard({ user, onOpen, onLogout }) {
  const [docs, setDocs] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [newTitle, setNewTitle] = useState('')
  const [creating, setCreating] = useState(false)
  const [deletingId, setDeletingId] = useState(null)

  async function load() {
    setLoading(true)
    setError('')
    try {
      setDocs(await api.listDocuments())
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to load documents.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  async function handleCreate(event) {
    event.preventDefault()
    const title = newTitle.trim() || 'Untitled document'
    setCreating(true)
    setError('')
    try {
      const doc = await api.createDocument({ title, content: '<p></p>' })
      setNewTitle('')
      onOpen(doc.id)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to create document.')
    } finally {
      setCreating(false)
    }
  }

  async function handleDelete(id, event) {
    event.stopPropagation()
    if (!window.confirm('Delete this document permanently?')) return
    setDeletingId(id)
    setError('')
    try {
      await api.deleteDocument(id)
      setDocs((prev) => prev.filter((d) => d.id !== id))
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to delete document.')
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div className="flex min-h-screen flex-col">
      <DashboardHeader user={user} onLogout={onLogout} />

      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8 sm:px-6">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-violet-600">
              Your workspace
            </p>
            <h1 className="mt-1 font-display text-2xl font-semibold tracking-tight text-ink">
              Documents
            </h1>
          </div>
          <span className="rounded-full bg-paper px-3 py-1 text-xs font-medium text-smoke shadow-sm">
            {loading ? '…' : `${docs.length} ${docs.length === 1 ? 'document' : 'documents'}`}
          </span>
        </div>

        <form onSubmit={handleCreate} className="mt-6 flex flex-col gap-2 sm:flex-row sm:gap-2.5">
          <input
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            placeholder="Untitled document"
            className="h-11 flex-1 rounded-xl border border-line bg-paper px-4 text-sm placeholder:text-smoke shadow-sm transition focus:border-violet focus:outline-none"
          />
          <button
            type="submit"
            disabled={creating}
            className="inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-xl bg-ink px-5 text-sm font-semibold text-paper shadow-[0_8px_20px_rgba(62,15,141,0.28)] transition hover:bg-ink-600 disabled:opacity-50"
          >
            <svg className="size-4 text-sun" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
              <path d="M8 2a1 1 0 0 1 1 1v4h4a1 1 0 1 1 0 2H9v4a1 1 0 1 1-2 0V9H3a1 1 0 1 1 0-2h4V3a1 1 0 0 1 1-1Z" />
            </svg>
            {creating ? 'Creating…' : 'New document'}
          </button>
        </form>

        {error && (
          <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-[13px] text-red-700">{error}</p>
        )}

        <section className="mt-6">
          {loading && (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-28 animate-pulse rounded-2xl bg-line/60" />
              ))}
            </div>
          )}

          {!loading && docs.length === 0 && (
            <div className="rounded-2xl border border-dashed border-line bg-paper px-6 py-16 text-center">
              <p className="font-display text-base font-semibold text-ink">No documents yet</p>
              <p className="mt-1 text-sm text-smoke">
                Name one above and hit <span className="font-medium text-ink">New document</span> to
                start writing.
              </p>
            </div>
          )}

          {!loading && docs.length > 0 && (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {docs.map((doc) => (
                <DocCard
                  key={doc.id}
                  doc={doc}
                  deleting={deletingId === doc.id}
                  onOpen={onOpen}
                  onDelete={handleDelete}
                />
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  )
}