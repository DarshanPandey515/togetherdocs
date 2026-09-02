import { formatDate } from '../lib/format'

export default function VersionPanel({ open, onClose, versions, preview, onPreview }) {
  if (!open) return null

  return (
    <aside className="fixed right-0 top-0 z-20 flex h-full w-80 flex-col border-l border-line bg-paper shadow-2xl">
      <div className="flex items-center justify-between border-b border-line px-5 py-4">
        <h2 className="font-display text-sm font-semibold tracking-tight text-ink">Version history</h2>
        <button onClick={onClose} className="text-xs font-medium text-smoke hover:text-ink">
          Close
        </button>
      </div>
      <div className="flex-1 overflow-y-auto p-4">
        {versions.length === 0 && (
          <p className="rounded-xl bg-mist px-3 py-6 text-center text-xs text-smoke">
            No versions yet.
          </p>
        )}
        {versions.map((v) => (
          <button
            key={v.id}
            onClick={() => onPreview(v)}
            className={`mb-2 flex w-full items-center gap-2.5 rounded-xl border px-3.5 py-2.5 text-left transition-colors duration-150 ${
              preview?.id === v.id ? 'border-ink bg-ink text-paper' : 'border-line bg-paper hover:bg-mist'
            }`}
          >
            <span className="inline-flex items-center gap-1.5">
              <span className="size-1.5 rounded-full bg-sun" />
              <span className="text-xs font-semibold">v{v.version}</span>
            </span>
            <span className={`text-[11px] ${preview?.id === v.id ? 'text-paper/70' : 'text-smoke'}`}>
              {v.created_by_name} · {formatDate(v.created_at)}
            </span>
          </button>
        ))}
        {preview && (
          <div className="mt-4 rounded-2xl border border-line bg-fog p-4">
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-violet-600">
              Preview · v{preview.version}
            </p>
            <div className="mt-2 text-sm" dangerouslySetInnerHTML={{ __html: preview.content }} />
          </div>
        )}
      </div>
    </aside>
  )
}