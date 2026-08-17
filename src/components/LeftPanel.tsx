import { useTezcatlipoca } from '@/stores/tezcatlipocaStore'
import { useState, useCallback } from 'react'
import type { Layer } from '@/types'

// =============================================================================
// LEFTPANEL — Panel de capas y workspaces reactivo
// Mentalidad DevOps: estado local, callbacks memoizados, no re-renders innecesarios
// =============================================================================

interface DomainInfo {
  key: string
  label: string
  icon: string
  color: string
}

const DOMAINS: DomainInfo[] = [
  { key: 'satellites', label: 'Satélites', icon: '🛰️', color: '#22d3ee' },
  { key: 'aviation', label: 'Aviación', icon: '✈️', color: '#f59e0b' },
  { key: 'maritime', label: 'Marítimo', icon: '🚢', color: '#38bdf8' },
  { key: 'geophysics', label: 'Geofísica', icon: '🌋', color: '#ef4444' },
  { key: 'infrastructure', label: 'Infraestructura', icon: '🏗️', color: '#a78bfa' },
  { key: 'topography', label: 'Topografía', icon: '📐', color: '#22c55e' },
  { key: 'events', label: 'Eventos', icon: '⚡', color: '#fbbf24' },
]

const WORKSPACES = [
  { name: 'General', icon: '🌐', desc: 'Vista general del proyecto' },
  { name: 'Topografía', icon: '📐', desc: 'Levantamiento y análisis' },
  { name: 'BIM', icon: '🏗️', desc: 'Modelado 4D/5D' },
  { name: 'OSINT', icon: '🔍', desc: 'Inteligencia espacial' },
  { name: 'Satélites', icon: '🛰️', desc: 'Seguimiento orbital' },
  { name: 'Infraestructura', icon: '🏗️', desc: 'Gestión de activos' },
  { name: 'Análisis', icon: '📊', desc: 'Análisis avanzado' },
  { name: 'Reportes', icon: '📋', desc: 'QA/QC y exportación' },
]

// Mock layers data — en producción vendría del backend
const DEFAULT_LAYERS = [
  { id: 'l1', name: 'Satélites LEO', domain: 'satellites', visible: true, opacity: 1, entityCount: 20, freshness: 'REAL' as const, source: 'CelesTrak' },
  { id: 'l2', name: 'Puntos de control', domain: 'topography', visible: true, opacity: 1, entityCount: 45, freshness: 'REAL' as const, source: 'Levantamiento' },
  { id: 'l3', name: 'Curvas de nivel', domain: 'topography', visible: true, opacity: 0.8, entityCount: 1200, freshness: 'CACHED' as const, source: 'TIN' },
  { id: 'l4', name: 'Modelo BIM', domain: 'infrastructure', visible: false, opacity: 1, entityCount: 3500, freshness: 'CACHED' as const, source: 'IFC' },
  { id: 'l5', name: 'Nube de puntos', domain: 'topography', visible: false, opacity: 0.6, entityCount: 25000000, freshness: 'CACHED' as const, source: 'LAS' },
  { id: 'l6', name: 'Red de drenaje', domain: 'topography', visible: true, opacity: 0.7, entityCount: 85, freshness: 'SIMULATED' as const, source: 'Hidrología' },
  { id: 'l7', name: 'Infraestructura', domain: 'infrastructure', visible: true, opacity: 1, entityCount: 12, freshness: 'REAL' as const, source: 'GIS' },
]

export default function LeftPanel() {
  const { layers, toggleLayer, setLayerOpacity, leftPanelOpen, toggleLeftPanel, setViewMode } = useTezcatlipoca()
  const [activeWorkspace, setActiveWorkspace] = useState('General')
  const [expandedDomains, setExpandedDomains] = useState<Set<string>>(new Set(['topography', 'satellites']))
  const [searchQuery, setSearchQuery] = useState('')

  // Use default layers if store is empty
  const displayLayers = layers.length > 0 ? layers : DEFAULT_LAYERS

  const toggleDomain = useCallback((key: string) => {
    setExpandedDomains(prev => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }, [])

  const filteredLayers = displayLayers.filter(l =>
    l.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    l.domain.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const layerCountByDomain = displayLayers.reduce((acc, l) => {
    acc[l.domain] = (acc[l.domain] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  const visibleCount = displayLayers.filter(l => l.visible).length

  if (!leftPanelOpen) {
    return (
      <button
        onClick={toggleLeftPanel}
        style={toggleButtonStyle}
        title="Abrir panel de capas"
      >
        ▶
      </button>
    )
  }

  return (
    <div className={`panel panel-left ${leftPanelOpen ? 'open' : ''}`} style={panelStyle}>
      {/* Header */}
      <div className="panel-header">
        <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: 14 }}>🗂️</span>
          Capas
          <span style={{
            fontSize: 10,
            padding: '2px 8px',
            borderRadius: 10,
            background: 'var(--bg-tertiary)',
            color: 'var(--text-secondary)',
          }}>
            {visibleCount}/{displayLayers.length}
          </span>
        </span>
        <button onClick={toggleLeftPanel} style={closeButtonStyle} title="Cerrar panel">
          ◀
        </button>
      </div>

      {/* Search */}
      <div style={{ padding: '8px 12px' }}>
        <input
          type="text"
          placeholder="Buscar capas..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{
            width: '100%',
            padding: '6px 10px',
            borderRadius: 6,
            border: '1px solid var(--border-color)',
            background: 'var(--bg-tertiary)',
            color: 'var(--text-primary)',
            fontSize: 12,
            outline: 'none',
          }}
        />
      </div>

      {/* Layers by Domain */}
      <div style={{ flex: 1, overflow: 'auto', padding: '0 12px 12px' }}>
        {DOMAINS.filter(d => layerCountByDomain[d.key] > 0).map((domain) => {
          const domainLayers = filteredLayers.filter(l => l.domain === domain.key)
          if (domainLayers.length === 0) return null
          const isExpanded = expandedDomains.has(domain.key)
          const domainVisible = domainLayers.filter(l => l.visible).length

          return (
            <div key={domain.key} style={{ marginBottom: 8 }}>
              <div
                onClick={() => toggleDomain(domain.key)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '6px 8px',
                  borderRadius: 6,
                  cursor: 'pointer',
                  background: isExpanded ? 'var(--bg-tertiary)' : 'transparent',
                  transition: 'all 150ms',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 12 }}>{domain.icon}</span>
                  <span style={{ fontSize: 12, fontWeight: 500 }}>{domain.label}</span>
                  <span style={{
                    fontSize: 9,
                    padding: '1px 6px',
                    borderRadius: 8,
                    background: domain.color + '20',
                    color: domain.color,
                    fontWeight: 600,
                  }}>
                    {domainVisible}/{domainLayers.length}
                  </span>
                </div>
                <span style={{
                  fontSize: 10,
                  color: 'var(--text-secondary)',
                  transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)',
                  transition: 'transform 150ms',
                }}>
                  ▶
                </span>
              </div>

              {isExpanded && (
                <div style={{ paddingLeft: 8, marginTop: 4 }}>
                  {domainLayers.map((layer) => (
                    <LayerItem
                      key={layer.id}
                      layer={layer}
                      onToggle={() => toggleLayer(layer.id)}
                      onOpacityChange={(v) => setLayerOpacity(layer.id, v)}
                    />
                  ))}
                </div>
              )}
            </div>
          )
        })}

        {filteredLayers.length === 0 && (
          <div style={{ textAlign: 'center', padding: 16, color: 'var(--text-muted)', fontSize: 11 }}>
            No se encontraron capas
          </div>
        )}
      </div>

      {/* Workspaces */}
      <div style={{ borderTop: '1px solid var(--border-color)', padding: '12px' }}>
        <div style={{ fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1, color: 'var(--text-accent)', marginBottom: 8 }}>
          Workspaces
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {WORKSPACES.map((w) => (
            <button
              key={w.name}
              onClick={() => {
                setActiveWorkspace(w.name)
                // Auto-switch view mode based on workspace
                if (w.name === 'Satélites') setViewMode('space')
                else if (w.name === 'Topografía') setViewMode('map')
                else if (w.name === 'BIM') setViewMode('earth')
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '6px 8px',
                borderRadius: 6,
                fontSize: 11,
                cursor: 'pointer',
                transition: 'all 150ms',
                border: 'none',
                background: activeWorkspace === w.name ? 'var(--bg-active)' : 'transparent',
                color: activeWorkspace === w.name ? 'var(--accent-blue)' : 'var(--text-secondary)',
                textAlign: 'left',
                width: '100%',
              }}
              title={w.desc}
            >
              <span style={{ fontSize: 12 }}>{w.icon}</span>
              <span>{w.name}</span>
              {activeWorkspace === w.name && (
                <span style={{ marginLeft: 'auto', fontSize: 8, color: 'var(--accent-blue)' }}>●</span>
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

// =============================================================================
// LAYER ITEM — Componente individual de capa
// =============================================================================
function LayerItem({
  layer,
  onToggle,
  onOpacityChange,
}: {
  layer: Layer
  onToggle: () => void
  onOpacityChange: (v: number) => void
}) {
  const freshnessColors: Record<string, string> = {
    REAL: '#22c55e',
    CACHED: '#38bdf8',
    STALE: '#f59e0b',
    SIMULATED: '#a78bfa',
    UNAVAILABLE: '#ef4444',
    ERROR: '#ef4444',
  }

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: 8,
      padding: '5px 8px',
      borderRadius: 6,
      background: layer.visible ? 'rgba(56,189,248,0.05)' : 'transparent',
      transition: 'all 150ms',
    }}>
      <input
        type="checkbox"
        checked={layer.visible}
        onChange={onToggle}
        style={{ width: 14, height: 14, accentColor: 'var(--accent-blue)', cursor: 'pointer' }}
      />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 11, color: layer.visible ? 'var(--text-primary)' : 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {layer.name}
        </div>
        <div style={{ fontSize: 9, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4 }}>
          <span style={{ width: 5, height: 5, borderRadius: '50%', background: freshnessColors[layer.freshness] || '#94a3b8' }} />
          {layer.freshness} • {layer.entityCount.toLocaleString()} entidades
        </div>
      </div>
      <input
        type="range"
        min={0}
        max={1}
        step={0.1}
        value={layer.opacity}
        onChange={(e) => onOpacityChange(parseFloat(e.target.value))}
        style={{ width: 50, height: 4 }}
        disabled={!layer.visible}
      />
    </div>
  )
}

// ── Styles ──────────────────────────────────────────────────────────────────
const panelStyle: React.CSSProperties = {
  gridArea: 'left',
  display: 'flex',
  flexDirection: 'column',
  gap: 0,
  overflow: 'hidden',
}

const toggleButtonStyle: React.CSSProperties = {
  position: 'fixed',
  left: 8,
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
