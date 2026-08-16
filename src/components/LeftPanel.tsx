import { useTezcatlipoca } from '@/stores/tezcatlipocaStore'

const DOMAINS = [
  { key: 'satellites', label: '🛰️ Satélites', count: 4 },
  { key: 'aviation', label: '✈️ Aviación', count: 0 },
  { key: 'maritime', label: '🚢 Marítimo', count: 0 },
  { key: 'geophysics', label: '🌋 Geofísica', count: 0 },
  { key: 'infrastructure', label: '🏗️ Infraestructura', count: 0 },
  { key: 'events', label: '⚡ Eventos', count: 0 },
  { key: 'cyber', label: '🔒 Ciber', count: 0 },
]

const WORKSPACES = [
  'General',
  'Topografía',
  'BIM',
  'OSINT',
  'Satélites',
  'Infraestructura',
  'Análisis',
  'Reportes',
  'Configuración',
]

export default function LeftPanel() {
  const { layers, toggleLayer, setLayerOpacity, leftPanelOpen, toggleLeftPanel } = useTezcatlipoca()

  if (!leftPanelOpen) {
    return (
      <button
        onClick={toggleLeftPanel}
        style={{
          position: 'fixed',
          left: 8, top: 60,
          zIndex: 50,
          width: 32, height: 32,
          borderRadius: 8,
          background: 'var(--bg-secondary)',
          border: '1px solid var(--border-color)',
          color: 'var(--text-primary)',
          cursor: 'pointer',
        }}
      >
        ▶
      </button>
    )
  }

  return (
    <div className="panel" style={{
      gridArea: 'left',
      display: 'flex',
      flexDirection: 'column',
      gap: 12,
      overflow: 'auto',
    }}>
      {/* Layers */}
      <div>
        <div className="panel-header">
          <span>🗂️ Capas</span>
          <button onClick={toggleLeftPanel} style={{
            background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer',
          }}>◀</button>
        </div>
        <div style={{ padding: '8px 12px', display: 'flex', flexDirection: 'column', gap: 6 }}>
          {layers.length === 0 ? (
            <span style={{ fontSize: 11, color: 'var(--text-secondary)', fontStyle: 'italic' }}>
              Sin capas activas
            </span>
          ) : (
            layers.map((layer) => (
              <div key={layer.id} style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '4px 8px',
                borderRadius: 6,
                background: layer.visible ? 'rgba(56,189,248,0.05)' : 'transparent',
              }}>
                <input
                  type="checkbox"
                  checked={layer.visible}
                  onChange={() => toggleLayer(layer.id)}
                />
                <span style={{ flex: 1, fontSize: 12 }}>{layer.name}</span>
                <span style={{ fontSize: 10, color: 'var(--text-secondary)' }}>
                  {layer.entityCount}
                </span>
                <input
                  type="range"
                  min={0} max={1} step={0.1}
                  value={layer.opacity}
                  onChange={(e) => setLayerOpacity(layer.id, parseFloat(e.target.value))}
                  style={{ width: 50 }}
                />
              </div>
            ))
          )}
        </div>
      </div>

      {/* Domains */}
      <div>
        <div className="panel-header">
          <span>🌐 Contexto Espacial</span>
        </div>
        <div style={{ padding: '8px 12px', display: 'flex', flexDirection: 'column', gap: 4 }}>
          {DOMAINS.map((d) => (
            <div key={d.key} style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '6px 8px',
              borderRadius: 6,
              cursor: 'pointer',
              transition: 'all 150ms',
            }} className="fade-in">
              <span style={{ fontSize: 12 }}>{d.label}</span>
              <span style={{
                fontSize: 10,
                padding: '2px 8px',
                borderRadius: 10,
                background: d.count > 0 ? 'var(--accent-blue)' : 'var(--bg-tertiary)',
                color: d.count > 0 ? '#000' : 'var(--text-secondary)',
              }}>
                {d.count}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Workspaces */}
      <div>
        <div className="panel-header">
          <span>📁 Workspaces</span>
        </div>
        <div style={{ padding: '8px 12px', display: 'flex', flexDirection: 'column', gap: 4 }}>
          {WORKSPACES.map((w) => (
            <div key={w} style={{
              padding: '6px 8px',
              borderRadius: 6,
              fontSize: 12,
              cursor: 'pointer',
              transition: 'all 150ms',
            }}>
              {w}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
