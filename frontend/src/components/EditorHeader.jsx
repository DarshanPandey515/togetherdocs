import Brand from './Brand'
import { secondaryBtn, primaryBtn } from '../lib/ui'

export default function EditorHeader({
  connected,
  online,
  status,
  showVersions,
  onBack,
  onToggleVersions,
  onOpenShare,
  onSave,
}) {
  return (
    <header className="sticky top-0 z-10 border-b border-line bg-paper/85 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-4xl items-center justify-between gap-3 px-4">
        <div className="flex min-w-0 items-center gap-3">
          <button
            onClick={onBack}
            className="inline-flex size-9 shrink-0 items-center justify-center rounded-lg border border-line bg-paper text-smoke shadow-sm transition hover:bg-mist hover:text-ink"
            aria-label="Back to documents"
          >
            ←
          </button>
          <Brand compactOnMobile />
        </div>
        <div className="flex items-center gap-2">
          <span
            className={`hidden items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-medium sm:inline-flex ${
              connected ? 'bg-sun-soft text-ink' : 'bg-red-50 text-red-700'
            }`}
            title={status}
          >
            <span className={connected ? 'live-dot' : 'size-1.5 rounded-full bg-red-500'} />
            {connected ? `${online} online` : 'offline'}
          </span>
          <button
            onClick={onToggleVersions}
            className={`${secondaryBtn} w-9 justify-center px-0 sm:w-auto sm:px-3.5`}
            aria-label={showVersions ? 'Hide version history' : 'Show version history'}
          >
            <svg className="size-4 sm:hidden" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
              <path d="M8 1a7 7 0 1 0 0 14A7 7 0 0 0 8 1Zm0 12a5 5 0 1 1 0-10 5 5 0 0 1 0 10Zm.5-8.5h-2v4.4l3 1.8 1-1.66-2-1.2V4.5Z" />
            </svg>
            <span className="hidden sm:inline">{showVersions ? 'Hide history' : 'History'}</span>
          </button>
          <button
            onClick={onOpenShare}
            className={`${secondaryBtn} w-9 justify-center px-0 sm:w-auto sm:px-3.5`}
            aria-label="Share document"
          >
            <svg className="size-4 sm:hidden" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
              <path d="M12 2.5A2.5 2.5 0 1 0 12.5 6L6.7 9.3a2.5 2.5 0 0 0 0 1.4l5.8 3.3a2.5 2.5 0 1 0 .5-1.2L7.4 9.6a2.5 2.5 0 0 0 0-1.2l5.6-3.2A2.5 2.5 0 0 0 12 2.5Z" />
            </svg>
            <span className="hidden sm:inline">Share</span>
          </button>
          <button className={primaryBtn} onClick={onSave}>
            Save
          </button>
        </div>
      </div>
    </header>
  )
}