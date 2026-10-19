import { useEffect, useState } from 'react'
import QRCode from 'qrcode'
import { QrCode, Download, AlertTriangle, CheckCircle2, Ban } from 'lucide-react'
import { SelectField } from './FormFields.jsx'
import { VALIDITY_OPTIONS, formatDateTime, qrPayload } from '../utils/qr.js'
import { formatTime, vehicleLabel } from '../utils/routePlans.js'

function useQrImage(text) {
  const [url, setUrl] = useState(null)
  useEffect(() => {
    if (!text) return setUrl(null)
    let cancelled = false
    QRCode.toDataURL(text, { width: 320, margin: 1, errorCorrectionLevel: 'M', color: { dark: '#111315', light: '#ffffff' } })
      .then((dataUrl) => !cancelled && setUrl(dataUrl))
      .catch((err) => console.error('QR generation failed:', err))
    return () => { cancelled = true }
  }, [text])
  return url
}

const STATUS_ICON = { active: CheckCircle2, outdated: AlertTriangle, expired: AlertTriangle, revoked: Ban }

// Overlay content for one route's QR code.
// info: resolveRoute() output; status: qrStatus() output.
export default function QrPanel({ route, info, qr, status, onGenerate, onRevoke }) {
  const [validity, setValidity] = useState('30')
  // Inline confirmation for actions that break already-printed codes.
  const [confirming, setConfirming] = useState(null) // 'regenerate' | 'revoke' | null
  const image = useQrImage(qr ? qrPayload(qr) : null)

  const usable = status.state === 'active' || status.state === 'outdated'
  const StatusIcon = STATUS_ICON[status.state]
  const fileName = `${route.name.replace(/[^\w-]+/g, '-')}-qr.png`

  function generate() {
    // Replacing a code that still scans needs a second click.
    if (usable && confirming !== 'regenerate') return setConfirming('regenerate')
    onGenerate(validity)
    setConfirming(null)
  }

  function revoke() {
    if (confirming !== 'revoke') return setConfirming('revoke')
    onRevoke()
    setConfirming(null)
  }

  return (
    <div className="qr-panel">
      <div className="qr-visual">
        <div className={`qr-frame ${status.state}`}>
          {image ? <img src={image} alt={`QR code for route ${route.name}`} /> : (
            <div className="qr-empty">
              <QrCode size={56} />
              <span>No QR code yet</span>
            </div>
          )}
          {image && (status.state === 'expired' || status.state === 'revoked') && (
            <span className="qr-stamp">{status.label}</span>
          )}
        </div>
        {image && usable && (
          <a className="rs-btn-ghost qr-download" href={image} download={fileName}>
            <Download size={16} /> Download PNG
          </a>
        )}
      </div>

      <div className="qr-side">
        <div className="fl-info">
          <dl>
            <dt>Route</dt>
            <dd>{route.name}</dd>
            <dt>Vehicle</dt>
            <dd dir="auto">{info.vehicle?.missing ? 'Removed' : vehicleLabel(info.vehicle) || '—'}</dd>
            <dt>Driver</dt>
            <dd>{info.driver?.missing ? 'Removed' : info.driver?.name || '—'}</dd>
            <dt>Stops</dt>
            <dd>{route.stops.length} · {formatTime(info.start)} → {formatTime(info.arrival)}</dd>
            {qr && (
              <>
                <dt>Generated</dt>
                <dd>{formatDateTime(qr.generatedAt)}</dd>
                <dt>Expires</dt>
                <dd>{qr.expiresAt ? formatDateTime(qr.expiresAt) : 'Never'}</dd>
              </>
            )}
          </dl>
        </div>

        <div className={`qr-status ${status.state}`} role="status">
          <span className={`qr-pill ${status.state}`}>
            {StatusIcon && <StatusIcon size={14} />} {status.label}
          </span>
          {status.state === 'none' && <p>Generate a code for passengers to scan when boarding this route.</p>}
          {status.state === 'active' && <p>This code is valid and matches the route's current details.</p>}
          {status.reasons.map((r) => <p key={r}>{r}</p>)}
          {status.state !== 'none' && status.state !== 'active' && <p className="qr-advice">Generate a new code and replace any printed copies.</p>}
        </div>

        <div className="qr-actions">
          <SelectField
            label="Valid for"
            options={VALIDITY_OPTIONS}
            value={validity}
            onChange={(e) => { setValidity(e.target.value); setConfirming(null) }}
          />
          {confirming === 'regenerate' && (
            <p className="qr-confirm">The current code will stop working, including printed copies. Click again to confirm.</p>
          )}
          {confirming === 'revoke' && (
            <p className="qr-confirm">Passengers won't be able to board with this code anymore. Click again to confirm.</p>
          )}
          <div className="qr-buttons">
            <button type="button" className="rs-btn" onClick={generate}>
              {confirming === 'regenerate' ? 'Confirm new code' : qr ? (status.state === 'outdated' ? 'Update QR' : 'Generate new QR') : 'Generate QR'}
            </button>
            {usable && (
              <button type="button" className="rs-btn-ghost qr-revoke" onClick={revoke}>
                {confirming === 'revoke' ? 'Confirm revoke' : 'Revoke'}
              </button>
            )}
            {confirming && (
              <button type="button" className="fl-clear" onClick={() => setConfirming(null)}>Keep current</button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
