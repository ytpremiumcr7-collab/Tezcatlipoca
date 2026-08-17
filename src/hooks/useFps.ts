import { useEffect, useRef, useState, useCallback } from 'react'

// =============================================================================
// USEFPS — Medidor de FPS con RAF único y cleanup garantizado
// Mentalidad DevOps: un solo RAF, cleanup en desmontaje, no acumulación
// =============================================================================

interface FpsMetrics {
  fps: number
  frameTime: number
}

export function useFps(): FpsMetrics {
  const [fps, setFps] = useState(0)
  const [frameTime, setFrameTime] = useState(0)

  // Use refs to avoid re-renders during measurement
  const framesRef = useRef(0)
  const lastTimeRef = useRef(performance.now())
  const rafRef = useRef(0)
  const disposedRef = useRef(false)

  const measure = useCallback(() => {
    if (disposedRef.current) return

    const now = performance.now()
    const elapsed = now - lastTimeRef.current
    framesRef.current++

    if (elapsed >= 1000) {
      const currentFps = Math.round((framesRef.current * 1000) / elapsed)
      const currentFrameTime = Math.round(elapsed / framesRef.current)

      setFps(currentFps)
      setFrameTime(currentFrameTime)

      framesRef.current = 0
      lastTimeRef.current = now
    }

    rafRef.current = requestAnimationFrame(measure)
  }, [])

  useEffect(() => {
    disposedRef.current = false
    framesRef.current = 0
    lastTimeRef.current = performance.now()

    rafRef.current = requestAnimationFrame(measure)

    return () => {
      disposedRef.current = true
      cancelAnimationFrame(rafRef.current)
    }
  }, [measure])

  return { fps, frameTime }
}
