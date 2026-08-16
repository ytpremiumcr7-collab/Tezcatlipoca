import { useTezcatlipoca } from '@/stores/tezcatlipocaStore'
import { useFps } from '@/hooks/useFps'
import { useEffect, useState } from 'react'

export default function HUD() {
  const { telemetry, viewMode, quality, time } = useTezcatlipoca()
  const { fps, frameTime } = useFps()
  const [clock, setClock] = useState(new Date())

  useEffect(() => {
    const interval = setInterval(() => setClock(new Date()), 1000)
    return () => clearInterval(interval)
  }, [])

  const hudItems = [
    { label: 'FPS', value: fps, unit: '', warn: fps < 30 },
    { label: 'Frame', value: frameTime, unit: 'ms', warn: frameTime > 33 },
    { label: 'VIEW', value: viewMode.toUpperCase(), unit: '' },
    { label: 'QUALITY', value: quality.toUpperCase(), unit: '' },
    { label: 'ENTITIES', value: telemetry.entitiesRendered, unit: `/${telemetry.entitiesTotal}` },
    { label: 'CHUNKS', value: telemetry.chunksLoaded, unit: `/${telemetry.chunksTotal}` },
    { label: 'MEMORY', value: telemetry.memoryMB.toFixed(0), unit: 'MB' },
    { label: 'GPU', value: telemetry.gpuTier.toUpperCase(), unit: '' },
    { label: 'RENDERER', value: telemetry.rendererState, unit: '' },
    { label: 'DATA', value: telemetry.dataState, unit: '' },
    { label: 'STREAM', value: `${(telemetry.streamPressure * 100).toFixed(0)}%`, unit: '' },
    { label: 'TIME', value: clock.toISOString().slice(11, 19), unit: 'UTC' },
    { label: 'SIM', value: new Date(time.current).toISOString().slice(11, 19), unit: time.isPlaying ? '▶' : '⏸' },
  ]

  return (
    <div style={{
      position: 'fixed',
      top: 56, right: 12,
      zIndex: 50,
      display: 'flex',
      flexDirection: 'column',
      gap: 4,
    }}>
      {hudItems.map((item) => (
        <div key={item.label} style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          padding: '4px 10px',
          borderRadius: 6,
          background: 'var(--hud-bg)',
          border: `1px solid ${item.warn ? 'var(--text-warning)' : 'var(--hud-border)'}`,
          backdropFilter: 'blur(8px)',
        }}>
          <span className="hud-label">{item.label}</span>
          <span className="hud-value" style={{ color: item.warn ? 'var(--text-warning)' : undefined }}>
            {item.value}{item.unit}
          </span>
        </div>
      ))}
    </div>
  )
}
