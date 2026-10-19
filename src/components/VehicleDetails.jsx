import { useEffect, useMemo, useState } from 'react'
import { ImageOff, FileText, ExternalLink } from 'lucide-react'

// Files are either File objects picked in the browser, or records from the
// data source ({ name, url? }). Returns a preview URL for each (or null),
// revoking any object URLs it created when the files change or on unmount.
function useFileUrls(files) {
  const [urls, setUrls] = useState([])
  useEffect(() => {
    const created = []
    setUrls(
      files.map((f) => {
        if (f instanceof File) {
          const url = URL.createObjectURL(f)
          created.push(url)
          return url
        }
        return f?.url ?? null
      }),
    )
    return () => created.forEach((url) => URL.revokeObjectURL(url))
  }, [files])
  return urls
}

function isImage(file) {
  return file instanceof File ? file.type.startsWith('image/') : /\.(png|jpe?g|gif|webp|avif|bmp)$/i.test(file.name)
}

function NoPreview({ name }) {
  return (
    <div className="fl-noimg">
      <ImageOff size={28} />
      <span>{name}</span>
    </div>
  )
}

export default function VehicleDetails({ vehicle }) {
  const licenseFiles = useMemo(() => (vehicle.licenseFile ? [vehicle.licenseFile] : []), [vehicle.licenseFile])
  const [licenseUrl] = useFileUrls(licenseFiles)
  const photoUrls = useFileUrls(vehicle.photos)
  const [current, setCurrent] = useState(0)

  const photo = vehicle.photos[current]

  return (
    <div className="fl-details">
      <div className="fl-gallery">
        <div className="fl-viewer">
          {!photo && <NoPreview name="No photos uploaded" />}
          {photo && (photoUrls[current]
            ? <img src={photoUrls[current]} alt={`${vehicle.plate} — ${photo.name}`} />
            : <NoPreview name={photo.name} />)}
        </div>
        {vehicle.photos.length > 1 && (
          <div className="fl-thumbs">
            {vehicle.photos.map((p, i) => (
              <button
                key={`${p.name}-${i}`}
                type="button"
                className={`fl-thumb${i === current ? ' on' : ''}`}
                onClick={() => setCurrent(i)}
                aria-label={`Show photo ${i + 1}: ${p.name}`}
                title={p.name}
              >
                {photoUrls[i] ? <img src={photoUrls[i]} alt="" /> : <ImageOff size={18} />}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="fl-info">
        <dl>
          <dt>License Plate</dt>
          <dd dir="auto">{vehicle.plate}</dd>
          <dt>Vehicle Model</dt>
          <dd>{vehicle.model}</dd>
          <dt>Capacity</dt>
          <dd>{vehicle.capacity} seats</dd>
          <dt>Color</dt>
          <dd>{vehicle.color}</dd>
          <dt>Photos</dt>
          <dd>{vehicle.photos.length || 'None'}</dd>
        </dl>

        <div className="fl-license">
          <span className="fl-field-label">Vehicle License</span>
          {!vehicle.licenseFile && <p className="fl-missing">Not uploaded</p>}
          {vehicle.licenseFile && (
            licenseUrl && isImage(vehicle.licenseFile) ? (
              <a href={licenseUrl} target="_blank" rel="noreferrer" className="fl-license-img" title="Open full size">
                <img src={licenseUrl} alt="Vehicle license" />
              </a>
            ) : (
              <div className="fl-license-file">
                <FileText size={20} />
                <span title={vehicle.licenseFile.name}>{vehicle.licenseFile.name}</span>
                {licenseUrl && (
                  <a href={licenseUrl} target="_blank" rel="noreferrer" aria-label="Open license">
                    <ExternalLink size={16} />
                  </a>
                )}
              </div>
            )
          )}
        </div>
      </div>
    </div>
  )
}
