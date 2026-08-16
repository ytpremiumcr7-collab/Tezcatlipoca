// =============================================================================
// SPATIAL RUNTIME — Núcleo orquestador de Tezcatlipoca v2
// Basado en la spec: Sección 4, 23
// =============================================================================

import { useTezcatlipoca } from '@/stores/tezcatlipocaStore'
import type { CameraState, Layer, TimeState, ViewMode } from '@/types'

// ---------------------------------------------------------------------------
// Camera Engine
// ---------------------------------------------------------------------------
class CameraEngine {
  private state: CameraState
  private subscribers: Set<(s: CameraState) => void> = new Set()

  constructor(initial: CameraState) {
    this.state = initial
  }

  getState() { return this.state }

  setPosition(pos: [number, number, number]) {
    this.state.position = pos
    this.notify()
  }

  setTarget(target: [number, number, number]) {
    this.state.target = target
    this.notify()
  }

  setZoom(zoom: number) {
    this.state.zoom = Math.max(0.1, Math.min(100, zoom))
    this.notify()
  }

  flyTo(position: [number, number, number], target: [number, number, number], duration: number = 2000) {
    const start = { ...this.state }
    const startTime = performance.now()

    const animate = (now: number) => {
      const t = Math.min(1, (now - startTime) / duration)
      const ease = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2 // cubic ease

      this.state.position = [
        start.position[0] + (position[0] - start.position[0]) * ease,
        start.position[1] + (position[1] - start.position[1]) * ease,
        start.position[2] + (position[2] - start.position[2]) * ease,
      ]
      this.state.target = [
        start.target[0] + (target[0] - start.target[0]) * ease,
        start.target[1] + (target[1] - start.target[1]) * ease,
        start.target[2] + (target[2] - start.target[2]) * ease,
      ]

      this.notify()

      if (t < 1) requestAnimationFrame(animate)
    }

    requestAnimationFrame(animate)
  }

  subscribe(fn: (s: CameraState) => void) {
    this.subscribers.add(fn)
    return () => this.subscribers.delete(fn)
  }

  private notify() {
    this.subscribers.forEach((fn) => fn(this.state))
  }
}

// ---------------------------------------------------------------------------
// Layer Engine
// ---------------------------------------------------------------------------
class LayerEngine {
  private layers: Layer[] = []
  private subscribers: Set<(l: Layer[]) => void> = new Set()

  addLayer(layer: Layer) {
    this.layers.push(layer)
    this.notify()
  }

  removeLayer(id: string) {
    this.layers = this.layers.filter((l) => l.id !== id)
    this.notify()
  }

  toggleLayer(id: string) {
    this.layers = this.layers.map((l) =>
      l.id === id ? { ...l, visible: !l.visible } : l
    )
    this.notify()
  }

  setOpacity(id: string, opacity: number) {
    this.layers = this.layers.map((l) =>
      l.id === id ? { ...l, opacity: Math.max(0, Math.min(1, opacity)) } : l
    )
    this.notify()
  }

  getLayers() { return this.layers }

  subscribe(fn: (l: Layer[]) => void) {
    this.subscribers.add(fn)
    return () => this.subscribers.delete(fn)
  }

  private notify() {
    this.subscribers.forEach((fn) => fn([...this.layers]))
  }
}

// ---------------------------------------------------------------------------
// Selection Engine
// ---------------------------------------------------------------------------
class SelectionEngine {
  private selected: Set<string> = new Set()
  private hovered: string | null = null
  private subscribers: Set<(s: Set<string>, h: string | null) => void> = new Set()

  select(id: string, multi: boolean = false) {
    if (multi) {
      if (this.selected.has(id)) this.selected.delete(id)
      else this.selected.add(id)
    } else {
      this.selected = new Set([id])
    }
    this.notify()
  }

  clear() {
    this.selected.clear()
    this.notify()
  }

  hover(id: string | null) {
    this.hovered = id
    this.notify()
  }

  getSelected() { return new Set(this.selected) }
  getHovered() { return this.hovered }

  subscribe(fn: (s: Set<string>, h: string | null) => void) {
    this.subscribers.add(fn)
    return () => this.subscribers.delete(fn)
  }

  private notify() {
    this.subscribers.forEach((fn) => fn(new Set(this.selected), this.hovered))
  }
}

// ---------------------------------------------------------------------------
// Time Engine
// ---------------------------------------------------------------------------
class TimeEngine {
  private state: TimeState
  private rafId: number = 0
  private lastFrame: number = 0
  private subscribers: Set<(s: TimeState) => void> = new Set()

  constructor(initial: TimeState) {
    this.state = initial
  }

  getState() { return this.state }

  setTime(t: number) {
    this.state.current = t
    this.notify()
  }

  setRate(rate: number) {
    this.state.rate = rate
    this.notify()
  }

  play() {
    this.state.isPlaying = true
    this.lastFrame = performance.now()
    this.tick()
  }

  pause() {
    this.state.isPlaying = false
    cancelAnimationFrame(this.rafId)
  }

  toggle() {
    this.state.isPlaying ? this.pause() : this.play()
  }

  private tick = () => {
    if (!this.state.isPlaying) return
    const now = performance.now()
    const dt = (now - this.lastFrame) * this.state.rate
    this.state.current += dt
    this.lastFrame = now
    this.notify()
    this.rafId = requestAnimationFrame(this.tick)
  }

  subscribe(fn: (s: TimeState) => void) {
    this.subscribers.add(fn)
    return () => this.subscribers.delete(fn)
  }

  private notify() {
    this.subscribers.forEach((fn) => fn({ ...this.state }))
  }
}

// ---------------------------------------------------------------------------
// Spatial Runtime — Orquestador
// ---------------------------------------------------------------------------
export class SpatialRuntime {
  camera: CameraEngine
  layers: LayerEngine
  selection: SelectionEngine
  time: TimeEngine

  private viewMode: ViewMode = 'earth'
  private quality: string = 'high'

  constructor() {
    const store = useTezcatlipoca.getState()

    this.camera = new CameraEngine(store.camera)
    this.layers = new LayerEngine()
    this.selection = new SelectionEngine()
    this.time = new TimeEngine(store.time)

    // Sync with Zustand store
    this.camera.subscribe((cam) => useTezcatlipoca.getState().setCamera(cam))
    this.layers.subscribe((layers) => {
      // Sync layers to store if needed
    })
    this.selection.subscribe((selected, hovered) => {
      const ids = Array.from(selected)
      useTezcatlipoca.getState().selectEntity(ids.length > 0 ? ids[ids.length - 1] : null)
    })
    this.time.subscribe((time) => useTezcatlipoca.getState().setTime(time.current))
  }

  setViewMode(mode: ViewMode) {
    this.viewMode = mode
    useTezcatlipoca.getState().setViewMode(mode)
  }

  setQuality(q: string) {
    this.quality = q
    useTezcatlipoca.getState().setQuality(q as any)
  }

  flyTo(position: [number, number, number], target: [number, number, number], duration?: number) {
    this.camera.flyTo(position, target, duration)
  }

  destroy() {
    this.time.pause()
  }
}

let runtimeInstance: SpatialRuntime | null = null

export function getSpatialRuntime(): SpatialRuntime {
  if (!runtimeInstance) {
    runtimeInstance = new SpatialRuntime()
  }
  return runtimeInstance
}

export function destroySpatialRuntime() {
  if (runtimeInstance) {
    runtimeInstance.destroy()
    runtimeInstance = null
  }
}
