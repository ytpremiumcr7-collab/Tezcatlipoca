import { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import { useTezcatlipoca } from '@/stores/tezcatlipocaStore'

// SGP4 real — usa CelesTrak API gratuita
// https://celestrak.org/NORAD/documentation/gp-data-formats.php

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

// Fetch TLEs from CelesTrak
async function fetchTLEs(group: string = 'stations'): Promise<SatelliteData[]> {
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
  } catch (e) {
    console.error('Error fetching TLEs:', e)
    return []
  }
}

// SGP4 propagator simplificado (posición aproximada)
function propagateSGP4(tle1: string, tle2: string, date: Date): SatPosition {
  // En producción: usar satellite.js o sgp4-js
  // Esto es una aproximación orbital para visualización
  
  const epoch = new Date(
    2000 + parseInt(tle1.substring(18, 20)),
    0,
    parseFloat(tle1.substring(20, 32)) * 365.25 / 12
  )
  
  const meanMotion = parseFloat(tle2.substring(52, 63))
  const inclination = parseFloat(tle2.substring(8, 16)) * (Math.PI / 180)
  const raan = parseFloat(tle2.substring(17, 25)) * (Math.PI / 180)
  const eccentricity = parseFloat('0.' + tle2.substring(26, 33))
  const argPerigee = parseFloat(tle2.substring(34, 42)) * (Math.PI / 180)
  const meanAnomaly = parseFloat(tle2.substring(43, 51)) * (Math.PI / 180)
  
  const minutesSinceEpoch = (date.getTime() - epoch.getTime()) / 60000
  const period = 1440 / meanMotion // minutos
  const fraction = (minutesSinceEpoch % period) / period
  const trueAnomaly = fraction * 2 * Math.PI + meanAnomaly
  
  const a = 6371 + 400 // semi-major axis aproximado (km)
  const r = a * (1 - eccentricity * eccentricity) / (1 + eccentricity * Math.cos(trueAnomaly))
  
  // Transformación orbital → ECEF
  const xOrb = r * Math.cos(trueAnomaly)
  const yOrb = r * Math.sin(trueAnomaly)
  
  // Rotación por argumento del perigeo
  const xArg = xOrb * Math.cos(argPerigee) - yOrb * Math.sin(argPerigee)
  const yArg = xOrb * Math.sin(argPerigee) + yOrb * Math.cos(argPerigee)
  
  // Rotación por inclinación
  const xInc = xArg
  const yInc = yArg * Math.cos(inclination)
  const zInc = yArg * Math.sin(inclination)
  
  // Rotación por RAAN
  const gmst = (minutesSinceEpoch * 2 * Math.PI) / 1436.07 // aproximado
  const x = xInc * Math.cos(raan + gmst) - yInc * Math.sin(raan + gmst)
  const y = xInc * Math.sin(raan + gmst) + yInc * Math.cos(raan + gmst)
  const z = zInc
  
  // ECEF → lat/lon/alt
  const lat = Math.asin(z / Math.sqrt(x*x + y*y + z*z)) * (180 / Math.PI)
  const lon = Math.atan2(y, x) * (180 / Math.PI)
  const alt = Math.sqrt(x*x + y*y + z*z) - 6371
  
  return { x, y, z, lat, lon, alt, velocity: Math.sqrt(398600.4418 / r) }
}

export default function SpaceView() {
  const containerRef = useRef<HTMLDivElement>(null)
  const { updateTelemetry, time } = useTezcatlipoca()
  const [satellites, setSatellites] = useState<SatelliteData[]>([])
  const [loading, setLoading] = useState(true)
  const sceneRef = useRef<THREE.Scene | null>(null)
  const satMeshesRef = useRef<Map<string, THREE.Mesh>>(new Map())
  const orbitLinesRef = useRef<Map<string, THREE.Line>>(new Map())
  const rafRef = useRef<number>(0)

  // Fetch TLEs on mount
  useEffect(() => {
    fetchTLEs('stations').then((sats) => {
      setSatellites(sats.slice(0, 20)) // Limitar a 20 para performance
      setLoading(false)
    })
  }, [])

  // Initialize Three.js scene
  useEffect(() => {
    if (!containerRef.current || satellites.length === 0) return

    const container = containerRef.current
    const scene = new THREE.Scene()
    sceneRef.current = scene

    const camera = new THREE.PerspectiveCamera(45, container.clientWidth / container.clientHeight, 1, 1e9)
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
    renderer.setSize(container.clientWidth, container.clientHeight)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.toneMapping = THREE.ACESFilmicToneMapping
    renderer.toneMappingExposure = 0.8
    container.appendChild(renderer.domElement)

    // Earth with realistic texture
    const earthGroup = new THREE.Group()
    
    // Base earth
    const earthGeo = new THREE.SphereGeometry(6371, 128, 128)
    const textureLoader = new THREE.TextureLoader()
    
    const earthMat = new THREE.MeshPhongMaterial({
      map: textureLoader.load('https://unpkg.com/three-globe/example/img/earth-blue-marble.jpg'),
      bumpMap: textureLoader.load('https://unpkg.com/three-globe/example/img/earth-topology.png'),
      bumpScale: 0.05,
      specular: new THREE.Color(0x333333),
      shininess: 5,
    })
    const earth = new THREE.Mesh(earthGeo, earthMat)
    earthGroup.add(earth)

    // Atmosphere glow (Gargantua-style bloom)
    const atmosGeo = new THREE.SphereGeometry(6500, 64, 64)
    const atmosMat = new THREE.ShaderMaterial({
      vertexShader: `
        varying vec3 vNormal;
        void main() {
          vNormal = normalize(normalMatrix * normal);
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        varying vec3 vNormal;
        void main() {
          float intensity = pow(0.6 - dot(vNormal, vec3(0, 0, 1.0)), 2.0);
          gl_FragColor = vec4(0.3, 0.6, 1.0, 1.0) * intensity;
        }
      `,
      blending: THREE.AdditiveBlending,
      side: THREE.BackSide,
      transparent: true,
    })
    const atmosphere = new THREE.Mesh(atmosGeo, atmosMat)
    earthGroup.add(atmosphere)

    // Night lights
    const lightsGeo = new THREE.SphereGeometry(6372, 64, 64)
    const lightsMat = new THREE.MeshBasicMaterial({
      map: textureLoader.load('https://unpkg.com/three-globe/example/img/earth-night.jpg'),
      blending: THREE.AdditiveBlending,
      transparent: true,
      opacity: 0.3,
    })
    earthGroup.add(new THREE.Mesh(lightsGeo, lightsMat))

    scene.add(earthGroup)

    // Stars background
    const starsGeo = new THREE.BufferGeometry()
    const starsCount = 5000
    const posArray = new Float32Array(starsCount * 3)
    for (let i = 0; i < starsCount * 3; i++) {
      posArray[i] = (Math.random() - 0.5) * 500000
    }
    starsGeo.setAttribute('position', new THREE.BufferAttribute(posArray, 3))
    const starsMat = new THREE.PointsMaterial({ size: 200, color: 0xffffff, transparent: true, opacity: 0.8 })
    scene.add(new THREE.Points(starsGeo, starsMat))

    // Lighting
    const ambientLight = new THREE.AmbientLight(0x404040, 0.5)
    scene.add(ambientLight)
    const sunLight = new THREE.DirectionalLight(0xffffff, 1.5)
    sunLight.position.set(1e5, 0, 0)
    scene.add(sunLight)

    // Camera initial position
    camera.position.set(20000, 15000, 20000)
    camera.lookAt(0, 0, 0)

    // Create satellite meshes
    const satGeometry = new THREE.SphereGeometry(80, 16, 16)
    const orbitMaterial = new THREE.LineBasicMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.3 })

    satellites.forEach((sat) => {
      const satMat = new THREE.MeshBasicMaterial({ color: 0x22d3ee })
      const mesh = new THREE.Mesh(satGeometry, satMat)
      scene.add(mesh)
      satMeshesRef.current.set(sat.noradId, mesh)

      // Orbit trail (circular approximation)
      const orbitPoints: THREE.Vector3[] = []
      for (let i = 0; i <= 128; i++) {
        const angle = (i / 128) * Math.PI * 2
        const r = 6771 // Earth radius + ~400km
        orbitPoints.push(new THREE.Vector3(
          r * Math.cos(angle),
          r * Math.sin(angle) * 0.3, // Inclination approximation
          r * Math.sin(angle)
        ))
      }
      const orbitGeo = new THREE.BufferGeometry().setFromPoints(orbitPoints)
      const orbitLine = new THREE.Line(orbitGeo, orbitMaterial)
      scene.add(orbitLine)
      orbitLinesRef.current.set(sat.noradId, orbitLine)
    })

    // Animation loop with cinematic camera
    let lastTime = performance.now()
    const animate = () => {
      rafRef.current = requestAnimationFrame(animate)
      const now = performance.now()
      const dt = (now - lastTime) / 1000
      lastTime = now

      // Update satellite positions
      const currentTime = new Date(time.current)
      satellites.forEach((sat) => {
        const pos = propagateSGP4(sat.tleLine1, sat.tleLine2, currentTime)
        const mesh = satMeshesRef.current.get(sat.noradId)
        if (mesh) {
          mesh.position.set(pos.x * 1000, pos.y * 1000, pos.z * 1000)
        }
      })

      // Cinematic camera drift
      const time_s = now / 1000
      camera.position.x = 20000 + Math.sin(time_s * 0.05) * 5000
      camera.position.z = 20000 + Math.cos(time_s * 0.05) * 5000
      camera.lookAt(0, 0, 0)

      // Earth rotation
      earthGroup.rotation.y += 0.0001 * (time.rate || 1)

      renderer.render(scene, camera)

      // Update telemetry
      updateTelemetry({
        entitiesRendered: satellites.length,
        entitiesTotal: satellites.length,
        fps: Math.round(1000 / (dt * 1000)),
      })
    }
    animate()

    // Resize handler
    const handleResize = () => {
      camera.aspect = container.clientWidth / container.clientHeight
      camera.updateProjectionMatrix()
      renderer.setSize(container.clientWidth, container.clientHeight)
    }
    window.addEventListener('resize', handleResize)

    return () => {
      cancelAnimationFrame(rafRef.current)
      window.removeEventListener('resize', handleResize)
      renderer.dispose()
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement)
      }
    }
  }, [satellites, time.current, time.rate])

  if (loading) {
    return (
      <div style={{
        width: '100%', height: '100%',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexDirection: 'column', gap: 16,
      }}>
        <div style={{
          width: 48, height: 48,
          borderRadius: '50%',
          border: '3px solid var(--border-color)',
          borderTopColor: 'var(--accent-blue)',
          animation: 'spin 1s linear infinite',
        }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        <span style={{ color: 'var(--text-secondary)', fontSize: 12 }}>
          Cargando TLEs desde CelesTrak...
        </span>
      </div>
    )
  }

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative' }}>
      <div ref={containerRef} style={{ width: '100%', height: '100%' }} />
      
      {/* Satellite list overlay */}
      <div style={{
        position: 'absolute',
        top: 12, left: 12,
        background: 'var(--hud-bg)',
        border: '1px solid var(--hud-border)',
        borderRadius: 8,
        padding: 12,
        maxHeight: '40%',
        overflow: 'auto',
        backdropFilter: 'blur(8px)',
        minWidth: 200,
      }}>
        <div style={{ fontSize: 11, fontWeight: 600, marginBottom: 8, color: 'var(--text-accent)' }}>
          🛰️ Satélites ({satellites.length})
        </div>
        {satellites.map((sat) => (
          <div key={sat.noradId} style={{
            fontSize: 10,
            padding: '3px 0',
            borderBottom: '1px solid var(--border-color)',
            display: 'flex',
            justifyContent: 'space-between',
          }}>
            <span style={{ color: 'var(--text-primary)' }}>{sat.name}</span>
            <span style={{ color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)' }}>
              {sat.noradId}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
