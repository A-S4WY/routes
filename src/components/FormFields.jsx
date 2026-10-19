// Labelled form fields shared by the dashboard pages' add/edit dialogs.
// Styles: fl-field* in fleet.css, rs-input / rs-req in route-setup.css.

export function FieldLabel({ children, required }) {
  return (
    <span className="fl-field-label">
      {children}
      {required && <span className="rs-req" aria-hidden="true">*</span>}
    </span>
  )
}

export function TextField({ label, required, ...inputProps }) {
  return (
    <label className="fl-field">
      <FieldLabel required={required}>{label}</FieldLabel>
      <input className="rs-input" required={required} {...inputProps} />
    </label>
  )
}

// options: [{ value, label }]
export function SelectField({ label, required, options, ...selectProps }) {
  return (
    <label className="fl-field">
      <FieldLabel required={required}>{label}</FieldLabel>
      <select className="rs-input" required={required} {...selectProps}>
        {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </label>
  )
}

// Pill-styled file picker: shows the chosen file name(s) next to the button.
export function FileField({ label, required, accept, multiple, value, onChange }) {
  const files = multiple ? value : value ? [value] : []
  return (
    <div className={`fl-field${required && !files.length ? ' fl-needed' : ''}`}>
      <FieldLabel required={required}>{label}</FieldLabel>
      <div className="fl-file">
        <label className="rs-btn-ghost fl-file-btn">
          {files.length ? 'Replace' : 'Upload'}
          <input
            type="file"
            accept={accept}
            multiple={multiple}
            hidden
            onChange={(e) => {
              const picked = [...e.target.files]
              if (picked.length) onChange(multiple ? picked : picked[0])
              e.target.value = '' // allow re-picking the same file
            }}
          />
        </label>
        <span className="fl-file-names" title={files.map((f) => f.name).join(', ')}>
          {files.length ? files.map((f) => f.name).join(', ') : 'No file chosen'}
        </span>
      </div>
    </div>
  )
}

// "* Required. Still needed: a, b." — turns green once nothing is missing.
export function RequiredNote({ missing }) {
  const done = missing.length === 0
  return (
    <p className={`fl-required-note${done ? ' done' : ''}`} role="status">
      <span className="rs-req">*</span> Required.{' '}
      {done ? 'All set.' : `Still needed: ${missing.join(', ')}.`}
    </p>
  )
}
