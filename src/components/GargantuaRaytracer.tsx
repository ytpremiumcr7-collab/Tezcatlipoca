import { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import type { QualityProfile } from '../engines/types'

interface Props {
  quality: QualityProfile
  onTelemetry: (t: { entities: number }) => void
}

const qualitySteps: Record<QualityProfile, number> = {
  low: 64,
  medium: 96,
  high: 128,
  ultra: 192
}

export default function GargantuaRaytracer({ quality, onTelemetry }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null)
  const frameRef = useRef<number>(0)
  const [params, setParams] = useState({
    mass: 1.0,
    diskTemp: 5000,
    inclination: 0.5,
    doppler: 1.0,
    exposure: 1.2
  })

  useEffect(() => {
    if (!containerRef.current) return
    const container = containerRef.current

    const scene = new THREE.Scene()
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1)
    const renderer = new THREE.WebGLRenderer({ antialias: false })
    renderer.setSize(container.clientWidth, container.clientHeight)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    container.appendChild(renderer.domElement)
    rendererRef.current = renderer

    const geometry = new THREE.PlaneGeometry(2, 2)

    const vertexShader = `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = vec4(position, 1.0);
      }
    `

    const fragmentShader = `
      precision highp float;
      varying vec2 vUv;
      uniform float uTime;
      uniform vec2 uResolution;
      uniform float uMass;
      uniform float uDiskTemp;
      uniform float uInclination;
      uniform float uDoppler;
      uniform float uExposure;

      #define PI 3.14159265359
      #define MAX_STEPS ${qualitySteps[quality]}

      float rs(float M) { return 2.0 * M; }

      float diskTemp(float r, float M, float T0) {
        float r_ms = 6.0 * M;
        if (r < r_ms) return 0.0;
        return T0 * pow(r_ms / r, 0.75);
      }

      vec3 blackbody(float T) {
        float t = T / 1000.0;
        vec3 c = vec3(0.0);
        c.r = 1.0 / (1.0 + exp(-(t - 4.0)));
        c.g = 1.0 / (1.0 + exp(-(t - 6.0) * 1.5));
        c.b = 1.0 / (1.0 + exp(-(t - 8.0) * 2.0));
        return c * T * T * T * T * 0.0001;
      }

      vec3 rayDir(vec2 uv, vec3 camPos, vec3 camTarget) {
        vec3 forward = normalize(camTarget - camPos);
        vec3 right = normalize(cross(vec3(0.0, 1.0, 0.0), forward));
        vec3 up = cross(forward, right);
        return normalize(uv.x * right + uv.y * up + 1.5 * forward);
      }

      vec3 bendRay(vec3 ro, vec3 rd, float M, float stepSize) {
        vec3 toCenter = -ro;
        float dist = length(toCenter);
        float force = (1.5 * rs(M) * stepSize) / (dist * dist);
        return normalize(rd + toCenter / dist * force);
      }

      void main() {
        vec2 uv = (vUv - 0.5) * vec2(uResolution.x / uResolution.y, 1.0);
        float M = uMass;
        float R_s = rs(M);
        vec3 camPos = vec3(0.0, uInclination * 0.3 + 0.1, -8.0 * M);
        vec3 rd = rayDir(uv, camPos, vec3(0.0));
        vec3 ro = camPos;
        vec3 col = vec3(0.0);
        float glow = 0.0;
        float t = 0.0;

        for (int i = 0; i < MAX_STEPS; i++) {
          vec3 p = ro + rd * t;
          float dist = length(p);
          if (dist < R_s * 1.05) break;

          float diskInner = 3.0 * R_s;
          float diskOuter = 20.0 * R_s;
          float diskHeight = 0.3 * M;

          if (abs(p.y) < diskHeight && dist > diskInner && dist < diskOuter) {
            float temp = diskTemp(dist, M, uDiskTemp);
            float doppler = 1.0 + uDoppler * (p.x / dist) * 0.5;
            vec3 emit = blackbody(temp * doppler);
            float alpha = smoothstep(diskHeight, 0.0, abs(p.y)) * 0.8;
            col += emit * alpha * (1.0 - col.r);
            glow += alpha * 0.1;
          }

          float lens = R_s / dist;
          glow += lens * lens * 0.02;
          float stepSize = max(0.05 * dist, 0.01);
          t += stepSize;
          rd = bendRay(p, rd, M, stepSize);
          if (t > 50.0) break;
        }

        col += vec3(1.0, 0.6, 0.2) * glow * 0.5;
        float stars = pow(max(sin(uv.x * 437.0) * sin(uv.y * 317.0), 0.0), 20.0);
        col += vec3(0.8, 0.9, 1.0) * stars * 0.3;
        col *= 1.0 + uv.x * uDoppler * 0.3;
        col = col * uExposure / (1.0 + col * uExposure);
        col = pow(col, vec3(0.4545));
        gl_FragColor = vec4(col, 1.0);
      }
    `

    const uniforms = {
      uTime: { value: 0 },
      uResolution: { value: new THREE.Vector2(container.clientWidth, container.clientHeight) },
      uMass: { value: params.mass },
      uDiskTemp: { value: params.diskTemp },
      uInclination: { value: params.inclination },
      uDoppler: { value: params.doppler },
      uExposure: { value: params.exposure }
    }

    const material = new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      uniforms
    })

    const mesh = new THREE.Mesh(geometry, material)
    scene.add(mesh)

    const startTime = performance.now()
    const animate = () => {
      frameRef.current = requestAnimationFrame(animate)
      uniforms.uTime.value = (performance.now() - startTime) * 0.001
      renderer.render(scene, camera)
    }
    animate()
    onTelemetry({ entities: qualitySteps[quality] })

    const handleResize = () => {
      const w = container.clientWidth
      const h = container.clientHeight
      renderer.setSize(w, h)
      uniforms.uResolution.value.set(w, h)
    }
    window.addEventListener('resize', handleResize)

    return () => {
      cancelAnimationFrame(frameRef.current)
      window.removeEventListener('resize', handleResize)
      renderer.dispose()
      geometry.dispose()
      material.dispose()
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement)
      }
    }
  }, [quality])

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative' }}>
      <div ref={containerRef} style={{ width: '100%', height: '100%' }} />
      <div style={{
        position: 'absolute', top: 80, left: 12,
        background: 'rgba(10,10,20,0.9)', color: '#ffa500',
        padding: '12px', borderRadius: '8px', border: '1px solid rgba(255,165,0,0.3)',
        fontFamily: 'monospace', fontSize: '0.75rem', width: '220px'
      }}>
        <h4 style={{ margin: '0 0 8px 0' }}>GARGANTUA CONTROLS</h4>
        <div>Mass: <input type="range" min="0.5" max="3" step="0.1" value={params.mass} onChange={e => setParams(p => ({ ...p, mass: parseFloat(e.target.value) }))} style={{ width: '100%' }} /></div>
        <div>Temp: <input type="range" min="1000" max="15000" step="500" value={params.diskTemp} onChange={e => setParams(p => ({ ...p, diskTemp: parseFloat(e.target.value) }))} style={{ width: '100%' }} /></div>
        <div>Tilt: <input type="range" min="0" max="2" step="0.1" value={params.inclination} onChange={e => setParams(p => ({ ...p, inclination: parseFloat(e.target.value) }))} style={{ width: '100%' }} /></div>
        <div>Doppler: <input type="range" min="0" max="2" step="0.1" value={params.doppler} onChange={e => setParams(p => ({ ...p, doppler: parseFloat(e.target.value) }))} style={{ width: '100%' }} /></div>
        <div>Exposure: <input type="range" min="0.5" max="3" step="0.1" value={params.exposure} onChange={e => setParams(p => ({ ...p, exposure: parseFloat(e.target.value) }))} style={{ width: '100%' }} /></div>
      </div>
    </div>
  )
}
