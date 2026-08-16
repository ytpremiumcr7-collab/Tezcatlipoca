import { useTezcatlipoca } from '@/stores/tezcatlipocaStore'
import { Suspense, lazy } from 'react'

const MapView = lazy(() => import('./MapView'))
const EarthView = lazy(() => import('./EarthView'))
const GlobeView = lazy(() => import('./GlobeView'))
const SpaceView = lazy(() => import('./SpaceView'))

export default function WorldViewport() {
  const { viewMode } = useTezcatlipoca()

  return (
    <div style={{
      gridArea: 'world',
      position: 'relative',
      borderRadius: 12,
      overflow: 'hidden',
      border: '1px solid var(--border-color)',
      background: 'var(--bg-primary)',
    }}>
      <Suspense fallback={<ViewportLoading />}>
        {viewMode === 'map' && <MapView />}
        {viewMode === 'earth' && <EarthView />}
        {viewMode === 'globe' && <GlobeView />}
        {viewMode === 'space' && <SpaceView />}
      </Suspense>
    </div>
  )
}

function ViewportLoading() {
  return (
    <div style={{
      width: '100%', height: '100%',
      display: 'flex',
      alignItems: 'center', justifyContent: 'center',
      flexDirection: 'column',
      gap: 16,
    }}>
      <div style={{
        width: 48, height: 48,
        borderRadius: '50%',
        border: '3px solid var(--border-color)',
        borderTopColor: 'var(--accent-blue)',
        animation: 'spin 1s linear infinite',
      }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      <span style={{ color: 'var(--text-secondary)', fontSize: 12 }}>
        Cargando mundo...
      </span>
    </div>
  )
}
