import { useTezcatlipoca } from '@/stores/tezcatlipocaStore'

export default function RightPanel() {
  const { selectedEntityId, rightPanelOpen, toggleRightPanel } = useTezcatlipoca()

  if (!rightPanelOpen) {
    return (
      <button
        onClick={toggleRightPanel}
        style={{
          position: 'fixed',
          right: 8, top: 60,
          zIndex: 50,
          width: 32, height: 32,
          borderRadius: 8,
          background: 'var(--bg-secondary)',
          border: '1px solid var(--border-color)',
          color: 'var(--text-primary)',
          cursor: 'pointer',
        }}
      >
        ◀
      </button>
    )
  }

  return (
    <div className="panel" style={{
      gridArea: 'right',
      display: 'flex',
      flexDirection: 'column',
      gap: 12,
      overflow: 'auto',
    }}>
      <div className="panel-header">
        <span>🔍 Inspector Universal</span>
        <button onClick={toggleRightPanel} style={{
          background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer',
        }}>▶</button>
      </div>

      {selectedEntityId ? (
        <EntityInspector entityId={selectedEntityId} />
      ) : (
        <div style={{
          padding: 24,
          textAlign: 'center',
          color: 'var(--text-secondary)',
          fontSize: 12,
        }}>
          <div style={{ fontSize: 32, marginBottom: 8 }}>👆</div>
          <div>Selecciona una entidad en el mundo</div>
          <div style={{ marginTop: 8, fontSize: 10 }}>
            Hover para preview, clic para inspeccionar
          </div>
        </div>
      )}
    </div>
  )
}

function EntityInspector({ entityId }: { entityId: string }) {
  // Mock entity data — en producción vendría del backend
  const entity = {
    id: entityId,
    type: 'SATELLITE',
    name: 'ISS (ZARYA)',
    source: 'CelesTrak',
    timestamp: new Date().toISOString(),
    freshness: 'REAL',
    quality: 0.98,
    coordinates: { lat: 51.6413, lon: -120.2331, alt: 408 },
    velocity: 7.66,
    period: 92.68,
    inclination: 51.64,
    actions: ['Seguir', 'Predicción', 'Snapshot', 'Exportar'],
  }

  return (
    <div style={{ padding: '0 12px 12px', display: 'flex', flexDirection: 'column', gap: 12 }}>
      {/* Identity */}
      <div style={{
        padding: 12,
        borderRadius: 8,
        background: 'var(--bg-tertiary)',
        border: '1px solid var(--border-color)',
      }}>
        <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 4 }}>{entity.name}</div>
        <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>
          {entity.type} • {entity.id}
        </div>
        <div style={{
          marginTop: 8,
          display: 'inline-flex',
          alignItems: 'center',
          gap: 6,
          padding: '4px 10px',
          borderRadius: 6,
          background: entity.freshness === 'REAL' ? 'rgba(34,197,94,0.1)' : 'rgba(245,158,11,0.1)',
          color: entity.freshness === 'REAL' ? 'var(--text-success)' : 'var(--text-warning)',
          fontSize: 11,
        }}>
          <span style={{
            width: 6, height: 6, borderRadius: '50%',
            background: 'currentColor',
          }} />
          {entity.freshness}
        </div>
      </div>

      {/* Properties */}
      <div>
        <h4 style={{
          fontSize: 10,
          textTransform: 'uppercase',
          letterSpacing: 1,
          color: 'var(--text-accent)',
          marginBottom: 8,
        }}>Propiedades</h4>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <PropertyRow label="Latitud" value={`${entity.coordinates.lat.toFixed(4)}°`} />
          <PropertyRow label="Longitud" value={`${entity.coordinates.lon.toFixed(4)}°`} />
          <PropertyRow label="Altitud" value={`${entity.coordinates.alt} km`} />
          <PropertyRow label="Velocidad" value={`${entity.velocity} km/s`} />
          <PropertyRow label="Período" value={`${entity.period} min`} />
          <PropertyRow label="Inclinación" value={`${entity.inclination}°`} />
          <PropertyRow label="Calidad" value={`${(entity.quality * 100).toFixed(0)}%`} />
          <PropertyRow label="Fuente" value={entity.source} />
        </div>
      </div>

      {/* QA/QC */}
      <div>
        <h4 style={{
          fontSize: 10,
          textTransform: 'uppercase',
          letterSpacing: 1,
          color: 'var(--text-accent)',
          marginBottom: 8,
        }}>QA/QC</h4>
        <div style={{
          padding: 10,
          borderRadius: 6,
          background: 'rgba(34,197,94,0.05)',
          border: '1px solid rgba(34,197,94,0.2)',
          fontSize: 11,
        }}>
          ✅ Datos validados • ✅ Geometría correcta • ✅ Fuente confiable
        </div>
      </div>

      {/* Provenance */}
      <div>
        <h4 style={{
          fontSize: 10,
          textTransform: 'uppercase',
          letterSpacing: 1,
          color: 'var(--text-accent)',
          marginBottom: 8,
        }}>Provenance</h4>
        <div style={{ fontSize: 11, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
          <div>📡 CelesTrak NORAD</div>
          <div>🕐 {new Date(entity.timestamp).toLocaleString()}</div>
          <div>🔐 TLE propagado SGP4</div>
        </div>
      </div>

      {/* Actions */}
      <div>
        <h4 style={{
          fontSize: 10,
          textTransform: 'uppercase',
          letterSpacing: 1,
          color: 'var(--text-accent)',
          marginBottom: 8,
        }}>Acciones</h4>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {entity.actions.map((action) => (
            <button key={action} className="tool-btn" style={{ fontSize: 11 }}>
              {action}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

function PropertyRow({ label, value }: { label: string; value: string }) {
  return (
    <div style={{
      display: 'flex',
      justifyContent: 'space-between',
      padding: '4px 0',
      borderBottom: '1px solid var(--border-color)',
    }}>
      <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>{label}</span>
      <span style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--text-accent)' }}>
        {value}
      </span>
    </div>
  )
}
