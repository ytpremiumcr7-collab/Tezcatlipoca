export type ViewMode = 'map' | 'earth' | 'globe'
export type QualityProfile = 'low' | 'medium' | 'high' | 'ultra'
export type Workspace = 'explore' | 'layers' | 'survey' | 'terrain' | 'bim' | 'observe' | 'events' | 'astronomy' | 'simulation' | 'analyze' | 'deliver'
export type Freshness = 'REAL' | 'CACHED' | 'STALE' | 'SIMULATED' | 'UNAVAILABLE' | 'ERROR'

export interface TelemetryData {
  fps: number
  nodes: number
  edges: number
  entities: number
  triangles?: number
  drawCalls?: number
}

export interface Project {
  id: string
  name: string
  location: string
  status: 'active' | 'review' | 'inactive'
  crs: string
}

export interface Alert {
  id: number
  type: 'structural' | 'volume' | 'slope' | 'seismic' | 'weather'
  severity: 'high' | 'medium' | 'low'
  title: string
  description: string
  time: string
}

export interface GraphNode {
  id: string
  title: string
  authors: string | string[]
  year: number
  abstract: string
  doi?: string
  url?: string
  citations: number
  community: number
  x?: number
  y?: number
  z?: number
}

export interface GraphLink {
  source: string
  target: string
  type: 'citation' | 'cocitation'
  weight: number
}

export interface GraphData {
  nodes: GraphNode[]
  links: GraphLink[]
  metadata: {
    totalPapers: number
    totalCitations: number
    communities: number
    dataCompleteness: number
    generatedAt: string
    source: string
  }
}

export interface SurveyPoint {
  id: string
  x: number
  y: number
  z: number
  code: string
  description: string
  elevation: number
  accuracy?: number
}

export interface TINTriangle {
  a: number
  b: number
  c: number
  area: number
  slope: number
  aspect: number
}

export interface TerrainModel {
  points: SurveyPoint[]
  triangles: TINTriangle[]
  contours: ContourLine[]
  volumes: VolumeReport
}

export interface ContourLine {
  elevation: number
  points: [number, number][]
  length: number
}

export interface VolumeReport {
  cut: number
  fill: number
  net: number
  area: number
}

export interface GeoEntity {
  id: string
  type: 'point' | 'line' | 'polygon' | 'mesh'
  coordinates: number[] | number[][] | number[][][]
  properties: Record<string, unknown>
  visible: boolean
  style?: Record<string, unknown>
}

export interface Layer {
  id: string
  name: string
  visible: boolean
  opacity: number
  entities: GeoEntity[]
  type: 'vector' | 'raster' | 'terrain' | 'pointcloud' | 'mesh' | 'bim' | 'satellite' | 'event'
  freshness: Freshness
}

export interface BlackHoleParams {
  blackHoleMass: number
  accretionRate: number
  diskInnerRadius: number
  diskOuterRadius: number
  diskTemperature: number
  inclination: number
  dopplerFactor: number
  redshift: number
  bloomStrength: number
  exposure: number
  timeScale: number
  turbulence: number
}

export interface CameraState {
  position: [number, number, number]
  target: [number, number, number]
  up: [number, number, number]
  fov: number
  near: number
  far: number
}

export interface VolumeChartItem {
  label: string
  value: number
  color: string
}

export interface VolumeData {
  cut: number
  fill: number
  net: number
  area: number
  precision: number
  chartData: VolumeChartItem[]
}

export interface RiskIndicator {
  name: string
  value: number
  level: 'Alto' | 'Medio' | 'Bajo'
}

export interface RiskIndicators {
  overall: number
  level: string
  items: RiskIndicator[]
}

export interface Coordinates {
  lat: number
  lon: number
  elev: number
}
