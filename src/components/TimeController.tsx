import { useTezcatlipoca } from '@/stores/tezcatlipocaStore'
import { useEffect, useRef, useState } from 'react'

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
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    if (time.isPlaying && time.rate > 0) {
      intervalRef.current = setInterval(() => {
        setTime(time.current + 1000 * time.rate)
      }, 1000)
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [time.isPlaying, time.rate])

  const simDate = new Date(time.current)
  const formatDate = (d: Date) => d.toISOString().slice(0, 19).replace('T', ' ')

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: 12,
      padding: '6px 12px',
      background: 'var(--bg-tertiary)',
      borderRadius: 8,
      border: '1px solid var(--border-color)',
    }}>
      {/* Play/Pause */}
      <button
        onClick={playPause}
        style={{
          width: 28, height: 28,
          borderRadius: '50%',
          border: '1px solid var(--border-active)',
          background: time.isPlaying ? 'var(--accent-blue)' : 'transparent',
          color: time.isPlaying ? '#000' : 'var(--text-primary)',
          cursor: 'pointer',
          fontSize: 12,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {time.isPlaying ? '⏸' : '▶'}
      </button>

      {/* Time display */}
      <div
        onClick={() => setShowCalendar(!showCalendar)}
        style={{
          fontFamily: 'var(--font-mono)',
          fontSize: 12,
          color: 'var(--text-accent)',
          cursor: 'pointer',
          padding: '2px 8px',
          borderRadius: 4,
          background: 'var(--bg-secondary)',
        }}
        title="Clic para cambiar fecha"
      >
        {formatDate(simDate)} UTC
      </div>

      {/* Warp speeds */}
      <div style={{ display: 'flex', gap: 2 }}>
        {WARP_SPEEDS.map((w) => (
          <button
            key={w.value}
            onClick={() => {
              setTimeRate(w.value)
              if (w.value > 0 && !time.isPlaying) playPause()
              if (w.value === 0 && time.isPlaying) playPause()
            }}
            style={{
              padding: '2px 8px',
              borderRadius: 4,
              border: 'none',
              background: time.rate === w.value ? 'var(--accent-blue)' : 'transparent',
              color: time.rate === w.value ? '#000' : 'var(--text-secondary)',
              fontSize: 10,
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            {w.label}
          </button>
        ))}
      </div>

      {/* Live indicator */}
      <div className="status-live">
        {time.isPlaying ? 'LIVE' : 'PAUSED'}
      </div>

      {/* Calendar popup */}
      {showCalendar && (
        <div style={{
          position: 'absolute',
          bottom: 40,
          left: '50%',
          transform: 'translateX(-50%)',
          background: 'var(--bg-panel)',
          border: '1px solid var(--border-color)',
          borderRadius: 8,
          padding: 12,
          zIndex: 100,
        }}>
          <input
            type="datetime-local"
            value={simDate.toISOString().slice(0, 16)}
            onChange={(e) => {
              setTime(new Date(e.target.value).getTime())
              setShowCalendar(false)
            }}
            style={{
              background: 'var(--bg-secondary)',
              color: 'var(--text-primary)',
              border: '1px solid var(--border-color)',
              borderRadius: 4,
              padding: 6,
            }}
          />
        </div>
      )}
    </div>
  )
}
