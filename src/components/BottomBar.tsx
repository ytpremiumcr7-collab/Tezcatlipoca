import { useTezcatlipoca } from '@/stores/tezcatlipocaStore'
import TimeController from './TimeController'

export default function BottomBar() {
  const { camera, backendStatus, lastSync } = useTezcatlipoca()

  const statusColor = {
    REAL: '#22c55e',
    CACHED: '#38bdf8',
    STALE: '#f59e0b',
    SIMULATED: '#a78bfa',
    UNAVAILABLE: '#ef4444',
    ERROR: '#ef4444',
  }[backendStatus] || '#94a3b8'

  return (
    <div style={{
      gridArea: 'bottom',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 16px',
      background: 'var(--bg-secondary)',
      borderRadius: 8,
      border: '1px solid var(--border-color)',
      gap: 16,
    }}>
      {/* Coordinates */}
      <div style={{
        display: 'flex',
        gap: 16,
        fontFamily: 'var(--font-mono)',
        fontSize: 11,
      }}>
        <span style={{ color: 'var(--text-secondary)' }}>
          LAT: <span style={{ color: 'var(--text-accent)' }}>{camera.position[1].toFixed(4)}°</span>
        </span>
        <span style={{ color: 'var(--text-secondary)' }}>
          LON: <span style={{ color: 'var(--text-accent)' }}>{camera.position[0].toFixed(4)}°</span>
        </span>
        <span style={{ color: 'var(--text-secondary)' }}>
          ALT: <span style={{ color: 'var(--text-accent)' }}>{(camera.position[2] / 1000).toFixed(1)} km</span>
        </span>
        <span style={{ color: 'var(--text-secondary)' }}>
          ZOOM: <span style={{ color: 'var(--text-accent)' }}>{camera.zoom.toFixed(2)}×</span>
        </span>
      </div>

      {/* Time Controller */}
      <TimeController />

      {/* Status */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        fontSize: 10,
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6,
        }}>
          <div style={{
            width: 6, height: 6, borderRadius: '50%',
            background: statusColor,
            boxShadow: `0 0 4px ${statusColor}`,
          }} />
          <span style={{ color: 'var(--text-secondary)' }}>{backendStatus}</span>
        </div>
        <span style={{ color: 'var(--text-secondary)' }}>
          Sync: {new Date(lastSync).toLocaleTimeString()}
        </span>
      </div>
    </div>
  )
}
