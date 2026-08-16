import { useEffect, useRef, useState, useMemo, useCallback } from 'react'
import ForceGraph3D from 'react-force-graph-3d'
import type { GraphData, GraphNode, QualityProfile } from '../engines/types'
import { louvainClustering } from '../utils/louvain'

interface Props {
  quality: QualityProfile
  onTelemetry: (t: { nodes: number; edges: number }) => void
}

const COMMUNITY_COLORS = [
  '#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', '#ffeaa7',
  '#dfe6e9', '#fd79a8', '#a29bfe', '#00b894', '#e17055',
  '#74b9ff', '#55efc4', '#ff7675', '#fab1a0', '#fdcb6e'
]

export default function CitationStarMap({ quality, onTelemetry }: Props) {
  const [graphData, setGraphData] = useState<GraphData | null>(null)
  const [hoverNode, setHoverNode] = useState<GraphNode | null>(null)
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null)
  const fgRef = useRef<any>(null)

  useEffect(() => {
    fetch('/src/data/papers.json')
      .then(r => r.json())
      .then((data: GraphData) => {
        const communities = louvainClustering(data.nodes, data.links, 1.0, 15)
        data.nodes.forEach((n, i) => { n.community = communities[i] })
        setGraphData(data)
        onTelemetry({ nodes: data.nodes.length, edges: data.links.length })
      })
  }, [onTelemetry])

  const coloredData = useMemo(() => {
    if (!graphData) return { nodes: [], links: [] }
    return {
      nodes: graphData.nodes.map(n => ({
        ...n,
        color: COMMUNITY_COLORS[n.community % COMMUNITY_COLORS.length],
        val: Math.sqrt(n.citations) * 0.3 + 2
      })),
      links: graphData.links
    }
  }, [graphData])

  const handleNodeClick = useCallback((node: any) => {
    setSelectedNode(node)
    if (fgRef.current) {
      fgRef.current.cameraPosition(
        { x: node.x * 1.5, y: node.y * 1.5, z: node.z * 1.5 },
        { x: node.x, y: node.y, z: node.z },
        1500
      )
    }
  }, [])

  if (!graphData) return <div style={{ color: '#ffa500', textAlign: 'center', marginTop: '40vh' }}>Loading Citation Network...</div>

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative' }}>
      <ForceGraph3D
        ref={fgRef}
        graphData={coloredData as any}
        nodeLabel={(n: any) => `${n.title} (${n.year}) - ${n.citations} citations`}
        nodeColor={(n: any) => n.color}
        nodeVal={(n: any) => n.val}
        linkColor={() => 'rgba(255,255,255,0.08)'}
        linkWidth={0.5}
        linkOpacity={0.4}
        backgroundColor="#000000"
        onNodeHover={setHoverNode as any}
        onNodeClick={handleNodeClick}
        warmupTicks={quality === 'ultra' ? 200 : quality === 'high' ? 120 : 60}
        cooldownTicks={50}
        d3AlphaDecay={0.02}
        d3VelocityDecay={0.3}
      />
      {hoverNode && (
        <div style={{
          position: 'absolute', top: 80, left: 12,
          background: 'rgba(10,10,20,0.9)', color: '#ffa500',
          padding: '12px', borderRadius: '8px', border: '1px solid rgba(255,165,0,0.3)',
          fontFamily: 'monospace', fontSize: '0.75rem', maxWidth: '320px', pointerEvents: 'none'
        }}>
          <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>{hoverNode.title}</div>
          <div>{hoverNode.authors} ({hoverNode.year})</div>
          <div>Citations: {hoverNode.citations}</div>
          <div>Community: {hoverNode.community}</div>
        </div>
      )}
      {selectedNode && (
        <div style={{
          position: 'absolute', top: 80, right: 12,
          background: 'rgba(10,10,20,0.95)', color: '#ddd',
          padding: '16px', borderRadius: '8px', border: '1px solid rgba(255,165,0,0.3)',
          fontFamily: 'monospace', fontSize: '0.8rem', maxWidth: '380px',
          maxHeight: '60vh', overflow: 'auto'
        }}>
          <h3 style={{ color: '#ffa500', marginTop: 0 }}>{selectedNode.title}</h3>
          <p><strong>Authors:</strong> {selectedNode.authors}</p>
          <p><strong>Year:</strong> {selectedNode.year}</p>
          <p><strong>Citations:</strong> {selectedNode.citations}</p>
          <p><strong>Community:</strong> {selectedNode.community}</p>
          <p><strong>DOI:</strong> {selectedNode.doi}</p>
          <p style={{ fontSize: '0.75rem', color: '#888', lineHeight: 1.4 }}>{selectedNode.abstract}</p>
          <a href={selectedNode.url} target="_blank" rel="noopener noreferrer" style={{ color: '#4ecdc4' }}>Open DOI</a>
        </div>
      )}
    </div>
  )
}
