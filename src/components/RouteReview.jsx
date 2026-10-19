import { useEffect, useRef, useState } from 'react'
import maplibregl from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
import mapStyle from '../mapStyle.json'
import { getRouteThrough } from '../utils/routing.js'
import { roleLabel, stopRole } from '../utils/routePlans.js'

const ROUTE_SOURCE_ID = 'review-route'
const ROUTE_LAYER_ID = 'review-route-line'

// Read-only map showing the route through the given stops, in order.
// Each stop: { name, location: { lat, lng }, role? }. Optional passengers
// ([{ userId, pickupStopId, dropOffStopId }]) add counts to the stop popups.
const NO_PASSENGERS = []

export default function RouteReview({ stops, passengers = NO_PASSENGERS }) {
  const containerRef = useRef(null)
  const [status, setStatus] = useState({ state: 'loading' })

  useEffect(() => {
    const points = stops.map((s) => s.location)
    const map = new maplibregl.Map({
      container: containerRef.current,
      style: mapStyle,
      center: [points[0].lng, points[0].lat],
      zoom: 13,
      attributionControl: false,
    })
    map.addControl(new maplibregl.AttributionControl({ compact: true }), 'bottom-right')
    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'top-right')

    const popupText = (stop, i) => {
      const count = (key, word) => {
        const n = passengers.filter((p) => p[key] === stop.id).length
        return n ? `${n} ${word}${n === 1 ? '' : 's'}` : null
      }
      const counts = [count('pickupStopId', 'pickup'), count('dropOffStopId', 'drop-off')].filter(Boolean)
      return [`${i + 1}. ${stop.name}`, roleLabel(stop), ...counts].join(' · ')
    }

    // Numbered stop markers
    stops.forEach((stop, i) => {
      const el = document.createElement('div')
      el.className = `rs-stop-marker ${stopRole(stop)}`
      el.textContent = i + 1
      new maplibregl.Marker({ element: el })
        .setLngLat([stop.location.lng, stop.location.lat])
        .setPopup(new maplibregl.Popup({ offset: 18 }).setText(popupText(stop, i)))
        .addTo(map)
    })

    const bounds = points.reduce(
      (b, p) => b.extend([p.lng, p.lat]),
      new maplibregl.LngLatBounds([points[0].lng, points[0].lat], [points[0].lng, points[0].lat]),
    )
    map.fitBounds(bounds, { padding: 60, maxZoom: 15, duration: 0 })

    let cancelled = false

    function drawLine(coordinates, dashed) {
      map.addSource(ROUTE_SOURCE_ID, {
        type: 'geojson',
        data: { type: 'Feature', geometry: { type: 'LineString', coordinates } },
      })
      map.addLayer({
        id: ROUTE_LAYER_ID,
        type: 'line',
        source: ROUTE_SOURCE_ID,
        layout: { 'line-cap': 'round', 'line-join': 'round' },
        paint: {
          'line-color': '#2fb31c',
          'line-width': 4,
          'line-opacity': 0.9,
          ...(dashed && { 'line-dasharray': [2, 2] }),
        },
      })
    }

    const routePromise = getRouteThrough(points)
    const loaded = new Promise((resolve) => map.once('load', resolve))

    // getRouteThrough never rejects: it falls back to straight lines (dashed)
    // and leaves the time empty if a lookup fails.
    Promise.all([routePromise, loaded]).then(([route]) => {
      if (cancelled) return
      drawLine(route.coordinates, !route.isRoadPath)
      setStatus({
        state: 'done',
        duration: route.durationText,
        distance: route.distanceText,
        isRoadPath: route.isRoadPath,
        isLive: route.isLive,
      })
    })

    return () => {
      cancelled = true
      map.remove()
    }
  }, [stops, passengers])

  return (
    <div className="rs-map-picker">
      <div ref={containerRef} className="rs-map" />
      <p className="rs-map-readout">
        {status.state === 'loading' && 'Calculating route…'}
        {status.state === 'done' && (
          <>
            <strong>
              {status.duration
                ? [status.duration, status.distance].filter(Boolean).join(' · ')
                : 'Travel time unavailable'}
            </strong>
            <span>
              {stops.length} stops
              {status.duration && (status.isLive ? ' · live traffic' : ' · typical time, no live traffic')}
              {!status.isRoadPath && ' · road path unavailable, showing straight lines'}
            </span>
          </>
        )}
      </p>
    </div>
  )
}
