import { formatDate } from '../lib/format'

export default function DocCard({ doc, deleting, onOpen, onDelete }) {
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onOpen(doc.id)}
      onKeyDown={(e) => e.key === 'Enter' && onOpen(doc.id)}
      className="group flex cursor-pointer flex-col justify-between rounded-2xl border border-line bg-paper p-4 shadow-sm transition duration-150 hover:-translate-y-0.5 hover:border-violet hover:shadow-[0_12px_28px_rgba(62,15,141,0.14)] focus:outline-none"
    >
      <div className="flex items-start justify-between gap-2">
        <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-violet-soft">
          <svg className="size-4 text-ink" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
            <path d="M4 1.5A1.5 1.5 0 0 0 2.5 3v10A1.5 1.5 0 0 0 4 14.5h8A1.5 1.5 0 0 0 13.5 13V5.6a1.5 1.5 0 0 0-.44-1.06l-2.1-2.1A1.5 1.5 0 0 0 9.9 2.06L4 1.5Zm0 1.5h5.4v3a1 1 0 0 0 1 1h3V13a.5.5 0 0 1-.5.5H4a.5.5 0 0 1-.5-.5V3a.5.5 0 0 1 .5-.5Z" />
          </svg>
        </span>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-mist px-2 py-0.5 text-[11px] font-medium text-smoke">
          <span className="size-1.5 rounded-full bg-sun" />
          v{doc.version}
        </span>
      </div>
      <div className="mt-3 min-w-0">
        <div className="truncate text-sm font-semibold text-coal group-hover:text-ink">{doc.title}</div>
        <div className="mt-0.5 flex items-center gap-1.5 text-[11px] text-smoke">
          <span className="inline-block size-1.5 rounded-full bg-sun" aria-hidden="true" />
          {doc.owner_name} · {formatDate(doc.updated_at)}
        </div>
      </div>
      <button
        className="mt-3 self-end rounded-lg px-2 py-1 text-xs font-medium text-smoke opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100 focus-visible:opacity-100 hover:bg-red-50 hover:text-red-700 disabled:opacity-0"
        disabled={deleting}
        onClick={(e) => onDelete(doc.id, e)}
        aria-label={`Delete ${doc.title}`}
      >
        {deleting ? 'Deleting…' : 'Delete'}
      </button>
    </div>
  )
}