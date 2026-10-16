import { useEffect, useRef, useState } from 'react'
import maplibregl from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
import mapStyle from '../mapStyle.json'
import { DEFAULT_CENTER, DEFAULT_ZOOM } from '../config.js'

// "29.96010, 31.25990"
export function formatCoords(point) {
  return `${point.lat.toFixed(5)}, ${point.lng.toFixed(5)}`
}

// Interactive map for picking a single point. Click to drop a pin, drag it to
// adjust. Calls onChange({ lat, lng }).
export default function MapPicker({ value, onChange }) {
  const containerRef = useRef(null)
  const markerRef = useRef(null)
  const onChangeRef = useRef(onChange)
  onChangeRef.current = onChange

  const [point, setPoint] = useState(value)

  useEffect(() => {
    const start = value ?? DEFAULT_CENTER
    const map = new maplibregl.Map({
      container: containerRef.current,
      style: mapStyle,
      center: [start.lng, start.lat],
      zoom: value ? 16 : DEFAULT_ZOOM,
      attributionControl: false,
    })
    map.addControl(new maplibregl.AttributionControl({ compact: true }), 'bottom-right')
    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'top-right')
    map.getCanvas().style.cursor = 'crosshair'

    function pick({ lng, lat }) {
      const picked = { lat, lng }
      setPoint(picked)
      onChangeRef.current(picked)
    }

    function placeMarker(lngLat) {
      if (!markerRef.current) {
        const el = document.createElement('div')
        el.className = 'map-marker map-marker-route'
        markerRef.current = new maplibregl.Marker({ element: el, draggable: true })
          .setLngLat(lngLat)
          .addTo(map)
        markerRef.current.on('dragend', () => pick(markerRef.current.getLngLat()))
      } else {
        markerRef.current.setLngLat(lngLat)
      }
    }

    if (value) placeMarker([value.lng, value.lat])

    map.on('click', (e) => {
      placeMarker(e.lngLat)
      pick(e.lngLat)
    })

    return () => {
      map.remove()
      markerRef.current = null
    }
    // Map is created once per open; later value changes come from the map itself.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className="rs-map-picker">
      <div ref={containerRef} className="rs-map" />
      <p className="rs-map-readout">
        {point
          ? <strong>{formatCoords(point)}</strong>
          : 'Click on the map to drop a pin. Drag it to adjust.'}
      </p>
    </div>
  )
}
