import { useEffect, useRef, forwardRef, useImperativeHandle } from 'react'
import maplibregl from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
import mapStyle from '../mapStyle.json'
import { DEFAULT_CENTER, DEFAULT_ZOOM, DEPOT } from '../config.js'

const ROUTE_SOURCE_ID = 'active-route'
const ROUTE_LAYER_ID = 'active-route-line'

const MapView = forwardRef(function MapView({ routes }, ref) {
  const containerRef = useRef(null)
  const mapRef = useRef(null)
  const markersRef = useRef([])
  const stopMarkersRef = useRef([])

  // Initialize the map once on mount
  useEffect(() => {
    const map = new maplibregl.Map({
      container: containerRef.current,
      style: mapStyle,
      center: [DEFAULT_CENTER.lng, DEFAULT_CENTER.lat],
      zoom: DEFAULT_ZOOM,
      attributionControl: false, // added back below, collapsed
    })

    // Required attribution for OpenFreeMap/OSM data, collapsed into
    // a small "i" icon instead of an always-visible text bar.
    map.addControl(new maplibregl.AttributionControl({ compact: true }), 'bottom-right')
    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'top-right')

    map.on('load', () => {
      map.addSource(ROUTE_SOURCE_ID, {
        type: 'geojson',
        data: { type: 'Feature', geometry: { type: 'LineString', coordinates: [] } },
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
        },
      })
    })

    // Depot marker
    const depotEl = document.createElement('div')
    depotEl.className = 'map-marker map-marker-depot'
    new maplibregl.Marker({ element: depotEl })
      .setLngLat([DEPOT.lng, DEPOT.lat])
      .setPopup(new maplibregl.Popup({ offset: 16 }).setText('Depot / Start point'))
      .addTo(map)

    mapRef.current = map

    return () => {
      map.remove()
      mapRef.current = null
    }
  }, [])

  // Re-sync route markers whenever the routes list changes
  useEffect(() => {
    const map = mapRef.current
    if (!map) return

    const addMarkers = () => {
      markersRef.current.forEach((marker) => marker.remove())
      markersRef.current = routes.map((route) => {
        const el = document.createElement('div')
        el.className = 'map-marker map-marker-route'
        return new maplibregl.Marker({ element: el })
          .setLngLat([route.lng, route.lat])
          .setPopup(new maplibregl.Popup({ offset: 16 }).setText(route.name))
          .addTo(map)
      })
    }

    if (map.isStyleLoaded()) addMarkers()
    else map.once('load', addMarkers)
  }, [routes])

  // Let the parent (Dashboard) tell the map to fly to a route, draw its path
  // and show its stops.
  useImperativeHandle(ref, () => ({
    focusRoute(lat, lng) {
      mapRef.current?.flyTo({ center: [lng, lat], zoom: 14 })
    },
    // Numbered pins for a route's stops ([{ name, location }]); zooms to fit them.
    showStops(stops) {
      const map = mapRef.current
      if (!map) return
      stopMarkersRef.current.forEach((marker) => marker.remove())
      stopMarkersRef.current = stops.map((stop, i) => {
        const el = document.createElement('div')
        el.className = 'map-marker-stop'
        el.textContent = i + 1
        return new maplibregl.Marker({ element: el })
          .setLngLat([stop.location.lng, stop.location.lat])
          .setPopup(new maplibregl.Popup({ offset: 16 }).setText(`${i + 1}. ${stop.name}`))
          .addTo(map)
      })
      if (stops.length) {
        const bounds = new maplibregl.LngLatBounds()
        stops.forEach((s) => bounds.extend([s.location.lng, s.location.lat]))
        map.fitBounds(bounds, { padding: 70, maxZoom: 15 })
      }
    },
    clearRoute() {
      stopMarkersRef.current.forEach((marker) => marker.remove())
      stopMarkersRef.current = []
      mapRef.current?.getSource(ROUTE_SOURCE_ID)?.setData({ type: 'Feature', geometry: { type: 'LineString', coordinates: [] } })
    },
    showRoutePath(coordinates) {
      const map = mapRef.current
      if (!map || !coordinates?.length) return
      const source = map.getSource(ROUTE_SOURCE_ID)
      if (source) {
        source.setData({
          type: 'Feature',
          geometry: { type: 'LineString', coordinates },
        })
      }
    },
  }))

  return <div ref={containerRef} style={{ width: '100%', height: '100%' }} />
})

export default MapView
