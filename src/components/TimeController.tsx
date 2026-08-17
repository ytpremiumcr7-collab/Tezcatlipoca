import { useTezcatlipoca } from '@/stores/tezcatlipocaStore'
import { useEffect, useRef, useState, useCallback } from 'react'

// =============================================================================
// TIMECONTROLLER — Control temporal con simulación de velocidad
// Mentalidad DevOps: interval único, cleanup garantizado, no stale closures
// =============================================================================

const WARP_SPEEDS = [
  { label: '⏸', value: 0 },
  { label: '1×', value: 1 },
  { label: '10×', value: 10 },
  { label: '100×', value: 100 },
  { label: '1000×', value: 1000 },
  { label: 'MAX', value: 10000 },
]

export default function TimeController() {
  const { time, setTime, setTimeRate, playPause } = useTezcatlipoca()
  const [showCalendar, setShowCalendar] = useState(false)

  // Use ref for interval to avoid stale closure issues
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const timeRef = useRef(time)
  const isPlayingRef = useRef(time.isPlaying)
  const rateRef = useRef(time.rate)

  // Keep refs in sync
  useEffect(() => {
    timeRef.current = time
    isPlayingRef.current = time.isPlaying
    rateRef.current = time.rate
  }, [time])

  // Single interval that reads from refs — no stale closures
  useEffect(() => {
    // Clear any existing interval first
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }

    if (time.isPlaying && time.rate > 0) {
      const intervalMs = time.rate >= 1000 ? 50 : time.rate >= 100 ? 100 : 1000
      intervalRef.current = setInterval(() => {
        const currentTime = timeRef.current.current
        const currentRate = rateRef.current
        const increment = intervalMs * currentRate
        setTime(currentTime + increment)
      }, intervalMs)
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }
  }, [time.isPlaying, time.rate, setTime])

  const simDate = new Date(time.current)

  const formatDate = useCallback((d: Date) => {
    try {
      return d.toISOString().slice(0, 19).replace('T', ' ')
    } catch {
      return '---'
    }
  }, [])

  const handleSpeedClick = useCallback((value: number) => {
    setTimeRate(value)
    if (value > 0 && !isPlayingRef.current) {
      playPause()
    }
    if (value === 0 && isPlayingRef.current) {
      playPause()
    }
  }, [setTimeRate, playPause])

  const handleDateChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const newDate = new Date(e.target.value)
    if (!isNaN(newDate.getTime())) {
      setTime(newDate.getTime())
      setShowCalendar(false)
    }
  }, [setTime])

  return (
    <div style={containerStyle}>
      {/* Play/Pause */}
      <button
        onClick={playPause}
        style={{
          ...playButtonStyle,
          background: time.isPlaying ? 'var(--accent-blue)' : 'transparent',
          color: time.isPlaying ? '#000' : 'var(--text-primary)',
        }}
        title={time.isPlaying ? 'Pausar simulación' : 'Iniciar simulación'}
      >
        {time.isPlaying ? '⏸' : '▶'}
      </button>

      {/* Time display */}
      <div
        onClick={() => setShowCalendar(!showCalendar)}
        style={timeDisplayStyle}
        title="Clic para cambiar fecha"
      >
        {formatDate(simDate)} UTC
      </div>

      {/* Warp speeds */}
      <div style={{ display: 'flex', gap: 2 }}>
        {WARP_SPEEDS.map((w) => (
          <button
            key={w.value}
            onClick={() => handleSpeedClick(w.value)}
            style={{
              ...speedButtonStyle,
              background: time.rate === w.value ? 'var(--accent-blue)' : 'transparent',
              color: time.rate === w.value ? '#000' : 'var(--text-secondary)',
            }}
            title={`Velocidad ${w.label}`}
          >
            {w.label}
          </button>
        ))}
      </div>

      {/* Live indicator */}
      <div
        style={{
          ...liveIndicatorStyle,
          color: time.isPlaying ? 'var(--text-success)' : 'var(--text-muted)',
        }}
      >
        {time.isPlaying ? '● LIVE' : '● PAUSED'}
      </div>

      {/* Calendar popup */}
      {showCalendar && (
        <div style={calendarPopupStyle}>
          <input
            type="datetime-local"
            value={simDate.toISOString().slice(0, 16)}
            onChange={handleDateChange}
            style={calendarInputStyle}
            autoFocus
          />
          <button
            onClick={() => setShowCalendar(false)}
            style={{
              marginTop: 8,
              padding: '4px 12px',
              borderRadius: 4,
              border: '1px solid var(--border-color)',
              background: 'var(--bg-secondary)',
              color: 'var(--text-primary)',
              cursor: 'pointer',
              fontSize: 11,
              width: '100%',
            }}
          >
            Cerrar
          </button>
        </div>
      )}
    </div>
  )
}

// ── Styles ──────────────────────────────────────────────────────────────────
const containerStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 12,
  padding: '6px 12px',
  background: 'var(--bg-tertiary)',
  borderRadius: 8,
  border: '1px solid var(--border-color)',
  position: 'relative',
}

const playButtonStyle: React.CSSProperties = {
  width: 28,
  height: 28,
  borderRadius: '50%',
  border: '1px solid var(--border-active)',
  cursor: 'pointer',
  fontSize: 12,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  transition: 'all 150ms',
}

const timeDisplayStyle: React.CSSProperties = {
  fontFamily: 'var(--font-mono)',
  fontSize: 12,
  color: 'var(--text-accent)',
  cursor: 'pointer',
  padding: '2px 8px',
  borderRadius: 4,
  background: 'var(--bg-secondary)',
  userSelect: 'none',
  transition: 'all 150ms',
}

const speedButtonStyle: React.CSSProperties = {
  padding: '2px 8px',
  borderRadius: 4,
  border: 'none',
  fontSize: 10,
  fontWeight: 600,
  cursor: 'pointer',
  transition: 'all 150ms',
}

const liveIndicatorStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 5,
  fontSize: 10,
  fontWeight: 600,
  textTransform: 'uppercase',
  letterSpacing: 0.5,
  fontFamily: 'var(--font-mono)',
}

const calendarPopupStyle: React.CSSProperties = {
  position: 'absolute',
  bottom: 48,
  left: '50%',
  transform: 'translateX(-50%)',
  background: 'var(--bg-panel)',
  border: '1px solid var(--border-color)',
  borderRadius: 8,
  padding: 12,
  zIndex: 100,
  boxShadow: 'var(--shadow-lg)',
  minWidth: 220,
}

const calendarInputStyle: React.CSSProperties = {
  background: 'var(--bg-secondary)',
  color: 'var(--text-primary)',
  border: '1px solid var(--border-color)',
  borderRadius: 4,
  padding: 6,
  fontSize: 12,
  fontFamily: 'var(--font-mono)',
  width: '100%',
}
