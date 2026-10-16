import { useEffect } from 'react'

// Without onSubmit the modal is view-only and shows a single Close button.
export default function Modal({ title, onClose, onSubmit, submitLabel = 'Save', canSubmit = true, wide = false, children }) {
  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  function handleSubmit(e) {
    e.preventDefault()
    if (onSubmit && canSubmit) onSubmit()
  }

  return (
    <div className="rs-modal-backdrop" onMouseDown={onClose}>
      <div className={`rs-modal${wide ? ' rs-modal-wide' : ''}`} role="dialog" aria-modal="true" aria-label={title} onMouseDown={(e) => e.stopPropagation()}>
        <h3>{title}</h3>
        <form onSubmit={handleSubmit} className="rs-modal-form">
          {children}
          <div className="rs-modal-actions">
            {onSubmit ? (
              <>
                <button type="button" className="rs-btn-ghost" onClick={onClose}>Cancel</button>
                <button type="submit" className="rs-btn" disabled={!canSubmit}>{submitLabel}</button>
              </>
            ) : (
              <button type="button" className="rs-btn" onClick={onClose}>Close</button>
            )}
          </div>
        </form>
      </div>
    </div>
  )
}
