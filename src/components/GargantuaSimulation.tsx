import { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import type { QualityProfile } from '../engines/types'

interface Props {
  onClose: () => void
  quality: QualityProfile
}

export default function GargantuaSimulation({ onClose, quality }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [params, setParams] = useState({
    mass: 1.0, diskTemp: 5000, inclination: 0.5,
    doppler: 1.0, exposure: 1.2
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

    const steps = quality === 'ultra' ? 192 : quality === 'high' ? 128 : 64

    const vertexShader = `varying vec2 vUv; void main() { vUv = uv; gl_Position = vec4(position, 1.0); }`

    const fragmentShader = `
      precision highp float;
      varying vec2 vUv;
      uniform float uTime, uMass, uDiskTemp, uInclination, uDoppler, uExposure;
      #define MAX_STEPS ${steps}
      float rs(float M) { return 2.0 * M; }
      void main() {
        vec2 uv = (vUv - 0.5) * vec2(1.0, 1.0);
        float M = uMass, R_s = rs(M);
        vec3 ro = vec3(0.0, uInclination * 0.3 + 0.1, -8.0 * M);
        vec3 rd = normalize(vec3(uv.x, uv.y, 1.5));
        vec3 col = vec3(0.0); float glow = 0.0, t = 0.0;
        for (int i = 0; i < MAX_STEPS; i++) {
          vec3 p = ro + rd * t; float dist = length(p);
          if (dist < R_s * 1.05) break;
          float dh = 0.3 * M, di = 3.0 * R_s, dout = 20.0 * R_s;
          if (abs(p.y) < dh && dist > di && dist < dout) {
            float temp = uDiskTemp * pow(6.0 * M / dist, 0.75);
            float dop = 1.0 + uDoppler * (p.x / dist) * 0.5;
            vec3 emit = vec3(1.0, 0.45, 0.08) * temp * temp * temp * temp * 0.00008 * dop;
            float alpha = smoothstep(dh, 0.0, abs(p.y)) * 0.8;
            col += emit * alpha * (1.0 - col.r); glow += alpha * 0.1;
          }
          float lens = R_s / dist; glow += lens * lens * 0.02;
          float stepSize = max(0.05 * dist, 0.01); t += stepSize;
          vec3 tc = -p; rd = normalize(rd + tc / dist * (1.5 * R_s * stepSize) / (dist * dist));
          if (t > 50.0) break;
        }
        col += vec3(1.0, 0.55, 0.15) * glow * 0.5;
        float stars = pow(max(sin(uv.x * 437.0) * sin(uv.y * 317.0), 0.0), 20.0);
        col += vec3(0.8, 0.9, 1.0) * stars * 0.3;
        col *= 1.0 + uv.x * uDoppler * 0.3;
        col = col * uExposure / (1.0 + col * uExposure);
        col = pow(col, vec3(0.4545));
        gl_FragColor = vec4(col, 1.0);
      }
    `

    const uniforms = {
      uTime: { value: 0 }, uMass: { value: params.mass },
      uDiskTemp: { value: params.diskTemp }, uInclination: { value: params.inclination },
      uDoppler: { value: params.doppler }, uExposure: { value: params.exposure }
    }

    const material = new THREE.ShaderMaterial({ vertexShader, fragmentShader, uniforms })
    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), material)
    scene.add(mesh)

    let frame: number
    const start = performance.now()
    const animate = () => {
      frame = requestAnimationFrame(animate)
      uniforms.uTime.value = (performance.now() - start) * 0.001
      renderer.render(scene, camera)
    }
    animate()

    const handleResize = () => {
      renderer.setSize(container.clientWidth, container.clientHeight)
    }
    window.addEventListener('resize', handleResize)

    return () => {
      cancelAnimationFrame(frame)
      window.removeEventListener('resize', handleResize)
      renderer.dispose()
      material.dispose()
      if (container.contains(renderer.domElement)) container.removeChild(renderer.domElement)
    }
  }, [quality])

  return (
    <div style={{
      position: 'absolute', top: '60px', left: '20px', right: '20px', bottom: '60px',
      zIndex: 100, background: 'rgba(5,5,10,0.98)',
      borderRadius: '16px', border: '1px solid rgba(255,165,0,0.2)',
      display: 'flex', flexDirection: 'column', overflow: 'hidden'
    }}>
      <div style={{
        padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,0.05)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between'
      }}>
        <div>
          <h2 style={{ margin: 0, color: '#ffa500', fontSize: '18px' }}>&#x1F7E3; Simulaci&oacute;n: Agujero Negro Schwarzschild</h2>
          <p style={{ margin: '4px 0 0', color: '#888', fontSize: '12px' }}>
            Raytracing gravitacional &bull; Disco de acreci&oacute;n &bull; Redshift &bull; Doppler beaming
          </p>
        </div>
        <button onClick={onClose} style={{
          background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: '8px', color: '#ddd', padding: '8px 16px', cursor: 'pointer',
          fontFamily: 'inherit', fontSize: '13px'
        }}>&#x2715; Salir de simulaci&oacute;n</button>
      </div>

      <div style={{ flex: 1, position: 'relative', display: 'flex' }}>
        <div ref={containerRef} style={{ flex: 1 }} />
        <div style={{
          width: '240px', padding: '16px',
          borderLeft: '1px solid rgba(255,255,255,0.05)',
          background: 'rgba(0,0,0,0.3)', overflow: 'auto'
        }}>
          <h4 style={{ color: '#ffa500', margin: '0 0 12px', fontSize: '13px' }}>PAR&Aacute;METROS F&Iacute;SICOS</h4>
          {[
            { key: 'mass', label: 'Masa (M☉)', min: 0.5, max: 5, step: 0.1 },
            { key: 'diskTemp', label: 'Temperatura disco (K)', min: 1000, max: 20000, step: 500 },
            { key: 'inclination', label: 'Inclinación', min: 0, max: 2, step: 0.1 },
            { key: 'doppler', label: 'Factor Doppler', min: 0, max: 2, step: 0.1 },
            { key: 'exposure', label: 'Exposición', min: 0.5, max: 3, step: 0.1 },
          ].map(p => (
            <div key={p.key} style={{ marginBottom: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#aaa', marginBottom: '4px' }}>
                <span>{p.label}</span>
                <span>{params[p.key as keyof typeof params]}</span>
              </div>
              <input type="range" min={p.min} max={p.max} step={p.step}
                value={params[p.key as keyof typeof params]}
                onChange={e => setParams(prev => ({ ...prev, [p.key]: parseFloat(e.target.value) }))}
                style={{ width: '100%' }}
              />
            </div>
          ))}
          <div style={{
            marginTop: '16px', padding: '12px',
            background: 'rgba(155,89,182,0.1)', borderRadius: '8px',
            borderLeft: '3px solid #9b59b6'
          }}>
            <div style={{ fontSize: '11px', color: '#9b59b6', fontWeight: 600 }}>&#x1F7E3; MODO SIMULACI&Oacute;N</div>
            <div style={{ fontSize: '10px', color: '#888', marginTop: '4px' }}>
              Los datos mostrados son simulados. No representan observaciones reales.
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
