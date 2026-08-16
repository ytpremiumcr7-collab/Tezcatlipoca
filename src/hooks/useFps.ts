import { useEffect, useRef, useState } from 'react'

export function useFps() {
  const [fps, setFps] = useState(0)
  const [frameTime, setFrameTime] = useState(0)
  const framesRef = useRef(0)
  const lastTimeRef = useRef(performance.now())
  const rafRef = useRef(0)

  useEffect(() => {
    const measure = () => {
      const now = performance.now()
      const elapsed = now - lastTimeRef.current
      framesRef.current++

      if (elapsed >= 1000) {
        const currentFps = Math.round((framesRef.current * 1000) / elapsed)
        setFps(currentFps)
        setFrameTime(Math.round(elapsed / framesRef.current))
        framesRef.current = 0
        lastTimeRef.current = now
      }

      rafRef.current = requestAnimationFrame(measure)
    }

    rafRef.current = requestAnimationFrame(measure)
    return () => cancelAnimationFrame(rafRef.current)
  }, [])

  return { fps, frameTime }
}
