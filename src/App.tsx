import { useState, useCallback, Suspense, lazy, useMemo } from 'react'
import ErrorBoundary from './components/ErrorBoundary'
import LoadingScreen from './components/LoadingScreen'
import Header from './components/Header'
import Sidebar from './components/Sidebar'
import Inspector from './components/Inspector'
import BottomBar from './components/BottomBar'
import SpatialCanvas from './components/SpatialCanvas'
import type { ViewMode, QualityProfile, Workspace, Project, Alert } from './engines/types'

const CitationSolarSystem = lazy(() => import('./components/CitationSolarSystem'))
const GargantuaSimulation = lazy(() => import('./components/GargantuaSimulation'))

const DEMO_PROJECTS: Project[] = [
  { id: 'templo-mayor', name: 'Templo Mayor', location: 'CDMX - Centro Histórico', status: 'active', crs: 'EPSG:6362' },
  { id: 'cerro-gordo', name: 'Cerro Gordo', location: 'Puebla - Cholula', status: 'active', crs: 'EPSG:6362' },
  { id: 'presa-amistad', name: 'Presa La Amistad', location: 'Coahuila - Frontera', status: 'review', crs: 'EPSG:6362' },
  { id: 'zona-portuaria', name: 'Zona Portuaria', location: 'Veracruz - Boca del Río', status: 'inactive', crs: 'EPSG:6362' },
]

const DEMO_ALERTS: Alert[] = [
  { id: 1, type: 'structural', severity: 'high', title: 'Riesgo estructural alto', description: 'Desplazamiento > umbral en sector NE', time: 'Hoy, 08:15' },
  { id: 2, type: 'volume', severity: 'medium', title: 'Volumen excedido', description: '+18.7% sobre modelo base', time: 'Ayer, 16:42' },
  { id: 3, type: 'slope', severity: 'low', title: 'Pendiente inestable', description: 'Zona SO - Factor de seguridad: 1.12', time: 'Ayer, 11:03' },
]

export default function App() {
  const [workspace, setWorkspace] = useState<Workspace>('explore')
  const [viewMode, setViewMode] = useState<ViewMode>('earth')
  const [quality, setQuality] = useState<QualityProfile>('high')
  const [activeProject, setActiveProject] = useState<Project>(DEMO_PROJECTS[0])
  const [showSolarSystem, setShowSolarSystem] = useState(false)
  const [showGargantua, setShowGargantua] = useState(false)
  const [selectedEntity, setSelectedEntity] = useState<any>(null)
  const [alerts] = useState<Alert[]>(DEMO_ALERTS)
  const [telemetry, setTelemetry] = useState({ fps: 0, nodes: 0, edges: 0, entities: 0, triangles: 0 })
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [inspectorCollapsed, setInspectorCollapsed] = useState(false)

  const updateTelemetry = useCallback((t: Partial<typeof telemetry>) => {
    setTelemetry(prev => ({ ...prev, ...t }))
  }, [])

  const handleWorkspaceChange = useCallback((ws: Workspace) => {
    setWorkspace(ws)
    if (ws === 'astronomy') setShowSolarSystem(true)
    if (ws === 'simulation') setShowGargantua(true)
  }, [])

  const volumeData = useMemo(() => ({
    cut: -27842,
    fill: 16395,
    net: -11447,
    area: 8.52,
    precision: 2.1,
    chartData: [
      { label: '-5m', value: 30, color: '#3498db' },
      { label: '-2.5m', value: 55, color: '#2ecc71' },
      { label: '0m', value: 80, color: '#f39c12' },
      { label: '+2.5m', value: 45, color: '#e74c3c' },
      { label: '+5m', value: 20, color: '#9b59b6' },
    ]
  }), [])

  const riskIndicators = useMemo(() => ({
    overall: 72,
    level: 'Alto' as const,
    items: [
      { name: 'Estabilidad estructural', value: 78, level: 'Alto' as const },
      { name: 'Deslizamiento', value: 65, level: 'Alto' as const },
      { name: 'Inundación', value: 41, level: 'Medio' as const },
      { name: 'Erosión', value: 28, level: 'Bajo' as const },
    ]
  }), [])

  return (
    <ErrorBoundary>
      <div style={{
        width: '100vw',
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        background: '#0a0a0f',
        color: '#e0e0e0',
        fontFamily: '"Inter", "Segoe UI", system-ui, sans-serif',
        overflow: 'hidden',
      }}>
        {/* HEADER */}
        <Header
          project={activeProject}
          projects={DEMO_PROJECTS}
          onProjectChange={setActiveProject}
          alerts={alerts}
          onSearch={() => {}}
        />

        {/* MAIN BODY */}
        <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
          {/* SIDEBAR */}
          <Sidebar
            workspace={workspace}
            onWorkspaceChange={handleWorkspaceChange}
            collapsed={sidebarCollapsed}
            onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
            projects={DEMO_PROJECTS}
            activeProject={activeProject}
            onProjectSelect={setActiveProject}
          />

          {/* CANVAS CENTRAL - NUNCA se oculta */}
          <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
            <SpatialCanvas
              viewMode={viewMode}
              workspace={workspace}
              quality={quality}
              project={activeProject}
              onTelemetry={updateTelemetry}
              onEntitySelect={setSelectedEntity}
            />

            {/* Overlays modales */}
            <Suspense fallback={<LoadingScreen message="Cargando simulación..." />}>
              {showSolarSystem && (
                <CitationSolarSystem
                  onClose={() => setShowSolarSystem(false)}
                  quality={quality}
                />
              )}
              {showGargantua && (
                <GargantuaSimulation
                  onClose={() => setShowGargantua(false)}
                  quality={quality}
                />
              )}
            </Suspense>
          </div>

          {/* INSPECTOR */}
          <Inspector
            entity={selectedEntity}
            alerts={alerts}
            volumeData={volumeData}
            riskIndicators={riskIndicators}
            collapsed={inspectorCollapsed}
            onToggle={() => setInspectorCollapsed(!inspectorCollapsed)}
            workspace={workspace}
          />
        </div>

        {/* BOTTOM BAR */}
        <BottomBar
          viewMode={viewMode}
          onViewModeChange={setViewMode}
          quality={quality}
          onQualityChange={setQuality}
          workspace={workspace}
          onWorkspaceChange={setWorkspace}
          telemetry={telemetry}
          coordinates={{ lat: 19.4326, lon: -99.1332, elev: 2240 }}
        />
      </div>
    </ErrorBoundary>
  )
}
