import { useTezcatlipoca } from '@/stores/tezcatlipocaStore'
import { useFps } from '@/hooks/useFps'
import { useEffect, useState, useRef } from 'react'

// =============================================================================
// HUD — Heads-Up Display con métricas reales del sistema
// Mentalidad DevOps: datos reales, memory monitoring, GPU detection, no mock data
// =============================================================================

export default function HUD() {
  const { telemetry, viewMode, quality, time } = useTezcatlipoca()
  const { fps, frameTime } = useFps()
  const [clock, setClock] = useState(new Date())
  const [memoryMB, setMemoryMB] = useState(0)
  const [gpuInfo, setGpuInfo] = useState<string>('detecting...')
  const [isCollapsed, setIsCollapsed] = useState(false)
  const memoryIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // Clock update
  useEffect(() => {
    const interval = setInterval(() => setClock(new Date()), 1000)
    return () => clearInterval(interval)
  }, [])

  // Memory monitoring
  useEffect(() => {
    const updateMemory = () => {
      const perf = performance as any
      if (perf.memory) {
        const usedMB = Math.round(perf.memory.usedJSHeapSize / 1048576)
        setMemoryMB(usedMB)
      }
    }
    updateMemory()
    memoryIntervalRef.current = setInterval(updateMemory, 5000)
    return () => {
      if (memoryIntervalRef.current) clearInterval(memoryIntervalRef.current)
    }
  }, [])

  // GPU detection
  useEffect(() => {
    try {
      const canvas = document.createElement('canvas')
      const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl')
      if (gl) {
        const debugInfo = (gl as any).getExtension('WEBGL_debug_renderer_info')
        if (debugInfo) {
          const renderer = (gl as any).getParameter(debugInfo.UNMASKED_RENDERER_WEBGL)
          setGpuInfo(renderer.split(' ').slice(0, 3).join(' '))
        } else {
          setGpuInfo('WebGL disponible')
        }
      } else {
        setGpuInfo('No WebGL')
      }
    } catch {
      setGpuInfo('No detectado')
    }
  }, [])

  // Determine GPU tier from telemetry or detect
  const gpuTier = telemetry.gpuTier

  // Build HUD items with real data
  const hudItems = [
    { label: 'FPS', value: fps, unit: '', warn: fps < 30 && fps > 0 },
    { label: 'FRAME', value: frameTime, unit: 'ms', warn: frameTime > 33 },
    { label: 'VIEW', value: viewMode.toUpperCase(), unit: '' },
    { label: 'QUALITY', value: quality.toUpperCase(), unit: '' },
    { label: 'ENTITIES', value: telemetry.entitiesRendered, unit: `/${telemetry.entitiesTotal}` },
    { label: 'CHUNKS', value: telemetry.chunksLoaded, unit: `/${telemetry.chunksTotal}` },
    { label: 'MEMORY', value: memoryMB, unit: 'MB', warn: memoryMB > 512 },
    { label: 'GPU', value: gpuTier.toUpperCase(), unit: '' },
    { label: 'RENDERER', value: telemetry.rendererState, unit: '' },
    { label: 'DATA', value: telemetry.dataState, unit: '' },
    { label: 'STREAM', value: `${(telemetry.streamPressure * 100).toFixed(0)}%`, unit: '' },
    { label: 'TIME', value: clock.toISOString().slice(11, 19), unit: 'UTC' },
    { label: 'SIM', value: new Date(time.current).toISOString().slice(11, 19), unit: time.isPlaying ? '▶' : '⏸' },
  ]

  if (isCollapsed) {
    return (
      <button
        onClick={() => setIsCollapsed(false)}
        style={{
          position: 'fixed',
          top: 56,
          right: 12,
          zIndex: 50,
          padding: '4px 8px',
          borderRadius: 6,
          background: 'var(--hud-bg)',
          border: '1px solid var(--hud-border)',
          color: 'var(--text-accent)',
          fontSize: 10,
          cursor: 'pointer',
          backdropFilter: 'blur(8px)',
        }}
        title="Expandir HUD"
      >
        📊 HUD
      </button>
    )
  }

  return (
    <div style={hudContainerStyle}>
      {/* Collapse button */}
      <button
        onClick={() => setIsCollapsed(true)}
        style={{
          position: 'absolute',
          top: -8,
          right: -8,
          width: 16,
          height: 16,
          borderRadius: '50%',
          background: 'var(--bg-tertiary)',
          border: '1px solid var(--border-color)',
          color: 'var(--text-muted)',
          fontSize: 8,
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1,
        }}
        title="Colapsar HUD"
      >
        ×
      </button>

      {hudItems.map((item) => (
        <div key={item.label} style={{
          ...hudItemStyle,
          borderColor: item.warn ? 'var(--text-warning)' : 'var(--hud-border)',
        }}>
          <span className="hud-label">{item.label}</span>
          <span className="hud-value" style={{ color: item.warn ? 'var(--text-warning)' : undefined }}>
            {item.value}{item.unit}
          </span>
        </div>
      ))}

      {/* GPU info tooltip */}
      <div style={{
        fontSize: 8,
        color: 'var(--text-muted)',
        textAlign: 'right',
        paddingTop: 2,
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
        maxWidth: 140,
      }} title={gpuInfo}>
        {gpuInfo}
      </div>
    </div>
  )
}

// ── Styles ──────────────────────────────────────────────────────────────────
const hudContainerStyle: React.CSSProperties = {
  position: 'fixed',
  top: 56,
  right: 12,
  zIndex: 50,
  display: 'flex',
  flexDirection: 'column',
  gap: 3,
  maxWidth: 160,
}

const hudItemStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 8,
  padding: '3px 10px',
  borderRadius: 6,
  background: 'var(--hud-bg)',
  border: '1px solid var(--hud-border)',
  backdropFilter: 'blur(8px)',
  transition: 'border-color 150ms',
}
