import { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import { useTezcatlipoca } from '@/stores/tezcatlipocaStore'

// =============================================================================
// GLOBE VIEW — Globo terráqueo interactivo con Three.js
// Mentalidad DevOps: cleanup exhaustivo, RAF controlado, graceful degradation
// =============================================================================

const STAR_COUNT = 3000
const GLOBE_RADIUS = 5
const ATMOSPHERE_RADIUS = 5.2

export default function GlobeView() {
  const containerRef = useRef<HTMLDivElement>(null)
  const { updateTelemetry } = useTezcatlipoca()
  const [loading, setLoading] = useState(true)

  // Refs para cleanup
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null)
  const sceneRef = useRef<THREE.Scene | null>(null)
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null)
  const globeRef = useRef<THREE.Mesh | null>(null)
  const atmosphereRef = useRef<THREE.Mesh | null>(null)
  const rafRef = useRef<number>(0)
  const disposedRef = useRef(false)
  const frameCountRef = useRef(0)
  const fpsTimeRef = useRef(performance.now())
  const mouseRef = useRef({ x: 0, y: 0, isDown: false, lastX: 0 })

  useEffect(() => {
    if (!containerRef.current) return

    disposedRef.current = false
    const container = containerRef.current

    // Scene
    const scene = new THREE.Scene()
    sceneRef.current = scene

    // Camera
    const camera = new THREE.PerspectiveCamera(
      45,
      container.clientWidth / container.clientHeight,
      0.1,
      1000
    )
    camera.position.z = 15
    cameraRef.current = camera

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
    renderer.setSize(container.clientWidth, container.clientHeight)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    rendererRef.current = renderer
    container.appendChild(renderer.domElement)

    // Globe
    const geometry = new THREE.SphereGeometry(GLOBE_RADIUS, 64, 64)
    const textureLoader = new THREE.TextureLoader()

    const material = new THREE.MeshPhongMaterial({
      color: 0x1a4d6e,
      specular: new THREE.Color(0x333333),
      shininess: 5,
    })

    // Try to load textures with fallback
    textureLoader.load(
      'https://unpkg.com/three-globe/example/img/earth-blue-marble.jpg',
      (tex) => {
        if (!disposedRef.current) {
          material.map = tex
          material.needsUpdate = true
        }
      },
      undefined,
      () => { /* fallback to color */ }
    )
    textureLoader.load(
      'https://unpkg.com/three-globe/example/img/earth-topology.png',
      (tex) => {
        if (!disposedRef.current) {
          material.bumpMap = tex
          material.bumpScale = 0.05
          material.needsUpdate = true
        }
      },
      undefined,
      () => { /* fallback */ }
    )

    const globe = new THREE.Mesh(geometry, material)
    globeRef.current = globe
    scene.add(globe)

    // Atmosphere glow
    const atmosGeo = new THREE.SphereGeometry(ATMOSPHERE_RADIUS, 64, 64)
    const atmosMat = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.08,
      side: THREE.BackSide,
    })
    const atmosphere = new THREE.Mesh(atmosGeo, atmosMat)
    atmosphereRef.current = atmosphere
    scene.add(atmosphere)

    // Stars
    const starsGeo = new THREE.BufferGeometry()
    const posArray = new Float32Array(STAR_COUNT * 3)
    for (let i = 0; i < STAR_COUNT * 3; i++) {
      posArray[i] = (Math.random() - 0.5) * 200
    }
    starsGeo.setAttribute('position', new THREE.BufferAttribute(posArray, 3))
    const starsMat = new THREE.PointsMaterial({
      size: 0.05,
      color: 0xffffff,
      transparent: true,
      opacity: 0.8,
    })
    scene.add(new THREE.Points(starsGeo, starsMat))

    // Lights
    const ambientLight = new THREE.AmbientLight(0x404040, 2)
    scene.add(ambientLight)
    const directionalLight = new THREE.DirectionalLight(0xffffff, 1)
    directionalLight.position.set(5, 3, 5)
    scene.add(directionalLight)

    // Mouse interaction
    const onMouseDown = (e: MouseEvent) => {
      mouseRef.current.isDown = true
      mouseRef.current.lastX = e.clientX
    }
    const onMouseUp = () => { mouseRef.current.isDown = false }
    const onMouseMove = (e: MouseEvent) => {
      if (!mouseRef.current.isDown) return
      const deltaX = e.clientX - mouseRef.current.lastX
      mouseRef.current.lastX = e.clientX
      if (globeRef.current) {
        globeRef.current.rotation.y += deltaX * 0.005
      }
      if (atmosphereRef.current) {
        atmosphereRef.current.rotation.y += deltaX * 0.005
      }
    }

    container.addEventListener('mousedown', onMouseDown)
    window.addEventListener('mouseup', onMouseUp)
    window.addEventListener('mousemove', onMouseMove)

    // Touch support
    const onTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 1) {
        mouseRef.current.isDown = true
        mouseRef.current.lastX = e.touches[0].clientX
      }
    }
    const onTouchEnd = () => { mouseRef.current.isDown = false }
    const onTouchMove = (e: TouchEvent) => {
      if (!mouseRef.current.isDown || e.touches.length !== 1) return
      const deltaX = e.touches[0].clientX - mouseRef.current.lastX
      mouseRef.current.lastX = e.touches[0].clientX
      if (globeRef.current) {
        globeRef.current.rotation.y += deltaX * 0.005
      }
      if (atmosphereRef.current) {
        atmosphereRef.current.rotation.y += deltaX * 0.005
      }
    }

    container.addEventListener('touchstart', onTouchStart, { passive: true })
    container.addEventListener('touchend', onTouchEnd)
    container.addEventListener('touchmove', onTouchMove, { passive: true })

    // Animation loop
    frameCountRef.current = 0
    fpsTimeRef.current = performance.now()

    const animate = () => {
      if (disposedRef.current) return
      rafRef.current = requestAnimationFrame(animate)

      const now = performance.now()
      frameCountRef.current++

      // FPS every second
      if (now - fpsTimeRef.current >= 1000) {
        const fps = Math.round((frameCountRef.current * 1000) / (now - fpsTimeRef.current))
        updateTelemetry({ fps, frameTime: Math.round(1000 / Math.max(fps, 1)) })
        frameCountRef.current = 0
        fpsTimeRef.current = now
      }

      // Auto-rotate when not interacting
      if (!mouseRef.current.isDown && globeRef.current) {
        globeRef.current.rotation.y += 0.0005
      }
      if (!mouseRef.current.isDown && atmosphereRef.current) {
        atmosphereRef.current.rotation.y += 0.0005
      }

      renderer.render(scene, camera)
    }

    animate()
    setLoading(false)

    // Resize
    const resizeObserver = new ResizeObserver(() => {
      if (!container || disposedRef.current) return
      const w = container.clientWidth
      const h = container.clientHeight
      camera.aspect = w / h
      camera.updateProjectionMatrix()
      renderer.setSize(w, h)
    })
    resizeObserver.observe(container)

    return () => {
      disposedRef.current = true
      cancelAnimationFrame(rafRef.current)
      resizeObserver.disconnect()

      container.removeEventListener('mousedown', onMouseDown)
      window.removeEventListener('mouseup', onMouseUp)
      window.removeEventListener('mousemove', onMouseMove)
      container.removeEventListener('touchstart', onTouchStart)
      container.removeEventListener('touchend', onTouchEnd)
      container.removeEventListener('touchmove', onTouchMove)

      // Dispose all resources
      geometry.dispose()
      material.dispose()
      atmosGeo.dispose()
      atmosMat.dispose()
      starsGeo.dispose()
      starsMat.dispose()

      scene.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          child.geometry.dispose()
          if (Array.isArray(child.material)) {
            child.material.forEach((m) => m.dispose())
          } else {
            child.material.dispose()
          }
        }
      })

      renderer.dispose()
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement)
      }

      rendererRef.current = null
      sceneRef.current = null
      cameraRef.current = null
      globeRef.current = null
      atmosphereRef.current = null
    }
  }, [updateTelemetry])

  if (loading) {
    return (
      <div style={centerStyle}>
        <div style={spinnerStyle} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        <span style={{ color: 'var(--text-secondary)', fontSize: 12 }}>
          Cargando globo terráqueo...
        </span>
      </div>
    )
  }

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative', cursor: 'grab' }}>
      <div ref={containerRef} style={{ width: '100%', height: '100%' }} />
      <div style={hintStyle}>
        <span style={{ fontSize: 9, color: 'var(--text-muted)' }}>
          🖱️ Arrastra para rotar • Auto-rotación cuando inactivo
        </span>
      </div>
    </div>
  )
}

const centerStyle: React.CSSProperties = {
  width: '100%',
  height: '100%',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  flexDirection: 'column',
  gap: 12,
}

const spinnerStyle: React.CSSProperties = {
  width: 40,
  height: 40,
  borderRadius: '50%',
  border: '3px solid var(--border-color)',
  borderTopColor: 'var(--accent-blue)',
  animation: 'spin 1s linear infinite',
}

const hintStyle: React.CSSProperties = {
  position: 'absolute',
  bottom: 12,
  left: '50%',
  transform: 'translateX(-50%)',
  background: 'var(--hud-bg)',
  border: '1px solid var(--hud-border)',
  borderRadius: 6,
  padding: '4px 12px',
  backdropFilter: 'blur(8px)',
  zIndex: 10,
}
