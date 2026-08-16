import type { ViewMode, QualityProfile } from '../engines/types'

const views: { key: ViewMode; label: string; icon: string }[] = [
  { key: 'map', label: 'Mapa 2D', icon: '🗺️' },
  { key: 'earth', label: 'Tierra', icon: '🌎' },
  { key: 'globe', label: 'Globo 3D', icon: '🌍' },
]

const qualities: QualityProfile[] = ['low', 'medium', 'high', 'ultra']

interface Props {
  currentView: ViewMode
  onViewChange: (v: ViewMode) => void
  quality: QualityProfile
  onQualityChange: (q: QualityProfile) => void
}

export default function Toolbar({ currentView, onViewChange, quality, onQualityChange }: Props) {
  return (
    <div style={{
      position: 'fixed',
      top: '12px',
      left: '50%',
      transform: 'translateX(-50%)',
      display: 'flex',
      gap: '8px',
      padding: '8px 16px',
      background: 'rgba(10,10,20,0.85)',
      backdropFilter: 'blur(12px)',
      borderRadius: '12px',
      border: '1px solid rgba(255,165,0,0.3)',
      zIndex: 1000,
      fontFamily: 'monospace',
    }}>
      {views.map(v => (
        <button
          key={v.key}
          onClick={() => onViewChange(v.key)}
          style={{
            padding: '6px 14px',
            borderRadius: '8px',
            border: 'none',
            cursor: 'pointer',
            fontSize: '0.8rem',
            fontFamily: 'monospace',
            background: currentView === v.key ? 'rgba(255,165,0,0.3)' : 'transparent',
            color: currentView === v.key ? '#ffa500' : '#aaa',
            transition: 'all 0.2s',
          }}
        >
          {v.icon} {v.label}
        </button>
      ))}
      <div style={{ width: '1px', background: 'rgba(255,255,255,0.2)', margin: '0 4px' }} />
      <select
        value={quality}
        onChange={e => onQualityChange(e.target.value as QualityProfile)}
        style={{
          background: 'transparent',
          color: '#ffa500',
          border: '1px solid rgba(255,165,0,0.3)',
          borderRadius: '6px',
          padding: '4px 8px',
          fontFamily: 'monospace',
          fontSize: '0.75rem',
          cursor: 'pointer',
        }}
      >
        {qualities.map(q => (
          <option key={q} value={q} style={{ background: '#111' }}>
            {q.toUpperCase()}
          </option>
        ))}
      </select>
    </div>
  )
}
