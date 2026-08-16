import type { TelemetryData, ViewMode, QualityProfile } from '../engines/types.ts'

interface Props {
  telemetry: TelemetryData
  view: ViewMode
  quality: QualityProfile
}

export default function HUD({ telemetry, view, quality }: Props) {
  return (
    <div style={{
      position: 'fixed',
      bottom: '12px',
      left: '12px',
      right: '12px',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'flex-end',
      pointerEvents: 'none',
      zIndex: 1000,
      fontFamily: 'monospace',
      fontSize: '0.7rem',
    }}>
      <div style={{
        background: 'rgba(10,10,20,0.8)',
        backdropFilter: 'blur(8px)',
        padding: '8px 12px',
        borderRadius: '8px',
        border: '1px solid rgba(255,165,0,0.2)',
        color: '#ffa500',
      }}>
        <div>FPS: {telemetry.fps.toFixed(1)}</div>
        <div>VIEW: {view.toUpperCase()}</div>
        <div>QUALITY: {quality.toUpperCase()}</div>
        <div>NODES: {telemetry.nodes}</div>
        <div>EDGES: {telemetry.edges}</div>
        <div>ENTITIES: {telemetry.entities}</div>
        {telemetry.triangles !== undefined && <div>TRIANGLES: {telemetry.triangles}</div>}
      </div>
      <div style={{
        background: 'rgba(10,10,20,0.8)',
        backdropFilter: 'blur(8px)',
        padding: '8px 12px',
        borderRadius: '8px',
        border: '1px solid rgba(255,165,0,0.2)',
        color: '#888',
        textAlign: 'right',
      }}>
        <div>TEZCATLIPOCA v1.0.0</div>
        <div>Deterministic Geospatial OS</div>
        <div>No AI APIs · No Cloud Cost</div>
      </div>
    </div>
  )
}
