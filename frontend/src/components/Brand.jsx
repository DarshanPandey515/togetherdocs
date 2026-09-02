export default function Brand({ compactOnMobile = false }) {
  return (
    <span className="inline-flex items-center gap-2.5">
      <span className="grid size-7 place-items-center rounded-xl bg-ink shadow-[0_4px_12px_rgba(62,15,141,0.35)]">
        <svg
          className="size-4 text-sun"
          viewBox="0 0 16 16"
          fill="currentColor"
          aria-hidden="true"
        >
          <path d="M3.2 2.6a.8.8 0 0 0-1.1.9l1.5 5a.8.8 0 0 0 1.05.52l1.3-.43-2.75 4.4a.8.8 0 1 0 1.36.85l3.2-5.1 1.44-.48a.8.8 0 0 0 .52-1.05l-1.5-5A.8.8 0 0 0 7.9 1.4l-4.7 1.2Z" />
        </svg>
      </span>
      <span
        className={`font-display text-[15px] font-semibold tracking-tight ${
          compactOnMobile ? 'hidden sm:inline' : ''
        } text-ink`}
      >
        TogetherDocs
      </span>
    </span>
  )
}
