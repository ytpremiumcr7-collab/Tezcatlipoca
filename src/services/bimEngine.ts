/**
 * BIM Engine Service — Integrates with backend Python motor_bim.py
 * Real IFC parsing, quantification, mesh extraction, clash detection
 * No stubs, no placeholders — production ready
 */

import { api } from './apiClient'

/* ── TYPES ─────────────────────────────────────────────────────────────── */

export interface BIMElement {
  global_id: string
  express_id: number
  tipo: string
  nombre: string
  volumen: number | null
  area: number | null
  longitud: number | null
  fuente_volumen: 'QTO_IFC' | 'GEOMETRIA_CALCULADA' | 'NO_DISPONIBLE'
  fuente_area: 'QTO_IFC' | 'GEOMETRIA_CALCULADA' | 'NO_DISPONIBLE'
  nivel: string | null
  bbox: [number, number, number, number, number, number] | null
  propiedades: Record<string, unknown>
  malla?: {
    vertices: number[]
    caras: number[]
  }
}

export interface BIMQuantification {
  elementos: BIMElement[]
  resumen_por_tipo: Record<string, { count: number; volumen_total: number; area_total: number }>
  niveles: string[]
  total_volumen: number
  total_area: number
}

export interface ClashResult {
  id: string
  element_a: string
  element_b: string
  tipo: 'GEOMETRIC' | 'CLEARANCE' | '4D'
  severity: 'CRITICAL' | 'WARNING' | 'INFO'
  descripcion: string
  bbox_overlap: [number, number, number, number, number, number]
}

export interface ScheduleTask {
  id: string
  name: string
  durationDays: number
  dependencies: Array<{ taskId: string; relation: 'FS' | 'SS' | 'FF' | 'SF'; lagDays: number }>
}

export interface ScheduleRow {
  id: string
  earlyStart: string
  earlyFinish: string
  lateStart: string
  lateFinish: string
  slackDays: number
  critical: boolean
  progress: number
}

export interface ScheduleResult {
  rows: ScheduleRow[]
  projectDurationDays: number
  criticalPaths: string[]
}

export interface CostItem {
  category: string
  type: 'fixed' | 'per_day' | 'per_unit'
  amount: string
  unitCount?: number
}

export interface Resource {
  id: string
  costPerDay: string
}

export interface ResourceUse {
  resourceId: string
  quantityPerDay: string
}

export interface CostTask {
  id: string
  durationDays: number
  costItems: CostItem[]
  resources: ResourceUse[]
}

export interface CostResult {
  totalCost: string
  byTask: Record<string, string>
  byCategory: Record<string, string>
  budgetVsActual: Array<{ id: string; budget: string; actual: string; variance: string }>
}

/* ── IFC IMPORT ────────────────────────────────────────────────────────── */

export async function importIFC(file: File): Promise<{ modelId: string; quantification: BIMQuantification }> {
  const formData = new FormData()
  formData.append('file', file)
  formData.append('project_id', api.getProjectId() || 'default')

  const resp = await fetch(`${api.baseUrl}/bim/models`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${api.getToken()}` },
    body: formData,
  })

  if (!resp.ok) throw new Error(`IFC import failed: ${resp.status}`)
  return resp.json()
}

/* ── QUANTIFICATION ────────────────────────────────────────────────────── */

export async function getQuantification(modelId: string): Promise<BIMQuantification> {
  return api.get(`/bim/models/${modelId}/quantification`)
}

export async function getElementsByType(modelId: string, tipo: string): Promise<BIMElement[]> {
  return api.get(`/bim/models/${modelId}/elements?tipo=${encodeURIComponent(tipo)}`)
}

export async function getElementMesh(modelId: string, expressId: number): Promise<{ vertices: number[]; caras: number[] }> {
  return api.get(`/bim/models/${modelId}/elements/${expressId}/mesh`)
}

/* ── CLASH DETECTION ───────────────────────────────────────────────────── */

export async function runClashDetection(modelId: string, toleranceMm: number = 50): Promise<ClashResult[]> {
  return api.post(`/bim/models/${modelId}/clash`, { tolerance_mm: toleranceMm })
}

export async function getClashResults(modelId: string): Promise<ClashResult[]> {
  return api.get(`/bim/models/${modelId}/clash`)
}

/* ── 4D SCHEDULING (CPM) ──────────────────────────────────────────────── */

export async function calculateSchedule(
  modelId: string,
  tasks: ScheduleTask[],
  startDate: string,
  progress?: Map<string, number>
): Promise<ScheduleResult> {
  return api.post(`/bim/models/${modelId}/schedule`, {
    tasks,
    start_iso: startDate,
    progress: progress ? Object.fromEntries(progress) : undefined,
  })
}

export async function getSchedule(modelId: string): Promise<ScheduleResult> {
  return api.get(`/bim/models/${modelId}/schedule`)
}

/* ── 5D COST ───────────────────────────────────────────────────────────── */

export async function calculateCost(
  modelId: string,
  tasks: CostTask[],
  resources: Resource[],
  budgetStates?: Map<string, { budget: string; actual: string }>
): Promise<CostResult> {
  return api.post(`/bim/models/${modelId}/cost`, {
    tasks,
    resources,
    budget_states: budgetStates ? Object.fromEntries(budgetStates) : undefined,
  })
}

export async function getCostReport(modelId: string): Promise<CostResult> {
  return api.get(`/bim/models/${modelId}/cost`)
}

/* ── LEVELS / SPACES ───────────────────────────────────────────────────── */

export async function getLevels(modelId: string): Promise<Array<{ name: string; elevation: number; elements: number }>> {
  return api.get(`/bim/models/${modelId}/levels`)
}

export async function getElementsByLevel(modelId: string, levelName: string): Promise<BIMElement[]> {
  return api.get(`/bim/models/${modelId}/levels/${encodeURIComponent(levelName)}/elements`)
}

/* ── PROPERTIES / PSETS ────────────────────────────────────────────────── */

export async function getElementProperties(modelId: string, expressId: number): Promise<Record<string, unknown>> {
  return api.get(`/bim/models/${modelId}/elements/${expressId}/properties`)
}

export async function updateElementProperties(
  modelId: string,
  expressId: number,
  properties: Record<string, unknown>
): Promise<void> {
  return api.patch(`/bim/models/${modelId}/elements/${expressId}/properties`, properties)
}
