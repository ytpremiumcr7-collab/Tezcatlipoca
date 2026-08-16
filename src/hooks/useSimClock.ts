import { useCallback, useMemo, useRef, useState } from 'react'

export interface SimClock {
  getTime: () => number
  speed: number
  playing: boolean
  setSpeed: (s: number) => void
  pause: () => void
  resume: () => void
  goNow: () => void
}

/**
 * Anchor-based simulation clock:
 *   simTime = simAnchor + (performance.now() - wallAnchor) * speed
 * Immune to setInterval throttling in background tabs.
 */
export function useSimClock(): SimClock {
  const simAnchor = useRef(0)
  const wallAnchor = useRef(0)
  const inited = useRef(false)
  const speedRef = useRef(1)
  const playingRef = useRef(true)
  const [speed, setSpeedState] = useState(1)
  const [playing, setPlaying] = useState(true)

  const ensure = useCallback(() => {
    if (!inited.current) {
      simAnchor.current = Date.now()
      wallAnchor.current = performance.now()
      inited.current = true
    }
  }, [])

  const getTime = useCallback(() => {
    ensure()
    if (!playingRef.current) return simAnchor.current
    return simAnchor.current + (performance.now() - wallAnchor.current) * speedRef.current
  }, [ensure])

  const reanchor = useCallback(() => {
    simAnchor.current = getTime()
    wallAnchor.current = performance.now()
  }, [getTime])

  const setSpeed = useCallback((s: number) => {
    reanchor()
    speedRef.current = s
    setSpeedState(s)
    if (!playingRef.current) {
      playingRef.current = true
      setPlaying(true)
    }
  }, [reanchor])

  const pause = useCallback(() => {
    if (!playingRef.current) return
    simAnchor.current = getTime()
    wallAnchor.current = performance.now()
    playingRef.current = false
    setPlaying(false)
  }, [getTime])

  const resume = useCallback(() => {
    if (playingRef.current) return
    ensure()
    wallAnchor.current = performance.now()
    playingRef.current = true
    setPlaying(true)
  }, [ensure])

  const goNow = useCallback(() => {
    simAnchor.current = Date.now()
    wallAnchor.current = performance.now()
    inited.current = true
    speedRef.current = 1
    playingRef.current = true
    setSpeedState(1)
    setPlaying(true)
  }, [])

  return useMemo(
    () => ({ getTime, speed, playing, setSpeed, pause, resume, goNow }),
    [getTime, speed, playing, setSpeed, pause, resume, goNow],
  )
}

// Format helpers
export function formatClockTime(ms: number): string {
  const d = new Date(ms)
  return d.toISOString().substring(11, 19)
}

export function formatClockDate(ms: number): string {
  const d = new Date(ms)
  return d.toISOString().substring(0, 10)
}
