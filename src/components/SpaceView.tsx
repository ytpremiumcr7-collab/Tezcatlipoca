import { useEffect, useRef, useState, useCallback } from 'react'
import * as THREE from 'three'
import { useTezcatlipoca } from '@/stores/tezcatlipocaStore'
import { api } from '@/services/apiClient'
import { useSimClock, formatClockTime, formatClockDate } from '@/hooks/useSimClock'
import { UI_GROUPS, parseTLE, propagateSGP4, type SatInfo } from '@/utils/satellites'

/* ── TYPES ─────────────────────────────────────────────────────────────── */
interface SatelliteData {
  name: string
  noradId: string
  tleLine1: string
  tleLine2: string
  group: string
}

interface SatelliteMesh {
  mesh: THREE.Mesh
  trail: THREE.Line
  data: SatInfo
  groupIndex: number
}

/* ── TLE FETCH ─────────────────────────────────────────────────────────── */
async function fetchTLEs(group: string = 'stations'): Promise<SatelliteData[]> {
  try {
    const backendSats = await api.satellites()
    if (Array.isArray(backendSats) && backendSats.length > 0) {
      return backendSats.map((s: any) => ({
        name: s.name || s.norad_id,
        noradId: s.norad_id || s.noradId,
        tleLine1: s.tle_line1 || s.tleLine1,
        tleLine2: s.tle_line2 || s.tleLine2,
        group: s.group || group,
      }))
    }
  } catch {
    // Fallback a CelesTrak
  }

  try {
    const resp = await fetch(`https://celestrak.org/NORAD/elements/gp.php?GROUP=${group}&FORMAT=TLE`)
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
  } catch {
    return []
  }
}

/* ── COMPONENT ─────────────────────────────────────────────────────────── */
export default function SpaceView() {
  const containerRef = useRef<HTMLDivElement>(null)
  const { quality, telemetry } = useTezcatlipoca()
  const clock = useSimClock()

  const [sats, setSats] = useState<SatInfo[]>([])
  const [loading, setLoading] = useState(true)
  const [activeGroups, setActiveGroups] = useState<Set<number>>(new Set([0, 1, 2, 6, 7]))
  const [selectedSat, setSelectedSat] = useState<SatInfo | null>(null)
  const [showHud, setShowHud] = useState(true)

  const sceneRef = useRef<THREE.Scene | null>(null)
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null)
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null)
  const satMeshesRef = useRef<SatelliteMesh[]>([])
  const earthRef = useRef<THREE.Mesh | null>(null)
  const animRef = useRef<number>(0)
  const trailGeoRef = useRef<THREE.BufferGeometry[]>([])

  /* Load TLEs */
  useEffect(() => {
    let cancelled = false
    Promise.all([
      fetchTLEs('stations'),
      fetchTLEs('gps-ops'),
      fetchTLEs('glonass'),
      fetchTLEs('galileo'),
      fetchTLEs('weather'),
      fetchTLEs('oneweb'),
      fetchTLEs('starlink'),
      fetchTLEs('visual'),
    ]).then(groups => {
      if (cancelled) return
      const all = groups.flatMap(g => parseTLE(g.map(s => `${s.name}\n${s.tleLine1}\n${s.tleLine2}`).join('\n')))
      setSats(all)
      setLoading(false)
    })
    return () => { cancelled = true }
  }, [])

  /* Init Three.js */
  useEffect(() => {
    if (!containerRef.current || sats.length === 0) return

    const container = containerRef.current
    const w = container.clientWidth
    const h = container.clientHeight

    // Scene
    const scene = new THREE.Scene()
    scene.background = new THREE.Color(0x050a14)
    sceneRef.current = scene

    // Camera
    const camera = new THREE.PerspectiveCamera(60, w / h, 0.1, 1e9)
    camera.position.set(15000, 8000, 15000)
    camera.lookAt(0, 0, 0)
    cameraRef.current = camera

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: quality !== 'low', alpha: false })
    renderer.setSize(w, h)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, quality === 'cinematic' ? 2 : 1.5))
    renderer.toneMapping = THREE.ACESFilmicToneMapping
    renderer.toneMappingExposure = 1.2
    container.appendChild(renderer.domElement)
    rendererRef.current = renderer

    // Earth
    const earthGeo = new THREE.SphereGeometry(6371, 64, 64)
    const earthMat = new THREE.MeshPhongMaterial({
      color: 0x1a4d6e,
      emissive: 0x0a1a2e,
      specular: 0x111111,
      shininess: 10,
    })
    const earth = new THREE.Mesh(earthGeo, earthMat)
    scene.add(earth)
    earthRef.current = earth

    // Atmosphere
    const atmosGeo = new THREE.SphereGeometry(6500, 64, 64)
    const atmosMat = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.08,
      side: THREE.BackSide,
    })
    scene.add(new THREE.Mesh(atmosGeo, atmosMat))

    // Atmosphere glow
    const glowGeo = new THREE.SphereGeometry(6600, 32, 32)
    const glowMat = new THREE.ShaderMaterial({
      transparent: true,
      side: THREE.BackSide,
      uniforms: {
        c: { value: 0.6 },
        p: { value: 4.0 },
        glowColor: { value: new THREE.Color(0x38bdf8) },
        viewVector: { value: camera.position },
      },
      vertexShader: `
        uniform vec3 viewVector;
        varying float intensity;
        void main() {
          vec3 vNormal = normalize(normalMatrix * normal);
          vec3 vNormel = normalize(normalMatrix * viewVector);
          intensity = pow(0.6 - dot(vNormal, vNormel), 4.0);
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform vec3 glowColor;
        varying float intensity;
        void main() {
          gl_FragColor = vec4(glowColor, 1.0) * intensity;
        }
      `,
    })
    scene.add(new THREE.Mesh(glowGeo, glowMat))

    // Stars
    const starGeo = new THREE.BufferGeometry()
    const starCount = 5000
    const starPos = new Float32Array(starCount * 3)
    for (let i = 0; i < starCount; i++) {
      const r = 50000 + Math.random() * 50000
      const theta = Math.random() * Math.PI * 2
      const phi = Math.acos(2 * Math.random() - 1)
      starPos[i * 3] = r * Math.sin(phi) * Math.cos(theta)
      starPos[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta)
      starPos[i * 3 + 2] = r * Math.cos(phi)
    }
    starGeo.setAttribute('position', new THREE.BufferAttribute(starPos, 3))
    const starMat = new THREE.PointsMaterial({ color: 0xffffff, size: 80, transparent: true, opacity: 0.8 })
    scene.add(new THREE.Points(starGeo, starMat))

    // Lights
    scene.add(new THREE.AmbientLight(0x404040, 1.5))
    const sunLight = new THREE.DirectionalLight(0xffffff, 2)
    sunLight.position.set(1e5, 0.5e5, 0.3e5)
    scene.add(sunLight)
    const fillLight = new THREE.DirectionalLight(0x4466aa, 0.3)
    fillLight.position.set(-1e5, -0.5e5, -0.3e5)
    scene.add(fillLight)

    // Satellites
    const satMeshes: SatelliteMesh[] = []
    const groupCounts = new Array(UI_GROUPS.length).fill(0)

    sats.forEach((sat) => {
      const groupDef = UI_GROUPS[sat.group] || UI_GROUPS[UI_GROUPS.length - 1]
      const size = groupDef.size * 15
      const color = new THREE.Color(groupDef.color)

      // Mesh
      const geo = new THREE.SphereGeometry(size, 8, 8)
      const mat = new THREE.MeshBasicMaterial({ color })
      const mesh = new THREE.Mesh(geo, mat)
      scene.add(mesh)

      // Trail
      const trailPoints: THREE.Vector3[] = []
      for (let i = 0; i < 60; i++) {
        const t = new Date(clock.getTime() - i * 60000)
        const pos = propagateSGP4(sat.l1, sat.l2, t)
        trailPoints.push(new THREE.Vector3(pos.x, pos.y, pos.z))
      }
      const trailGeo = new THREE.BufferGeometry().setFromPoints(trailPoints)
      const trailMat = new THREE.LineBasicMaterial({ color, transparent: true, opacity: 0.3 })
      const trail = new THREE.Line(trailGeo, trailMat)
      scene.add(trail)
      trailGeoRef.current.push(trailGeo)

      satMeshes.push({ mesh, trail, data: sat, groupIndex: sat.group })
      groupCounts[sat.group]++
    })

    satMeshesRef.current = satMeshes

    // Animation loop
    let lastTime = performance.now()
    const animate = () => {
      animRef.current = requestAnimationFrame(animate)
      const now = performance.now()
      const dt = (now - lastTime) / 1000
      lastTime = now

      const simTime = new Date(clock.getTime())

      // Update satellites
      satMeshes.forEach((sat) => {
        if (!activeGroups.has(sat.groupIndex)) {
          sat.mesh.visible = false
          sat.trail.visible = false
          return
        }
        sat.mesh.visible = true
        sat.trail.visible = true

        const pos = propagateSGP4(sat.data.l1, sat.data.l2, simTime)
        sat.mesh.position.set(pos.x, pos.y, pos.z)

        // Update trail
        const positions = sat.trail.geometry.attributes.position.array as Float32Array
        for (let i = 59; i > 0; i--) {
          positions[i * 3] = positions[(i - 1) * 3]
          positions[i * 3 + 1] = positions[(i - 1) * 3 + 1]
          positions[i * 3 + 2] = positions[(i - 1) * 3 + 2]
        }
        positions[0] = pos.x
        positions[1] = pos.y
        positions[2] = pos.z
        sat.trail.geometry.attributes.position.needsUpdate = true
      })

      // Rotate earth
      if (earthRef.current) {
        earthRef.current.rotation.y += 0.0002 * dt * 60
      }

      // Update atmosphere glow
      glowMat.uniforms.viewVector.value = camera.position

      renderer.render(scene, camera)
    }
    animate()

    // Resize
    const onResize = () => {
      const cw = container.clientWidth
      const ch = container.clientHeight
      camera.aspect = cw / ch
      camera.updateProjectionMatrix()
      renderer.setSize(cw, ch)
    }
    window.addEventListener('resize', onResize)

    // Click handler
    const raycaster = new THREE.Raycaster()
    const mouse = new THREE.Vector2()
    const onClick = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect()
      mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1
      mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1
      raycaster.setFromCamera(mouse, camera)
      const intersects = raycaster.intersectObjects(satMeshes.map(s => s.mesh))
      if (intersects.length > 0) {
        const sat = satMeshes.find(s => s.mesh === intersects[0].object)
        if (sat) setSelectedSat(sat.data)
      } else {
        setSelectedSat(null)
      }
    }
    container.addEventListener('click', onClick)

    return () => {
      cancelAnimationFrame(animRef.current)
      window.removeEventListener('resize', onResize)
      container.removeEventListener('click', onClick)
      renderer.dispose()
      container.removeChild(renderer.domElement)
    }
  }, [sats, quality, activeGroups, clock])

  /* Toggle group */
  const toggleGroup = useCallback((idx: number) => {
    setActiveGroups(prev => {
      const next = new Set(prev)
      if (next.has(idx)) next.delete(idx)
      else next.add(idx)
      return next
    })
  }, [])

  /* Fly to satellite */
  const flyToSat = useCallback((sat: SatInfo) => {
    if (!cameraRef.current) return
    const pos = propagateSGP4(sat.l1, sat.l2, new Date(clock.getTime()))
    const target = new THREE.Vector3(pos.x, pos.y, pos.z)
    const offset = target.clone().normalize().multiplyScalar(2000)
    const endPos = target.clone().add(offset)

    const startPos = cameraRef.current.position.clone()
    const startTarget = new THREE.Vector3(0, 0, 0)
    let t = 0
    const duration = 1.5

    const animateFly = () => {
      t += 0.016 / duration
      if (t >= 1) {
        cameraRef.current!.position.copy(endPos)
        cameraRef.current!.lookAt(target)
        return
      }
      const ease = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2
      cameraRef.current!.position.lerpVectors(startPos, endPos, ease)
      const currentTarget = new THREE.Vector3().lerpVectors(startTarget, target, ease)
      cameraRef.current!.lookAt(currentTarget)
      requestAnimationFrame(animateFly)
    }
    animateFly()
  }, [clock])

  return (
    <div ref={containerRef} style={{ width: '100%', height: '100%', position: 'relative', overflow: 'hidden' }}>
      {loading && (
        <div style={{
          position: 'absolute', inset: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexDirection: 'column', gap: 12, background: 'var(--bg-primary)',
        }}>
          <div className="loading-spinner" style={{ width: 40, height: 40, borderWidth: 3 }} />
          <span style={{ color: 'var(--text-secondary)', fontSize: 12 }}>
            Cargando satélites...
          </span>
        </div>
      )}

      {/* HUD Overlay */}
      {showHud && !loading && (
        <>
          {/* Clock */}
          <div style={{
            position: 'absolute', top: 12, left: '50%', transform: 'translateX(-50%)',
            background: 'var(--hud-bg)', border: '1px solid var(--hud-border)',
            borderRadius: 10, padding: '8px 16px', backdropFilter: 'blur(12px)',
            display: 'flex', alignItems: 'center', gap: 12, zIndex: 10,
          }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 18, fontWeight: 700, fontFamily: 'var(--font-mono)', color: 'var(--text-accent)' }}>
                {formatClockTime(clock.getTime())}
              </div>
              <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>
                {formatClockDate(clock.getTime())}
              </div>
            </div>
            <div style={{ width: 1, height: 24, background: 'var(--border-color)' }} />
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <button
                onClick={() => clock.playing ? clock.pause() : clock.resume()}
                className="btn btn-xs"
                style={{ minWidth: 28 }}
              >
                {clock.playing ? '⏸' : '▶'}
              </button>
              <button onClick={() => clock.goNow()} className="btn btn-xs">NOW</button>
              <select
                value={clock.speed}
                onChange={(e) => clock.setSpeed(Number(e.target.value))}
                style={{ width: 80, fontSize: 11 }}
              >
                <option value={1}>1×</option>
                <option value={10}>10×</option>
                <option value={60}>1m/s</option>
                <option value={3600}>1h/s</option>
                <option value={86400}>1d/s</option>
              </select>
            </div>
          </div>

          {/* Layer Panel */}
          <div style={{
            position: 'absolute', top: 70, left: 12,
            background: 'var(--hud-bg)', border: '1px solid var(--hud-border)',
            borderRadius: 10, padding: 10, backdropFilter: 'blur(12px)',
            display: 'flex', flexDirection: 'column', gap: 6, zIndex: 10,
            maxHeight: 'calc(100% - 100px)', overflow: 'auto',
          }}>
            <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: 0.5 }}>
              Capas
            </div>
            {UI_GROUPS.map((g, i) => (
              <button
                key={g.key}
                onClick={() => toggleGroup(i)}
                className={`btn btn-xs ${activeGroups.has(i) ? '' : 'btn-ghost'}`}
                style={{
                  justifyContent: 'flex-start',
                  borderColor: activeGroups.has(i) ? g.color : undefined,
                  color: activeGroups.has(i) ? g.color : undefined,
                }}
              >
                <span style={{
                  width: 8, height: 8, borderRadius: '50%',
                  background: g.color, display: 'inline-block', marginRight: 6,
                }} />
                {g.label}
              </button>
            ))}
          </div>

          {/* Selected Satellite Detail */}
          {selectedSat && (
            <div style={{
              position: 'absolute', top: 70, right: 12,
              background: 'var(--hud-bg)', border: '1px solid var(--hud-border)',
              borderRadius: 10, padding: 14, backdropFilter: 'blur(12px)',
              width: 220, zIndex: 10,
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <span style={{ fontWeight: 600, fontSize: 13 }}>{selectedSat.name}</span>
                <button onClick={() => setSelectedSat(null)} className="btn btn-xs btn-ghost">×</button>
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginBottom: 8 }}>
                NORAD: {selectedSat.norad}<br />
                Grupo: {UI_GROUPS[selectedSat.group]?.label || 'Other'}
              </div>
              <button onClick={() => flyToSat(selectedSat)} className="btn btn-sm btn-primary" style={{ width: '100%' }}>
                🎯 Fly To
              </button>
            </div>
          )}

          {/* Telemetry */}
          <div style={{
            position: 'absolute', bottom: 12, left: 12,
            background: 'var(--hud-bg)', border: '1px solid var(--hud-border)',
            borderRadius: 10, padding: '8px 12px', backdropFilter: 'blur(12px)',
            fontSize: 10, fontFamily: 'var(--font-mono)', color: 'var(--text-accent)',
            zIndex: 10,
          }}>
            <div>FPS: {telemetry.fps.toFixed(1)}</div>
            <div>SAT: {sats.length}</div>
            <div>ACT: {satMeshesRef.current.filter(s => activeGroups.has(s.groupIndex)).length}</div>
          </div>
        </>
      )}

      {/* Toggle HUD */}
      <button
        onClick={() => setShowHud(!showHud)}
        style={{
          position: 'absolute', bottom: 12, right: 12, zIndex: 10,
          width: 32, height: 32, borderRadius: '50%',
          background: 'var(--hud-bg)', border: '1px solid var(--hud-border)',
          color: 'var(--text-secondary)', cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}
      >
        {showHud ? '👁' : '👁‍🗨'}
      </button>
    </div>
  )
}
