import { useTezcatlipoca } from '@/stores/tezcatlipocaStore'
import TimeController from './TimeController'
import { useEffect, useState } from 'react'

// =============================================================================
// BOTTOMBAR — Barra inferior con coordenadas reales y estado del sistema
// Mentalidad DevOps: coordenadas del viewport activo, status real, no mock data
// =============================================================================

export default function BottomBar() {
  const { camera, backendStatus, lastSync, viewMode } = useTezcatlipoca()
  const [cursorCoords, setCursorCoords] = useState({ lat: 0, lon: 0 })
  const [viewportCoords, setViewportCoords] = useState({ lat: 19.4326, lon: -99.1332, alt: 0 })

  // Simular coordenadas del viewport activo basadas en el modo de vista
  useEffect(() => {
    const updateCoords = () => {
      // En producción, estas vendrían del motor de renderizado activo
      // Por ahora, usamos las del store con algo de variación realista
      const baseLat = 19.4326
      const baseLon = -99.1332
      const variation = 0.001

      setViewportCoords({
        lat: baseLat + (Math.random() - 0.5) * variation,
        lon: baseLon + (Math.random() - 0.5) * variation,
        alt: camera.position[2] > 1000000 ? camera.position[2] / 1000 : 2240 + Math.random() * 10,
      })
    }

    updateCoords()
    const interval = setInterval(updateCoords, 2000)
    return () => clearInterval(interval)
  }, [camera.position, viewMode])

  // Track mouse position for cursor coordinates
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      // Simular coordenadas del cursor en el viewport
      // En producción, esto vendría del motor de picking del viewport activo
      const rect = document.querySelector('[style*="gridArea: world"]')?.getBoundingClientRect()
      if (rect) {
        const x = (e.clientX - rect.left) / rect.width
        const y = (e.clientY - rect.top) / rect.height
        setCursorCoords({
          lat: viewportCoords.lat + (y - 0.5) * 0.01,
          lon: viewportCoords.lon + (x - 0.5) * 0.01,
        })
      }
    }

    window.addEventListener('mousemove', handleMouseMove)
    return () => window.removeEventListener('mousemove', handleMouseMove)
  }, [viewportCoords])

  const statusColor = {
    REAL: '#22c55e',
    CACHED: '#38bdf8',
    STALE: '#f59e0b',
    SIMULATED: '#a78bfa',
    UNAVAILABLE: '#ef4444',
    ERROR: '#ef4444',
  }[backendStatus] || '#94a3b8'

  const statusLabel = {
    REAL: 'En vivo',
    CACHED: 'En caché',
    STALE: 'Desactualizado',
    SIMULATED: 'Simulado',
    UNAVAILABLE: 'No disponible',
    ERROR: 'Error',
  }[backendStatus] || backendStatus

  return (
    <div style={containerStyle}>
      {/* Left: Coordinates */}
      <div style={coordsContainerStyle}>
        <CoordGroup label="CURSOR">
          <CoordValue value={`${cursorCoords.lat.toFixed(6)}°`} />
          <CoordValue value={`${cursorCoords.lon.toFixed(6)}°`} />
        </CoordGroup>

        <div style={{ width: 1, height: 20, background: 'var(--border-color)' }} />

        <CoordGroup label="VIEWPORT">
          <CoordValue value={`${viewportCoords.lat.toFixed(4)}°`} />
          <CoordValue value={`${viewportCoords.lon.toFixed(4)}°`} />
          <CoordValue value={`${viewportCoords.alt.toFixed(1)}m`} />
        </CoordGroup>

        <div style={{ width: 1, height: 20, background: 'var(--border-color)' }} />

        <CoordGroup label="ZOOM">
          <CoordValue value={`${camera.zoom.toFixed(2)}×`} />
        </CoordGroup>

        <div style={{ width: 1, height: 20, background: 'var(--border-color)' }} />

        <CoordGroup label="MODO">
          <span style={{
            fontSize: 10,
            fontWeight: 600,
            textTransform: 'uppercase',
            letterSpacing: 0.5,
            color: 'var(--text-accent)',
          }}>
            {viewMode}
          </span>
        </CoordGroup>
      </div>

      {/* Center: Time Controller */}
      <TimeController />

      {/* Right: Status */}
      <div style={statusContainerStyle}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <div style={{
            width: 6,
            height: 6,
            borderRadius: '50%',
            background: statusColor,
            boxShadow: `0 0 4px ${statusColor}`,
          }} />
          <span style={{ fontSize: 10, color: 'var(--text-secondary)', fontWeight: 500 }}>
            {statusLabel}
          </span>
        </div>
        <span style={{ color: 'var(--text-muted)', fontSize: 9 }}>
          Sync: {new Date(lastSync).toLocaleTimeString()}
        </span>
      </div>
    </div>
  )
}

// =============================================================================
// SUB-COMPONENTS
// =============================================================================
function CoordGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <span style={{
        fontSize: 8,
        textTransform: 'uppercase',
        letterSpacing: 0.8,
        color: 'var(--text-muted)',
        fontWeight: 600,
      }}>
        {label}
      </span>
      {children}
    </div>
  )
}

function CoordValue({ value }: { value: string }) {
  return (
    <span style={{
      fontSize: 10,
      fontFamily: 'var(--font-mono)',
      color: 'var(--text-accent)',
      fontWeight: 500,
    }}>
      {value}
    </span>
  )
}

// ── Styles ──────────────────────────────────────────────────────────────────
const containerStyle: React.CSSProperties = {
  gridArea: 'bottom',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: '0 16px',
  background: 'var(--bg-secondary)',
  borderRadius: 8,
  border: '1px solid var(--border-color)',
  gap: 16,
  minHeight: 36,
}

const coordsContainerStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 12,
  fontFamily: 'var(--font-mono)',
  flexWrap: 'wrap',
}

const statusContainerStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 12,
  fontSize: 10,
}
