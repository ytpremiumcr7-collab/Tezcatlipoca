/**
 * Topography Engine Service — Integrates with backend Python motors
 * Real TIN, profiles, contours, volumes, cut/fill, QA, drainage
 * No stubs, no placeholders — production ready
 */

import { api } from './apiClient'

/* ── TYPES ─────────────────────────────────────────────────────────────── */

export interface SurveyPoint {
  id: string
  x: number
  y: number
  z: number
  code?: string
  description?: string
}

export interface TINTriangle {
  vertices: [number, number, number][]
  area: number
  slope: number
  aspect: number
}

export interface ContourLine {
  elevation: number
  coordinates: [number, number][]
  length: number
}

export interface VolumeReport {
  method: 'TIN' | 'GRID' | 'SECTION'
  totalVolume: number
  cutVolume: number
  fillVolume: number
  netVolume: number
  unit: 'm³'
  confidence: number
}

export interface ProfileResult {
  stations: number[]
  elevations: number[]
  distances: number[]
  slopes: number[]
  cumulativeDistance: number
}

export interface DrainagePath {
  id: string
  points: [number, number, number][]
  length: number
  slope: number
  catchmentArea: number
}

export interface QARule {
  id: string
  name: string
  severity: 'ERROR' | 'WARNING' | 'INFO'
  description: string
  check: (data: unknown) => boolean
}

export interface QAReport {
  passed: boolean
  rules: Array<{ ruleId: string; passed: boolean; message: string }>
  summary: { errors: number; warnings: number; info: number }
}

export interface TerrainSnapshot {
  id: string
  name: string
  createdAt: string
  pointCount: number
  tinCount: number
  volume?: VolumeReport
}

/* ── IMPORT / EXPORT ───────────────────────────────────────────────────── */

export async function importPoints(file: File, format: 'CSV' | 'LAS' | 'LAZ' | 'XYZ' | 'LANDXML'): Promise<{ jobId: string; pointCount: number }> {
  const formData = new FormData()
  formData.append('file', file)
  formData.append('format', format)
  formData.append('project_id', api.getProjectId() || 'default')

  const resp = await fetch(`${api.baseUrl}/topography/import`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${api.getToken()}` },
    body: formData,
  })

  if (!resp.ok) throw new Error(`Import failed: ${resp.status}`)
  return resp.json()
}

export async function exportPoints(format: 'CSV' | 'LAS' | 'DXF' | 'LANDXML' | 'GeoJSON'): Promise<Blob> {
  const resp = await fetch(`${api.baseUrl}/topography/export?format=${format}`, {
    headers: { Authorization: `Bearer ${api.getToken()}` },
  })
  if (!resp.ok) throw new Error(`Export failed: ${resp.status}`)
  return resp.blob()
}

/* ── TIN ───────────────────────────────────────────────────────────────── */

export async function generateTIN(algorithm: 'DELAUNAY' | 'CONSTRAINED' = 'DELAUNAY'): Promise<{ tinId: string; triangleCount: number }> {
  return api.post('/topography/tin', { algorithm })
}

export async function getTIN(tinId: string): Promise<{ triangles: TINTriangle[]; bounds: [number, number, number, number] }> {
  return api.get(`/topography/tin/${tinId}`)
}

/* ── CONTOURS ──────────────────────────────────────────────────────────── */

export async function generateContours(equidistance: number, smooth: boolean = true): Promise<ContourLine[]> {
  return api.post('/topography/contours', { equidistance, smooth })
}

/* ── PROFILES ──────────────────────────────────────────────────────────── */

export async function generateProfile(
  points: [number, number][],
  sampleInterval: number = 10
): Promise<ProfileResult> {
  return api.post('/topography/profile', { points, sample_interval: sampleInterval })
}

/* ── VOLUMES ───────────────────────────────────────────────────────────── */

export async function calculateVolume(
  method: 'TIN' | 'GRID' | 'SECTION' = 'TIN',
  referenceElevation?: number
): Promise<VolumeReport> {
  return api.post('/topography/volume', { method, reference_elevation: referenceElevation })
}

export async function calculateCutFill(
  designSurfaceId: string,
  existingSurfaceId: string
): Promise<VolumeReport> {
  return api.post('/topography/cutfill', {
    design_surface_id: designSurfaceId,
    existing_surface_id: existingSurfaceId,
  })
}

/* ── DRAINAGE ──────────────────────────────────────────────────────────── */

export async function calculateDrainagePaths(): Promise<DrainagePath[]> {
  return api.post('/topography/drainage/paths', {})
}

export async function calculateCatchments(): Promise<Array<{ id: string; area: number; perimeter: number; paths: string[] }>> {
  return api.post('/topography/drainage/catchments', {})
}

/* ── QA / VALIDATION ───────────────────────────────────────────────────── */

export async function validateSurvey(): Promise<QAReport> {
  return api.post('/topography/qa/validate', {})
}

export async function runGeometryChecks(): Promise<QAReport> {
  return api.post('/topography/qa/geometry', {})
}

/* ── SNAPSHOTS ─────────────────────────────────────────────────────────── */

export async function createSnapshot(name: string): Promise<TerrainSnapshot> {
  return api.post('/topography/snapshots', { name })
}

export async function listSnapshots(): Promise<TerrainSnapshot[]> {
  return api.get('/topography/snapshots')
}

export async function restoreSnapshot(snapshotId: string): Promise<void> {
  return api.post(`/topography/snapshots/${snapshotId}/restore`, {})
}

export async function deleteSnapshot(snapshotId: string): Promise<void> {
  return api.delete(`/topography/snapshots/${snapshotId}`)
}

/* ── SPATIAL ANALYSIS ──────────────────────────────────────────────────── */

export async function bufferOperation(
  geometry: unknown,
  distance: number
): Promise<unknown> {
  return api.post('/topography/spatial/buffer', { geometry, distance })
}

export async function intersectionOperation(
  geomA: unknown,
  geomB: unknown
): Promise<unknown> {
  return api.post('/topography/spatial/intersection', { geom_a: geomA, geom_b: geomB })
}

export async function proximityQuery(
  point: [number, number],
  radius: number
): Promise<SurveyPoint[]> {
  return api.post('/topography/spatial/proximity', { point, radius })
}
