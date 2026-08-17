import { useEffect, useRef, useState } from 'react'
import { useTezcatlipoca } from '@/stores/tezcatlipocaStore'

// =============================================================================
// EARTHVIEW — Cesium globe con terrain real y satélites
// Mentalidad DevOps: cleanup exhaustivo, error boundaries, graceful degradation
// =============================================================================

interface SatelliteEntity {
  name: string
  lat: number
  lon: number
  alt: number
  type: 'station' | 'science' | 'communication'
}

const DEMO_SATELLITES: SatelliteEntity[] = [
  { name: 'ISS', lat: 51.6413, lon: -120.2331, alt: 408000, type: 'station' },
  { name: 'Hubble', lat: 28.4696, lon: -80.5278, alt: 540000, type: 'science' },
  { name: 'GPS IIR-1', lat: 55.0, lon: -100.0, alt: 20200000, type: 'communication' },
  { name: 'Tiangong', lat: 42.0, lon: 115.0, alt: 390000, type: 'station' },
]

export default function EarthView() {
  const containerRef = useRef<HTMLDivElement>(null)
  const viewerRef = useRef<any>(null)
  const entitiesRef = useRef<any[]>([])
  const disposedRef = useRef(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { updateTelemetry } = useTezcatlipoca()

  useEffect(() => {
    if (!containerRef.current) return

    let cancelled = false
    disposedRef.current = false

    const initCesium = async () => {
      try {
        const Cesium = await import('cesium')

        // Token fallback: demo mode sin token
        const token = import.meta.env.VITE_CESIUM_ION_TOKEN
        if (token) {
          Cesium.Ion.defaultAccessToken = token
        }

        if (cancelled || disposedRef.current) return

        const container = containerRef.current!

        // Crear viewer con opciones mínimas para performance
        const viewer = new Cesium.Viewer(container, {
          terrainProvider: token
            ? await Cesium.createWorldTerrainAsync()
            : new Cesium.EllipsoidTerrainProvider(),
          baseLayerPicker: true,
          geocoder: true,
          homeButton: true,
          sceneModePicker: true,
          navigationHelpButton: false,
          animation: false,
          timeline: false,
          fullscreenButton: false,
          creditContainer: document.createElement('div'), // Ocultar créditos
          selectionIndicator: false,
          infoBox: false,
        })

        viewerRef.current = viewer

        // Añadir satélites de ejemplo
        DEMO_SATELLITES.forEach((sat) => {
          const color = sat.type === 'station'
            ? Cesium.Color.CYAN
            : sat.type === 'science'
              ? Cesium.Color.MAGENTA
              : Cesium.Color.YELLOW

          const entity = viewer.entities.add({
            name: sat.name,
            position: Cesium.Cartesian3.fromDegrees(sat.lon, sat.lat, sat.alt),
            point: { pixelSize: 10, color, outlineColor: Cesium.Color.BLACK, outlineWidth: 2 },
            label: {
              text: sat.name,
              font: '12px JetBrains Mono, monospace',
              fillColor: Cesium.Color.WHITE,
              outlineColor: Cesium.Color.BLACK,
              outlineWidth: 2,
              pixelOffset: new Cesium.Cartesian2(0, -18),
              showBackground: true,
              backgroundColor: new Cesium.Color(0, 0, 0, 0.6),
              backgroundPadding: new Cesium.Cartesian2(6, 4),
            },
          })
          entitiesRef.current.push(entity)
        })

        // Fly to CDMX
        viewer.camera.flyTo({
          destination: Cesium.Cartesian3.fromDegrees(-99.1332, 19.4326, 2000000),
          duration: 2,
        })

        // Telemetry update
        const telemetryInterval = setInterval(() => {
          if (disposedRef.current) return
          updateTelemetry({
            entitiesRendered: DEMO_SATELLITES.length,
            entitiesTotal: DEMO_SATELLITES.length,
            rendererState: 'READY',
          })
        }, 5000)

        setLoading(false)

        return () => {
          clearInterval(telemetryInterval)
        }
      } catch (e: any) {
        if (!cancelled && !disposedRef.current) {
          console.error('[EarthView] Cesium init error:', e)
          setError(e.message || 'Error al inicializar Cesium')
          setLoading(false)
        }
      }
    }

    const cleanupPromise = initCesium()

    return () => {
      cancelled = true
      disposedRef.current = true

      // Cleanup Cesium viewer
      if (viewerRef.current) {
        try {
          // Remove all entities first
          entitiesRef.current.forEach((entity) => {
            if (viewerRef.current?.entities?.contains(entity)) {
              viewerRef.current.entities.remove(entity)
            }
          })
          entitiesRef.current = []

          // Destroy viewer
          viewerRef.current.destroy()
          viewerRef.current = null
        } catch (e) {
          console.warn('[EarthView] Cleanup error:', e)
        }
      }

      // Remove Cesium canvas container
      if (containerRef.current) {
        containerRef.current.innerHTML = ''
      }
    }
  }, [updateTelemetry])

  if (loading) {
    return (
      <div style={centerStyle}>
        <div style={spinnerStyle} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        <span style={{ color: 'var(--text-secondary)', fontSize: 12 }}>
          Inicializando Cesium...
        </span>
      </div>
    )
  }

  if (error) {
    return (
      <div style={centerStyle}>
        <div style={{ fontSize: 32, marginBottom: 8 }}>🌍</div>
        <span style={{ color: 'var(--text-warning)', fontSize: 13, textAlign: 'center', maxWidth: 350 }}>
          {error}
        </span>
        <span style={{ color: 'var(--text-muted)', fontSize: 11, marginTop: 8 }}>
          Verifica que VITE_CESIUM_ION_TOKEN esté configurado o usa modo demo
        </span>
        <button
          onClick={() => { setError(null); setLoading(true) }}
          style={{
            marginTop: 12,
            padding: '6px 16px',
            borderRadius: 6,
            border: '1px solid var(--border-color)',
            background: 'var(--bg-secondary)',
            color: 'var(--text-primary)',
            cursor: 'pointer',
            fontSize: 12,
          }}
        >
          Reintentar
        </button>
      </div>
    )
  }

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative' }}>
      <div ref={containerRef} style={{ width: '100%', height: '100%' }} />

      {/* Satellite legend */}
      <div style={legendStyle}>
        <div style={{ fontSize: 10, fontWeight: 600, marginBottom: 6, color: 'var(--text-accent)' }}>
          Satélites
        </div>
        {DEMO_SATELLITES.map((sat) => (
          <div key={sat.name} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '2px 0' }}>
            <div style={{
              width: 8, height: 8, borderRadius: '50%',
              background: sat.type === 'station' ? '#00ffff' : sat.type === 'science' ? '#ff00ff' : '#ffff00',
              boxShadow: `0 0 4px ${sat.type === 'station' ? '#00ffff' : sat.type === 'science' ? '#ff00ff' : '#ffff00'}`,
            }} />
            <span style={{ fontSize: 10, color: 'var(--text-primary)' }}>{sat.name}</span>
            <span style={{ fontSize: 9, color: 'var(--text-muted)', marginLeft: 'auto' }}>
              {(sat.alt / 1000).toFixed(0)} km
            </span>
          </div>
        ))}
      </div>

      {/* Controls hint */}
      <div style={hintStyle}>
        <span style={{ fontSize: 9, color: 'var(--text-muted)' }}>
          🖱️ Click+drag: rotar • Scroll: zoom • Right-click: pan
        </span>
      </div>
    </div>
  )
}

const centerStyle: React.CSSProperties = {
  width: '100%',
  height: '100%',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  flexDirection: 'column',
  gap: 12,
}

const spinnerStyle: React.CSSProperties = {
  width: 40,
  height: 40,
  borderRadius: '50%',
  border: '3px solid var(--border-color)',
  borderTopColor: 'var(--accent-blue)',
  animation: 'spin 1s linear infinite',
}

const legendStyle: React.CSSProperties = {
  position: 'absolute',
  top: 12,
  left: 12,
  background: 'var(--hud-bg)',
  border: '1px solid var(--hud-border)',
  borderRadius: 8,
  padding: '10px 12px',
  backdropFilter: 'blur(8px)',
  zIndex: 10,
  minWidth: 160,
}

const hintStyle: React.CSSProperties = {
  position: 'absolute',
  bottom: 12,
  left: '50%',
  transform: 'translateX(-50%)',
  background: 'var(--hud-bg)',
  border: '1px solid var(--hud-border)',
  borderRadius: 6,
  padding: '4px 12px',
  backdropFilter: 'blur(8px)',
  zIndex: 10,
}
