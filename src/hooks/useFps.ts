import { useState, useEffect, useRef } from 'react'

export function useFps() {
  const [fps, setFps] = useState(0)
  const frames = useRef(0)
  const lastTime = useRef(performance.now())

  useEffect(() => {
    let raf: number
    const tick = () => {
      frames.current++
      const now = performance.now()
      if (now - lastTime.current >= 1000) {
        setFps(frames.current)
        frames.current = 0
        lastTime.current = now
      }
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [])

  return fps
}
