import type { GraphNode, GraphLink } from '../engines/types.ts'

interface LouvainNode {
  id: string
  community: number
  degree: number
  neighbors: Map<string, number>
}

export function louvainClustering(nodes: GraphNode[], links: GraphLink[], resolution = 1.0, iterations = 10): number[] {
  const nodeMap = new Map<string, LouvainNode>()

  for (const n of nodes) {
    nodeMap.set(n.id, { id: n.id, community: nodes.indexOf(n), degree: 0, neighbors: new Map() })
  }

  let totalWeight = 0
  for (const link of links) {
    const s = typeof link.source === 'string' ? link.source : (link.source as GraphNode).id
    const t = typeof link.target === 'string' ? link.target : (link.target as GraphNode).id
    const w = link.weight || 1
    const sn = nodeMap.get(s)
    const tn = nodeMap.get(t)
    if (sn && tn) {
      sn.neighbors.set(t, (sn.neighbors.get(t) || 0) + w)
      tn.neighbors.set(s, (tn.neighbors.get(s) || 0) + w)
      sn.degree += w
      tn.degree += w
      totalWeight += w
    }
  }

  if (totalWeight === 0) return nodes.map(() => 0)

  const communities = new Map<number, { nodes: Set<string>; degree: number }>()
  for (const [id, node] of nodeMap) {
    communities.set(node.community, { nodes: new Set([id]), degree: node.degree })
  }

  for (let iter = 0; iter < iterations; iter++) {
    let moved = false

    for (const [id, node] of nodeMap) {
      const currentComm = node.community
      const commWeights = new Map<number, number>()

      for (const [neighborId, weight] of node.neighbors) {
        const neighbor = nodeMap.get(neighborId)
        if (neighbor) {
          const comm = neighbor.community
          commWeights.set(comm, (commWeights.get(comm) || 0) + weight)
        }
      }

      let bestComm = currentComm
      let bestGain = 0
      const currentCommData = communities.get(currentComm)
      const ki = node.degree

      for (const [comm, weight] of commWeights) {
        if (comm === currentComm) continue
        const commData = communities.get(comm)
        if (!commData) continue
        const sigmaTot = commData.degree
        const gain = weight - resolution * ki * sigmaTot / (2 * totalWeight)
        if (gain > bestGain) {
          bestGain = gain
          bestComm = comm
        }
      }

      if (bestComm !== currentComm && currentCommData) {
        currentCommData.nodes.delete(id)
        currentCommData.degree -= ki
        const newCommData = communities.get(bestComm)
        if (newCommData) {
          newCommData.nodes.add(id)
          newCommData.degree += ki
        }
        node.community = bestComm
        moved = true
      }
    }

    if (!moved) break
  }

  // Reindex communities
  const commMap = new Map<number, number>()
  let nextComm = 0
  const result: number[] = []
  for (const n of nodes) {
    const node = nodeMap.get(n.id)
    if (node) {
      if (!commMap.has(node.community)) {
        commMap.set(node.community, nextComm++)
      }
      result.push(commMap.get(node.community)!)
    } else {
      result.push(0)
    }
  }

  return result
}
