import { secondaryBtn, primaryBtn, inputClass } from '../lib/ui'

export default function ShareModal({
  open,
  onClose,
  onSubmit,
  email,
  onEmailChange,
  role,
  onRoleChange,
  busy,
  ok,
  message,
}) {
  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-30 grid place-items-center bg-ink/50 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="rise w-full max-w-sm rounded-3xl border border-line bg-paper p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="font-display text-lg font-semibold tracking-tight text-ink">Share document</h2>
        <form onSubmit={onSubmit} className="mt-5">
          <label className="block">
            <span className="text-xs font-medium text-smoke">Email</span>
            <input
              type="email"
              value={email}
              onChange={(e) => onEmailChange(e.target.value)}
              placeholder="person@example.com"
              required
              className={`mt-1.5 ${inputClass}`}
            />
          </label>
          <label className="mt-4 block">
            <span className="text-xs font-medium text-smoke">Role</span>
            <select
              value={role}
              onChange={(e) => onRoleChange(e.target.value)}
              className={`mt-1.5 ${inputClass}`}
            >
              <option value="viewer">Viewer</option>
              <option value="editor">Editor</option>
            </select>
          </label>
          {message && (
            <p
              className={`mt-3 rounded-lg px-3 py-2 text-xs ${
                ok ? 'bg-sun-soft text-ink' : 'bg-red-50 text-red-700'
              }`}
            >
              {message}
            </p>
          )}
          <div className="mt-6 flex justify-end gap-2">
            <button type="button" className={secondaryBtn} onClick={onClose}>
              Close
            </button>
            <button type="submit" className={primaryBtn} disabled={busy}>
              {busy ? 'Sharing…' : 'Share'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}