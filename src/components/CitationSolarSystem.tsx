import { useMemo, useRef, useState } from 'react'
import ForceGraph3D from 'react-force-graph-3d'
import type { QualityProfile } from '../engines/types'
import papersData from '../data/papers.json'

interface Props {
  onClose: () => void
  quality: QualityProfile
}

const FIELD_COLORS: Record<string, string> = {
  'Special Relativity': '#3498db',
  'General Relativity': '#e74c3c',
  'Black Holes': '#9b59b6',
  'Cosmology': '#1abc9c',
  'Quantum Theory': '#f39c12',
  'Particle Physics': '#2ecc71',
  'Thermodynamics': '#e67e22',
  'Fluid Dynamics': '#16a085',
  'Photogrammetry': '#d35400',
  'LiDAR': '#27ae60',
  'TIN': '#8e44ad',
  'Interpolation': '#2980b9',
  'DEM': '#c0392b',
  'Hydrology': '#f1c40f',
  'Terrain Analysis': '#2c3e50',
  'GIS': '#1abc9c',
  'Spatial Analysis': '#e74c3c',
  'Geostatistics': '#3498db',
  'Spatial Stats': '#9b59b6',
  'Point Patterns': '#e67e22',
  'Voronoi': '#16a085',
  'Comp. Geometry': '#d35400',
  'Spatial Indexing': '#27ae60',
  'R-Tree': '#8e44ad',
  'Spatial DB': '#2980b9',
  'String Theory': '#c0392b',
  'Quantum Computing': '#f1c40f',
  'Inflation': '#2c3e50',
  'CMB': '#3498db',
  'Dark Energy': '#e74c3c',
}

export default function CitationSolarSystem({ onClose, quality }: Props) {
  const fgRef = useRef<any>(null)
  const [selectedNode, setSelectedNode] = useState<any>(null)

  const graphData = useMemo(() => {
    const nodes = papersData.nodes.map(n => {
      const field = n.abstract.split('to ').pop()?.split('.')[0] || 'Unknown'
      return {
        ...n,
        color: FIELD_COLORS[field] || '#888888',
        val: Math.sqrt(n.citations) * 0.5 + 3,
        field,
      }
    })
    return { nodes, links: papersData.links }
  }, [])

  return (
    <div style={{
      position: 'absolute', top: '60px', left: '20px', right: '20px', bottom: '60px',
      zIndex: 100, background: 'rgba(5,5,10,0.98)',
      borderRadius: '16px', border: '1px solid rgba(255,165,0,0.2)',
      display: 'flex', flexDirection: 'column', overflow: 'hidden',
      boxShadow: '0 0 60px rgba(0,0,0,0.8)'
    }}>
      <div style={{
        padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,0.05)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between'
      }}>
        <div>
          <h2 style={{ margin: 0, color: '#ffa500', fontSize: '18px' }}>Sistema Solar del Conocimiento</h2>
          <p style={{ margin: '4px 0 0', color: '#888', fontSize: '12px' }}>
            {papersData.metadata.totalPapers} papers &bull; {papersData.metadata.totalCitations.toLocaleString()} citaciones &bull; {papersData.metadata.communities} comunidades
          </p>
        </div>
        <button onClick={onClose} style={{
          background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: '8px', color: '#ddd', padding: '8px 16px', cursor: 'pointer',
          fontFamily: 'inherit', fontSize: '13px'
        }}>✕ Cerrar</button>
      </div>

      <div style={{ flex: 1, position: 'relative' }}>
        <ForceGraph3D
          ref={fgRef}
          graphData={graphData as any}
          nodeLabel={(n: any) => `${n.title} (${n.year}) — ${n.citations} citas`}
          nodeColor={(n: any) => n.color}
          nodeVal={(n: any) => n.val}
          linkColor={() => 'rgba(255,255,255,0.06)'}
          linkWidth={0.3}
          backgroundColor="#05050a"
          onNodeClick={setSelectedNode as any}
          warmupTicks={quality === 'ultra' ? 200 : quality === 'high' ? 120 : 60}
          cooldownTicks={50}
          d3AlphaDecay={0.02}
          d3VelocityDecay={0.3}
        />

        {selectedNode && (
          <div style={{
            position: 'absolute', bottom: '20px', right: '20px',
            background: 'rgba(15,15,25,0.95)', border: '1px solid rgba(255,165,0,0.2)',
            borderRadius: '12px', padding: '20px', maxWidth: '400px',
            color: '#ddd', fontSize: '13px', fontFamily: 'inherit'
          }}>
            <h3 style={{ color: '#ffa500', margin: '0 0 8px', fontSize: '15px' }}>{selectedNode.title}</h3>
            <p style={{ margin: '4px 0' }}><strong style={{ color: '#aaa' }}>Autor:</strong> {selectedNode.authors}</p>
            <p style={{ margin: '4px 0' }}><strong style={{ color: '#aaa' }}>Año:</strong> {selectedNode.year}</p>
            <p style={{ margin: '4px 0' }}><strong style={{ color: '#aaa' }}>Citas:</strong> {selectedNode.citations}</p>
            <p style={{ margin: '4px 0' }}><strong style={{ color: '#aaa' }}>Campo:</strong> <span style={{ color: selectedNode.color }}>{selectedNode.field}</span></p>
            <p style={{ color: '#888', fontSize: '12px', lineHeight: 1.5, margin: '8px 0' }}>{selectedNode.abstract}</p>
            <a href={selectedNode.url} target="_blank" rel="noopener noreferrer" style={{ color: '#4ecdc4', textDecoration: 'none' }}>Ver paper &rarr;</a>
          </div>
        )}
      </div>
    </div>
  )
}
