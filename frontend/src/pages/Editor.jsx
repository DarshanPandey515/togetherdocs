import { useEffect, useRef, useState } from 'react'
import FroalaEditorComponent from 'react-froala-wysiwyg'
import 'froala-editor/css/froala_style.min.css'
import 'froala-editor/css/froala_editor.pkgd.min.css'
import 'froala-editor/js/plugins.pkgd.min.js'
import { api, ApiError } from '../lib/api'
import CollabClient from '../lib/collab'
import { secondaryBtn } from '../lib/ui'
import EditorHeader from '../components/EditorHeader'
import ShareModal from '../components/ShareModal'
import VersionPanel from '../components/VersionPanel'
import DocMeta from '../components/DocMeta'

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
  heightMin: 420,
  charCounterCount: true,
}

export default function Editor({ docId, onBack }) {
  const [doc, setDoc] = useState(null)
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [version, setVersion] = useState(0)
  const [connected, setConnected] = useState(false)
  const [online, setOnline] = useState(0)
  const [status, setStatus] = useState('Connecting…')
  const [conflict, setConflict] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  const [showShare, setShowShare] = useState(false)
  const [showVersions, setShowVersions] = useState(false)
  const [versions, setVersions] = useState([])
  const [preview, setPreview] = useState(null)

  const [shareEmail, setShareEmail] = useState('')
  const [shareRole, setShareRole] = useState('viewer')
  const [shareBusy, setShareBusy] = useState(false)
  const [shareOk, setShareOk] = useState(false)
  const [shareMessage, setShareMessage] = useState('')

  // Refs mirror the authoritative/latest values so async handlers never read
  // stale state from the render closure.
  const versionRef = useRef(0)
  const contentRef = useRef('')
  const remoteRef = useRef('')
  const pendingRef = useRef(null)
  const sendTimer = useRef(null)
  const titleTimer = useRef(null)
  const collabRef = useRef(null)

  // Initial load via REST (title/owner metadata + fallback content).
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
        contentRef.current = data.content
        remoteRef.current = data.content
        versionRef.current = data.version
        setVersion(data.version)
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

  // WebSocket collaboration connection.
  useEffect(() => {
    const client = new CollabClient(docId, {
      onConnected: () => {
        setConnected(true)
        setStatus('Syncing…')
      },
      onState: (data) => {
        const pending = pendingRef.current
        pendingRef.current = null
        setConnected(true)
        setConflict(false)
        if (pending != null && pending !== data.content) {
          // Client had offline edits; replay them on the authoritative version.
          versionRef.current = data.version
          setVersion(data.version)
          client.sendEdit(data.version, pending)
          setStatus('Sending pending changes…')
        } else {
          versionRef.current = data.version
          setVersion(data.version)
          contentRef.current = data.content
          remoteRef.current = data.content
          setContent(data.content)
          setStatus('Connected')
        }
      },
      onAck: (data) => {
        versionRef.current = data.version
        setVersion(data.version)
        setConflict(false)
        setStatus(`Saved · v${data.version}`)
      },
      onReject: (data) => {
        // Authoritative state — apply it so the client can recover.
        versionRef.current = data.version
        setVersion(data.version)
        contentRef.current = data.content
        remoteRef.current = data.content
        setContent(data.content)
        setConflict(true)
        setStatus(`Conflict — updated to v${data.version}`)
      },
      onBroadcast: (data) => {
        if (client.userId && data.user_id === client.userId) return
        versionRef.current = data.version
        setVersion(data.version)
        contentRef.current = data.content
        remoteRef.current = data.content
        setContent(data.content)
        setConflict(false)
      },
      onError: (data) => {
        setStatus(data.message || 'Error')
      },
      onStatus: (message) => {
        setConnected(false)
        setStatus(message)
      },
      onPresenceState: (users) => {
        setOnline(Array.isArray(users) ? users.length : 0)
      },
      onPresenceJoin: () => {
        setOnline((n) => n + 1)
      },
      onPresenceLeave: () => {
        setOnline((n) => Math.max(0, n - 1))
      },
    })
    collabRef.current = client
    return () => {
      clearTimeout(sendTimer.current)
      client.close()
      collabRef.current = null
    }
  }, [docId])

  function handleContentChange(newContent) {
    contentRef.current = newContent
    setContent(newContent)
    // Ignore echoes of server-applied content (from sync/broadcast/reject).
    if (newContent === remoteRef.current) return
    setStatus('Saving…')
    clearTimeout(sendTimer.current)
    sendTimer.current = setTimeout(flushEdit, 500)
  }

  function flushEdit() {
    clearTimeout(sendTimer.current)
    const client = collabRef.current
    if (!client || !client.connected) {
      pendingRef.current = contentRef.current
      setStatus('Offline — changes pending')
      return
    }
    remoteRef.current = contentRef.current
    client.sendEdit(versionRef.current, contentRef.current)
    setStatus('Saving…')
  }

  function handleTitleChange(next) {
    setTitle(next)
    clearTimeout(titleTimer.current)
    titleTimer.current = setTimeout(() => {
      api.updateDocument(docId, { title: next }).catch((err) => {
        setError(err instanceof ApiError ? err.message : 'Failed to save title.')
      })
    }, 600)
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
      <div className="desk grid min-h-screen place-items-center">
        <div className="flex items-center gap-3 rounded-full bg-paper px-5 py-3 text-sm text-smoke shadow-sm">
          <span className="live-dot" />
          Loading document…
        </div>
      </div>
    )
  }

  if (error && !doc) {
    return (
      <div className="desk grid min-h-screen place-items-center">
        <div className="rounded-2xl border border-line bg-paper p-8 text-center shadow-sm">
          <p className="text-sm text-red-700">{error}</p>
          <button onClick={onBack} className={`mt-4 ${secondaryBtn}`}>
            ← Documents
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col">
      <EditorHeader
        connected={connected}
        online={online}
        status={status}
        showVersions={showVersions}
        onBack={onBack}
        onToggleVersions={loadVersions}
        onOpenShare={() => setShowShare(true)}
        onSave={flushEdit}
      />

      <main className="desk flex-1 px-4 py-8">
        <div className="sheet mx-auto max-w-3xl px-6 py-8 sm:px-10 sm:py-10">
          <DocMeta
            title={title}
            onTitleChange={handleTitleChange}
            version={version}
            ownerName={doc.owner_name}
            status={status}
            error={error}
            conflict={conflict}
          />

          <div className="mt-6">
            <FroalaEditor
              tag="textarea"
              model={content}
              onModelChange={handleContentChange}
              config={EDITOR_CONFIG}
            />
          </div>
        </div>
      </main>

      <ShareModal
        open={showShare}
        onClose={() => setShowShare(false)}
        onSubmit={handleShare}
        email={shareEmail}
        onEmailChange={setShareEmail}
        role={shareRole}
        onRoleChange={setShareRole}
        busy={shareBusy}
        ok={shareOk}
        message={shareMessage}
      />

      <VersionPanel
        open={showVersions}
        onClose={loadVersions}
        versions={versions}
        preview={preview}
        onPreview={setPreview}
      />
    </div>
  )
}