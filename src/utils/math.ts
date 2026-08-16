export function clamp(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, v))
}

export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * clamp(t, 0, 1)
}

export function smoothstep(edge0: number, edge1: number, x: number): number {
  const t = clamp((x - edge0) / (edge1 - edge0), 0, 1)
  return t * t * (3 - 2 * t)
}

export function hash31(p: number): [number, number, number] {
  let n = Math.sin(p * 127.1 + 311.7) * 43758.5453
  const x = n - Math.floor(n)
  n = Math.sin(p * 269.5 + 183.3) * 43758.5453
  const y = n - Math.floor(n)
  n = Math.sin(p * 419.2 + 57.1) * 43758.5453
  const z = n - Math.floor(n)
  return [x, y, z]
}

export function hash1(p: number): number {
  return Math.sin(p * 127.1 + 311.7) * 43758.5453 - Math.floor(Math.sin(p * 127.1 + 311.7) * 43758.5453)
}

export function getFirstAuthor(authors: string | string[]): string {
  if (typeof authors === 'string') return authors.split(',')[0].trim()
  return authors[0] || 'Unknown'
}

export function debounce<T extends (...args: unknown[]) => void>(fn: T, ms: number): T {
  let timer: ReturnType<typeof setTimeout>
  return ((...args: unknown[]) => {
    clearTimeout(timer)
    timer = setTimeout(() => fn(...args), ms)
  }) as T
}

export function throttle<T extends (...args: unknown[]) => void>(fn: T, ms: number): T {
  let last = 0
  return ((...args: unknown[]) => {
    const now = Date.now()
    if (now - last >= ms) {
      last = now
      fn(...args)
    }
  }) as T
}
