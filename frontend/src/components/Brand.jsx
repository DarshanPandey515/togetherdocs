export default function Brand() {
  return (
    <span className="inline-flex items-center gap-2">
      <svg
        className="size-4 shrink-0 bg-ink p-0.5 text-paper"
        viewBox="0 0 16 16"
        fill="currentColor"
        aria-hidden="true"
      >
        <rect x="2" y="2" width="12" height="2" />
        <rect x="2" y="7" width="8" height="2" />
        <rect x="2" y="12" width="5" height="2" />
      </svg>
      <span className="font-display text-base font-semibold tracking-tight">TogetherDocs</span>
    </span>
  )
}