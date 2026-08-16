import type { ViewMode, QualityProfile, Workspace, Coordinates } from '../engines/types'

interface Props {
  viewMode: ViewMode
  onViewModeChange: (v: ViewMode) => void
  quality: QualityProfile
  onQualityChange: (q: QualityProfile) => void
  workspace: Workspace
  onWorkspaceChange: (w: Workspace) => void
  telemetry: { fps: number; nodes: number; edges: number; entities: number; triangles: number }
  coordinates: Coordinates
}

export default function BottomBar({ viewMode, onViewModeChange, quality, onQualityChange, workspace, onWorkspaceChange, coordinates, telemetry }: Props) {
  return (
    <footer style={{
      height: '48px',
      background: 'linear-gradient(0deg, #111118 0%, #0d0d14 100%)',
      borderTop: '1px solid rgba(255,165,0,0.1)',
      display: 'flex',
      alignItems: 'center',
      padding: '0 16px',
      gap: '16px',
      flexShrink: 0,
      zIndex: 100,
    }}>
      {/* Tools */}
      <div style={{ display: 'flex', gap: '4px' }}>
        <ToolButton icon="📐" label="Medir" />
        <ToolButton icon="✏️" label="Dibujar" />
        <ToolButton icon="📐" label="Perfil" />
        <ToolButton icon="🏔️" label="Terreno" />
        <ToolButton icon="🏗️" label="BIM" />
        <ToolButton icon="📦" label="Volumen" />
        <ToolButton icon="☁️" label="Point Cloud" />
      </div>

      <div style={{ width: '1px', height: '24px', background: 'rgba(255,255,255,0.1)' }} />

      {/* View Modes */}
      <div style={{ display: 'flex', gap: '4px', background: 'rgba(255,255,255,0.05)', borderRadius: '6px', padding: '2px' }}>
        {(['map', 'earth', 'globe'] as ViewMode[]).map(v => (
          <button key={v} onClick={() => onViewModeChange(v)} style={{
            padding: '6px 14px', borderRadius: '4px', border: 'none',
            background: viewMode === v ? 'rgba(255,165,0,0.2)' : 'transparent',
            color: viewMode === v ? '#ffa500' : '#888', fontSize: '12px',
            cursor: 'pointer', textTransform: 'uppercase', fontFamily: 'inherit'
          }}>{v}</button>
        ))}
      </div>

      <div style={{ width: '1px', height: '24px', background: 'rgba(255,255,255,0.1)' }} />

      {/* Quality */}
      <select value={quality} onChange={e => onQualityChange(e.target.value as QualityProfile)} style={{
        background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: '6px', color: '#ddd', fontSize: '12px', padding: '6px 12px',
        fontFamily: 'inherit'
      }}>
        <option value="low">Baja</option>
        <option value="medium">Media</option>
        <option value="high">Alta</option>
        <option value="ultra">Ultra</option>
      </select>

      <div style={{ flex: 1 }} />

      {/* Coordinates */}
      <div style={{ display: 'flex', gap: '16px', fontSize: '12px', color: '#888', fontFamily: 'monospace' }}>
        <span>Lat: {coordinates.lat.toFixed(4)}°</span>
        <span>Lon: {coordinates.lon.toFixed(4)}°</span>
        <span>Elev: {coordinates.elev.toFixed(1)} m</span>
      </div>

      <div style={{ width: '1px', height: '24px', background: 'rgba(255,255,255,0.1)' }} />

      {/* Telemetry */}
      <div style={{ display: 'flex', gap: '12px', fontSize: '11px', color: '#666' }}>
        <span>FPS: {telemetry.fps || '--'}</span>
        <span>Entidades: {telemetry.entities || 0}</span>
        {telemetry.triangles > 0 && <span>Triangulos: {telemetry.triangles}</span>}
      </div>
    </footer>
  )
}

function ToolButton({ icon, label }: { icon: string; label: string }) {
  return (
    <button style={{
      background: 'transparent', border: 'none', color: '#888',
      fontSize: '12px', cursor: 'pointer', padding: '6px 10px',
      borderRadius: '6px', display: 'flex', alignItems: 'center', gap: '4px',
      fontFamily: 'inherit'
    }} title={label}>
      <span>{icon}</span>
      <span style={{ fontSize: '11px' }}>{label}</span>
    </button>
  )
}
