import Brand from './Brand'

export default function DashboardHeader({ user, onLogout }) {
  const initial = (user?.name || user?.email || '?').charAt(0).toUpperCase()

  return (
    <header className="sticky top-0 z-10 border-b border-line bg-paper/80 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4 sm:px-6">
        <Brand compactOnMobile />
        <div className="flex items-center gap-2">
          <span className="hidden rounded-full bg-violet-soft px-3 py-1 text-xs font-medium text-ink sm:inline">
            {user?.name || user?.email}
          </span>
          <span className="grid size-8 place-items-center rounded-full bg-ink text-xs font-semibold text-sun">
            {initial}
          </span>
          <button
            onClick={onLogout}
            className="rounded-full px-3 py-1.5 text-xs font-medium text-smoke transition-colors hover:bg-mist hover:text-ink"
          >
            Sign out
          </button>
        </div>
      </div>
    </header>
  )
}