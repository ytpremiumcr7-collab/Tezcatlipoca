import { useTezcatlipoca } from '@/stores/tezcatlipocaStore'
import { useState, useEffect } from 'react'
import type { SpatialEntity, EntityType } from '@/types'

// =============================================================================
// RIGHTPANEL — Inspector Universal dinámico por tipo de entidad
// Mentalidad DevOps: renderizado condicional, datos tipados, no hardcodeo
// =============================================================================

export default function RightPanel() {
  const { selectedEntityId, rightPanelOpen, toggleRightPanel } = useTezcatlipoca()

  if (!rightPanelOpen) {
    return (
      <button
        onClick={toggleRightPanel}
        style={toggleButtonStyle}
        title="Abrir panel de inspección"
      >
        ◀
      </button>
    )
  }

  return (
    <div className={`panel panel-right ${rightPanelOpen ? 'open' : ''}`} style={panelStyle}>
      <div className="panel-header">
        <span>Inspector Universal</span>
        <button onClick={toggleRightPanel} style={closeButtonStyle} title="Cerrar panel">
          ▶
        </button>
      </div>

      {selectedEntityId ? (
        <EntityInspector entityId={selectedEntityId} />
      ) : (
        <EmptyState />
      )}
    </div>
  )
}

function EmptyState() {
  return (
    <div style={emptyStateStyle}>
      <div style={{ fontSize: 32, marginBottom: 8, opacity: 0.5 }}>👆</div>
      <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
        Selecciona una entidad en el mundo
      </div>
      <div style={{ marginTop: 8, fontSize: 10, color: 'var(--text-muted)' }}>
        Hover para preview, clic para inspeccionar
      </div>
    </div>
  )
}

// =============================================================================
// ENTITY INSPECTOR — Renderizado dinámico según tipo de entidad
// =============================================================================
function EntityInspector({ entityId }: { entityId: string }) {
  const [entity, setEntity] = useState<SpatialEntity | null>(null)
  const [loading, setLoading] = useState(true)

  // Simular fetch de entidad — en producción vendría del backend
  useEffect(() => {
    setLoading(true)
    // Simular delay de red
    const timer = setTimeout(() => {
      const mockEntity = generateMockEntity(entityId)
      setEntity(mockEntity)
      setLoading(false)
    }, 200)
    return () => clearTimeout(timer)
  }, [entityId])

  if (loading) {
    return (
      <div style={{ padding: 24, textAlign: 'center' }}>
        <div style={spinnerStyle} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>Cargando entidad...</span>
      </div>
    )
  }

  if (!entity) {
    return (
      <div style={{ padding: 24, textAlign: 'center', color: 'var(--text-warning)', fontSize: 12 }}>
        No se encontró la entidad
      </div>
    )
  }

  return (
    <div style={{ padding: '0 12px 12px', display: 'flex', flexDirection: 'column', gap: 12 }}>
      {/* Identity Header */}
      <EntityHeader entity={entity} />

      {/* Type-specific content */}
      <EntityTypeContent entity={entity} />

      {/* Common: Properties */}
      <EntityProperties entity={entity} />

      {/* Common: QA/QC */}
      <EntityQA entity={entity} />

      {/* Common: Provenance */}
      <EntityProvenance entity={entity} />

      {/* Common: Actions */}
      <EntityActions entity={entity} />
    </div>
  )
}

function EntityHeader({ entity }: { entity: SpatialEntity }) {
  const typeColors: Record<string, string> = {
    SATELLITE: '#22d3ee',
    AIRCRAFT: '#f59e0b',
    VESSEL: '#38bdf8',
    EARTHQUAKE: '#ef4444',
    SURVEY_POINT: '#22c55e',
    CONTROL_POINT: '#34d399',
    TIN: '#a78bfa',
    DEM: '#818cf8',
    POINT_CLOUD: '#fb7185',
    BIM_MODEL: '#f472b6',
    BIM_ELEMENT: '#e879f9',
    INFRASTRUCTURE_ASSET: '#c084fc',
  }

  const color = typeColors[entity.type] || '#94a3b8'

  return (
    <div style={headerCardStyle}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
        <div style={{
          width: 10, height: 10, borderRadius: '50%',
          background: color,
          boxShadow: `0 0 8px ${color}`,
        }} />
        <div style={{ fontSize: 14, fontWeight: 700 }}>
          {getEntityDisplayName(entity)}
        </div>
      </div>
      <div style={{ fontSize: 10, color: 'var(--text-secondary)', marginBottom: 8 }}>
        {entity.type} • {entity.id}
      </div>
      <div style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        padding: '4px 10px',
        borderRadius: 6,
        background: entity.state === 'REAL' ? 'rgba(34,197,94,0.1)' :
          entity.state === 'CACHED' ? 'rgba(56,189,248,0.1)' :
            entity.state === 'STALE' ? 'rgba(245,158,11,0.1)' :
              'rgba(239,68,68,0.1)',
        color: entity.state === 'REAL' ? 'var(--text-success)' :
          entity.state === 'CACHED' ? 'var(--accent-blue)' :
            entity.state === 'STALE' ? 'var(--text-warning)' :
              'var(--text-danger)',
        fontSize: 10,
        fontWeight: 600,
      }}>
        <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'currentColor' }} />
        {entity.state}
      </div>
    </div>
  )
}

function EntityTypeContent({ entity }: { entity: SpatialEntity }) {
  switch (entity.type) {
    case 'SATELLITE':
      return <SatelliteDetails entity={entity} />
    case 'SURVEY_POINT':
    case 'CONTROL_POINT':
      return <SurveyPointDetails entity={entity} />
    case 'TIN':
    case 'DEM':
    case 'DTM':
    case 'DSM':
      return <TerrainDetails entity={entity} />
    case 'POINT_CLOUD':
      return <PointCloudDetails entity={entity} />
    case 'BIM_MODEL':
    case 'BIM_ELEMENT':
      return <BIMDetails entity={entity} />
    case 'INFRASTRUCTURE_ASSET':
      return <InfrastructureDetails entity={entity} />
    default:
      return null
  }
}

function SatelliteDetails({ entity }: { entity: SpatialEntity }) {
  const meta = entity.metadata as any
  return (
    <div>
      <SectionTitle>Datos Orbitales</SectionTitle>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <PropertyRow label="Latitud" value={`${meta?.lat?.toFixed(4) ?? '---'}°`} />
        <PropertyRow label="Longitud" value={`${meta?.lon?.toFixed(4) ?? '---'}°`} />
        <PropertyRow label="Altitud" value={`${meta?.alt ?? '---'} km`} />
        <PropertyRow label="Velocidad" value={`${meta?.velocity ?? '---'} km/s`} />
        <PropertyRow label="Período" value={`${meta?.period ?? '---'} min`} />
        <PropertyRow label="Inclinación" value={`${meta?.inclination ?? '---'}°`} />
      </div>
    </div>
  )
}

function SurveyPointDetails({ entity }: { entity: SpatialEntity }) {
  const meta = entity.metadata as any
  return (
    <div>
      <SectionTitle>Coordenadas</SectionTitle>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <PropertyRow label="Este (X)" value={`${meta?.x?.toFixed(3) ?? '---'} m`} />
        <PropertyRow label="Norte (Y)" value={`${meta?.y?.toFixed(3) ?? '---'} m`} />
        <PropertyRow label="Elevación (Z)" value={`${meta?.z?.toFixed(3) ?? '---'} m`} />
        <PropertyRow label="Identificador" value={meta?.identificador ?? '---'} />
        <PropertyRow label="CRS" value={meta?.crs ?? 'WGS84'} />
        <PropertyRow label="Precisión" value={`${meta?.precision ?? '---'} m`} />
      </div>
    </div>
  )
}

function TerrainDetails({ entity }: { entity: SpatialEntity }) {
  const meta = entity.metadata as any
  return (
    <div>
      <SectionTitle>Propiedades del Terreno</SectionTitle>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <PropertyRow label="Resolución" value={`${meta?.resolution ?? '---'} m`} />
        <PropertyRow label="Elev. Mín" value={`${meta?.minElevation ?? '---'} m`} />
        <PropertyRow label="Elev. Máx" value={`${meta?.maxElevation ?? '---'} m`} />
        <PropertyRow label="Área" value={`${meta?.area?.toFixed(2) ?? '---'} ha`} />
        <PropertyRow label="Celdas" value={meta?.cellCount?.toLocaleString() ?? '---'} />
        <PropertyRow label="Formato" value={meta?.format ?? '---'} />
      </div>
    </div>
  )
}

function PointCloudDetails({ entity }: { entity: SpatialEntity }) {
  const meta = entity.metadata as any
  return (
    <div>
      <SectionTitle>Propiedades de la Nube</SectionTitle>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <PropertyRow label="Puntos totales" value={meta?.pointCount?.toLocaleString() ?? '---'} />
        <PropertyRow label="Densidad" value={`${meta?.density ?? '---'} pts/m²`} />
        <PropertyRow label="Clasificación" value={meta?.classification ?? 'No clasificado'} />
        <PropertyRow label="Formato" value={meta?.format ?? 'LAS'} />
        <PropertyRow label="Tamaño" value={`${meta?.fileSize ?? '---'} MB`} />
        <PropertyRow label="CRS" value={meta?.crs ?? 'WGS84'} />
      </div>
    </div>
  )
}

function BIMDetails({ entity }: { entity: SpatialEntity }) {
  const meta = entity.metadata as any
  return (
    <div>
      <SectionTitle>Propiedades BIM</SectionTitle>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <PropertyRow label="Tipo IFC" value={meta?.ifcType ?? '---'} />
        <PropertyRow label="Nivel" value={meta?.level ?? '---'} />
        <PropertyRow label="Volumen" value={`${meta?.volume?.toFixed(2) ?? '---'} m³`} />
        <PropertyRow label="Área" value={`${meta?.area?.toFixed(2) ?? '---'} m²`} />
        <PropertyRow label="Material" value={meta?.material ?? '---'} />
        <PropertyRow label="Global ID" value={meta?.globalId ?? '---'} />
      </div>
    </div>
  )
}

function InfrastructureDetails({ entity }: { entity: SpatialEntity }) {
  const meta = entity.metadata as any
  return (
    <div>
      <SectionTitle>Propiedades de Infraestructura</SectionTitle>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <PropertyRow label="Tipo" value={meta?.assetType ?? '---'} />
        <PropertyRow label="Estado" value={meta?.condition ?? '---'} />
        <PropertyRow label="Instalación" value={meta?.installDate ?? '---'} />
        <PropertyRow label="Último mant." value={meta?.lastMaintenance ?? '---'} />
        <PropertyRow label="Vida útil" value={`${meta?.lifespan ?? '---'} años`} />
        <PropertyRow label="Costo" value={`$${meta?.cost?.toLocaleString() ?? '---'}`} />
      </div>
    </div>
  )
}

function EntityProperties({ entity }: { entity: SpatialEntity }) {
  return (
    <div>
      <SectionTitle>Propiedades Generales</SectionTitle>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <PropertyRow label="Calidad" value={`${(entity.quality * 100).toFixed(0)}%`} />
        <PropertyRow label="Fuente" value={entity.source} />
        <PropertyRow label="Timestamp" value={new Date(entity.timestamp).toLocaleString()} />
        <PropertyRow label="Observado" value={entity.observed_at ? new Date(entity.observed_at).toLocaleString() : 'N/A'} />
      </div>
    </div>
  )
}

function EntityQA({ entity }: { entity: SpatialEntity }) {
  const issues: Array<{ severity: 'warning' | 'error'; message: string }> = entity.provenance?.confidence ? [] : [{ severity: 'warning', message: 'Confianza no verificada' }]

  return (
    <div>
      <SectionTitle>QA / QC</SectionTitle>
      <div style={{
        padding: 10,
        borderRadius: 6,
        background: issues.length === 0 ? 'rgba(34,197,94,0.05)' : 'rgba(245,158,11,0.05)',
        border: `1px solid ${issues.length === 0 ? 'rgba(34,197,94,0.2)' : 'rgba(245,158,11,0.2)'}`,
        fontSize: 11,
      }}>
        {issues.length === 0 ? (
          <div style={{ color: 'var(--text-success)' }}>
            ✅ Datos validados • ✅ Geometría correcta • ✅ Fuente confiable
          </div>
        ) : (
          <div>
            {issues.map((issue, i) => (
              <div key={i} style={{ color: issue.severity === 'error' ? 'var(--text-danger)' : 'var(--text-warning)' }}>
                {issue.severity === 'error' ? '❌' : '⚠️'} {issue.message}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function EntityProvenance({ entity }: { entity: SpatialEntity }) {
  return (
    <div>
      <SectionTitle>Provenance</SectionTitle>
      <div style={{ fontSize: 11, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
        <div>📡 {entity.source}</div>
        <div>🕐 {new Date(entity.timestamp).toLocaleString()}</div>
        <div>🔐 Confianza: {((entity.provenance?.confidence ?? 0) * 100).toFixed(0)}%</div>
        <div>👤 Validador: {entity.provenance?.validator ?? 'Sistema'}</div>
      </div>
    </div>
  )
}

function EntityActions({ entity }: { entity: SpatialEntity }) {
  const actions = getEntityActions(entity.type)

  return (
    <div>
      <SectionTitle>Acciones</SectionTitle>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
        {actions.map((action) => (
          <button key={action} className="tool-btn" style={{ fontSize: 11, padding: '6px 12px' }}>
            {action}
          </button>
        ))}
      </div>
    </div>
  )
}

// =============================================================================
// HELPERS
// =============================================================================
function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h4 style={{
      fontSize: 10,
      textTransform: 'uppercase',
      letterSpacing: 1,
      color: 'var(--text-accent)',
      marginBottom: 8,
      marginTop: 4,
    }}>
      {children}
    </h4>
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

function getEntityDisplayName(entity: SpatialEntity): string {
  const meta = entity.metadata as any
  return meta?.name ?? meta?.identificador ?? meta?.ifcType ?? entity.type
}

function getEntityActions(type: EntityType): string[] {
  const actionMap: Record<string, string[]> = {
    SATELLITE: ['Seguir', 'Predicción', 'Snapshot', 'Exportar'],
    SURVEY_POINT: ['Editar', 'Validar', 'Snapshot', 'Exportar'],
    CONTROL_POINT: ['Editar', 'Transformar', 'Snapshot', 'Exportar'],
    TIN: ['Visualizar', 'Analizar', 'Snapshot', 'Exportar'],
    DEM: ['Perfil', 'Curvas', 'Snapshot', 'Exportar'],
    POINT_CLOUD: ['Clasificar', 'Segmentar', 'Snapshot', 'Exportar'],
    BIM_MODEL: ['Explorar', 'Clash', 'Snapshot', 'Exportar'],
    BIM_ELEMENT: ['Propiedades', 'QTO', 'Snapshot', 'Exportar'],
    INFRASTRUCTURE_ASSET: ['Inspeccionar', 'Mantenimiento', 'Snapshot', 'Exportar'],
  }
  return actionMap[type] || ['Snapshot', 'Exportar']
}

function generateMockEntity(id: string): SpatialEntity {
  // Determinar tipo basado en el ID
  const type: EntityType = id.startsWith('sat') ? 'SATELLITE' :
    id.startsWith('pt') ? 'SURVEY_POINT' :
      id.startsWith('tin') ? 'TIN' :
        id.startsWith('pc') ? 'POINT_CLOUD' :
          id.startsWith('bim') ? 'BIM_ELEMENT' :
            id.startsWith('inf') ? 'INFRASTRUCTURE_ASSET' :
              'SURVEY_POINT'

  const baseEntity: SpatialEntity = {
    id,
    type,
    geometry: null,
    source: 'Tezcatlipoca',
    timestamp: new Date().toISOString(),
    observed_at: new Date().toISOString(),
    state: 'REAL',
    metadata: {},
    quality: 0.95 + Math.random() * 0.05,
    provenance: {
      source: 'Sistema',
      extracted_at: new Date().toISOString(),
      validator: 'Auto',
      confidence: 0.95,
    },
    relations: [],
    actions: [],
  }

  // Add type-specific metadata
  switch (type) {
    case 'SATELLITE':
      baseEntity.metadata = {
        name: 'ISS (ZARYA)',
        lat: 51.6413 + (Math.random() - 0.5) * 10,
        lon: -120.2331 + (Math.random() - 0.5) * 20,
        alt: 408,
        velocity: 7.66,
        period: 92.68,
        inclination: 51.64,
      }
      break
    case 'SURVEY_POINT':
      baseEntity.metadata = {
        x: 500000 + Math.random() * 10000,
        y: 2100000 + Math.random() * 10000,
        z: 2240 + Math.random() * 50,
        identificador: `PT-${Math.floor(Math.random() * 999)}`,
        crs: 'UTM 14N',
        precision: 0.02 + Math.random() * 0.03,
      }
      break
    case 'TIN':
      baseEntity.metadata = {
        resolution: 2.5,
        minElevation: 2230,
        maxElevation: 2450,
        area: 45.2,
        cellCount: 18000,
        format: 'TIN',
      }
      break
    case 'POINT_CLOUD':
      baseEntity.metadata = {
        pointCount: 25000000,
        density: 45,
        classification: 'Ground + Vegetation + Building',
        format: 'LAS 1.4',
        fileSize: 850,
        crs: 'UTM 14N',
      }
      break
    case 'BIM_ELEMENT':
      baseEntity.metadata = {
        ifcType: 'IfcWall',
        level: 'Nivel 1',
        volume: 12.5,
        area: 45.0,
        material: 'Hormigón C25',
        globalId: `3fX${Math.random().toString(36).slice(2, 10)}`,
      }
      break
    case 'INFRASTRUCTURE_ASSET':
      baseEntity.metadata = {
        assetType: 'Puente',
        condition: 'Bueno',
        installDate: '2018-03-15',
        lastMaintenance: '2025-11-20',
        lifespan: 50,
        cost: 2500000,
      }
      break
  }

  return baseEntity
}

// ── Styles ──────────────────────────────────────────────────────────────────
const panelStyle: React.CSSProperties = {
  gridArea: 'right',
  display: 'flex',
  flexDirection: 'column',
  gap: 12,
  overflow: 'auto',
}

const toggleButtonStyle: React.CSSProperties = {
  position: 'fixed',
  right: 8,
  top: 60,
  zIndex: 50,
  width: 32,
  height: 32,
  borderRadius: 8,
  background: 'var(--bg-secondary)',
  border: '1px solid var(--border-color)',
  color: 'var(--text-primary)',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontSize: 12,
}

const closeButtonStyle: React.CSSProperties = {
  background: 'none',
  border: 'none',
  color: 'var(--text-secondary)',
  cursor: 'pointer',
  fontSize: 12,
  width: 24,
  height: 24,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  borderRadius: 4,
  transition: 'all 150ms',
}

const emptyStateStyle: React.CSSProperties = {
  padding: 24,
  textAlign: 'center',
  color: 'var(--text-secondary)',
  fontSize: 12,
}

const headerCardStyle: React.CSSProperties = {
  padding: 12,
  borderRadius: 8,
  background: 'var(--bg-tertiary)',
  border: '1px solid var(--border-color)',
}

const spinnerStyle: React.CSSProperties = {
  width: 24,
  height: 24,
  borderRadius: '50%',
  border: '2px solid var(--border-color)',
  borderTopColor: 'var(--accent-blue)',
  animation: 'spin 1s linear infinite',
  margin: '0 auto 8px',
}
