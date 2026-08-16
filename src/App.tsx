import { useEffect, Suspense } from 'react'
import { useTezcatlipoca } from '@/stores/tezcatlipocaStore'
import { getSpatialRuntime } from '@/engines/SpatialRuntime'
import Header from '@/components/Header'
import LeftPanel from '@/components/LeftPanel'
import RightPanel from '@/components/RightPanel'
import WorldViewport from '@/components/WorldViewport'
import ToolButtons from '@/components/ToolButtons'
import ToolPanel from '@/panels/ToolPanel'
import BottomBar from '@/components/BottomBar'
import HUD from '@/components/HUD'
import ErrorBoundary from '@/components/ErrorBoundary'

export default function App() {
  const { fullscreen } = useTezcatlipoca()

  useEffect(() => {
    const runtime = getSpatialRuntime()
    return () => { /* cleanup */ }
  }, [])

  return (
    <ErrorBoundary>
      <div className={`tezcatlipoca-grid ${fullscreen ? 'fullscreen' : ''}`}>
        <Header />
        <LeftPanel />
        <Suspense fallback={<ViewportLoading />}>
          <WorldViewport />
        </Suspense>
        <RightPanel />
        <ToolButtons />
        <ToolPanel />
        <BottomBar />
        <HUD />
      </div>
    </ErrorBoundary>
  )
}

function ViewportLoading() {
  return (
    <div style={{
      gridArea: 'world',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      flexDirection: 'column',
      gap: 16,
      background: 'var(--bg-primary)',
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
        Cargando mundo espacial...
      </span>
    </div>
  )
}
