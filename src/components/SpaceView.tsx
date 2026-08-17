import { useEffect, useRef, useState, useCallback } from 'react'
import * as THREE from 'three'
import { useTezcatlipoca } from '@/stores/tezcatlipocaStore'

// =============================================================================
// SPACEVIEW — Visualización orbital con satélites LEO en tiempo real
// Mentalidad DevOps: cleanup exhaustivo, RAF controlado, error boundaries
// =============================================================================

interface SatelliteData {
  name: string
  noradId: string
  tleLine1: string
  tleLine2: string
  group: string
}

interface SatPosition {
  x: number
  y: number
  z: number
  lat: number
  lon: number
  alt: number
  velocity: number
}

// ── Constants ───────────────────────────────────────────────────────────────
const EARTH_RADIUS_KM = 6371
const SAT_LIMIT = 20
const STAR_COUNT = 3000
const ORBIT_SEGMENTS = 128

// ── TLE Fetch ───────────────────────────────────────────────────────────────
async function fetchTLEs(group: string = 'stations'): Promise<SatelliteData[]> {
  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 15000)
    const resp = await fetch(
      `https://celestrak.org/NORAD/elements/gp.php?GROUP=${group}&FORMAT=TLE`,
      { signal: controller.signal }
    )
    clearTimeout(timeoutId)
    if (!resp.ok) throw new Error(`HTTP ${resp.status}`)
    const text = await resp.text()
    const lines = text.trim().split('\n')
    const sats: SatelliteData[] = []
    for (let i = 0; i < lines.length; i += 3) {
      if (i + 2 < lines.length) {
        sats.push({
          name: lines[i].trim(),
          noradId: lines[i + 1].substring(2, 7).trim(),
          tleLine1: lines[i + 1].trim(),
          tleLine2: lines[i + 2].trim(),
          group,
        })
      }
    }
    return sats
  } catch (e) {
    console.warn('[SpaceView] TLE fetch failed:', e)
    return []
  }
}

// ── SGP4 Approximation ──────────────────────────────────────────────────────
function propagateSGP4(tle1: string, tle2: string, date: Date): SatPosition {
  const epochYear = 2000 + parseInt(tle1.substring(18, 20))
  const epochDay = parseFloat(tle1.substring(20, 32))
  const epoch = new Date(epochYear, 0, 1)
  epoch.setDate(epoch.getDate() + Math.floor(epochDay) - 1)
  epoch.setHours(0, (epochDay % 1) * 1440, 0, 0)

  const meanMotion = parseFloat(tle2.substring(52, 63))
  const inclination = parseFloat(tle2.substring(8, 16)) * (Math.PI / 180)
  const raan = parseFloat(tle2.substring(17, 25)) * (Math.PI / 180)
  const eccentricity = parseFloat('0.' + tle2.substring(26, 33))
  const argPerigee = parseFloat(tle2.substring(34, 42)) * (Math.PI / 180)
  const meanAnomaly = parseFloat(tle2.substring(43, 51)) * (Math.PI / 180)

  const minutesSinceEpoch = (date.getTime() - epoch.getTime()) / 60000
  const period = 1440 / meanMotion
  const fraction = (minutesSinceEpoch % period) / period
  const trueAnomaly = fraction * 2 * Math.PI + meanAnomaly

  const a = EARTH_RADIUS_KM + 400
  const r = a * (1 - eccentricity * eccentricity) / (1 + eccentricity * Math.cos(trueAnomaly))

  const xOrb = r * Math.cos(trueAnomaly)
  const yOrb = r * Math.sin(trueAnomaly)

  const xArg = xOrb * Math.cos(argPerigee) - yOrb * Math.sin(argPerigee)
  const yArg = xOrb * Math.sin(argPerigee) + yOrb * Math.cos(argPerigee)

  const xInc = xArg
  const yInc = yArg * Math.cos(inclination)
  const zInc = yArg * Math.sin(inclination)

  const gmst = (minutesSinceEpoch * 2 * Math.PI) / 1436.07
  const x = xInc * Math.cos(raan + gmst) - yInc * Math.sin(raan + gmst)
  const y = xInc * Math.sin(raan + gmst) + yInc * Math.cos(raan + gmst)
  const z = zInc

  const lat = Math.asin(z / Math.sqrt(x * x + y * y + z * z)) * (180 / Math.PI)
  const lon = Math.atan2(y, x) * (180 / Math.PI)
  const alt = Math.sqrt(x * x + y * y + z * z) - EARTH_RADIUS_KM

  return { x, y, z, lat, lon, alt, velocity: Math.sqrt(398600.4418 / r) }
}

// ── Atmosphere Shader ───────────────────────────────────────────────────────
const ATMOSPHERE_VERT = `
  varying vec3 vNormal;
  void main() {
    vNormal = normalize(normalMatrix * normal);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`

const ATMOSPHERE_FRAG = `
  varying vec3 vNormal;
  void main() {
    float intensity = pow(0.6 - dot(vNormal, vec3(0.0, 0.0, 1.0)), 2.0);
    gl_FragColor = vec4(0.3, 0.6, 1.0, 1.0) * intensity;
  }
`

// ── Main Component ──────────────────────────────────────────────────────────
export default function SpaceView() {
  const containerRef = useRef<HTMLDivElement>(null)
  const { updateTelemetry, time } = useTezcatlipoca()
  const [satellites, setSatellites] = useState<SatelliteData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Refs for Three.js objects (never trigger re-renders)
  const sceneRef = useRef<THREE.Scene | null>(null)
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null)
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null)
  const earthGroupRef = useRef<THREE.Group | null>(null)
  const satMeshesRef = useRef<Map<string, THREE.Mesh>>(new Map())
  const orbitLinesRef = useRef<Map<string, THREE.Line>>(new Map())
  const rafRef = useRef<number>(0)
  const disposedRef = useRef(false)
  const lastTimeRef = useRef(0)
  const frameCountRef = useRef(0)
  const fpsTimeRef = useRef(performance.now())

  // Fetch TLEs on mount
  useEffect(() => {
    let cancelled = false
    fetchTLEs('stations').then((sats) => {
      if (cancelled) return
      if (sats.length === 0) {
        setError('No se pudieron cargar los datos TLE. Verifica tu conexión.')
        setLoading(false)
        return
      }
      setSatellites(sats.slice(0, SAT_LIMIT))
      setLoading(false)
    }).catch((e) => {
      if (cancelled) return
      setError(`Error: ${e.message}`)
      setLoading(false)
    })
    return () => { cancelled = true }
  }, [])

  // Initialize Three.js scene
  const initScene = useCallback(() => {
    if (!containerRef.current || disposedRef.current) return
    const container = containerRef.current

    // Scene
    const scene = new THREE.Scene()
    sceneRef.current = scene

    // Camera
    const camera = new THREE.PerspectiveCamera(
      45,
      container.clientWidth / container.clientHeight,
      1,
      1e9
    )
    camera.position.set(20000, 15000, 20000)
    camera.lookAt(0, 0, 0)
    cameraRef.current = camera

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
    renderer.setSize(container.clientWidth, container.clientHeight)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.toneMapping = THREE.ACESFilmicToneMapping
    renderer.toneMappingExposure = 0.8
    rendererRef.current = renderer
    container.appendChild(renderer.domElement)

    // Earth Group
    const earthGroup = new THREE.Group()
    earthGroupRef.current = earthGroup

    // Earth geometry (reused)
    const earthGeo = new THREE.SphereGeometry(EARTH_RADIUS_KM, 128, 128)
    const textureLoader = new THREE.TextureLoader()

    // Earth material with error handling
    const earthMat = new THREE.MeshPhongMaterial({
      color: 0x1a4d6e,
      specular: new THREE.Color(0x333333),
      shininess: 5,
    })

    // Try to load textures, fallback to color
    textureLoader.load(
      'https://unpkg.com/three-globe/example/img/earth-blue-marble.jpg',
      (tex) => { if (!disposedRef.current) earthMat.map = tex; earthMat.needsUpdate = true },
      undefined,
      () => { /* fallback to color */ }
    )
    textureLoader.load(
      'https://unpkg.com/three-globe/example/img/earth-topology.png',
      (tex) => { if (!disposedRef.current) earthMat.bumpMap = tex; earthMat.bumpScale = 0.05; earthMat.needsUpdate = true },
      undefined,
      () => { /* fallback */ }
    )

    const earth = new THREE.Mesh(earthGeo, earthMat)
    earthGroup.add(earth)

    // Atmosphere glow
    const atmosGeo = new THREE.SphereGeometry(EARTH_RADIUS_KM + 129, 64, 64)
    const atmosMat = new THREE.ShaderMaterial({
      vertexShader: ATMOSPHERE_VERT,
      fragmentShader: ATMOSPHERE_FRAG,
      blending: THREE.AdditiveBlending,
      side: THREE.BackSide,
      transparent: true,
    })
    const atmosphere = new THREE.Mesh(atmosGeo, atmosMat)
    earthGroup.add(atmosphere)

    // Night lights
    const lightsGeo = new THREE.SphereGeometry(EARTH_RADIUS_KM + 1, 64, 64)
    const lightsMat = new THREE.MeshBasicMaterial({
      color: 0xffaa44,
      blending: THREE.AdditiveBlending,
      transparent: true,
      opacity: 0.15,
    })
    textureLoader.load(
      'https://unpkg.com/three-globe/example/img/earth-night.jpg',
      (tex) => { if (!disposedRef.current) lightsMat.map = tex; lightsMat.needsUpdate = true },
      undefined,
      () => { /* fallback */ }
    )
    earthGroup.add(new THREE.Mesh(lightsGeo, lightsMat))

    scene.add(earthGroup)

    // Stars
    const starsGeo = new THREE.BufferGeometry()
    const posArray = new Float32Array(STAR_COUNT * 3)
    for (let i = 0; i < STAR_COUNT * 3; i++) {
      posArray[i] = (Math.random() - 0.5) * 500000
    }
    starsGeo.setAttribute('position', new THREE.BufferAttribute(posArray, 3))
    const starsMat = new THREE.PointsMaterial({
      size: 200,
      color: 0xffffff,
      transparent: true,
      opacity: 0.8,
      sizeAttenuation: true,
    })
    scene.add(new THREE.Points(starsGeo, starsMat))

    // Lighting
    const ambientLight = new THREE.AmbientLight(0x404040, 0.5)
    scene.add(ambientLight)
    const sunLight = new THREE.DirectionalLight(0xffffff, 1.5)
    sunLight.position.set(1e5, 0, 0)
    scene.add(sunLight)

    // Create satellite meshes
    const satGeometry = new THREE.SphereGeometry(80, 16, 16)
    const orbitMaterial = new THREE.LineBasicMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.2,
    })

    satellites.forEach((sat) => {
      const satMat = new THREE.MeshBasicMaterial({ color: 0x22d3ee })
      const mesh = new THREE.Mesh(satGeometry, satMat)
      scene.add(mesh)
      satMeshesRef.current.set(sat.noradId, mesh)

      // Orbit trail
      const orbitPoints: THREE.Vector3[] = []
      for (let i = 0; i <= ORBIT_SEGMENTS; i++) {
        const angle = (i / ORBIT_SEGMENTS) * Math.PI * 2
        const r = EARTH_RADIUS_KM + 400
        orbitPoints.push(new THREE.Vector3(
          r * Math.cos(angle),
          r * Math.sin(angle) * 0.3,
          r * Math.sin(angle)
        ))
      }
      const orbitGeo = new THREE.BufferGeometry().setFromPoints(orbitPoints)
      const orbitLine = new THREE.Line(orbitGeo, orbitMaterial)
      scene.add(orbitLine)
      orbitLinesRef.current.set(sat.noradId, orbitLine)
    })

    // Animation loop
    lastTimeRef.current = performance.now()
    frameCountRef.current = 0
    fpsTimeRef.current = performance.now()

    const animate = () => {
      if (disposedRef.current) return
      rafRef.current = requestAnimationFrame(animate)

      const now = performance.now()
      const dt = (now - lastTimeRef.current) / 1000
      lastTimeRef.current = now
      frameCountRef.current++

      // FPS calculation every second
      if (now - fpsTimeRef.current >= 1000) {
        const fps = Math.round((frameCountRef.current * 1000) / (now - fpsTimeRef.current))
        updateTelemetry({
          entitiesRendered: satellites.length,
          entitiesTotal: satellites.length,
          fps,
          frameTime: Math.round(dt * 1000),
        })
        frameCountRef.current = 0
        fpsTimeRef.current = now
      }

      // Update satellite positions
      const currentTime = new Date(time.current)
      satellites.forEach((sat) => {
        try {
          const pos = propagateSGP4(sat.tleLine1, sat.tleLine2, currentTime)
          const mesh = satMeshesRef.current.get(sat.noradId)
          if (mesh) {
            mesh.position.set(pos.x * 1000, pos.y * 1000, pos.z * 1000)
          }
        } catch {
          // Skip invalid propagation
        }
      })

      // Cinematic camera drift
      const time_s = now / 1000
      camera.position.x = 20000 + Math.sin(time_s * 0.05) * 5000
      camera.position.z = 20000 + Math.cos(time_s * 0.05) * 5000
      camera.lookAt(0, 0, 0)

      // Earth rotation
      if (earthGroup) {
        earthGroup.rotation.y += 0.0001 * (time.rate || 1)
      }

      renderer.render(scene, camera)
    }

    animate()

    // Resize handler
    const handleResize = () => {
      if (!container || disposedRef.current) return
      const w = container.clientWidth
      const h = container.clientHeight
      camera.aspect = w / h
      camera.updateProjectionMatrix()
      renderer.setSize(w, h)
    }

    const resizeObserver = new ResizeObserver(handleResize)
    resizeObserver.observe(container)

    return () => {
      resizeObserver.disconnect()
    }
  }, [satellites, time.current, time.rate, updateTelemetry])

  // Mount / unmount lifecycle
  useEffect(() => {
    if (satellites.length === 0 || !containerRef.current) return

    disposedRef.current = false
    const cleanup = initScene()

    return () => {
      disposedRef.current = true
      cancelAnimationFrame(rafRef.current)

      // Dispose all Three.js resources
      satMeshesRef.current.forEach((mesh) => {
        mesh.geometry.dispose()
        if (mesh.material instanceof THREE.Material) mesh.material.dispose()
      })
      satMeshesRef.current.clear()

      orbitLinesRef.current.forEach((line) => {
        line.geometry.dispose()
        if (line.material instanceof THREE.Material) line.material.dispose()
      })
      orbitLinesRef.current.clear()

      if (earthGroupRef.current) {
        earthGroupRef.current.traverse((child) => {
          if (child instanceof THREE.Mesh) {
            child.geometry.dispose()
            if (Array.isArray(child.material)) {
              child.material.forEach((m) => m.dispose())
            } else {
              child.material.dispose()
            }
          }
        })
      }

      if (rendererRef.current) {
        rendererRef.current.dispose()
        if (containerRef.current?.contains(rendererRef.current.domElement)) {
          containerRef.current.removeChild(rendererRef.current.domElement)
        }
      }

      sceneRef.current = null
      rendererRef.current = null
      cameraRef.current = null
      earthGroupRef.current = null

      if (cleanup) cleanup()
    }
  }, [initScene, satellites.length])

  if (loading) {
    return (
      <div style={loadingStyle}>
        <div style={spinnerStyle} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        <span style={{ color: 'var(--text-secondary)', fontSize: 12 }}>
          Cargando TLEs desde CelesTrak...
        </span>
      </div>
    )
  }

  if (error) {
    return (
      <div style={loadingStyle}>
        <div style={{ fontSize: 32, marginBottom: 8 }}>⚠️</div>
        <span style={{ color: 'var(--text-warning)', fontSize: 13, textAlign: 'center', maxWidth: 300 }}>
          {error}
        </span>
        <button
          onClick={() => { setError(null); setLoading(true); fetchTLEs('stations').then(s => { setSatellites(s.slice(0, SAT_LIMIT)); setLoading(false) }) }}
          style={{
            marginTop: 12,
            padding: '6px 16px',
            borderRadius: 6,
            border: '1px solid var(--border-color)',
            background: 'var(--bg-secondary)',
            color: 'var(--text-primary)',
            cursor: 'pointer',
            fontSize: 12,
          }}
        >
          Reintentar
        </button>
      </div>
    )
  }

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative' }}>
      <div ref={containerRef} style={{ width: '100%', height: '100%' }} />

      {/* Satellite list overlay */}
      <div style={overlayStyle}>
        <div style={{ fontSize: 11, fontWeight: 600, marginBottom: 8, color: 'var(--text-accent)' }}>
          Satélites ({satellites.length})
        </div>
        <div style={{ maxHeight: 200, overflow: 'auto' }}>
          {satellites.map((sat) => (
            <div key={sat.noradId} style={satRowStyle}>
              <span style={{ color: 'var(--text-primary)', fontSize: 10, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {sat.name}
              </span>
              <span style={{ color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)', fontSize: 10 }}>
                {sat.noradId}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Scale indicator */}
      <div style={scaleStyle}>
        <div style={{ fontSize: 9, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 1 }}>
          Escala Orbital
        </div>
        <div style={{ fontSize: 11, color: 'var(--text-accent)', fontFamily: 'var(--font-mono)' }}>
          {EARTH_RADIUS_KM.toLocaleString()} km radio terrestre
        </div>
      </div>
    </div>
  )
}

// ── Styles ──────────────────────────────────────────────────────────────────
const loadingStyle: React.CSSProperties = {
  width: '100%',
  height: '100%',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  flexDirection: 'column',
  gap: 16,
}

const spinnerStyle: React.CSSProperties = {
  width: 48,
  height: 48,
  borderRadius: '50%',
  border: '3px solid var(--border-color)',
  borderTopColor: 'var(--accent-blue)',
  animation: 'spin 1s linear infinite',
}

const overlayStyle: React.CSSProperties = {
  position: 'absolute',
  top: 12,
  left: 12,
  background: 'var(--hud-bg)',
  border: '1px solid var(--hud-border)',
  borderRadius: 8,
  padding: 12,
  maxHeight: '40%',
  overflow: 'hidden',
  backdropFilter: 'blur(8px)',
  minWidth: 200,
  zIndex: 10,
}

const satRowStyle: React.CSSProperties = {
  fontSize: 10,
  padding: '3px 0',
  borderBottom: '1px solid var(--border-color)',
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  gap: 8,
}

const scaleStyle: React.CSSProperties = {
  position: 'absolute',
  bottom: 12,
  left: 12,
  background: 'var(--hud-bg)',
  border: '1px solid var(--hud-border)',
  borderRadius: 8,
  padding: '8px 12px',
  backdropFilter: 'blur(8px)',
  zIndex: 10,
}
