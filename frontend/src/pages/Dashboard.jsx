import { useEffect, useState } from 'react'
import { api, ApiError } from '../api'
import Brand from '../components/Brand'

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
      <header className="sticky top-0 z-10 flex h-11 items-center justify-between border-b border-line bg-paper px-4">
        <Brand />
        <div className="flex items-center gap-3">
          <span className="font-mono text-xs text-smoke">{user?.name || user?.email}</span>
          <button
            onClick={onLogout}
            className="font-mono text-xs text-smoke hover:text-ink"
          >
            Sign out
          </button>
        </div>
      </header>

      <main className="mx-auto w-full max-w-2xl px-4 py-10">
        <div className="flex items-end justify-between">
          <div>
            <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-smoke">Your workspace</p>
            <h1 className="mt-1 font-display text-3xl font-semibold tracking-tight">Documents</h1>
          </div>
          <span className="font-mono text-xs text-smoke">
            {loading ? '…' : `${docs.length} ${docs.length === 1 ? 'document' : 'documents'}`}
          </span>
        </div>

        <form onSubmit={handleCreate} className="mt-7 flex gap-2">
          <input
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            placeholder="Untitled document"
            className="flex-1 border border-line bg-paper px-3 py-2 text-sm placeholder:text-smoke focus:border-ink focus:outline-none"
          />
          <button
            type="submit"
            disabled={creating}
            className="shrink-0 bg-ink px-4 py-2 text-sm font-medium text-paper hover:bg-coal disabled:opacity-50"
          >
            {creating ? 'Creating…' : 'New document'}
          </button>
        </form>

        {error && <p className="mt-3 text-[13px] text-red-600">{error}</p>}

        <section className="mt-6 border border-line bg-paper">
          {loading && (
            <p className="px-4 py-10 text-center font-mono text-xs text-smoke">Loading documents…</p>
          )}
          {!loading && docs.length === 0 && (
            <p className="border border-dashed border-line bg-fog px-4 py-12 text-center font-mono text-xs text-smoke">
              No documents yet — create your first above.
            </p>
          )}
          {!loading &&
            docs.map((doc) => (
              <div
                key={doc.id}
                role="button"
                tabIndex={0}
                onClick={() => onOpen(doc.id)}
                onKeyDown={(e) => e.key === 'Enter' && onOpen(doc.id)}
                className="group flex cursor-pointer items-center justify-between gap-3 border-b border-line px-4 py-3 transition-colors duration-150 last:border-b-0 hover:bg-ink hover:text-paper"
              >
                <div className="min-w-0">
                  <div className="truncate text-sm font-medium">{doc.title}</div>
                  <div className="mt-0.5 font-mono text-[11px] text-smoke group-hover:text-paper/70">
                    {doc.owner_name} · v{doc.version} · {formatDate(doc.updated_at)}
                  </div>
                </div>
                <button
                  className="shrink-0 px-2 py-1 font-mono text-xs text-smoke opacity-0 transition-opacity duration-150 group-hover:opacity-100 group-hover:text-paper hover:!text-red-500 disabled:opacity-0"
                  disabled={deletingId === doc.id}
                  onClick={(e) => handleDelete(doc.id, e)}
                  aria-label={`Delete ${doc.title}`}
                >
                  {deletingId === doc.id ? '…' : '×'}
                </button>
              </div>
            ))}
        </section>
      </main>
    </div>
  )
}

function formatDate(value) {
  if (!value) return ''
  return new Date(value).toLocaleString()
}