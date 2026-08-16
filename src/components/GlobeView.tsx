import { useEffect, useRef } from 'react'
import * as THREE from 'three'

export default function GlobeView() {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!containerRef.current) return

    const container = containerRef.current
    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(45, container.clientWidth / container.clientHeight, 0.1, 1000)
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })

    renderer.setSize(container.clientWidth, container.clientHeight)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    container.appendChild(renderer.domElement)

    // Globe
    const geometry = new THREE.SphereGeometry(5, 64, 64)
    const textureLoader = new THREE.TextureLoader()
    const material = new THREE.MeshPhongMaterial({
      map: textureLoader.load('https://unpkg.com/three-globe/example/img/earth-blue-marble.jpg'),
      bumpMap: textureLoader.load('https://unpkg.com/three-globe/example/img/earth-topology.png'),
      bumpScale: 0.05,
      specular: new THREE.Color(0x333333),
      shininess: 5,
    })
    const globe = new THREE.Mesh(geometry, material)
    scene.add(globe)

    // Atmosphere glow
    const atmosGeo = new THREE.SphereGeometry(5.2, 64, 64)
    const atmosMat = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.1,
      side: THREE.BackSide,
    })
    const atmosphere = new THREE.Mesh(atmosGeo, atmosMat)
    scene.add(atmosphere)

    // Stars
    const starsGeo = new THREE.BufferGeometry()
    const starsCount = 3000
    const posArray = new Float32Array(starsCount * 3)
    for (let i = 0; i < starsCount * 3; i++) {
      posArray[i] = (Math.random() - 0.5) * 200
    }
    starsGeo.setAttribute('position', new THREE.BufferAttribute(posArray, 3))
    const starsMat = new THREE.PointsMaterial({ size: 0.05, color: 0xffffff })
    const stars = new THREE.Points(starsGeo, starsMat)
    scene.add(stars)

    // Lights
    const ambientLight = new THREE.AmbientLight(0x404040, 2)
    scene.add(ambientLight)
    const directionalLight = new THREE.DirectionalLight(0xffffff, 1)
    directionalLight.position.set(5, 3, 5)
    scene.add(directionalLight)

    camera.position.z = 15

    // Animation
    let animId: number
    const animate = () => {
      animId = requestAnimationFrame(animate)
      globe.rotation.y += 0.001
      atmosphere.rotation.y += 0.001
      renderer.render(scene, camera)
    }
    animate()

    // Resize
    const handleResize = () => {
      camera.aspect = container.clientWidth / container.clientHeight
      camera.updateProjectionMatrix()
      renderer.setSize(container.clientWidth, container.clientHeight)
    }
    window.addEventListener('resize', handleResize)

    return () => {
      cancelAnimationFrame(animId)
      window.removeEventListener('resize', handleResize)
      renderer.dispose()
      container.removeChild(renderer.domElement)
    }
  }, [])

  return <div ref={containerRef} style={{ width: '100%', height: '100%' }} />
}
