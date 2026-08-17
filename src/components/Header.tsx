import { useTezcatlipoca } from '@/stores/tezcatlipocaStore'
import { useState, useCallback, useRef, useEffect } from 'react'

// =============================================================================
// HEADER — Barra superior con navegación, búsqueda y estado
// Mentalidad DevOps: mobile-first, callbacks memoizados, cleanup de eventos
// =============================================================================

const VIEW_MODES = [
  { id: 'map' as const, label: 'Mapa', icon: '🗺️' },
  { id: 'earth' as const, label: 'Tierra', icon: '🌍' },
  { id: 'globe' as const, label: 'Globo', icon: '🌐' },
  { id: 'space' as const, label: 'Espacio', icon: '🛰️' },
]

export default function Header() {
  const { viewMode, setViewMode, backendStatus, projectId, toggleMobileMenu, mobileMenuOpen, toggleLeftPanel, toggleRightPanel, leftPanelOpen, rightPanelOpen } = useTezcatlipoca()
  const [searchOpen, setSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const searchInputRef = useRef<HTMLInputElement>(null)
  const [isMobile, setIsMobile] = useState(false)

  // Detect mobile viewport
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth <= 768)
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // Auto-focus search input
  useEffect(() => {
    if (searchOpen && searchInputRef.current) {
      searchInputRef.current.focus()
    }
  }, [searchOpen])

  // Close search on Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && searchOpen) {
        setSearchOpen(false)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [searchOpen])

  const handleSearchSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      // En producción: dispatch search action
      console.log('[Header] Search:', searchQuery)
      setSearchOpen(false)
      setSearchQuery('')
    }
  }, [searchQuery])

  const statusColor = {
    REAL: '#22c55e',
    CACHED: '#38bdf8',
    STALE: '#f59e0b',
    SIMULATED: '#a78bfa',
    UNAVAILABLE: '#ef4444',
    ERROR: '#ef4444',
  }[backendStatus] || '#94a3b8'

  const statusLabel = {
    REAL: 'En vivo',
    CACHED: 'Caché',
    STALE: 'Desactualizado',
    SIMULATED: 'Simulado',
    UNAVAILABLE: 'Offline',
    ERROR: 'Error',
  }[backendStatus] || backendStatus

  return (
    <header style={headerStyle}>
      {/* Left: Logo + Mobile Toggle */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
        {/* Mobile menu toggle */}
        <button
          onClick={toggleMobileMenu}
          style={{ ...mobileToggleStyle, display: isMobile ? 'flex' : 'none' }}
          className="mobile-toggle"
          title="Menú"
          aria-label="Abrir menú"
        >
          {mobileMenuOpen ? '✕' : '☰'}
        </button>

        {/* Mobile panel toggles */}
        <button
          onClick={() => { toggleLeftPanel(); if (rightPanelOpen) toggleRightPanel() }}
          style={{ ...mobileToggleStyle, display: isMobile ? 'flex' : 'none', background: leftPanelOpen ? 'var(--bg-active)' : undefined, borderColor: leftPanelOpen ? 'var(--accent-blue)' : undefined }}
          className="mobile-panel-toggle"
          title="Capas"
          aria-label="Abrir panel de capas"
        >
          🗂️
        </button>

        <button
          onClick={() => { toggleRightPanel(); if (leftPanelOpen) toggleLeftPanel() }}
          style={{ ...mobileToggleStyle, display: isMobile ? 'flex' : 'none', background: rightPanelOpen ? 'var(--bg-active)' : undefined, borderColor: rightPanelOpen ? 'var(--accent-blue)' : undefined }}
          className="mobile-panel-toggle"
          title="Inspector"
          aria-label="Abrir panel de inspección"
        >
          🔍
        </button>

        {/* Logo */}
        <div style={logoContainerStyle}>
          <div style={logoIconStyle}>T</div>
          <div style={{ minWidth: 0 }}>
            <div style={logoTextStyle}>TEZCATLIPOCA</div>
            <div style={logoSubtextStyle}>
              {projectId || 'Sin proyecto'}
            </div>
          </div>
        </div>
      </div>

      {/* Center: View Mode Switcher */}
      <div style={viewModeContainerStyle} className="view-mode-switcher">
        {VIEW_MODES.map((mode) => (
          <button
            key={mode.id}
            onClick={() => setViewMode(mode.id)}
            style={{
              ...viewModeButtonStyle,
              background: viewMode === mode.id ? 'var(--accent-blue)' : 'transparent',
              color: viewMode === mode.id ? '#000' : 'var(--text-secondary)',
            }}
            title={`Modo ${mode.label}`}
            aria-label={`Cambiar a modo ${mode.label}`}
            aria-pressed={viewMode === mode.id}
          >
            <span style={{ fontSize: 12 }}>{mode.icon}</span>
            <span className="view-mode-label">{mode.label}</span>
          </button>
        ))}
      </div>

      {/* Right: Search + Status + User */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
        {/* Search */}
        <div style={{ position: 'relative' }}>
          {searchOpen ? (
            <form onSubmit={handleSearchSubmit}>
              <input
                ref={searchInputRef}
                autoFocus
                placeholder="Buscar entidad, capa, dataset..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onBlur={() => {
                  if (!searchQuery.trim()) setSearchOpen(false)
                }}
                style={searchInputStyle}
              />
            </form>
          ) : (
            <button
              onClick={() => setSearchOpen(true)}
              style={iconButtonStyle}
              title="Buscar"
              aria-label="Abrir búsqueda"
            >
              🔍
            </button>
          )}
        </div>

        {/* Backend Status */}
        <div style={statusContainerStyle} title={`Estado: ${statusLabel}`}>
          <div style={{
            width: 8,
            height: 8,
            borderRadius: '50%',
            background: statusColor,
            boxShadow: `0 0 6px ${statusColor}`,
            animation: backendStatus === 'REAL' ? 'pulse-glow 2s infinite' : 'none',
          }} />
          <span style={statusTextStyle} className="status-label">
            {statusLabel}
          </span>
        </div>

        {/* User */}
        <button
          style={userButtonStyle}
          title="Usuario"
          aria-label="Menú de usuario"
        >
          U
        </button>
      </div>
    </header>
  )
}

// ── Styles ──────────────────────────────────────────────────────────────────
const headerStyle: React.CSSProperties = {
  gridArea: 'header',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: '0 16px',
  background: 'var(--bg-secondary)',
  borderBottom: '1px solid var(--border-color)',
  borderRadius: '8px',
  gap: 12,
  minHeight: 'var(--header-height)',
  flexShrink: 0,
}

const mobileToggleStyle: React.CSSProperties = {
  display: 'none',
  background: 'none',
  border: 'none',
  color: 'var(--text-primary)',
  fontSize: 18,
  cursor: 'pointer',
  width: 32,
  height: 32,
  alignItems: 'center',
  justifyContent: 'center',
  borderRadius: 6,
  transition: 'all 150ms',
}

const logoContainerStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 10,
  minWidth: 0,
}

const logoIconStyle: React.CSSProperties = {
  width: 32,
  height: 32,
  borderRadius: '50%',
  background: 'conic-gradient(from 0deg, #38bdf8, #22d3ee, #34d399, #38bdf8)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontSize: 14,
  fontWeight: 'bold',
  color: '#000',
  flexShrink: 0,
}

const logoTextStyle: React.CSSProperties = {
  fontWeight: 700,
  fontSize: 14,
  letterSpacing: 1,
  whiteSpace: 'nowrap',
}

const logoSubtextStyle: React.CSSProperties = {
  fontSize: 10,
  color: 'var(--text-secondary)',
  textTransform: 'uppercase',
  letterSpacing: 2,
  whiteSpace: 'nowrap',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
}

const viewModeContainerStyle: React.CSSProperties = {
  display: 'flex',
  gap: 4,
  background: 'var(--bg-tertiary)',
  padding: 3,
  borderRadius: 8,
  flexShrink: 0,
}

const viewModeButtonStyle: React.CSSProperties = {
  padding: '6px 12px',
  borderRadius: 6,
  border: 'none',
  fontSize: 11,
  fontWeight: 600,
  textTransform: 'uppercase',
  letterSpacing: 0.5,
  cursor: 'pointer',
  transition: 'all 150ms',
  display: 'flex',
  alignItems: 'center',
  gap: 4,
  whiteSpace: 'nowrap',
}

const searchInputStyle: React.CSSProperties = {
  width: 280,
  padding: '6px 12px',
  borderRadius: 6,
  border: '1px solid var(--border-active)',
  background: 'var(--bg-tertiary)',
  color: 'var(--text-primary)',
  fontSize: 12,
  outline: 'none',
  fontFamily: 'var(--font-sans)',
}

const iconButtonStyle: React.CSSProperties = {
  background: 'none',
  border: 'none',
  color: 'var(--text-secondary)',
  cursor: 'pointer',
  fontSize: 16,
  width: 32,
  height: 32,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  borderRadius: 6,
  transition: 'all 150ms',
}

const statusContainerStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 6,
  padding: '4px 10px',
  borderRadius: 6,
  background: 'var(--bg-tertiary)',
  flexShrink: 0,
}

const statusTextStyle: React.CSSProperties = {
  fontSize: 10,
  textTransform: 'uppercase',
  color: 'var(--text-secondary)',
  fontWeight: 600,
  letterSpacing: 0.5,
  whiteSpace: 'nowrap',
}

const userButtonStyle: React.CSSProperties = {
  width: 30,
  height: 30,
  borderRadius: '50%',
  background: 'var(--accent-blue)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontSize: 12,
  fontWeight: 'bold',
  color: '#000',
  cursor: 'pointer',
  border: 'none',
  flexShrink: 0,
  transition: 'all 150ms',
}
