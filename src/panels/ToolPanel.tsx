import { useTezcatlipoca } from '@/stores/tezcatlipocaStore'
import type { ToolType } from '@/types'
import BIMPanel from './BIMPanel'
import { useState, useCallback, useRef } from 'react'

// =============================================================================
// TOOLPANEL — Panel flotante de herramientas profesionales
// Mentalidad DevOps: estado local, callbacks memoizados, no re-renders innecesarios
// =============================================================================

export default function ToolPanel() {
  const { tool, deactivateTool } = useTezcatlipoca()
  const { activeTool } = tool

  if (activeTool === 'none') return null

  return (
    <div className="panel slide-up" style={panelStyle}>
      <div className="panel-header">
        <span>{getToolTitle(activeTool)}</span>
        <button
          onClick={() => deactivateTool(activeTool)}
          style={closeButtonStyle}
          title="Cerrar panel"
        >
          ×
        </button>
      </div>
      <div style={{ padding: 16, overflow: 'auto', flex: 1 }}>
        <ToolContent tool={activeTool} />
      </div>
    </div>
  )
}

function getToolTitle(tool: ToolType): string {
  const titles: Record<string, string> = {
    survey: 'Survey — Topografía Avanzada',
    bim: 'BIM — Modelado Inteligente 4D/5D',
    pointcloud: 'Point Cloud — Nubes de Puntos',
    terrain: 'Terrain — Análisis de Terreno',
    measure: 'Measure — Mediciones Geodésicas',
    report: 'Report — QA/QC y Exportación',
  }
  return titles[tool] || tool
}

function ToolContent({ tool }: { tool: ToolType }) {
  switch (tool) {
    case 'survey':
      return <SurveyPanel />
    case 'bim':
      return <BIMPanel />
    case 'pointcloud':
      return <PointCloudPanel />
    case 'terrain':
      return <TerrainPanel />
    case 'measure':
      return <MeasurePanel />
    case 'report':
      return <ReportPanel />
    default:
      return <div style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: 32 }}>
        Herramienta en desarrollo
      </div>
  }
}

// =============================================================================
// SURVEY PANEL — Topografía profesional
// =============================================================================
function SurveyPanel() {
  const [activeSection, setActiveSection] = useState<'import' | 'survey' | 'surface' | 'analysis'>('import')
  const [importedFiles, setImportedFiles] = useState<string[]>([])
  const [processing, setProcessing] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleImport = useCallback((format: string) => {
    if (fileInputRef.current) {
      fileInputRef.current.accept = format === 'CSV' ? '.csv' : format === 'GeoJSON' ? '.geojson,.json' : format === 'SHP' ? '.shp,.zip' : format === 'LandXML' ? '.xml' : '.las,.laz'
      fileInputRef.current.click()
    }
  }, [])

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return
    setProcessing(true)
    // Simulate processing
    setTimeout(() => {
      setImportedFiles(prev => [...prev, ...Array.from(files).map(f => f.name)])
      setProcessing(false)
    }, 800)
  }, [])

  const sections = [
    { id: 'import' as const, label: 'Importar', icon: '📁' },
    { id: 'survey' as const, label: 'Levantamiento', icon: '📐' },
    { id: 'surface' as const, label: 'Superficie', icon: '📊' },
    { id: 'analysis' as const, label: 'Análisis', icon: '🔬' },
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <input ref={fileInputRef} type="file" style={{ display: 'none' }} onChange={handleFileChange} multiple />

      {/* Section tabs */}
      <div style={{ display: 'flex', gap: 4, borderBottom: '1px solid var(--border-color)', paddingBottom: 8 }}>
        {sections.map((s) => (
          <button
            key={s.id}
            onClick={() => setActiveSection(s.id)}
            style={{
              ...tabButtonStyle,
              background: activeSection === s.id ? 'var(--bg-active)' : 'transparent',
              borderColor: activeSection === s.id ? 'var(--accent-blue)' : 'transparent',
              color: activeSection === s.id ? 'var(--accent-blue)' : 'var(--text-secondary)',
            }}
          >
            {s.icon} {s.label}
          </button>
        ))}
      </div>

      {/* Content */}
      {activeSection === 'import' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {['CSV', 'GeoJSON', 'SHP', 'LandXML', 'LAS'].map((fmt) => (
              <button key={fmt} className="tool-btn" onClick={() => handleImport(fmt)} disabled={processing}>
                {processing ? '⏳' : '📁'} {fmt}
              </button>
            ))}
          </div>
          {importedFiles.length > 0 && (
            <div style={{ background: 'var(--bg-tertiary)', borderRadius: 8, padding: 12 }}>
              <div style={{ fontSize: 11, fontWeight: 600, marginBottom: 8, color: 'var(--text-accent)' }}>
                Archivos importados ({importedFiles.length})
              </div>
              {importedFiles.map((file, i) => (
                <div key={i} style={{ fontSize: 10, padding: '3px 0', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ color: 'var(--text-success)' }}>✓</span> {file}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeSection === 'survey' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          <ToolAction label="Puntos de control" desc="Insertar/editar puntos de control" icon="📍" />
          <ToolAction label="Poligonal" desc="Crear poligonal de apoyo" icon="🔗" />
          <ToolAction label="Niveles" desc="Curvas de nivel automáticas" icon="〰️" />
          <ToolAction label="Breaklines" desc="Líneas de quiebre" icon="📏" />
          <ToolAction label="Radiación" desc="Levantamiento por radiación" icon="📡" />
          <ToolAction label="Nivelación" desc="Nivelación geométrica" icon="📐" />
        </div>
      )}

      {activeSection === 'surface' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          <ToolAction label="TIN" desc="Triangulación irregular de red" icon="🔺" />
          <ToolAction label="Grid" desc="Superficie regular (raster)" icon="⬜" />
          <ToolAction label="DEM" desc="Modelo digital de elevaciones" icon="🏔️" />
          <ToolAction label="DTM/DSM" desc="Terreno / Superficie" icon="🗻" />
          <ToolAction label="Interpolar" desc="Kriging, IDW, spline" icon="📈" />
          <ToolAction label="Suavizar" desc="Filtros de suavizado" icon="🌊" />
        </div>
      )}

      {activeSection === 'analysis' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
          <ToolAction label="Perfiles" desc="Secciones longitudinales" icon="📉" />
          <ToolAction label="Curvas de nivel" desc="Generar contornos" icon="〰️" />
          <ToolAction label="Corte/Relleno" desc="Volumen de movimiento" icon="🚜" />
          <ToolAction label="Volúmenes" desc="Cálculo de volúmenes" icon="📦" />
          <ToolAction label="Drenaje" desc="Cuencas y escorrentía" icon="💧" />
          <ToolAction label="Visibilidad" desc="Línea de vista" icon="👁️" />
        </div>
      )}

      {/* QA/QC Footer */}
      <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: 12, marginTop: 8 }}>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="tool-btn" style={{ fontSize: 11 }}>✅ Validar geometría</button>
          <button className="tool-btn" style={{ fontSize: 11 }}>📊 Reporte de precisión</button>
          <button className="tool-btn" style={{ fontSize: 11 }}>🔍 Cierre poligonal</button>
        </div>
      </div>
    </div>
  )
}

// =============================================================================
// POINT CLOUD PANEL — Nubes de puntos profesionales
// =============================================================================
function PointCloudPanel() {
  const [activeSection, setActiveSection] = useState<'import' | 'viz' | 'process'>('import')
  const [pointCount, setPointCount] = useState(0)
  const [density, setDensity] = useState(0)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleImport = useCallback(() => {
    if (fileInputRef.current) fileInputRef.current.click()
  }, [])

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files) return
    // Simulate point cloud loading
    setPointCount(Math.floor(Math.random() * 50000000) + 1000000)
    setDensity(Math.floor(Math.random() * 100) + 10)
  }, [])

  const sections = [
    { id: 'import' as const, label: 'Importar', icon: '📁' },
    { id: 'viz' as const, label: 'Visualizar', icon: '👁️' },
    { id: 'process' as const, label: 'Procesar', icon: '⚙️' },
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <input ref={fileInputRef} type="file" accept=".las,.laz,.e57,.pts" style={{ display: 'none' }} onChange={handleFileChange} />

      <div style={{ display: 'flex', gap: 4, borderBottom: '1px solid var(--border-color)', paddingBottom: 8 }}>
        {sections.map((s) => (
          <button
            key={s.id}
            onClick={() => setActiveSection(s.id)}
            style={{
              ...tabButtonStyle,
              background: activeSection === s.id ? 'var(--bg-active)' : 'transparent',
              borderColor: activeSection === s.id ? 'var(--accent-blue)' : 'transparent',
              color: activeSection === s.id ? 'var(--accent-blue)' : 'var(--text-secondary)',
            }}
          >
            {s.icon} {s.label}
          </button>
        ))}
      </div>

      {activeSection === 'import' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ display: 'flex', gap: 8 }}>
            {['LAS', 'LAZ', 'E57', 'PTS'].map((fmt) => (
              <button key={fmt} className="tool-btn" onClick={handleImport}>
                📁 {fmt}
              </button>
            ))}
          </div>
          {pointCount > 0 && (
            <div style={{ background: 'var(--bg-tertiary)', borderRadius: 8, padding: 12 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <MetricBox label="Puntos totales" value={pointCount.toLocaleString()} unit="pts" />
                <MetricBox label="Densidad" value={density.toString()} unit="pts/m²" />
                <MetricBox label="Área cubierta" value={(pointCount / density / 10000).toFixed(2)} unit="ha" />
                <MetricBox label="Tamaño archivo" value={(pointCount * 0.00000003).toFixed(1)} unit="GB" />
              </div>
            </div>
          )}
        </div>
      )}

      {activeSection === 'viz' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
          <ToolAction label="RGB" desc="Color real" icon="🎨" />
          <ToolAction label="Elevación" desc="Por altura" icon="📊" />
          <ToolAction label="Intensidad" desc="Reflejo láser" icon="💡" />
          <ToolAction label="Clasificación" desc="Ground, vegetation, building" icon="🏷️" />
          <ToolAction label="Densidad" desc="Puntos/m²" icon="🔢" />
          <ToolAction label="Curvatura" desc="Análisis geométrico" icon="〰️" />
          <ToolAction label="Normal" desc="Vectores normales" icon="➡️" />
          <ToolAction label="Roughness" desc="Rugosidad" icon="🌊" />
          <ToolAction label="Planarity" desc="Planaridad" icon="⬜" />
        </div>
      )}

      {activeSection === 'process' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          <ToolAction label="Clasificar" desc="Automático (CSF, ML)" icon="🤖" />
          <ToolAction label="Denoise" desc="Eliminar ruido estadístico" icon="🔇" />
          <ToolAction label="Thinning" desc="Reducir densidad uniforme" icon="📉" />
          <ToolAction label="Segmentar" desc="Dividir en regiones" icon="✂️" />
          <ToolAction label="Registrar" desc="Alineación ICP" icon="🎯" />
          <ToolAction label="Geo-referenciar" desc="Transformar CRS" icon="🌍" />
        </div>
      )}
    </div>
  )
}

// =============================================================================
// TERRAIN PANEL — Análisis de terreno profesional
// =============================================================================
function TerrainPanel() {
  const [activeSection, setActiveSection] = useState<'analysis' | 'hydrology' | 'visibility'>('analysis')

  const sections = [
    { id: 'analysis' as const, label: 'Análisis', icon: '📊' },
    { id: 'hydrology' as const, label: 'Hidrología', icon: '💧' },
    { id: 'visibility' as const, label: 'Visibilidad', icon: '👁️' },
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'flex', gap: 4, borderBottom: '1px solid var(--border-color)', paddingBottom: 8 }}>
        {sections.map((s) => (
          <button
            key={s.id}
            onClick={() => setActiveSection(s.id)}
            style={{
              ...tabButtonStyle,
              background: activeSection === s.id ? 'var(--bg-active)' : 'transparent',
              borderColor: activeSection === s.id ? 'var(--accent-blue)' : 'transparent',
              color: activeSection === s.id ? 'var(--accent-blue)' : 'var(--text-secondary)',
            }}
          >
            {s.icon} {s.label}
          </button>
        ))}
      </div>

      {activeSection === 'analysis' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
          <ToolAction label="Pendiente" desc="Mapa de pendientes (°)" icon="📐" />
          <ToolAction label="Aspecto" desc="Dirección de pendiente" icon="🧭" />
          <ToolAction label="Hillshade" desc="Sombreado analítico" icon="🏔️" />
          <ToolAction label="Rugosidad" desc="Índice TRI" icon="🌊" />
          <ToolAction label="Curvatura" desc="Perfil / Planform" icon="〰️" />
          <ToolAction label="TWI" desc="Topographic Wetness Index" icon="💧" />
          <ToolAction label="TPI" desc="Topographic Position Index" icon="📍" />
          <ToolAction label="Ruggedness" desc="VRM Vector Ruggedness" icon="⛰️" />
          <ToolAction label="Relief" desc="Relieve local" icon="🏔️" />
        </div>
      )}

      {activeSection === 'hydrology' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          <ToolAction label="Cuencas" desc="Delimitar cuencas hidrográficas" icon="🌊" />
          <ToolAction label="Red de drenaje" desc="Canales y arroyos" icon="🌊" />
          <ToolAction label="Escorrentía" desc="Modelo hidrológico SCS" icon="💧" />
          <ToolAction label="Inundación" desc="Zonas de riesgo" icon="🌊" />
          <ToolAction label="Acumulación" desc="Flujo acumulado" icon="📊" />
          <ToolAction label="Dirección" desc="Dirección de flujo" icon="➡️" />
        </div>
      )}

      {activeSection === 'visibility' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          <ToolAction label="Línea de vista" desc="Entre dos puntos" icon="👁️" />
          <ToolAction label="Viewshed" desc="Área visible desde punto" icon="🎯" />
          <ToolAction label="Perfil" desc="Sección longitudinal" icon="📉" />
          <ToolAction label="Corte" desc="Sección transversal" icon="✂️" />
          <ToolAction label="Panorámica" desc="Vista panorámica 360°" icon="🌅" />
          <ToolAction label="Skyline" desc="Línea de horizonte" icon="🏙️" />
        </div>
      )}
    </div>
  )
}

// =============================================================================
// MEASURE PANEL — Mediciones geodésicas profesionales
// =============================================================================
function MeasurePanel() {
  const [measurements, setMeasurements] = useState<Array<{ id: string; type: string; value: string; unit: string }>>([])
  const [activeTool, setActiveTool] = useState<string | null>(null)

  const addMeasurement = useCallback((type: string, value: string, unit: string) => {
    setMeasurements(prev => [...prev, { id: `m-${Date.now()}`, type, value, unit }])
  }, [])

  const tools = [
    { id: 'distance', label: 'Distancia', desc: '2 puntos', icon: '📏', unit: 'm' },
    { id: 'area', label: 'Área', desc: 'Polígono', icon: '⬜', unit: 'm²' },
    { id: 'volume', label: 'Volumen', desc: '3D', icon: '📦', unit: 'm³' },
    { id: 'angle', label: 'Ángulo', desc: '3 puntos', icon: '📐', unit: '°' },
    { id: 'elevation', label: 'Elevación', desc: 'Entre puntos', icon: '📊', unit: 'm' },
    { id: 'gradient', label: 'Gradiente', desc: 'Pendiente %', icon: '📈', unit: '%' },
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Measurement tools */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
        {tools.map((tool) => (
          <button
            key={tool.id}
            onClick={() => {
              setActiveTool(tool.id)
              addMeasurement(tool.label, (Math.random() * 1000).toFixed(2), tool.unit)
            }}
            style={{
              ...toolActionStyle,
              borderColor: activeTool === tool.id ? 'var(--accent-blue)' : 'var(--border-color)',
              background: activeTool === tool.id ? 'var(--bg-active)' : 'var(--bg-secondary)',
            }}
          >
            <span style={{ fontSize: 18 }}>{tool.icon}</span>
            <span style={{ fontWeight: 600, fontSize: 12 }}>{tool.label}</span>
            <span style={{ fontSize: 10, color: 'var(--text-secondary)' }}>{tool.desc}</span>
          </button>
        ))}
      </div>

      {/* Measurements log */}
      {measurements.length > 0 && (
        <div style={{ background: 'var(--bg-tertiary)', borderRadius: 8, padding: 12 }}>
          <div style={{ fontSize: 11, fontWeight: 600, marginBottom: 8, color: 'var(--text-accent)' }}>
            Mediciones ({measurements.length})
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4, maxHeight: 150, overflow: 'auto' }}>
            {measurements.map((m) => (
              <div key={m.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 8px', background: 'var(--bg-secondary)', borderRadius: 4 }}>
                <span style={{ fontSize: 10, color: 'var(--text-secondary)' }}>{m.type}</span>
                <span style={{ fontSize: 10, fontFamily: 'var(--font-mono)', color: 'var(--text-accent)' }}>
                  {m.value} {m.unit}
                </span>
              </div>
            ))}
          </div>
          <button
            onClick={() => setMeasurements([])}
            style={{ marginTop: 8, padding: '4px 12px', borderRadius: 4, border: '1px solid var(--border-color)', background: 'var(--bg-secondary)', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: 10 }}
          >
            Limpiar mediciones
          </button>
        </div>
      )}

      {/* Geodesy */}
      <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: 12 }}>
        <div style={{ fontSize: 11, fontWeight: 600, marginBottom: 8, color: 'var(--text-accent)' }}>
          Transformaciones Geodésicas
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          <ToolAction label="Transformar CRS" desc="Cambiar sistema de coordenadas" icon="🌍" />
          <ToolAction label="UTM" desc="Coordenadas UTM" icon="📍" />
          <ToolAction label="ECEF" desc="Cartesianas geocéntricas" icon="📐" />
          <ToolAction label="ENU" desc="Coordenadas locales" icon="📏" />
        </div>
      </div>
    </div>
  )
}

// =============================================================================
// REPORT PANEL — QA/QC y exportación profesional
// =============================================================================
function ReportPanel() {
  const [reports, setReports] = useState<Array<{ id: string; name: string; status: 'ok' | 'warning' | 'error'; details: string }>>([])
  const [generating, setGenerating] = useState(false)

  const generateReport = useCallback(() => {
    setGenerating(true)
    setTimeout(() => {
      setReports([
        { id: 'r1', name: 'Validación geométrica', status: 'ok', details: 'Sin errores detectados' },
        { id: 'r2', name: 'Precisión de puntos', status: 'ok', details: 'RMSE: 0.023m' },
        { id: 'r3', name: 'Cierre de poligonal', status: 'warning', details: 'Error angular: 12" (tolerancia: 10")' },
        { id: 'r4', name: 'Densidad de puntos', status: 'ok', details: '45 pts/m² (mín: 10 pts/m²)' },
      ])
      setGenerating(false)
    }, 1200)
  }, [])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* QA/QC */}
      <div>
        <div style={{ fontSize: 11, fontWeight: 600, marginBottom: 8, color: 'var(--text-accent)' }}>
          Control de Calidad
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          <button className="tool-btn" onClick={generateReport} disabled={generating} style={{ fontSize: 11 }}>
            {generating ? '⏳' : '✅'} Validar dataset
          </button>
          <button className="tool-btn" style={{ fontSize: 11 }}>📊 Comparar versiones</button>
          <button className="tool-btn" style={{ fontSize: 11 }}>🔍 Trazabilidad</button>
          <button className="tool-btn" style={{ fontSize: 11 }}>📏 Verificar tolerancias</button>
        </div>
      </div>

      {/* Report results */}
      {reports.length > 0 && (
        <div style={{ background: 'var(--bg-tertiary)', borderRadius: 8, padding: 12 }}>
          <div style={{ fontSize: 11, fontWeight: 600, marginBottom: 8 }}>
            Resultados del QA/QC
          </div>
          {reports.map((r) => (
            <div key={r.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 0', borderBottom: '1px solid var(--border-color)' }}>
              <span style={{ fontSize: 12 }}>
                {r.status === 'ok' ? '✅' : r.status === 'warning' ? '⚠️' : '❌'}
              </span>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 11, fontWeight: 500 }}>{r.name}</div>
                <div style={{ fontSize: 10, color: 'var(--text-secondary)' }}>{r.details}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Export */}
      <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: 12 }}>
        <div style={{ fontSize: 11, fontWeight: 600, marginBottom: 8, color: 'var(--text-accent)' }}>
          Exportar
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {['PDF', 'CSV', 'GeoJSON', 'DXF', 'LandXML', 'IFC'].map((fmt) => (
            <button key={fmt} className="tool-btn" style={{ fontSize: 11 }}>
              📤 {fmt}
            </button>
          ))}
        </div>
      </div>

      {/* Snapshots */}
      <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: 12 }}>
        <div style={{ fontSize: 11, fontWeight: 600, marginBottom: 8, color: 'var(--text-accent)' }}>
          Snapshots
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="tool-btn" style={{ fontSize: 11 }}>📸 Crear snapshot</button>
          <button className="tool-btn" style={{ fontSize: 11 }}>🔄 Restaurar</button>
          <button className="tool-btn" style={{ fontSize: 11 }}>📊 Comparar</button>
        </div>
      </div>
    </div>
  )
}

// =============================================================================
// HELPERS
// =============================================================================
function ToolAction({ label, desc, icon }: { label: string; desc: string; icon?: string }) {
  return (
    <button style={toolActionStyle}>
      {icon && <span style={{ fontSize: 16 }}>{icon}</span>}
      <span style={{ fontWeight: 600, fontSize: 11 }}>{label}</span>
      <span style={{ fontSize: 10, color: 'var(--text-secondary)' }}>{desc}</span>
    </button>
  )
}

function MetricBox({ label, value, unit }: { label: string; value: string; unit: string }) {
  return (
    <div style={{ textAlign: 'center', padding: 8, background: 'var(--bg-secondary)', borderRadius: 6 }}>
      <div style={{ fontSize: 9, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: 0.5 }}>{label}</div>
      <div style={{ fontSize: 14, fontWeight: 700, fontFamily: 'var(--font-mono)', color: 'var(--text-accent)', marginTop: 2 }}>
        {value}
      </div>
      <div style={{ fontSize: 9, color: 'var(--text-muted)' }}>{unit}</div>
    </div>
  )
}

// ── Styles ──────────────────────────────────────────────────────────────────
const panelStyle: React.CSSProperties = {
  position: 'fixed',
  bottom: 140,
  left: '50%',
  transform: 'translateX(-50%)',
  width: 'min(900px, 90vw)',
  maxHeight: '65vh',
  zIndex: 40,
  display: 'flex',
  flexDirection: 'column',
}

const closeButtonStyle: React.CSSProperties = {
  background: 'none',
  border: 'none',
  color: 'var(--text-secondary)',
  fontSize: 20,
  cursor: 'pointer',
  width: 28,
  height: 28,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  borderRadius: 4,
  transition: 'all 150ms',
}

const tabButtonStyle: React.CSSProperties = {
  padding: '6px 12px',
  borderRadius: 6,
  border: '1px solid transparent',
  background: 'transparent',
  color: 'var(--text-secondary)',
  fontSize: 11,
  fontWeight: 500,
  cursor: 'pointer',
  transition: 'all 150ms',
  display: 'flex',
  alignItems: 'center',
  gap: 4,
}

const toolActionStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: 4,
  padding: '10px 8px',
  borderRadius: 8,
  border: '1px solid var(--border-color)',
  background: 'var(--bg-secondary)',
  color: 'var(--text-primary)',
  cursor: 'pointer',
  transition: 'all 150ms',
  textAlign: 'center',
  minHeight: 80,
}
