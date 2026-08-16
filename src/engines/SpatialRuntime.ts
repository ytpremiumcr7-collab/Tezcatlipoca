import type { CameraState, Layer, GeoEntity } from './types.ts'

export class CameraEngine {
  state: CameraState = {
    position: [0, 0, 1000],
    target: [0, 0, 0],
    up: [0, 1, 0],
    fov: 60,
    near: 0.1,
    far: 100000,
  }

  listeners = new Set<(s: CameraState) => void>()

  setPosition(p: [number, number, number]) {
    this.state.position = p
    this.notify()
  }

  setTarget(t: [number, number, number]) {
    this.state.target = t
    this.notify()
  }

  zoom(factor: number) {
    const dx = this.state.position[0] - this.state.target[0]
    const dy = this.state.position[1] - this.state.target[1]
    const dz = this.state.position[2] - this.state.target[2]
    this.state.position = [
      this.state.target[0] + dx * factor,
      this.state.target[1] + dy * factor,
      this.state.target[2] + dz * factor,
    ]
    this.notify()
  }

  orbit(deltaAzimuth: number, deltaPolar: number) {
    const dx = this.state.position[0] - this.state.target[0]
    const dy = this.state.position[1] - this.state.target[1]
    const dz = this.state.position[2] - this.state.target[2]
    const r = Math.sqrt(dx * dx + dy * dy + dz * dz)
    let azimuth = Math.atan2(dz, dx)
    let polar = Math.acos(dy / r)
    azimuth += deltaAzimuth
    polar = Math.max(0.01, Math.min(Math.PI - 0.01, polar + deltaPolar))
    this.state.position = [
      this.state.target[0] + r * Math.sin(polar) * Math.cos(azimuth),
      this.state.target[1] + r * Math.cos(polar),
      this.state.target[2] + r * Math.sin(polar) * Math.sin(azimuth),
    ]
    this.notify()
  }

  subscribe(fn: (s: CameraState) => void) {
    this.listeners.add(fn)
    return () => this.listeners.delete(fn)
  }

  private notify() {
    this.listeners.forEach(fn => fn(this.state))
  }
}

export class LayerEngine {
  layers: Layer[] = []
  listeners = new Set<(l: Layer[]) => void>()

  addLayer(layer: Layer) {
    this.layers.push(layer)
    this.notify()
  }

  removeLayer(id: string) {
    this.layers = this.layers.filter(l => l.id !== id)
    this.notify()
  }

  toggleVisibility(id: string) {
    const layer = this.layers.find(l => l.id === id)
    if (layer) {
      layer.visible = !layer.visible
      this.notify()
    }
  }

  setOpacity(id: string, opacity: number) {
    const layer = this.layers.find(l => l.id === id)
    if (layer) {
      layer.opacity = opacity
      this.notify()
    }
  }

  getVisible(): Layer[] {
    return this.layers.filter(l => l.visible)
  }

  subscribe(fn: (l: Layer[]) => void) {
    this.listeners.add(fn)
    return () => this.listeners.delete(fn)
  }

  private notify() {
    this.listeners.forEach(fn => fn([...this.layers]))
  }
}

export class SelectionEngine {
  selected: Set<string> = new Set()
  listeners = new Set<(ids: Set<string>) => void>()

  select(id: string, multi = false) {
    if (!multi) this.selected.clear()
    this.selected.add(id)
    this.notify()
  }

  deselect(id: string) {
    this.selected.delete(id)
    this.notify()
  }

  clear() {
    this.selected.clear()
    this.notify()
  }

  isSelected(id: string): boolean {
    return this.selected.has(id)
  }

  subscribe(fn: (ids: Set<string>) => void) {
    this.listeners.add(fn)
    return () => this.listeners.delete(fn)
  }

  private notify() {
    this.listeners.forEach(fn => new Set(this.selected))
  }
}

export class TimeEngine {
  time = 0
  speed = 1
  playing = false
  listeners = new Set<(t: number) => void>()
  raf = 0
  last = 0

  play() {
    if (this.playing) return
    this.playing = true
    this.last = performance.now()
    this.tick()
  }

  pause() {
    this.playing = false
    cancelAnimationFrame(this.raf)
  }

  setTime(t: number) {
    this.time = t
    this.notify()
  }

  setSpeed(s: number) {
    this.speed = s
  }

  private tick = () => {
    if (!this.playing) return
    const now = performance.now()
    const dt = (now - this.last) / 1000
    this.last = now
    this.time += dt * this.speed
    this.notify()
    this.raf = requestAnimationFrame(this.tick)
  }

  subscribe(fn: (t: number) => void) {
    this.listeners.add(fn)
    return () => this.listeners.delete(fn)
  }

  private notify() {
    this.listeners.forEach(fn => fn(this.time))
  }

  destroy() {
    this.pause()
    this.listeners.clear()
  }
}

export class SpatialRuntime {
  camera = new CameraEngine()
  layers = new LayerEngine()
  selection = new SelectionEngine()
  time = new TimeEngine()

  destroy() {
    this.time.destroy()
  }
}
