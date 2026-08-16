// =============================================================================
// API CLIENT CENTRALIZADO — Tezcatlipoca v2
// Consume backend contracts. No crea backend.
// =============================================================================

import { API_STATUS_MAP, type ApiError, type ApiStatus } from '@/types'

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8000/api/v1'

interface RequestConfig extends RequestInit {
  timeout?: number
  retries?: number
}

class TezcatlipocaAPI {
  private _baseUrl: string
  private token: string | null = null
  private correlationId: string = ''

  constructor(baseUrl: string = API_BASE) {
    this._baseUrl = baseUrl
  }

  setToken(token: string | null) {
    this.token = token
  }

  getToken(): string | null {
    return this.token
  }

  get baseUrl(): string {
    return this._baseUrl
  }

  getProjectId(): string {
    return localStorage.getItem('tz_project') || 'default'
  }

  async get<T>(endpoint: string, config?: RequestConfig): Promise<T> {
    return this.request<T>('GET', endpoint, undefined, config)
  }

  async post<T>(endpoint: string, body?: unknown, config?: RequestConfig): Promise<T> {
    return this.request<T>('POST', endpoint, body, config)
  }

  async patch<T>(endpoint: string, body?: unknown, config?: RequestConfig): Promise<T> {
    return this.request<T>('PATCH', endpoint, body, config)
  }

  async delete<T>(endpoint: string, config?: RequestConfig): Promise<T> {
    return this.request<T>('DELETE', endpoint, undefined, config)
  }

  private genCorrelationId(): string {
    return `tz-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
  }

  private async fetchWithTimeout(
    url: string,
    config: RequestConfig,
  ): Promise<Response> {
    const { timeout = 30000, ...rest } = config
    const controller = new AbortController()
    const id = setTimeout(() => controller.abort(), timeout)

    try {
      const resp = await fetch(url, { ...rest, signal: controller.signal })
      clearTimeout(id)
      return resp
    } catch (e) {
      clearTimeout(id)
      if (e instanceof Error && e.name === 'AbortError') {
        throw this.mkError('TIMEOUT', 'Request timeout', 408)
      }
      throw e
    }
  }

  private mkError(code: string, message: string, status: number): ApiError {
    return { code, message, status }
  }

  private async request<T>(
    method: string,
    endpoint: string,
    body?: unknown,
    config: RequestConfig = {},
  ): Promise<T> {
    this.correlationId = this.genCorrelationId()
    const url = `${this._baseUrl}${endpoint}`
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'X-Correlation-ID': this.correlationId,
      ...((config.headers as Record<string, string>) || {}),
    }

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`
    }

    const retries = config.retries ?? 2
    let lastError: Error | null = null

    for (let i = 0; i <= retries; i++) {
      try {
        const resp = await this.fetchWithTimeout(url, {
          ...config,
          method,
          headers,
          body: body ? JSON.stringify(body) : undefined,
        })

        if (!resp.ok) {
          const status = resp.status as ApiStatus
          const msg = API_STATUS_MAP[status] || `HTTP ${status}`
          throw this.mkError(`HTTP_${status}`, msg, status)
        }

        if (resp.status === 204) return undefined as T
        return (await resp.json()) as T
      } catch (e) {
        lastError = e as Error
        if (i < retries) await new Promise((r) => setTimeout(r, 1000 * (i + 1)))
      }
    }

    throw lastError
  }

  // AUTH
  async login(credentials: { username: string; password: string }) {
    return this.request<{ token: string; tenant: string }>('POST', '/auth/login', credentials)
  }

  async me() {
    return this.request<{ id: string; tier: string }>('GET', '/auth/me')
  }

  // WORLD
  async worldState() {
    return this.request<unknown>('GET', '/world/state')
  }

  async worldEntities(query?: Record<string, unknown>) {
    return this.request<unknown>('POST', '/world/context/query', query)
  }

  // LAYERS
  async layers() {
    return this.request<unknown>('GET', '/layers')
  }

  async updateLayer(id: string, patch: Record<string, unknown>) {
    return this.request<unknown>('PATCH', `/layers/${id}`, patch)
  }

  // TOPOGRAPHY
  async surveys() {
    return this.request<unknown>('GET', '/surveys')
  }

  async pointsQuery(query: Record<string, unknown>) {
    return this.request<unknown>('POST', '/points/query', query)
  }

  async tinCompute(points: unknown[]) {
    return this.request<unknown>('POST', '/topography/tin', { points })
  }

  async profileCompute(points: [number, number][]) {
    return this.request<unknown>('POST', '/topography/profile', { points })
  }

  async contoursCompute(surfaceId: string, interval: number) {
    return this.request<unknown>('POST', '/topography/contours', { surface_id: surfaceId, interval })
  }

  async volumeCompute(surfaceA: string, surfaceB: string) {
    return this.request<unknown>('POST', '/topography/volume', { surface_a: surfaceA, surface_b: surfaceB })
  }

  async cutFillCompute(surfaceA: string, surfaceB: string) {
    return this.request<unknown>('POST', '/topography/cutfill', { surface_a: surfaceA, surface_b: surfaceB })
  }

  async qaCheck(datasetId: string) {
    return this.request<unknown>('GET', `/topography/qa/${datasetId}`)
  }

  // BIM
  async bimModels() {
    return this.request<unknown>('GET', '/bim/models')
  }

  async bimModel(modelId: string) {
    return this.request<unknown>('GET', `/bim/models/${modelId}`)
  }

  async bimElements(modelId: string) {
    return this.request<unknown>('GET', `/bim/models/${modelId}/elements`)
  }

  async bimElement(elementId: string) {
    return this.request<unknown>('GET', `/bim/elements/${elementId}`)
  }

  async bimProperties(elementId: string) {
    return this.request<unknown>('GET', `/bim/elements/${elementId}/properties`)
  }

  async bimQuantities(elementId: string) {
    return this.request<unknown>('GET', `/bim/elements/${elementId}/quantities`)
  }

  async bimLevels(modelId: string) {
    return this.request<unknown>('GET', `/bim/models/${modelId}/levels`)
  }

  async bimClashes(modelId: string) {
    return this.request<unknown>('GET', `/bim/models/${modelId}/clashes`)
  }

  // OSINT / SPATIAL CONTEXT
  async observations(query?: Record<string, unknown>) {
    return this.request<unknown>('POST', '/observations/query', query)
  }

  async aviation() {
    return this.request<unknown>('GET', '/aviation')
  }

  async maritime() {
    return this.request<unknown>('GET', '/maritime')
  }

  async geophysics() {
    return this.request<unknown>('GET', '/geophysics')
  }

  async satellites() {
    return this.request<unknown>('GET', '/satellites')
  }

  async events() {
    return this.request<unknown>('GET', '/events')
  }

  // TEMPORAL
  async timeline() {
    return this.request<unknown>('GET', '/timeline')
  }

  async timelineReplay(request: Record<string, unknown>) {
    return this.request<unknown>('POST', '/timeline/replay', request)
  }

  // SNAPSHOTS
  async snapshots() {
    return this.request<unknown>('GET', '/snapshots')
  }

  async createSnapshot(snapshot: Record<string, unknown>) {
    return this.request<unknown>('POST', '/snapshots', snapshot)
  }

  async restoreSnapshot(id: string) {
    return this.request<unknown>('POST', `/snapshots/${id}/restore`)
  }

  // JOBS
  async jobs() {
    return this.request<unknown>('GET', '/jobs')
  }

  async job(id: string) {
    return this.request<unknown>('GET', `/jobs/${id}`)
  }

  async cancelJob(id: string) {
    return this.request<unknown>('POST', `/jobs/${id}/cancel`)
  }

  // HEALTH
  async health() {
    return this.request<{ status: string }>('GET', '/runtime/health')
  }

  async ready() {
    return this.request<{ ready: boolean }>('GET', '/runtime/ready')
  }
}

export const api = new TezcatlipocaAPI()
export default api
