import { create } from 'zustand'
import type {
  ViewMode, QualityProfile, ToolType, TelemetryData,
  TimeState, CameraState, Layer, Job, Snapshot, DataState
} from '@/types'

// =============================================================================
// TEZCATLIPOCA STORE — Estado global con Zustand
// =============================================================================

interface ToolState {
  activeTool: ToolType
  openTools: ToolType[]
  competingWarning: boolean
}

interface AppState {
  // View
  viewMode: ViewMode
  quality: QualityProfile
  camera: CameraState
  fullscreen: boolean

  // Tools
  tool: ToolState

  // Data
  layers: Layer[]
  selectedEntityId: string | null
  hoveredEntityId: string | null

  // Time
  time: TimeState

  // Telemetry / HUD
  telemetry: TelemetryData

  // Jobs
  jobs: Job[]

  // Snapshots
  snapshots: Snapshot[]
  activeSnapshotId: string | null

  // Auth / Context
  authToken: string | null
  tenantId: string | null
  projectId: string | null

  // UI
  leftPanelOpen: boolean
  rightPanelOpen: boolean
  mobileMenuOpen: boolean

  // Backend state
  backendStatus: DataState
  lastSync: number
}

interface AppActions {
  // View
  setViewMode: (mode: ViewMode) => void
  setQuality: (q: QualityProfile) => void
  setCamera: (cam: Partial<CameraState>) => void
  toggleFullscreen: () => void

  // Tools
  activateTool: (tool: ToolType) => void
  deactivateTool: (tool: ToolType) => void
  closeAllTools: () => void

  // Selection
  selectEntity: (id: string | null) => void
  hoverEntity: (id: string | null) => void

  // Time
  setTime: (t: number) => void
  setTimeRate: (rate: number) => void
  playPause: () => void

  // Telemetry
  updateTelemetry: (patch: Partial<TelemetryData>) => void

  // Layers
  toggleLayer: (id: string) => void
  setLayerOpacity: (id: string, opacity: number) => void

  // Jobs
  addJob: (job: Job) => void
  updateJob: (id: string, patch: Partial<Job>) => void

  // Snapshots
  addSnapshot: (snap: Snapshot) => void
  restoreSnapshot: (id: string) => void

  // Auth
  setAuth: (token: string | null, tenant: string | null) => void

  // UI
  toggleLeftPanel: () => void
  toggleRightPanel: () => void
  toggleMobileMenu: () => void

  // Backend
  setBackendStatus: (status: DataState) => void
}

const DEFAULT_CAMERA: CameraState = {
  position: [0, 0, 20000000],
  target: [0, 0, 0],
  zoom: 1,
  heading: 0,
  pitch: -45,
}

const DEFAULT_TIME: TimeState = {
  current: Date.now(),
  rate: 1,
  isPlaying: true,
  range: [Date.now() - 86400000, Date.now() + 3600000],
  markers: [],
}

const DEFAULT_TELEMETRY: TelemetryData = {
  fps: 0,
  frameTime: 0,
  entitiesRendered: 0,
  entitiesTotal: 0,
  chunksLoaded: 0,
  chunksTotal: 0,
  memoryMB: 0,
  gpuTier: 'mid',
  rendererState: 'READY',
  dataState: 'CACHED',
  streamPressure: 0,
}

export const useTezcatlipoca = create<AppState & AppActions>((set, get) => ({
  // Initial state
  viewMode: 'earth',
  quality: 'high',
  camera: DEFAULT_CAMERA,
  fullscreen: false,

  tool: {
    activeTool: 'none',
    openTools: [],
    competingWarning: false,
  },

  layers: [],
  selectedEntityId: null,
  hoveredEntityId: null,

  time: DEFAULT_TIME,
  telemetry: DEFAULT_TELEMETRY,
  jobs: [],
  snapshots: [],
  activeSnapshotId: null,

  authToken: null,
  tenantId: null,
  projectId: null,

  leftPanelOpen: true,
  rightPanelOpen: true,
  mobileMenuOpen: false,

  backendStatus: 'CACHED',
  lastSync: Date.now(),

  // Actions
  setViewMode: (mode) => set({ viewMode: mode }),
  setQuality: (q) => set({ quality: q }),
  setCamera: (cam) => set((s) => ({ camera: { ...s.camera, ...cam } })),
  toggleFullscreen: () => set((s) => ({ fullscreen: !s.fullscreen })),

  activateTool: (tool) => set((s) => {
    if (tool === 'none') return { tool: { activeTool: 'none', openTools: [], competingWarning: false } }
    const openTools = s.tool.openTools.includes(tool)
      ? s.tool.openTools
      : [...s.tool.openTools, tool]
    const competing = openTools.length > 1
    return {
      tool: {
        activeTool: tool,
        openTools,
        competingWarning: competing,
      },
    }
  }),

  deactivateTool: (tool) => set((s) => {
    const openTools = s.tool.openTools.filter((t) => t !== tool)
    const activeTool = openTools.length > 0 ? openTools[openTools.length - 1] : 'none'
    return {
      tool: {
        activeTool,
        openTools,
        competingWarning: openTools.length > 1,
      },
    }
  }),

  closeAllTools: () => set({
    tool: { activeTool: 'none', openTools: [], competingWarning: false },
  }),

  selectEntity: (id) => set({ selectedEntityId: id }),
  hoverEntity: (id) => set({ hoveredEntityId: id }),

  setTime: (t) => set((s) => ({ time: { ...s.time, current: t } })),
  setTimeRate: (rate) => set((s) => ({ time: { ...s.time, rate } })),
  playPause: () => set((s) => ({ time: { ...s.time, isPlaying: !s.time.isPlaying } })),

  updateTelemetry: (patch) => set((s) => ({
    telemetry: { ...s.telemetry, ...patch },
  })),

  toggleLayer: (id) => set((s) => ({
    layers: s.layers.map((l) => l.id === id ? { ...l, visible: !l.visible } : l),
  })),

  setLayerOpacity: (id, opacity) => set((s) => ({
    layers: s.layers.map((l) => l.id === id ? { ...l, opacity } : l),
  })),

  addJob: (job) => set((s) => ({ jobs: [...s.jobs, job] })),
  updateJob: (id, patch) => set((s) => ({
    jobs: s.jobs.map((j) => j.id === id ? { ...j, ...patch } : j),
  })),

  addSnapshot: (snap) => set((s) => ({ snapshots: [...s.snapshots, snap] })),
  restoreSnapshot: (id) => set({ activeSnapshotId: id }),

  setAuth: (token, tenant) => set({ authToken: token, tenantId: tenant }),

  toggleLeftPanel: () => set((s) => ({ leftPanelOpen: !s.leftPanelOpen })),
  toggleRightPanel: () => set((s) => ({ rightPanelOpen: !s.rightPanelOpen })),
  toggleMobileMenu: () => set((s) => ({ mobileMenuOpen: !s.mobileMenuOpen })),

  setBackendStatus: (status) => set({ backendStatus: status, lastSync: Date.now() }),
}))
