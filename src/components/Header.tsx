import { useState } from 'react'
import type { Project, Alert } from '../engines/types'

interface Props {
  project: Project
  projects: Project[]
  onProjectChange: (p: Project) => void
  alerts: Alert[]
  onSearch: (q: string) => void
}

export default function Header({ project, projects, onProjectChange, alerts }: Props) {
  const [showProjectMenu, setShowProjectMenu] = useState(false)
  const [showNotifications, setShowNotifications] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  const unreadAlerts = alerts.filter(a => a.severity === 'high').length

  return (
    <header style={{
      height: '56px',
      background: 'linear-gradient(180deg, #111118 0%, #0d0d14 100%)',
      borderBottom: '1px solid rgba(255,165,0,0.15)',
      display: 'flex',
      alignItems: 'center',
      padding: '0 20px',
      gap: '16px',
      zIndex: 100,
      flexShrink: 0,
    }}>
      {/* Logo */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: '200px' }}>
        <div style={{
          width: '36px', height: '36px',
          borderRadius: '50%',
          background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
          border: '2px solid rgba(255,165,0,0.4)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '18px', color: '#ffa500'
        }}>🌎</div>
        <div>
          <div style={{ fontWeight: 700, fontSize: '15px', color: '#fff', letterSpacing: '0.5px' }}>Tezcatlipoca</div>
          <div style={{ fontSize: '10px', color: '#888', textTransform: 'uppercase', letterSpacing: '1px' }}>Geospatial Intelligence</div>
        </div>
      </div>

      {/* Project Selector */}
      <div style={{ position: 'relative' }}>
        <button
          onClick={() => setShowProjectMenu(!showProjectMenu)}
          style={{
            background: 'rgba(255,165,0,0.08)',
            border: '1px solid rgba(255,165,0,0.25)',
            borderRadius: '8px',
            padding: '8px 16px',
            color: '#ffa500',
            fontSize: '13px',
            fontFamily: 'inherit',
            cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: '8px'
          }}
        >
          <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: project.status === 'active' ? '#2ecc71' : project.status === 'review' ? '#f39c12' : '#e74c3c' }} />
          Proyecto: {project.name}
          <span style={{ fontSize: '10px' }}>▼</span>
        </button>
        {showProjectMenu && (
          <div style={{
            position: 'absolute', top: '100%', left: 0, marginTop: '4px',
            background: '#1a1a24', border: '1px solid rgba(255,165,0,0.2)',
            borderRadius: '8px', padding: '8px 0', minWidth: '280px',
            zIndex: 200, boxShadow: '0 8px 32px rgba(0,0,0,0.5)'
          }}>
            {projects.map(p => (
              <div key={p.id} onClick={() => { onProjectChange(p); setShowProjectMenu(false) }}
                style={{
                  padding: '10px 16px', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', gap: '10px',
                  background: p.id === project.id ? 'rgba(255,165,0,0.1)' : 'transparent',
                  borderLeft: p.id === project.id ? '3px solid #ffa500' : '3px solid transparent'
                }}
              >
                <span style={{
                  width: '8px', height: '8px', borderRadius: '50%',
                  background: p.status === 'active' ? '#2ecc71' : p.status === 'review' ? '#f39c12' : '#e74c3c',
                  flexShrink: 0
                }} />
                <div>
                  <div style={{ fontSize: '13px', color: '#fff' }}>{p.name}</div>
                  <div style={{ fontSize: '11px', color: '#888' }}>{p.location}</div>
                </div>
                <span style={{
                  marginLeft: 'auto', fontSize: '10px', padding: '2px 8px',
                  borderRadius: '4px', background: p.status === 'active' ? 'rgba(46,204,113,0.15)' : p.status === 'review' ? 'rgba(243,156,18,0.15)' : 'rgba(231,76,60,0.15)',
                  color: p.status === 'active' ? '#2ecc71' : p.status === 'review' ? '#f39c12' : '#e74c3c'
                }}>
                  {p.status === 'active' ? 'Activo' : p.status === 'review' ? 'En revisión' : 'Inactivo'}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Search */}
      <div style={{ flex: 1, maxWidth: '400px', position: 'relative' }}>
        <input
          type="text"
          placeholder="Buscar coordenadas, capas, entidades..."
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          style={{
            width: '100%', padding: '8px 16px 8px 36px',
            background: 'rgba(255,255,255,0.05)',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: '8px', color: '#ddd', fontSize: '13px',
            outline: 'none', fontFamily: 'inherit'
          }}
        />
        <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#666', fontSize: '14px' }}>🔍</span>
      </div>

      {/* Spacer */}
      <div style={{ flex: 1 }} />

      {/* Notifications */}
      <div style={{ position: 'relative' }}>
        <button
          onClick={() => setShowNotifications(!showNotifications)}
          style={{
            background: 'transparent', border: 'none', color: '#ddd',
            fontSize: '18px', cursor: 'pointer', position: 'relative', padding: '8px'
          }}
        >
          🔔
          {unreadAlerts > 0 && (
            <span style={{
              position: 'absolute', top: '2px', right: '2px',
              width: '16px', height: '16px', borderRadius: '50%',
              background: '#e74c3c', color: '#fff', fontSize: '10px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontWeight: 'bold'
            }}>{unreadAlerts}</span>
          )}
        </button>
        {showNotifications && (
          <div style={{
            position: 'absolute', top: '100%', right: 0, marginTop: '4px',
            background: '#1a1a24', border: '1px solid rgba(255,165,0,0.2)',
            borderRadius: '8px', padding: '12px', minWidth: '320px',
            zIndex: 200, boxShadow: '0 8px 32px rgba(0,0,0,0.5)'
          }}>
            <div style={{ fontSize: '12px', color: '#ffa500', fontWeight: 600, marginBottom: '8px', textTransform: 'uppercase' }}>
              Alertas Activas ({alerts.length})
            </div>
            {alerts.map(a => (
              <div key={a.id} style={{
                padding: '10px', borderRadius: '6px', marginBottom: '6px',
                background: a.severity === 'high' ? 'rgba(231,76,60,0.1)' : a.severity === 'medium' ? 'rgba(243,156,18,0.1)' : 'rgba(52,152,219,0.1)',
                borderLeft: `3px solid ${a.severity === 'high' ? '#e74c3c' : a.severity === 'medium' ? '#f39c12' : '#3498db'}`
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span>{a.severity === 'high' ? '🔴' : a.severity === 'medium' ? '🟡' : '🔵'}</span>
                  <span style={{ fontSize: '12px', fontWeight: 600, color: '#fff' }}>{a.title}</span>
                </div>
                <div style={{ fontSize: '11px', color: '#aaa', marginTop: '2px' }}>{a.description}</div>
                <div style={{ fontSize: '10px', color: '#666', marginTop: '4px' }}>{a.time}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Settings */}
      <button style={{ background: 'transparent', border: 'none', color: '#ddd', fontSize: '18px', cursor: 'pointer', padding: '8px' }}>⚙️</button>

      {/* User */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <div style={{
          width: '32px', height: '32px', borderRadius: '50%',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '14px', fontWeight: 'bold', color: '#fff'
        }}>DA</div>
        <span style={{ fontSize: '13px', color: '#ddd' }}>Dr. Atl</span>
      </div>
    </header>
  )
}
