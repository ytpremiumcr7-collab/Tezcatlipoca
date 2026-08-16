import { useState, useCallback } from 'react'
import { useTezcatlipoca } from '@/stores/tezcatlipocaStore'
import type { ToolType } from '@/types'
import BIMPanel from './BIMPanel'
import * as topo from '@/services/topographyEngine'
import * as bim from '@/services/bimEngine'

export default function ToolPanel() {
  const { tool, deactivateTool } = useTezcatlipoca()
  const { activeTool } = tool

  if (activeTool === 'none') return null

  return (
    <div className="panel slide-up" style={{
      position: 'fixed',
      bottom: 140,
      left: '50%',
      transform: 'translateX(-50%)',
      width: 'min(900px, 90vw)',
      maxHeight: '65vh',
      zIndex: 40,
      display: 'flex',
      flexDirection: 'column',
    }}>
      <div className="panel-header">
        <span>{getToolTitle(activeTool)}</span>
        <button
          onClick={() => deactivateTool(activeTool)}
          style={{
            background: 'none',
            border: 'none',
            color: 'var(--text-secondary)',
            fontSize: 18,
            cursor: 'pointer',
          }}
        >
          ×
        </button>
      </div>
      <div style={{ padding: 16, overflow: 'auto' }}>
        <ToolContent tool={activeTool} />
      </div>
    </div>
  )
}

function getToolTitle(tool: ToolType): string {
  const titles: Record<string, string> = {
    survey: '📐 Survey — Topografía Avanzada',
    bim: '🏗️ BIM — Modelado Inteligente 4D/5D',
    pointcloud: '☁️ Point Cloud — Nubes de Puntos',
    terrain: '📊 Terrain — Análisis de Terreno',
    measure: '📏 Measure — Mediciones Geodésicas',
    report: '📋 Report — QA/QC y Exportación',
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
      return <div>Tool no implementado</div>
  }
}

// ---------------------------------------------------------------------------
// SURVEY PANEL — Conectado al backend real
// ---------------------------------------------------------------------------
function SurveyPanel() {
  const [importing, setImporting] = useState(false)
  const [importResult, setImportResult] = useState<{ jobId: string; pointCount: number } | null>(null)
  const [qaReport, setQaReport] = useState<topo.QAReport | null>(null)
  const [tinResult, setTinResult] = useState<{ tinId: string; triangleCount: number } | null>(null)
  const [volumeResult, setVolumeResult] = useState<topo.VolumeReport | null>(null)
  const [contours, setContours] = useState<topo.ContourLine[] | null>(null)
  const [loading, setLoading] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleImport = useCallback(async (file: File, format: 'CSV' | 'LAS' | 'LAZ' | 'XYZ' | 'LANDXML') => {
    setImporting(true)
    setError(null)
    try {
      const result = await topo.importPoints(file, format)
      setImportResult(result)
    } catch (e: any) {
      setError(e.message || 'Error al importar')
    } finally {
      setImporting(false)
    }
  }, [])

  const handleGenerateTIN = useCallback(async () => {
    setLoading('TIN')
    setError(null)
    try {
      const result = await topo.generateTIN('DELAUNAY')
      setTinResult(result)
    } catch (e: any) {
      setError(e.message || 'Error al generar TIN')
    } finally {
      setLoading(null)
    }
  }, [])

  const handleGenerateContours = useCallback(async () => {
    setLoading('Contours')
    setError(null)
    try {
      const result = await topo.generateContours(1.0, true)
      setContours(result)
    } catch (e: any) {
      setError(e.message || 'Error al generar curvas')
    } finally {
      setLoading(null)
    }
  }, [])

  const handleCalculateVolume = useCallback(async () => {
    setLoading('Volume')
    setError(null)
    try {
      const result = await topo.calculateVolume('TIN')
      setVolumeResult(result)
    } catch (e: any) {
      setError(e.message || 'Error al calcular volumen')
    } finally {
      setLoading(null)
    }
  }, [])

  const handleValidate = useCallback(async () => {
    setLoading('QA')
    setError(null)
    try {
      const result = await topo.validateSurvey()
      setQaReport(result)
    } catch (e: any) {
      setError(e.message || 'Error en validación')
    } finally {
      setLoading(null)
    }
  }, [])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {error && (
        <div style={{
          padding: '8px 12px', borderRadius: 6,
          background: 'rgba(239,68,68,0.1)', border: '1px solid var(--border-danger)',
          color: 'var(--text-danger)', fontSize: 12,
        }}>
          ❌ {error}
        </div>
      )}

      <Section title="Importar Datos">
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {(['CSV', 'LAS', 'LAZ', 'XYZ', 'LANDXML'] as const).map((fmt) => (
            <label key={fmt} className="tool-btn" style={{ cursor: 'pointer', position: 'relative' }}>
              📁 {fmt}
              <input
                type="file"
                accept={fmt === 'CSV' ? '.csv' : fmt === 'LAS' ? '.las' : fmt === 'LAZ' ? '.laz' : fmt === 'XYZ' ? '.xyz' : '.xml'}
                style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer' }}
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (file) handleImport(file, fmt)
                }}
              />
            </label>
          ))}
        </div>
        {importing && <div className="loading-spinner" style={{ width: 16, height: 16, marginTop: 8 }} />}
        {importResult && (
          <div style={{ fontSize: 11, color: 'var(--text-success)', marginTop: 8 }}>
            ✅ {importResult.pointCount} puntos importados (Job: {importResult.jobId})
          </div>
        )}
      </Section>

      <Section title="Superficie">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          <button
            className="tool-btn"
            onClick={handleGenerateTIN}
            disabled={loading === 'TIN'}
          >
            {loading === 'TIN' ? <span className="loading-spinner" style={{ width: 12, height: 12 }} /> : '🔷'} TIN
            <span style={{ fontSize: 10, color: 'var(--text-secondary)' }}>Triangulación Delaunay</span>
          </button>
          <ToolAction label="Grid" desc="Superficie regular" />
          <ToolAction label="DEM" desc="Modelo digital de elevaciones" />
          <ToolAction label="DTM/DSM" desc="Terreno/superficie" />
        </div>
        {tinResult && (
          <div style={{ fontSize: 11, color: 'var(--text-success)', marginTop: 8 }}>
            ✅ TIN generado: {tinResult.triangleCount} triángulos
          </div>
        )}
      </Section>

      <Section title="Análisis">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
          <ToolAction label="Perfiles" desc="Secciones longitudinales" />
          <button
            className="tool-btn"
            onClick={handleGenerateContours}
            disabled={loading === 'Contours'}
            style={{ flexDirection: 'column', alignItems: 'flex-start', gap: 2 }}
          >
            <span style={{ fontWeight: 600 }}>{loading === 'Contours' ? '⏳' : '📐'} Curvas de nivel</span>
            <span style={{ fontSize: 10, color: 'var(--text-secondary)' }}>Generar contornos</span>
          </button>
          <ToolAction label="Corte/Relleno" desc="Volumen de movimiento" />
          <button
            className="tool-btn"
            onClick={handleCalculateVolume}
            disabled={loading === 'Volume'}
            style={{ flexDirection: 'column', alignItems: 'flex-start', gap: 2 }}
          >
            <span style={{ fontWeight: 600 }}>{loading === 'Volume' ? '⏳' : '📦'} Volúmenes</span>
            <span style={{ fontSize: 10, color: 'var(--text-secondary)' }}>Cálculo de volúmenes</span>
          </button>
          <ToolAction label="Drenaje" desc="Cuencas y escorrentía" />
          <ToolAction label="Visibilidad" desc="Línea de vista" />
        </div>
        {contours && (
          <div style={{ fontSize: 11, color: 'var(--text-success)', marginTop: 8 }}>
            ✅ {contours.length} curvas de nivel generadas
          </div>
        )}
        {volumeResult && (
          <div style={{
            marginTop: 8, padding: 10, background: 'var(--bg-tertiary)',
            borderRadius: 6, fontSize: 11,
          }}>
            <div><strong>Volumen Total:</strong> {volumeResult.totalVolume.toFixed(2)} m³</div>
            <div><strong>Corte:</strong> {volumeResult.cutVolume.toFixed(2)} m³</div>
            <div><strong>Relleno:</strong> {volumeResult.fillVolume.toFixed(2)} m³</div>
            <div><strong>Neto:</strong> {volumeResult.netVolume.toFixed(2)} m³</div>
            <div><strong>Confianza:</strong> {(volumeResult.confidence * 100).toFixed(1)}%</div>
          </div>
        )}
      </Section>

      <Section title="QA/QC">
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            className="tool-btn"
            onClick={handleValidate}
            disabled={loading === 'QA'}
          >
            {loading === 'QA' ? <span className="loading-spinner" style={{ width: 12, height: 12 }} /> : '✅'} Validar geometría
          </button>
          <button className="tool-btn">📊 Reporte de precisión</button>
          <button className="tool-btn">🔍 Cierre poligonal</button>
        </div>
        {qaReport && (
          <div style={{
            marginTop: 8, padding: 10, background: 'var(--bg-tertiary)',
            borderRadius: 6, fontSize: 11,
          }}>
            <div style={{ color: qaReport.passed ? 'var(--text-success)' : 'var(--text-danger)' }}>
              {qaReport.passed ? '✅ Validación aprobada' : '❌ Errores encontrados'}
            </div>
            <div>Errores: {qaReport.summary.errors} | Warnings: {qaReport.summary.warnings} | Info: {qaReport.summary.info}</div>
          </div>
        )}
      </Section>
    </div>
  )
}

// ---------------------------------------------------------------------------
// POINT CLOUD PANEL
// ---------------------------------------------------------------------------
function PointCloudPanel() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <Section title="Importar">
        <div style={{ display: 'flex', gap: 8 }}>
          {['LAS', 'LAZ', 'E57', 'PTS'].map((fmt) => (
            <button key={fmt} className="tool-btn">📁 {fmt}</button>
          ))}
        </div>
      </Section>

      <Section title="Visualización">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
          <ToolAction label="RGB" desc="Color real" />
          <ToolAction label="Elevación" desc="Por altura" />
          <ToolAction label="Intensidad" desc="Reflejo láser" />
          <ToolAction label="Clasificación" desc="Ground, vegetation, etc." />
          <ToolAction label="Densidad" desc="Puntos/m²" />
          <ToolAction label="Curvatura" desc="Análisis geométrico" />
        </div>
      </Section>

      <Section title="Procesamiento">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          <ToolAction label="Clasificar" desc="Automático/manual" />
          <ToolAction label="Denoise" desc="Eliminar ruido" />
          <ToolAction label="Thinning" desc="Reducir densidad" />
          <ToolAction label="Segmentar" desc="Dividir en regiones" />
        </div>
      </Section>
    </div>
  )
}

// ---------------------------------------------------------------------------
// TERRAIN PANEL
// ---------------------------------------------------------------------------
function TerrainPanel() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <Section title="Análisis">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
          <ToolAction label="Pendiente" desc="Mapa de pendientes" />
          <ToolAction label="Aspecto" desc="Dirección de pendiente" />
          <ToolAction label="Hillshade" desc="Sombreado" />
          <ToolAction label="Rugosidad" desc="Índice de rugosidad" />
          <ToolAction label="Curvatura" desc="Perfil/planform" />
          <ToolAction label="Wetness" desc="Índice de humedad" />
        </div>
      </Section>

      <Section title="Hidrología">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          <ToolAction label="Cuencas" desc="Delimitar cuencas" />
          <ToolAction label="Red de drenaje" desc="Canales y arroyos" />
          <ToolAction label="Escorrentía" desc="Modelo hidrológico" />
          <ToolAction label="Inundación" desc="Zonas de riesgo" />
        </div>
      </Section>

      <Section title="Visibilidad">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          <ToolAction label="Línea de vista" desc="Entre puntos" />
          <ToolAction label="Viewshed" desc="Área visible" />
          <ToolAction label="Perfil" desc="Sección longitudinal" />
          <ToolAction label="Corte" desc="Sección transversal" />
        </div>
      </Section>
    </div>
  )
}

// ---------------------------------------------------------------------------
// MEASURE PANEL
// ---------------------------------------------------------------------------
function MeasurePanel() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <Section title="Medición">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
          <ToolAction label="Distancia" desc="2 puntos" />
          <ToolAction label="Área" desc="Polígono" />
          <ToolAction label="Volumen" desc="3D" />
          <ToolAction label="Ángulo" desc="3 puntos" />
          <ToolAction label="Elevación" desc="Entre puntos" />
          <ToolAction label="Gradiente" desc="Pendiente %" />
        </div>
      </Section>

      <Section title="Geodesia">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          <ToolAction label="Transformar CRS" desc="Cambiar sistema" />
          <ToolAction label="UTM" desc="Coordenadas UTM" />
          <ToolAction label="ECEF" desc="Cartesianas" />
          <ToolAction label="ENU" desc="Locales" />
        </div>
      </Section>
    </div>
  )
}

// ---------------------------------------------------------------------------
// REPORT PANEL — Conectado al backend real (snapshots, export, QA)
// ---------------------------------------------------------------------------
function ReportPanel() {
  const [snapshots, setSnapshots] = useState<topo.TerrainSnapshot[] | null>(null)
  const [loading, setLoading] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [exporting, setExporting] = useState<string | null>(null)

  const handleListSnapshots = useCallback(async () => {
    setLoading('list')
    setError(null)
    try {
      const result = await topo.listSnapshots()
      setSnapshots(result)
    } catch (e: any) {
      setError(e.message || 'Error al listar snapshots')
    } finally {
      setLoading(null)
    }
  }, [])

  const handleCreateSnapshot = useCallback(async () => {
    setLoading('create')
    setError(null)
    try {
      const result = await topo.createSnapshot('Snapshot ' + new Date().toISOString())
      setSnapshots(prev => prev ? [result, ...prev] : [result])
    } catch (e: any) {
      setError(e.message || 'Error al crear snapshot')
    } finally {
      setLoading(null)
    }
  }, [])

  const handleRestoreSnapshot = useCallback(async (id: string) => {
    setLoading('restore')
    setError(null)
    try {
      await topo.restoreSnapshot(id)
      setSnapshots(null)
    } catch (e: any) {
      setError(e.message || 'Error al restaurar')
    } finally {
      setLoading(null)
    }
  }, [])

  const handleDeleteSnapshot = useCallback(async (id: string) => {
    setLoading('delete')
    setError(null)
    try {
      await topo.deleteSnapshot(id)
      setSnapshots(prev => prev?.filter(s => s.id !== id) || null)
    } catch (e: any) {
      setError(e.message || 'Error al eliminar')
    } finally {
      setLoading(null)
    }
  }, [])

  const handleExport = useCallback(async (format: 'CSV' | 'GeoJSON' | 'DXF' | 'LANDXML') => {
    setExporting(format)
    setError(null)
    try {
      const blob = await topo.exportPoints(format)
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `export.${format.toLowerCase()}`
      a.click()
      URL.revokeObjectURL(url)
    } catch (e: any) {
      setError(e.message || 'Error al exportar')
    } finally {
      setExporting(null)
    }
  }, [])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {error && (
        <div style={{
          padding: '8px 12px', borderRadius: 6,
          background: 'rgba(239,68,68,0.1)', border: '1px solid var(--border-danger)',
          color: 'var(--text-danger)', fontSize: 12,
        }}>
          ❌ {error}
        </div>
      )}

      <Section title="Snapshots">
        <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
          <button
            className="tool-btn"
            onClick={handleCreateSnapshot}
            disabled={loading === 'create'}
          >
            {loading === 'create' ? <span className="loading-spinner" style={{ width: 12, height: 12 }} /> : '📸'} Crear snapshot
          </button>
          <button
            className="tool-btn"
            onClick={handleListSnapshots}
            disabled={loading === 'list'}
          >
            {loading === 'list' ? <span className="loading-spinner" style={{ width: 12, height: 12 }} /> : '📋'} Listar
          </button>
        </div>

        {snapshots && snapshots.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {snapshots.map((snap) => (
              <div key={snap.id} style={{
                padding: '8px 12px', background: 'var(--bg-tertiary)',
                borderRadius: 6, display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              }}>
                <div>
                  <div style={{ fontSize: 11, fontWeight: 600 }}>{snap.name}</div>
                  <div style={{ fontSize: 10, color: 'var(--text-secondary)' }}>
                    {new Date(snap.createdAt).toLocaleString()} • {snap.pointCount} pts • {snap.tinCount} TINs
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 4 }}>
                  <button
                    className="tool-btn"
                    style={{ fontSize: 10 }}
                    onClick={() => handleRestoreSnapshot(snap.id)}
                    disabled={loading === 'restore'}
                  >
                    🔄
                  </button>
                  <button
                    className="tool-btn"
                    style={{ fontSize: 10, color: 'var(--text-danger)' }}
                    onClick={() => handleDeleteSnapshot(snap.id)}
                    disabled={loading === 'delete'}
                  >
                    🗑️
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {snapshots && snapshots.length === 0 && (
          <div style={{ fontSize: 11, color: 'var(--text-secondary)', padding: '8px 0' }}>
            No hay snapshots. Crea uno para guardar el estado actual.
          </div>
        )}
      </Section>

      <Section title="Exportar">
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {(['CSV', 'GeoJSON', 'DXF', 'LANDXML'] as const).map((fmt) => (
            <button
              key={fmt}
              className="tool-btn"
              onClick={() => handleExport(fmt)}
              disabled={exporting === fmt}
            >
              {exporting === fmt ? <span className="loading-spinner" style={{ width: 12, height: 12 }} /> : '📤'} {fmt}
            </button>
          ))}
        </div>
      </Section>

      <Section title="QA/QC">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          <ToolAction label="Validar dataset" desc="Chequeo completo" />
          <ToolAction label="Comparar versiones" desc="Diff de terrenos" />
          <ToolAction label="Trazabilidad" desc="Provenance" />
          <ToolAction label="Tolerancias" desc="Verificar límites" />
        </div>
      </Section>
    </div>
  )
}

// ---------------------------------------------------------------------------
// HELPERS
// ---------------------------------------------------------------------------
function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: 12 }}>
      <h4 style={{
        fontSize: 11,
        textTransform: 'uppercase',
        letterSpacing: 1,
        color: 'var(--text-accent)',
        marginBottom: 8,
      }}>
        {title}
      </h4>
      {children}
    </div>
  )
}

function ToolAction({ label, desc }: { label: string; desc: string }) {
  return (
    <button className="tool-btn" style={{
      flexDirection: 'column',
      alignItems: 'flex-start',
      gap: 2,
      padding: '8px 12px',
      width: '100%',
    }}>
      <span style={{ fontWeight: 600 }}>{label}</span>
      <span style={{ fontSize: 10, color: 'var(--text-secondary)' }}>{desc}</span>
    </button>
  )
}
