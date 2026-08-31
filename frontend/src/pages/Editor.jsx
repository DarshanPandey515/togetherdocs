import { useEffect, useState } from 'react'
import FroalaEditorComponent from 'react-froala-wysiwyg'
import 'froala-editor/css/froala_style.min.css'
import 'froala-editor/css/froala_editor.pkgd.min.css'
import 'froala-editor/js/plugins.pkgd.min.js'
import { api, ApiError } from '../api'
import Brand from '../components/Brand'

const FroalaEditor = FroalaEditorComponent.default || FroalaEditorComponent

const EDITOR_CONFIG = {
  toolbarButtons: [
    ['bold', 'italic', 'underline', 'strikeThrough'],
    ['fontFamily', 'fontSize'],
    ['textColor', 'backgroundColor'],
    ['paragraphFormat', 'alignLeft', 'alignCenter', 'alignRight', 'alignJustify'],
    ['formatOL', 'formatUL', 'indent', 'outdent'],
    ['insertLink', 'insertImage', 'insertTable'],
    ['undo', 'redo', 'fullscreen', 'codeView'],
  ],
  placeholderText: 'Write something amazing…',
  heightMin: 400,
  charCounterCount: true,
}

const secondaryBtn =
  'border border-line bg-paper px-3 py-1.5 text-xs font-medium hover:bg-mist'
const primaryBtn =
  'bg-ink px-3 py-1.5 text-xs font-medium text-paper hover:bg-coal disabled:opacity-50'

export default function Editor({ docId, onBack }) {
  const [doc, setDoc] = useState(null)
  const [content, setContent] = useState('')
  const [title, setTitle] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [status, setStatus] = useState('')
  const [error, setError] = useState('')
  const [showShare, setShowShare] = useState(false)
  const [showVersions, setShowVersions] = useState(false)
  const [versions, setVersions] = useState([])
  const [preview, setPreview] = useState(null)

  const [shareEmail, setShareEmail] = useState('')
  const [shareRole, setShareRole] = useState('viewer')
  const [shareBusy, setShareBusy] = useState(false)
  const [shareOk, setShareOk] = useState(false)
  const [shareMessage, setShareMessage] = useState('')

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError('')
    api
      .getDocument(docId)
      .then((data) => {
        if (cancelled) return
        setDoc(data)
        setTitle(data.title)
        setContent(data.content)
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof ApiError ? err.message : 'Failed to load document.')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [docId])

  async function handleSave() {
    setSaving(true)
    setError('')
    setStatus('')
    try {
      const updated = await api.updateDocument(docId, { title, content })
      setDoc(updated)
      setTitle(updated.title)
      setStatus(`Saved · v${updated.version}`)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to save document.')
    } finally {
      setSaving(false)
    }
  }

  async function handleShare(event) {
    event.preventDefault()
    setShareBusy(true)
    setShareMessage('')
    try {
      await api.shareDocument(docId, { email: shareEmail.trim(), role: shareRole })
      setShareOk(true)
      setShareMessage(`Shared with ${shareEmail.trim()} as ${shareRole}.`)
      setShareEmail('')
    } catch (err) {
      setShareOk(false)
      setShareMessage(err instanceof ApiError ? err.message : 'Failed to share.')
    } finally {
      setShareBusy(false)
    }
  }

  async function loadVersions() {
    if (!showVersions) {
      try {
        setVersions(await api.listVersions(docId))
      } catch (err) {
        setError(err instanceof ApiError ? err.message : 'Failed to load versions.')
      }
    }
    setShowVersions((prev) => !prev)
  }

  if (loading) {
    return (
      <div className="desk grid min-h-screen place-items-center font-mono text-xs text-smoke">
        Loading document…
      </div>
    )
  }

  if (error && !doc) {
    return (
      <div className="desk grid min-h-screen place-items-center">
        <div className="text-center">
          <p className="text-sm text-red-600">{error}</p>
          <button onClick={onBack} className={`mt-4 ${secondaryBtn}`}>
            ← Documents
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-10 flex h-11 items-center justify-between border-b border-line bg-paper px-4">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="font-mono text-xs text-smoke hover:text-ink">
            ← Documents
          </button>
          <Brand />
        </div>
        <div className="flex items-center gap-2">
          <button onClick={loadVersions} className={secondaryBtn}>
            {showVersions ? 'Hide history' : 'History'}
          </button>
          <button onClick={() => setShowShare(true)} className={secondaryBtn}>
            Share
          </button>
          <button className={primaryBtn} disabled={saving} onClick={handleSave}>
            {saving ? 'Saving…' : 'Save'}
          </button>
        </div>
      </header>

      <main className="desk flex-1 px-4 py-8">
        <div className="sheet mx-auto max-w-3xl px-10 py-10">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Untitled document"
            className="w-full border border-transparent bg-transparent px-0 py-0 font-display text-3xl font-semibold tracking-tight placeholder:text-smoke/60 focus:border-b focus:border-ink focus:outline-none"
          />

          <div className="mt-4 flex flex-wrap items-center gap-3">
            <span className="border border-ink px-1.5 py-0.5 font-mono text-[11px] font-medium">
              v{doc.version}
            </span>
            <span className="font-mono text-[11px] text-smoke">{doc.owner_name}</span>
            {status && <span className="font-mono text-[11px] text-smoke">{status}</span>}
            {error && <span className="font-mono text-[11px] text-red-600">{error}</span>}
          </div>

          <div className="mt-7">
            <FroalaEditor
              tag="textarea"
              model={content}
              onModelChange={(newContent) => setContent(newContent)}
              config={EDITOR_CONFIG}
            />
          </div>
        </div>
      </main>

      {showShare && (
        <div className="fixed inset-0 z-30 grid place-items-center bg-ink/50 p-4" onClick={() => setShowShare(false)}>
          <div className="w-full max-w-sm border border-line bg-paper p-6" onClick={(e) => e.stopPropagation()}>
            <h2 className="font-display text-lg font-semibold tracking-tight">Share document</h2>
            <form onSubmit={handleShare} className="mt-5">
              <label className="block">
                <span className="text-xs text-smoke">Email</span>
                <input
                  type="email"
                  value={shareEmail}
                  onChange={(e) => setShareEmail(e.target.value)}
                  placeholder="person@example.com"
                  required
                  className="mt-1.5 w-full border border-line bg-paper px-3 py-2 text-sm placeholder:text-smoke focus:border-ink focus:outline-none"
                />
              </label>
              <label className="mt-4 block">
                <span className="text-xs text-smoke">Role</span>
                <select
                  value={shareRole}
                  onChange={(e) => setShareRole(e.target.value)}
                  className="mt-1.5 w-full border border-line bg-paper px-3 py-2 text-sm focus:border-ink focus:outline-none"
                >
                  <option value="viewer">Viewer</option>
                  <option value="editor">Editor</option>
                </select>
              </label>
              {shareMessage && (
                <p className={`mt-3 text-xs ${shareOk ? 'text-smoke' : 'text-red-600'}`}>{shareMessage}</p>
              )}
              <div className="mt-6 flex justify-end gap-2">
                <button type="button" className={secondaryBtn} onClick={() => setShowShare(false)}>
                  Close
                </button>
                <button type="submit" className={primaryBtn} disabled={shareBusy}>
                  {shareBusy ? 'Sharing…' : 'Share'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showVersions && (
        <aside className="fixed right-0 top-0 z-20 flex h-full w-72 flex-col border-l border-line bg-paper">
          <div className="flex items-center justify-between border-b border-line px-4 py-3">
            <h2 className="font-display text-sm font-semibold tracking-tight">Version history</h2>
            <button onClick={loadVersions} className="font-mono text-xs text-smoke hover:text-ink">
              Close
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-4">
            {versions.length === 0 && <p className="font-mono text-xs text-smoke">No versions yet.</p>}
            {versions.map((v) => (
              <button
                key={v.id}
                onClick={() => setPreview(v)}
                className={`mb-2 flex w-full items-center gap-2 border px-3 py-2 text-left transition-colors duration-150 ${
                  preview?.id === v.id ? 'border-ink bg-ink text-paper' : 'border-line hover:bg-mist'
                }`}
              >
                <span className="font-mono text-xs font-medium">v{v.version}</span>
                <span
                  className={`font-mono text-[11px] ${preview?.id === v.id ? 'text-paper/70' : 'text-smoke'}`}
                >
                  {v.created_by_name} · {formatDate(v.created_at)}
                </span>
              </button>
            ))}
            {preview && (
              <div className="mt-4 border border-line bg-fog p-4">
                <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-smoke">
                  Preview · v{preview.version}
                </p>
                <div className="mt-2 text-sm" dangerouslySetInnerHTML={{ __html: preview.content }} />
              </div>
            )}
          </div>
        </aside>
      )}
    </div>
  )
}

function formatDate(value) {
  if (!value) return ''
  return new Date(value).toLocaleString()
}