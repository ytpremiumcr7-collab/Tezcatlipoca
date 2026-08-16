import { useTezcatlipoca } from '@/stores/tezcatlipocaStore'
import { useState } from 'react'

export default function Header() {
  const { viewMode, setViewMode, backendStatus, projectId, toggleMobileMenu } = useTezcatlipoca()
  const [searchOpen, setSearchOpen] = useState(false)

  const statusColor = {
    REAL: '#22c55e',
    CACHED: '#38bdf8',
    STALE: '#f59e0b',
    SIMULATED: '#a78bfa',
    UNAVAILABLE: '#ef4444',
    ERROR: '#ef4444',
  }[backendStatus] || '#94a3b8'

  return (
    <header style={{
      gridArea: 'header',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 16px',
      background: 'var(--bg-secondary)',
      borderBottom: '1px solid var(--border-color)',
      borderRadius: '8px',
      gap: 12,
    }}>
      {/* Logo */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <button
          onClick={toggleMobileMenu}
          style={{
            display: 'none',
            background: 'none', border: 'none', color: 'var(--text-primary)',
            fontSize: 20, cursor: 'pointer',
          }}
          className="mobile-toggle"
        >
          ☰
        </button>
        <div style={{
          width: 32, height: 32, borderRadius: '50%',
          background: 'conic-gradient(from 0deg, #38bdf8, #22d3ee, #34d399, #38bdf8)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 14, fontWeight: 'bold', color: '#000',
        }}>
          T
        </div>
        <div>
          <div style={{ fontWeight: 700, fontSize: 14, letterSpacing: 1 }}>TEZCATLIPOCA</div>
          <div style={{ fontSize: 10, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: 2 }}>
            {projectId || 'Sin proyecto'}
          </div>
        </div>
      </div>

      {/* View Mode Switcher */}
      <div style={{
        display: 'flex',
        gap: 4,
        background: 'var(--bg-tertiary)',
        padding: 3,
        borderRadius: 8,
      }}>
        {(['map', 'earth', 'globe', 'space'] as const).map((mode) => (
          <button
            key={mode}
            onClick={() => setViewMode(mode)}
            style={{
              padding: '6px 14px',
              borderRadius: 6,
              border: 'none',
              background: viewMode === mode ? 'var(--accent-blue)' : 'transparent',
              color: viewMode === mode ? '#000' : 'var(--text-secondary)',
              fontSize: 11,
              fontWeight: 600,
              textTransform: 'uppercase',
              letterSpacing: 1,
              cursor: 'pointer',
              transition: 'all 150ms',
            }}
          >
            {mode}
          </button>
        ))}
      </div>

      {/* Right Section */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        {/* Search */}
        <div style={{ position: 'relative' }}>
          {searchOpen ? (
            <input
              autoFocus
              placeholder="Buscar entidad, capa, dataset..."
              onBlur={() => setSearchOpen(false)}
              style={{
                width: 280,
                padding: '6px 12px',
                borderRadius: 6,
                border: '1px solid var(--border-active)',
                background: 'var(--bg-tertiary)',
                color: 'var(--text-primary)',
                fontSize: 12,
                outline: 'none',
              }}
            />
          ) : (
            <button
              onClick={() => setSearchOpen(true)}
              style={{
                background: 'none', border: 'none', color: 'var(--text-secondary)',
                cursor: 'pointer', fontSize: 16,
              }}
            >
              🔍
            </button>
          )}
        </div>

        {/* Backend Status */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 6,
          padding: '4px 10px', borderRadius: 6,
          background: 'var(--bg-tertiary)',
        }}>
          <div style={{
            width: 8, height: 8, borderRadius: '50%',
            background: statusColor,
            boxShadow: `0 0 6px ${statusColor}`,
          }} />
          <span style={{ fontSize: 10, textTransform: 'uppercase', color: 'var(--text-secondary)' }}>
            {backendStatus}
          </span>
        </div>

        {/* User */}
        <div style={{
          width: 30, height: 30, borderRadius: '50%',
          background: 'var(--accent-blue)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 12, fontWeight: 'bold', color: '#000', cursor: 'pointer',
        }}>
          U
        </div>
      </div>
    </header>
  )
}
