// =============================================================================
// TEZCATLIPOCA v2 — TIPOS CANÓNICOS
// Basado en la spec: tezcatlipoca_frontend_fusion_definitive_spec.py
// =============================================================================

// ---------------------------------------------------------------------------
// 1. ESTADOS DE DATOS
// ---------------------------------------------------------------------------
export type DataState = 'REAL' | 'CACHED' | 'STALE' | 'SIMULATED' | 'UNAVAILABLE' | 'ERROR'

export type DatasetLifecycle = 'DRAFT' | 'VALIDATED' | 'APPROVED' | 'REJECTED'

// ---------------------------------------------------------------------------
// 2. ENTIDADES ESPACIALES
// ---------------------------------------------------------------------------
export type EntityType =
  | 'SATELLITE' | 'AIRCRAFT' | 'VESSEL'
  | 'EARTHQUAKE' | 'EVENT'
  | 'SURVEY_POINT' | 'CONTROL_POINT' | 'SURFACE'
  | 'TIN' | 'DEM' | 'DTM' | 'DSM'
  | 'POINT_CLOUD' | 'RASTER' | 'PROFILE' | 'CONTOUR_SET'
  | 'VOLUME_RESULT' | 'TERRAIN_ANALYSIS'
  | 'BIM_MODEL' | 'BIM_ELEMENT' | 'BIM_SPACE' | 'BIM_LEVEL' | 'BIM_CLASH'
  | 'INFRASTRUCTURE_ASSET' | 'DIGITAL_TWIN'
  | 'ANALYSIS_RESULT' | 'SNAPSHOT' | 'REPORT' | 'EXPORT'

export interface SpatialEntity {
  id: string
  type: EntityType
  geometry: Record<string, unknown> | null
  source: string
  timestamp: string
  observed_at: string | null
  state: DataState
  metadata: Record<string, unknown>
  quality: number // 0-1
  provenance: ProvenanceRecord
  relations: EntityRelation[]
  actions: AuthorizedAction[]
}

export interface ProvenanceRecord {
  source: string
  extracted_at: string
  validator: string
  confidence: number
}

export interface EntityRelation {
  target_id: string
  relation_type: string
  strength: number
}

export interface AuthorizedAction {
  action: string
  allowed: boolean
  reason?: string
}

// ---------------------------------------------------------------------------
// 3. VISTA Y CÁMARA
// ---------------------------------------------------------------------------
export type ViewMode = 'map' | 'earth' | 'globe' | 'space'
export type QualityProfile = 'low' | 'medium' | 'high' | 'cinematic' | 'safe'

export interface CameraState {
  position: [number, number, number]
  target: [number, number, number]
  zoom: number
  heading: number
  pitch: number
}

// ---------------------------------------------------------------------------
// 4. HERRAMIENTAS (TOOL BUTTONS)
// ---------------------------------------------------------------------------
export type ToolType =
  | 'none'
  | 'survey'      // Topografía: puntos, poligonales, niveles
  | 'bim'         // BIM: modelos, elementos, clash
  | 'pointcloud'  // Nube de puntos: LAS/LAZ, LOD
  | 'terrain'     // Terreno: análisis, visibilidad, drenaje
  | 'measure'     // Medición: distancias, áreas, volúmenes
  | 'report'      // Reportes: exportar, QA/QC

export interface ToolConfig {
  id: ToolType
  label: string
  icon: string
  description: string
  requiresBackend: boolean
  maxConcurrent: number
}

// ---------------------------------------------------------------------------
// 5. TELEMETRÍA Y HUD
// ---------------------------------------------------------------------------
export interface TelemetryData {
  fps: number
  frameTime: number
  entitiesRendered: number
  entitiesTotal: number
  chunksLoaded: number
  chunksTotal: number
  memoryMB: number
  gpuTier: 'low' | 'mid' | 'high'
  rendererState: 'READY' | 'DEGRADED' | 'OFFLINE' | 'FAULT'
  dataState: DataState
  streamPressure: number // 0-1
}

// ---------------------------------------------------------------------------
// 6. CAPAS
// ---------------------------------------------------------------------------
export interface Layer {
  id: string
  name: string
  domain: string
  visible: boolean
  opacity: number
  entityCount: number
  freshness: DataState
  source: string
}

// ---------------------------------------------------------------------------
// 7. TIEMPO
// ---------------------------------------------------------------------------
export interface TimeState {
  current: number // ms epoch
  rate: number    // 1 = realtime, 0 = paused, >1 = fast-forward
  isPlaying: boolean
  range: [number, number]
  markers: TimeMarker[]
}

export interface TimeMarker {
  timestamp: number
  label: string
  type: 'event' | 'snapshot' | 'job'
}

// ---------------------------------------------------------------------------
// 8. SNAPSHOTS
// ---------------------------------------------------------------------------
export interface Snapshot {
  id: string
  name: string
  created_at: string
  world_hash: string
  camera: CameraState
  viewMode: ViewMode
  layers: string[] // layer IDs
  selectedEntities: string[]
  spatialContext: string
  time: TimeState
  workspace: string
  filters: Record<string, unknown>
  renderProfile: QualityProfile
  jobReferences: string[]
}

// ---------------------------------------------------------------------------
// 9. JOBS / BACKEND
// ---------------------------------------------------------------------------
export interface Job {
  id: string
  type: string
  status: 'queued' | 'running' | 'completed' | 'failed' | 'cancelled'
  progress: number // 0-100
  message: string
  created_at: string
  completed_at: string | null
  result_id: string | null
}

// ---------------------------------------------------------------------------
// 10. SATÉLITES (LEO)
// ---------------------------------------------------------------------------
export interface SatInfo {
  name: string
  norad: number
  l1: string
  l2: string
  group: number
  epochMs: number
}

export interface UiGroupDef {
  key: string
  label: string
  color: string
  size: number
}

export type DataSource = 'live' | 'cached' | 'snapshot'

export interface Dataset {
  sats: SatInfo[]
  counts: number[]
  epochMs: number
  source: DataSource
  fetchedAt: number
  total: number
}

// ---------------------------------------------------------------------------
// 11. BIM
// ---------------------------------------------------------------------------
export interface BIMElement {
  global_id: string
  express_id: number
  tipo: string
  nombre: string
  volumen: number | null
  area: number | null
  longitud: number | null
  fuente_volumen: 'QTO_IFC' | 'GEOMETRIA_CALCULADA' | 'NO_DISPONIBLE'
  fuente_area: string
  nivel: string | null
  bbox: [number, number, number, number, number, number] | null
  propiedades: Record<string, unknown>
  malla: { vertices: number[]; caras: number[] } | null
}

export interface BIMModel {
  id: string
  nombre: string
  elementos: BIMElement[]
  niveles: string[]
  total_volumen: number
  total_area: number
}

// ---------------------------------------------------------------------------
// 12. TOPOGRAFÍA
// ---------------------------------------------------------------------------
export interface SurveyPoint {
  id: string
  x: number
  y: number
  z: number
  identificador: string
}

export interface TINTriangle {
  vertices: [number, number, number][]
  area: number
  slope: number
}

export interface VolumeReport {
  cut_volume: number
  fill_volume: number
  net_volume: number
  method: string
}

export interface QAReport {
  ok: boolean
  issues: QAIssue[]
  metrics: Record<string, unknown>
}

export interface QAIssue {
  code: string
  severity: 'error' | 'warning' | 'info'
  message: string
  location: string | null
  details: Record<string, unknown>
}

// ---------------------------------------------------------------------------
// 13. RESPUESTAS BACKEND
// ---------------------------------------------------------------------------
export interface ApiError {
  code: string
  message: string
  status: number
  details?: Record<string, unknown>
}

export type ApiStatus = 401 | 403 | 404 | 409 | 412 | 413 | 429 | 500 | 503

export const API_STATUS_MAP: Record<ApiStatus, string> = {
  401: 'Autenticación requerida',
  403: 'No autorizado',
  404: 'Recurso no disponible',
  409: 'Conflicto',
  412: 'Versión del mundo obsoleta',
  413: 'Payload demasiado grande',
  429: 'Rate limit excedido',
  500: 'Error del backend',
  503: 'Backend no disponible',
}
