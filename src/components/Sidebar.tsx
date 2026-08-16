import { useState } from 'react'
import type { Workspace, Project } from '../engines/types'

interface Props {
  workspace: Workspace
  onWorkspaceChange: (w: Workspace) => void
  collapsed: boolean
  onToggle: () => void
  projects: Project[]
  activeProject: Project
  onProjectSelect: (p: Project) => void
}

const WORKSPACES: { id: Workspace; label: string; icon: string }[] = [
  { id: 'explore', label: 'Explorar', icon: '🧭' },
  { id: 'layers', label: 'Capas', icon: '📚' },
  { id: 'survey', label: 'Topografia', icon: '📐' },
  { id: 'terrain', label: 'Terreno', icon: '⛰️' },
  { id: 'bim', label: 'BIM', icon: '🏗️' },
  { id: 'observe', label: 'Observar', icon: '🛰️' },
  { id: 'events', label: 'Eventos', icon: '⚡' },
  { id: 'astronomy', label: 'Astronomia', icon: '🔭' },
  { id: 'simulation', label: 'Simular', icon: '🔮' },
  { id: 'analyze', label: 'Analizar', icon: '📊' },
  { id: 'deliver', label: 'Entregar', icon: '📦' },
]

export default function Sidebar({ workspace, onWorkspaceChange, collapsed, onToggle }: Props) {
  return (
    <aside style={{
      width: collapsed ? '56px' : '260px',
      background: 'linear-gradient(180deg, #111118 0%, #0d0d14 100%)',
      borderRight: '1px solid rgba(255,165,0,0.1)',
      display: 'flex',
      flexDirection: 'column',
      transition: 'width 0.2s ease',
      flexShrink: 0,
      overflow: 'hidden',
    }}>
      <button onClick={onToggle} style={{
        alignSelf: 'flex-end', margin: '8px',
        background: 'transparent', border: 'none',
        color: '#888', cursor: 'pointer', fontSize: '16px'
      }}>{collapsed ? '→' : '←'}</button>

      {!collapsed && (
        <>
          <div style={{ padding: '0 12px 12px' }}>
            <div style={{ fontSize: '10px', color: '#888', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px', paddingLeft: '8px' }}>Navegacion</div>
            {WORKSPACES.map(ws => (
              <button key={ws.id} onClick={() => onWorkspaceChange(ws.id)} style={{
                width: '100%', textAlign: 'left', padding: '10px 12px',
                marginBottom: '2px', borderRadius: '8px',
                background: workspace === ws.id ? 'rgba(255,165,0,0.12)' : 'transparent',
                border: 'none', color: workspace === ws.id ? '#ffa500' : '#aaa',
                fontSize: '13px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px',
                fontFamily: 'inherit'
              }}>
                <span style={{ fontSize: '16px' }}>{ws.icon}</span>
                {ws.label}
              </button>
            ))}
          </div>

          <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', margin: '0 12px' }} />

          <div style={{ padding: '12px' }}>
            <div style={{ fontSize: '10px', color: '#888', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px', paddingLeft: '8px' }}>Filtros Activos</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <FilterTag label="Elevacion > 2,200 m" />
              <FilterTag label="Uso de suelo: Urbano" />
              <FilterTag label="Riesgo: Alto / Medio" />
            </div>
          </div>

          <div style={{ marginTop: 'auto', padding: '12px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
            <div style={{ fontSize: '11px', color: '#666' }}>Datos: 21 Mayo 2024, 09:42 UTC</div>
            <div style={{ fontSize: '11px', color: '#666' }}>Resolucion: 0.5 m/px</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '8px' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#2ecc71' }} />
              <span style={{ fontSize: '11px', color: '#2ecc71' }}>Conectado</span>
            </div>
          </div>
        </>
      )}
    </aside>
  )
}

function FilterTag({ label }: { label: string }) {
  return (
    <div style={{
      background: 'rgba(255,165,0,0.08)', border: '1px solid rgba(255,165,0,0.2)',
      borderRadius: '6px', padding: '6px 10px', fontSize: '11px', color: '#ddd',
      display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px'
    }}>
      {label}
      <span style={{ cursor: 'pointer', color: '#888' }}>×</span>
    </div>
  )
}
