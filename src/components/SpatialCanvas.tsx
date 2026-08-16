import { Suspense, lazy, useEffect, useState } from 'react'
import type { ViewMode, QualityProfile, Workspace, Project } from '../engines/types'
import LoadingScreen from './LoadingScreen'

const CesiumGlobe = lazy(() => import('./CesiumGlobe'))
const TopographyHub = lazy(() => import('./TopographyHub'))

interface Props {
  viewMode: ViewMode
  workspace: Workspace
  quality: QualityProfile
  project: Project
  onTelemetry: (t: any) => void
  onEntitySelect: (e: any) => void
}

export default function SpatialCanvas({ workspace, quality, onTelemetry, onEntitySelect }: Props) {
  const [showTopography, setShowTopography] = useState(false)

  useEffect(() => {
    setShowTopography(workspace === 'survey' || workspace === 'terrain')
  }, [workspace])

  const workspaceLabel = workspace === 'explore' ? 'Modo Explorar' : 
    workspace === 'survey' ? 'Modo Topografia' :
    workspace === 'terrain' ? 'Modo Terreno' :
    workspace === 'bim' ? 'Modo BIM' :
    workspace === 'observe' ? 'Modo Observacion' :
    workspace === 'astronomy' ? 'Modo Astronomia' :
    workspace === 'simulation' ? 'Modo Simulacion' : workspace

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative' }}>
      {/* Base: Cesium Globe/Earth/Map - SIEMPRE presente */}
      <div style={{ position: 'absolute', inset: 0, zIndex: 1 }}>
        <Suspense fallback={<LoadingScreen message="Inicializando Cesium..." />}>
          <CesiumGlobe quality={quality} onTelemetry={onTelemetry} />
        </Suspense>
      </div>

      {/* Topography overlay cuando workspace = survey/terrain */}
      {showTopography && (
        <div style={{ position: 'absolute', inset: 0, zIndex: 10, background: 'rgba(10,10,15,0.95)' }}>
          <Suspense fallback={<LoadingScreen message="Generando TIN..." />}>
            <TopographyHub quality={quality} onTelemetry={onTelemetry} />
          </Suspense>
        </div>
      )}

      {/* Workspace indicator */}
      <div style={{
        position: 'absolute', top: '12px', left: '50%', transform: 'translateX(-50%)',
        zIndex: 20, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(10px)',
        padding: '6px 20px', borderRadius: '20px', border: '1px solid rgba(255,165,0,0.2)',
        fontSize: '12px', color: '#ffa500', textTransform: 'uppercase', letterSpacing: '1px'
      }}>
        {workspaceLabel}
      </div>
    </div>
  )
}
