import { useTezcatlipoca } from '@/stores/tezcatlipocaStore'
import type { ToolType } from '@/types'

const TOOLS: { id: ToolType; label: string; icon: string; desc: string }[] = [
  { id: 'survey', label: 'Survey', icon: '📐', desc: 'Topografía: puntos, poligonales, TIN, perfiles' },
  { id: 'bim', label: 'BIM', icon: '🏗️', desc: 'Modelos IFC, elementos, clash, QTO, 4D/5D' },
  { id: 'pointcloud', label: 'Point Cloud', icon: '☁️', desc: 'Nubes de puntos LAS/LAZ, LOD, clasificación' },
  { id: 'terrain', label: 'Terrain', icon: '📊', desc: 'Análisis de terreno, visibilidad, drenaje' },
  { id: 'measure', label: 'Measure', icon: '📏', desc: 'Distancias, áreas, volúmenes, geodesia' },
  { id: 'report', label: 'Report', icon: '📋', desc: 'QA/QC, exportar, snapshots, provenance' },
]

export default function ToolButtons() {
  const { tool, activateTool, deactivateTool, closeAllTools } = useTezcatlipoca()
  const { activeTool, openTools, competingWarning } = tool

  return (
    <div style={{
      gridArea: 'tools',
      display: 'flex',
      flexDirection: 'column',
      gap: 8,
      padding: '8px 12px',
      background: 'var(--bg-secondary)',
      borderRadius: 12,
      border: competingWarning ? '1px solid var(--text-warning)' : '1px solid var(--border-color)',
    }}>
      {/* Warning banner */}
      {competingWarning && (
        <div style={{
          padding: '6px 12px',
          borderRadius: 6,
          background: 'rgba(245, 158, 11, 0.1)',
          border: '1px solid var(--text-warning)',
          color: 'var(--text-warning)',
          fontSize: 11,
          display: 'flex',
          alignItems: 'center',
          gap: 8,
        }}>
          <span>⚠️</span>
          <span>Herramientas compitiendo por atención ({openTools.length} abiertas). Rendimiento puede degradarse.</span>
          <button
            onClick={closeAllTools}
            style={{
              marginLeft: 'auto',
              background: 'none',
              border: '1px solid var(--text-warning)',
              color: 'var(--text-warning)',
              borderRadius: 4,
              padding: '2px 8px',
              fontSize: 10,
              cursor: 'pointer',
            }}
          >
            Cerrar todas
          </button>
        </div>
      )}

      {/* Tool buttons row */}
      <div style={{
        display: 'flex',
        gap: 8,
        flexWrap: 'wrap',
        alignItems: 'center',
      }}>
        {TOOLS.map((t) => {
          const isActive = activeTool === t.id
          const isOpen = openTools.includes(t.id)
          const isDisabled = !isActive && !isOpen && openTools.length >= 3 && activeTool !== 'none'

          return (
            <button
              key={t.id}
              onClick={() => isActive ? deactivateTool(t.id) : activateTool(t.id)}
              disabled={isDisabled}
              title={t.desc}
              className={`tool-btn ${isActive ? 'active' : ''} ${isOpen && !isActive ? 'competing' : ''} ${isDisabled ? 'disabled' : ''}`}
            >
              <span style={{ fontSize: 16 }}>{t.icon}</span>
              <span>{t.label}</span>
              {isOpen && !isActive && (
                <span style={{
                  width: 8, height: 8, borderRadius: '50%',
                  background: 'var(--text-warning)',
                }} />
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}
