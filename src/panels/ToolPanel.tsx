import { useTezcatlipoca } from '@/stores/tezcatlipocaStore'
import type { ToolType } from '@/types'
import BIMPanel from './BIMPanel'

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
// SURVEY PANEL
// ---------------------------------------------------------------------------
function SurveyPanel() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <Section title="Importar Datos">
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {['CSV', 'GeoJSON', 'SHP', 'LandXML', 'LAS'].map((fmt) => (
            <button key={fmt} className="tool-btn">📁 {fmt}</button>
          ))}
        </div>
      </Section>

      <Section title="Levantamiento">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          <ToolAction label="Puntos de control" desc="Insertar/editar puntos" />
          <ToolAction label="Poligonal" desc="Crear poligonal de apoyo" />
          <ToolAction label="Niveles" desc="Curvas de nivel" />
          <ToolAction label="Breaklines" desc="Líneas de quiebre" />
        </div>
      </Section>

      <Section title="Superficie">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          <ToolAction label="TIN" desc="Triangulación irregular" />
          <ToolAction label="Grid" desc="Superficie regular" />
          <ToolAction label="DEM" desc="Modelo digital de elevaciones" />
          <ToolAction label="DTM/DSM" desc="Terreno/superficie" />
        </div>
      </Section>

      <Section title="Análisis">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
          <ToolAction label="Perfiles" desc="Secciones longitudinales" />
          <ToolAction label="Curvas de nivel" desc="Generar contornos" />
          <ToolAction label="Corte/Relleno" desc="Volumen de movimiento" />
          <ToolAction label="Volúmenes" desc="Cálculo de volúmenes" />
          <ToolAction label="Drenaje" desc="Cuencas y escorrentía" />
          <ToolAction label="Visibilidad" desc="Línea de vista" />
        </div>
      </Section>

      <Section title="QA/QC">
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="tool-btn">✅ Validar geometría</button>
          <button className="tool-btn">📊 Reporte de precisión</button>
          <button className="tool-btn">🔍 Cierre poligonal</button>
        </div>
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
// REPORT PANEL
// ---------------------------------------------------------------------------
function ReportPanel() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <Section title="QA/QC">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          <ToolAction label="Validar dataset" desc="Chequeo completo" />
          <ToolAction label="Comparar versiones" desc="Diff de terrenos" />
          <ToolAction label="Trazabilidad" desc="Provenance" />
          <ToolAction label="Tolerancias" desc="Verificar límites" />
        </div>
      </Section>

      <Section title="Exportar">
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {['PDF', 'CSV', 'GeoJSON', 'DXF', 'LandXML', 'IFC'].map((fmt) => (
            <button key={fmt} className="tool-btn">📤 {fmt}</button>
          ))}
        </div>
      </Section>

      <Section title="Snapshots">
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="tool-btn">📸 Crear snapshot</button>
          <button className="tool-btn">🔄 Restaurar</button>
          <button className="tool-btn">📊 Comparar</button>
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
