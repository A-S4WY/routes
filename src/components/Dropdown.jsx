import { useEffect, useRef, useState } from 'react'
import { ListFilter } from 'lucide-react'

// Round icon button that opens a panel below it. Closes on outside click or Esc.
// `label` is used for the tooltip and screen readers; `count` shows a badge
// (e.g. number of active filters). `children` may be a function receiving
// `close`, for panels that should close after a choice is made.
export default function Dropdown({ label, icon: Icon = ListFilter, count = 0, children }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)
  const close = () => setOpen(false)

  useEffect(() => {
    if (!open) return
    const onDown = (e) => !ref.current?.contains(e.target) && setOpen(false)
    const onKey = (e) => e.key === 'Escape' && setOpen(false)
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  const fullLabel = count ? `${label} (${count} active)` : label

  return (
    <div className="fl-filters" ref={ref}>
      <button
        type="button"
        className={`fl-filter-btn${count ? ' on' : ''}${open ? ' open' : ''}`}
        aria-expanded={open}
        aria-label={fullLabel}
        title={fullLabel}
        onClick={() => setOpen((o) => !o)}
      >
        <Icon size={20} />
        {count > 0 && <span className="fl-badge" aria-hidden="true">{count}</span>}
      </button>
      {open && (
        <div className="fl-popover" role="dialog" aria-label={label}>
          <div className="fl-popover-title">{label}</div>
          {typeof children === 'function' ? children(close) : children}
        </div>
      )}
    </div>
  )
}
