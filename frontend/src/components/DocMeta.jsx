export default function DocMeta({ title, onTitleChange, version, ownerName, status, error, conflict }) {
  return (
    <>
      <div className="flex items-center gap-2.5">
        <span className="live-dot" aria-hidden="true" />
        <span className="text-xs font-medium text-smoke">{status}</span>
      </div>

      <input
        value={title}
        onChange={(e) => onTitleChange(e.target.value)}
        placeholder="Untitled document"
        className="mt-2 w-full rounded-lg border border-transparent bg-transparent px-0 py-0 font-display text-3xl font-semibold tracking-tight text-ink placeholder:text-smoke/60"
      />

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-ink px-2.5 py-0.5 text-[11px] font-semibold text-sun">
          v{version}
        </span>
        <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-smoke">
          <span className="grid size-4 place-items-center rounded-full bg-violet-soft text-[9px] font-bold text-ink">
            {ownerName?.charAt(0)?.toUpperCase() || '?'}
          </span>
          {ownerName}
        </span>
        {error && <span className="text-[11px] font-medium text-red-700">{error}</span>}
      </div>

      {conflict && (
        <div className="mt-4 flex items-start gap-2.5 rounded-xl bg-sun-soft px-4 py-3 text-xs text-ink">
          <svg
            className="mt-0.5 size-4 shrink-0 text-sun"
            viewBox="0 0 16 16"
            fill="currentColor"
            aria-hidden="true"
          >
            <path d="M8 1a7 7 0 1 0 0 14A7 7 0 0 0 8 1Zm0 12a5 5 0 1 1 0-10 5 5 0 0 1 0 10ZM7 4.5h2V9H7V4.5Zm0 5h2v2H7v-2Z" />
          </svg>
          Someone edited this document from your version. Your editor now shows the latest content
          (v{version}).
        </div>
      )}
    </>
  )
}