import { useEffect, useRef, useState, useCallback } from 'react'
import type { QualityProfile, SurveyPoint, TINTriangle, ContourLine, VolumeReport } from '../engines/types'

interface Props {
  quality: QualityProfile
  onTelemetry: (t: { triangles: number; entities: number }) => void
}

function generateSurveyPoints(): SurveyPoint[] {
  const points: SurveyPoint[] = []
  const gridSize = 10
  const spacing = 10
  let id = 0
  for (let x = 0; x < gridSize; x++) {
    for (let y = 0; y < gridSize; y++) {
      const px = x * spacing + (Math.random() - 0.5) * 3
      const py = y * spacing + (Math.random() - 0.5) * 3
      const pz = Math.sin(x * 0.5) * Math.cos(y * 0.5) * 15 + Math.random() * 2
      points.push({
        id: `P${id++}`,
        x: px, y: py, z: pz,
        code: 'TP',
        description: `Topo Point ${id}`,
        elevation: pz,
        accuracy: 0.02
      })
    }
  }
  return points
}

function delaunayTriangulation(points: SurveyPoint[]): TINTriangle[] {
  if (points.length < 3) return []
  const tris: TINTriangle[] = []
  const minX = Math.min(...points.map(p => p.x))
  const maxX = Math.max(...points.map(p => p.x))
  const minY = Math.min(...points.map(p => p.y))
  const maxY = Math.max(...points.map(p => p.y))
  const dx = maxX - minX
  const dy = maxY - minY
  const dmax = Math.max(dx, dy)
  const midx = (minX + maxX) / 2
  const midy = (minY + maxY) / 2

  const superP1 = { x: midx - 2 * dmax, y: midy - dmax, z: 0 }
  const superP2 = { x: midx, y: midy + 2 * dmax, z: 0 }
  const superP3 = { x: midx + 2 * dmax, y: midy - dmax, z: 0 }

  function circumcircle(p1: any, p2: any, p3: any) {
    const d = 2 * (p1.x * (p2.y - p3.y) + p2.x * (p3.y - p1.y) + p3.x * (p1.y - p2.y))
    if (Math.abs(d) < 1e-10) return null
    const ux = ((p1.x * p1.x + p1.y * p1.y) * (p2.y - p3.y) + (p2.x * p2.x + p2.y * p2.y) * (p3.y - p1.y) + (p3.x * p3.x + p3.y * p3.y) * (p1.y - p2.y)) / d
    const uy = ((p1.x * p1.x + p1.y * p1.y) * (p3.x - p2.x) + (p2.x * p2.x + p2.y * p2.y) * (p1.x - p3.x) + (p3.x * p3.x + p3.y * p3.y) * (p2.x - p1.x)) / d
    const r = Math.sqrt((ux - p1.x) ** 2 + (uy - p1.y) ** 2)
    return { x: ux, y: uy, r }
  }

  let triangles: any[] = [[superP1, superP2, superP3]]

  for (const p of points) {
    const badTriangles: any[] = []
    for (const tri of triangles) {
      const cc = circumcircle(tri[0], tri[1], tri[2])
      if (cc && Math.sqrt((p.x - cc.x) ** 2 + (p.y - cc.y) ** 2) < cc.r) {
        badTriangles.push(tri)
      }
    }

    const polygon: any[] = []
    for (const tri of badTriangles) {
      for (let i = 0; i < 3; i++) {
        const edge = [tri[i], tri[(i + 1) % 3]]
        let shared = false
        for (const other of badTriangles) {
          if (other === tri) continue
          for (let j = 0; j < 3; j++) {
            const oEdge = [other[j], other[(j + 1) % 3]]
            if ((edge[0] === oEdge[0] && edge[1] === oEdge[1]) || (edge[0] === oEdge[1] && edge[1] === oEdge[0])) {
              shared = true
            }
          }
        }
        if (!shared) polygon.push(edge)
      }
    }

    triangles = triangles.filter(t => !badTriangles.includes(t))
    for (const edge of polygon) {
      triangles.push([edge[0], edge[1], p])
    }
  }

  triangles = triangles.filter(t =>
    !t.includes(superP1) && !t.includes(superP2) && !t.includes(superP3)
  )

  const pointMap = new Map(points.map((p, i) => [`${p.x},${p.y}`, i]))
  for (const tri of triangles) {
    const ia = pointMap.get(`${tri[0].x},${tri[0].y}`) ?? 0
    const ib = pointMap.get(`${tri[1].x},${tri[1].y}`) ?? 0
    const ic = pointMap.get(`${tri[2].x},${tri[2].y}`) ?? 0
    const a = points[ia], b = points[ib], c = points[ic]
    const area = Math.abs((b.x - a.x) * (c.y - a.y) - (c.x - a.x) * (b.y - a.y)) / 2
    const slope = Math.atan2(Math.abs(c.z - a.z), Math.sqrt((c.x - a.x) ** 2 + (c.y - a.y) ** 2)) * 180 / Math.PI
    tris.push({ a: ia, b: ib, c: ic, area, slope, aspect: 0 })
  }

  return tris
}

function generateContours(points: SurveyPoint[], triangles: TINTriangle[], interval: number): ContourLine[] {
  const contours: ContourLine[] = []
  if (points.length === 0) return contours
  const minZ = Math.min(...points.map(p => p.z))
  const maxZ = Math.max(...points.map(p => p.z))
  for (let elev = Math.ceil(minZ / interval) * interval; elev <= maxZ; elev += interval) {
    const cpoints: [number, number][] = []
    for (const tri of triangles) {
      const pa = points[tri.a], pb = points[tri.b], pc = points[tri.c]
      const vals = [pa.z, pb.z, pc.z]
      const ps = [[pa.x, pa.y], [pb.x, pb.y], [pc.x, pc.y]]
      for (let i = 0; i < 3; i++) {
        const j = (i + 1) % 3
        if ((vals[i] <= elev && vals[j] > elev) || (vals[i] > elev && vals[j] <= elev)) {
          const t = (elev - vals[i]) / (vals[j] - vals[i])
          cpoints.push([
            ps[i][0] + t * (ps[j][0] - ps[i][0]),
            ps[i][1] + t * (ps[j][1] - ps[i][1])
          ])
        }
      }
    }
    if (cpoints.length > 1) {
      let len = 0
      for (let i = 1; i < cpoints.length; i++) {
        len += Math.sqrt((cpoints[i][0] - cpoints[i-1][0]) ** 2 + (cpoints[i][1] - cpoints[i-1][1]) ** 2)
      }
      contours.push({ elevation: elev, points: cpoints, length: len })
    }
  }
  return contours
}

function calculateVolume(points: SurveyPoint[], triangles: TINTriangle[], baseElev: number): VolumeReport {
  let cut = 0, fill = 0, area = 0
  for (const tri of triangles) {
    const pa = points[tri.a], pb = points[tri.b], pc = points[tri.c]
    const avgZ = (pa.z + pb.z + pc.z) / 3
    const diff = avgZ - baseElev
    if (diff > 0) cut += tri.area * diff
    else fill += tri.area * Math.abs(diff)
    area += tri.area
  }
  return { cut, fill, net: cut - fill, area }
}

export default function TopographyHub({ onTelemetry }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [points] = useState(generateSurveyPoints)
  const [triangles, setTriangles] = useState<TINTriangle[]>([])
  const [contours, setContours] = useState<ContourLine[]>([])
  const [volume, setVolume] = useState<VolumeReport>({ cut: 0, fill: 0, net: 0, area: 0 })
  const [layers, setLayers] = useState({ points: true, tin: true, contours: true, labels: false })
  const [selectedPoint, setSelectedPoint] = useState<SurveyPoint | null>(null)
  const [offset, setOffset] = useState({ x: 0, y: 0 })
  const [scale, setScale] = useState(4)
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const [profilePoints, setProfilePoints] = useState<SurveyPoint[]>([])

  useEffect(() => {
    const tris = delaunayTriangulation(points)
    const conts = generateContours(points, tris, 5)
    const vol = calculateVolume(points, tris, 0)
    setTriangles(tris)
    setContours(conts)
    setVolume(vol)
    onTelemetry({ triangles: tris.length, entities: points.length })
  }, [points, onTelemetry])

  const draw = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const w = canvas.width
    const h = canvas.height

    ctx.fillStyle = '#0a0a12'
    ctx.fillRect(0, 0, w, h)

    ctx.strokeStyle = 'rgba(255,165,0,0.05)'
    ctx.lineWidth = 1
    for (let x = 0; x < w; x += 50) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke() }
    for (let y = 0; y < h; y += 50) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke() }

    const toCanvas = (px: number, py: number) => ({
      x: (px - 45) * scale + w / 2 + offset.x,
      y: h - ((py - 45) * scale + h / 2 + offset.y)
    })

    if (layers.tin) {
      for (const tri of triangles) {
        const pa = toCanvas(points[tri.a].x, points[tri.a].y)
        const pb = toCanvas(points[tri.b].x, points[tri.b].y)
        const pc = toCanvas(points[tri.c].x, points[tri.c].y)
        const avgZ = (points[tri.a].z + points[tri.b].z + points[tri.c].z) / 3
        const intensity = (avgZ + 15) / 30
        ctx.fillStyle = `rgba(${100 + intensity * 155}, ${50 + intensity * 100}, ${20 + intensity * 40}, 0.3)`
        ctx.beginPath()
        ctx.moveTo(pa.x, pa.y)
        ctx.lineTo(pb.x, pb.y)
        ctx.lineTo(pc.x, pc.y)
        ctx.closePath()
        ctx.fill()
        ctx.strokeStyle = 'rgba(255,165,0,0.15)'
        ctx.lineWidth = 0.5
        ctx.stroke()
      }
    }

    if (layers.contours) {
      for (const contour of contours) {
        if (contour.points.length < 2) continue
        ctx.strokeStyle = contour.elevation % 10 === 0 ? 'rgba(255,165,0,0.6)' : 'rgba(255,165,0,0.25)'
        ctx.lineWidth = contour.elevation % 10 === 0 ? 1.5 : 0.5
        ctx.beginPath()
        const start = toCanvas(contour.points[0][0], contour.points[0][1])
        ctx.moveTo(start.x, start.y)
        for (let i = 1; i < contour.points.length; i++) {
          const p = toCanvas(contour.points[i][0], contour.points[i][1])
          ctx.lineTo(p.x, p.y)
        }
        ctx.stroke()

        if (layers.labels && contour.elevation % 10 === 0 && contour.points.length > 5) {
          const mid = toCanvas(contour.points[Math.floor(contour.points.length / 2)][0], contour.points[Math.floor(contour.points.length / 2)][1])
          ctx.fillStyle = '#ffa500'
          ctx.font = '10px monospace'
          ctx.fillText(`${contour.elevation.toFixed(0)}m`, mid.x + 5, mid.y)
        }
      }
    }

    if (layers.points) {
      for (const p of points) {
        const c = toCanvas(p.x, p.y)
        ctx.fillStyle = selectedPoint?.id === p.id ? '#4ecdc4' : '#ffa500'
        ctx.beginPath()
        ctx.arc(c.x, c.y, selectedPoint?.id === p.id ? 5 : 2.5, 0, Math.PI * 2)
        ctx.fill()
      }
    }

    if (profilePoints.length === 2) {
      const p1 = toCanvas(profilePoints[0].x, profilePoints[0].y)
      const p2 = toCanvas(profilePoints[1].x, profilePoints[1].y)
      ctx.strokeStyle = '#ff6b6b'
      ctx.lineWidth = 2
      ctx.setLineDash([5, 5])
      ctx.beginPath()
      ctx.moveTo(p1.x, p1.y)
      ctx.lineTo(p2.x, p2.y)
      ctx.stroke()
      ctx.setLineDash([])
    }
  }, [points, triangles, contours, layers, selectedPoint, offset, scale, profilePoints])

  useEffect(() => {
    draw()
  }, [draw])

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true)
    setDragStart({ x: e.clientX - offset.x, y: e.clientY - offset.y })
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging) {
      setOffset({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y })
    }
  }

  const handleMouseUp = () => setIsDragging(false)

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault()
    setScale(s => Math.max(0.5, Math.min(20, s * (e.deltaY < 0 ? 1.2 : 0.8))))
  }

  const handleClick = (e: React.MouseEvent) => {
    if (isDragging) return
    const canvas = canvasRef.current
    if (!canvas) return
    const rect = canvas.getBoundingClientRect()
    const mx = e.clientX - rect.left
    const my = e.clientY - rect.top
    const w = canvas.width
    const h = canvas.height

    let nearest: SurveyPoint | null = null
    let minDist = Infinity
    for (const p of points) {
      const cx = (p.x - 45) * scale + w / 2 + offset.x
      const cy = h - ((p.y - 45) * scale + h / 2 + offset.y)
      const d = Math.sqrt((mx - cx) ** 2 + (my - cy) ** 2)
      if (d < minDist && d < 15) {
        minDist = d
        nearest = p
      }
    }

    if (nearest) {
      if (profilePoints.length < 2) {
        setProfilePoints(prev => [...prev, nearest!])
      } else {
        setProfilePoints([nearest])
      }
      setSelectedPoint(nearest)
    }
  }

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative', display: 'flex' }}>
      <canvas
        ref={canvasRef}
        width={1200}
        height={800}
        style={{ width: '100%', height: '100%', cursor: isDragging ? 'grabbing' : 'crosshair' }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
        onClick={handleClick}
      />
      <div style={{
        position: 'absolute', top: 80, left: 12,
        background: 'rgba(10,10,20,0.9)', color: '#ddd',
        padding: '12px', borderRadius: '8px', border: '1px solid rgba(255,165,0,0.3)',
        fontFamily: 'monospace', fontSize: '0.75rem', width: '180px'
      }}>
        <h4 style={{ color: '#ffa500', margin: '0 0 8px 0' }}>LAYERS</h4>
        {Object.entries(layers).map(([key, val]) => (
          <div key={key} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '2px 0', cursor: 'pointer' }}
            onClick={() => setLayers(l => ({ ...l, [key]: !val }))}>
            <span style={{ color: val ? '#4ecdc4' : '#555' }}>{val ? '☑' : '☐'}</span>
            <span style={{ textTransform: 'uppercase' }}>{key}</span>
          </div>
        ))}
        <hr style={{ borderColor: 'rgba(255,165,0,0.2)', margin: '8px 0' }} />
        <div style={{ color: '#ffa500', fontSize: '0.7rem' }}>
          <div>Points: {points.length}</div>
          <div>Triangles: {triangles.length}</div>
          <div>Contours: {contours.length}</div>
        </div>
      </div>

      {selectedPoint && (
        <div style={{
          position: 'absolute', top: 80, right: 12,
          background: 'rgba(10,10,20,0.95)', color: '#ddd',
          padding: '12px', borderRadius: '8px', border: '1px solid rgba(255,165,0,0.3)',
          fontFamily: 'monospace', fontSize: '0.75rem', width: '200px'
        }}>
          <h4 style={{ color: '#ffa500', margin: '0 0 8px 0' }}>INSPECTOR</h4>
          <div>ID: {selectedPoint.id}</div>
          <div>X: {selectedPoint.x.toFixed(3)}</div>
          <div>Y: {selectedPoint.y.toFixed(3)}</div>
          <div>Z: {selectedPoint.z.toFixed(3)}</div>
          <div>Code: {selectedPoint.code}</div>
          <div>Accuracy: ±{selectedPoint.accuracy}m</div>
        </div>
      )}

      <div style={{
        position: 'absolute', bottom: 80, left: 12,
        background: 'rgba(10,10,20,0.9)', color: '#ddd',
        padding: '12px', borderRadius: '8px', border: '1px solid rgba(255,165,0,0.3)',
        fontFamily: 'monospace', fontSize: '0.75rem', width: '200px'
      }}>
        <h4 style={{ color: '#ffa500', margin: '0 0 8px 0' }}>VOLUME REPORT</h4>
        <div style={{ color: '#4ecdc4' }}>Cut: {volume.cut.toFixed(2)} m³</div>
        <div style={{ color: '#ff6b6b' }}>Fill: {volume.fill.toFixed(2)} m³</div>
        <div style={{ color: '#ffeaa7' }}>Net: {volume.net.toFixed(2)} m³</div>
        <div>Area: {volume.area.toFixed(2)} m²</div>
      </div>

      {profilePoints.length === 2 && (
        <div style={{
          position: 'absolute', bottom: 80, right: 12,
          background: 'rgba(10,10,20,0.95)', color: '#ddd',
          padding: '12px', borderRadius: '8px', border: '1px solid rgba(255,165,0,0.3)',
          fontFamily: 'monospace', fontSize: '0.7rem', width: '280px'
        }}>
          <h4 style={{ color: '#ffa500', margin: '0 0 8px 0' }}>PROFILE</h4>
          <div>{profilePoints[0].id} → {profilePoints[1].id}</div>
          <div>ΔX: {(profilePoints[1].x - profilePoints[0].x).toFixed(2)}m</div>
          <div>ΔY: {(profilePoints[1].y - profilePoints[0].y).toFixed(2)}m</div>
          <div>ΔZ: {(profilePoints[1].z - profilePoints[0].z).toFixed(2)}m</div>
          <div>Dist: {Math.sqrt((profilePoints[1].x - profilePoints[0].x) ** 2 + (profilePoints[1].y - profilePoints[0].y) ** 2).toFixed(2)}m</div>
          <div>Slope: {(Math.atan2(profilePoints[1].z - profilePoints[0].z, Math.sqrt((profilePoints[1].x - profilePoints[0].x) ** 2 + (profilePoints[1].y - profilePoints[0].y) ** 2)) * 180 / Math.PI).toFixed(1)}°</div>
        </div>
      )}
    </div>
  )
}
