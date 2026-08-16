import { useState, useCallback, useEffect } from 'react'
import * as bim from '@/services/bimEngine'

interface BIMTask {
  id: string
  name: string
  start: string
  end: string
  progress: number
  cost: number
  currency: string
  wbs: string
  dependencies: Array<{ taskId: string; relation: 'FS' | 'SS' | 'FF' | 'SF'; lagDays: number }>
  resources: string[]
  clash_check_required: boolean
  elements: string[]
}

interface BIMElement4D {
  global_id: string
  name: string
  type: string
  geometry: { vertices: number[]; faces: number[] } | null
  material: string | null
  properties: Record<string, unknown>
  psets: Record<string, Record<string, unknown>>
  quantities: Record<string, { value: number; unit: string; source: string }>
  schedule: {
    start: string
    end: string
    actual_start: string | null
    actual_end: string | null
    progress: number
  }
  cost: {
    unit_cost: number
    total_cost: number
    currency: string
  }
}

// Mock data for 4D/5D — en producción viene del backend
const MOCK_TASKS: BIMTask[] = [
  {
    id: 'task-001',
    name: 'Cimentación',
    start: '2026-01-01',
    end: '2026-02-15',
    progress: 100,
    cost: 150000,
    currency: 'USD',
    wbs: '1.1',
    dependencies: [],
    resources: ['excavadora', 'hormigón'],
    clash_check_required: true,
    elements: ['wall-001', 'slab-001'],
  },
  {
    id: 'task-002',
    name: 'Estructura Primer Nivel',
    start: '2026-02-16',
    end: '2026-04-30',
    progress: 65,
    cost: 280000,
    currency: 'USD',
    wbs: '1.2',
    dependencies: [{ taskId: 'task-001', relation: 'FS' as const, lagDays: 0 }],
    resources: ['grúa', 'acero'],
    clash_check_required: true,
    elements: ['column-001', 'beam-001'],
  },
  {
    id: 'task-003',
    name: 'MEP Planta Baja',
    start: '2026-03-01',
    end: '2026-05-15',
    progress: 30,
    cost: 120000,
    currency: 'USD',
    wbs: '2.1',
    dependencies: [{ taskId: 'task-001', relation: 'FS' as const, lagDays: 0 }],
    resources: ['electricista', 'plomero'],
    clash_check_required: true,
    elements: ['pipe-001', 'cable-001'],
  },
]

export default function BIMPanel() {
  const [activeTab, setActiveTab] = useState<'3d' | '4d' | '5d' | 'clash' | 'qto'>('3d')
  const [selectedTask, setSelectedTask] = useState<string | null>(null)
  const [modelId, setModelId] = useState<string | null>(null)

  const tabs = [
    { id: '3d' as const, label: '3D Modelo', icon: '🏗️' },
    { id: '4d' as const, label: '4D Scheduling', icon: '📅' },
    { id: '5d' as const, label: '5D Costos', icon: '💰' },
    { id: 'clash' as const, label: 'Clash', icon: '💥' },
    { id: 'qto' as const, label: 'QTO', icon: '📊' },
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, height: '100%' }}>
      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, borderBottom: '1px solid var(--border-color)', paddingBottom: 8 }}>
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`tool-btn ${activeTab === tab.id ? 'active' : ''}`}
          >
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflow: 'auto' }}>
        {activeTab === '3d' && <Model3DView modelId={modelId} onModelLoaded={setModelId} />}
        {activeTab === '4d' && <Scheduling4D modelId={modelId} tasks={MOCK_TASKS} selectedTask={selectedTask} onSelectTask={setSelectedTask} />}
        {activeTab === '5d' && <Costos5D modelId={modelId} tasks={MOCK_TASKS} />}
        {activeTab === 'clash' && <ClashDetection modelId={modelId} tasks={MOCK_TASKS} />}
        {activeTab === 'qto' && <QTOView modelId={modelId} />}
      </div>
    </div>
  )
}

// 3D Model View — Conectado al backend real
function Model3DView({ modelId, onModelLoaded }: { modelId: string | null; onModelLoaded: (id: string) => void }) {
  const [importing, setImporting] = useState(false)
  const [quantification, setQuantification] = useState<bim.BIMQuantification | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleImport = useCallback(async (file: File) => {
    setImporting(true)
    setError(null)
    try {
      const result = await bim.importIFC(file)
      onModelLoaded(result.modelId)
      setQuantification(result.quantification)
    } catch (e: any) {
      setError(e.message || 'Error al importar IFC')
    } finally {
      setImporting(false)
    }
  }, [onModelLoaded])

  const handleLoadQuantification = useCallback(async () => {
    if (!modelId) return
    try {
      const result = await bim.getQuantification(modelId)
      setQuantification(result)
    } catch (e: any) {
      setError(e.message || 'Error al cargar cuantificación')
    }
  }, [modelId])

  useEffect(() => {
    if (modelId && !quantification) {
      handleLoadQuantification()
    }
  }, [modelId, quantification, handleLoadQuantification])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {error && (
        <div style={{
          padding: '8px 12px', borderRadius: 6,
          background: 'rgba(239,68,68,0.1)', border: '1px solid var(--border-danger)',
          color: 'var(--text-danger)', fontSize: 12,
        }}>
          ❌ {error}
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h4 style={{ fontSize: 12, color: 'var(--text-accent)' }}>
          🏗️ Modelo BIM 3D {modelId && <span className="badge badge-blue">{modelId.slice(0, 8)}</span>}
        </h4>
        <div style={{ display: 'flex', gap: 8 }}>
          <label className="tool-btn" style={{ cursor: 'pointer', position: 'relative' }}>
            📁 {importing ? 'Importando...' : 'Cargar IFC'}
            <input
              type="file"
              accept=".ifc"
              style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer' }}
              onChange={(e) => {
                const file = e.target.files?.[0]
                if (file) handleImport(file)
              }}
              disabled={importing}
            />
          </label>
          {modelId && (
            <button className="tool-btn" onClick={handleLoadQuantification}>🔄 Recargar</button>
          )}
        </div>
      </div>

      {importing && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div className="loading-spinner" style={{ width: 16, height: 16 }} />
          <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>Parseando IFC y extrayendo geometría...</span>
        </div>
      )}

      {/* 3D Canvas placeholder */}
      <div style={{
        height: 300,
        background: 'var(--bg-tertiary)',
        borderRadius: 8,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'column',
        gap: 12,
      }}>
        {modelId ? (
          <>
            <div style={{ fontSize: 48, opacity: 0.3 }}>🏗️</div>
            <span style={{ color: 'var(--text-secondary)', fontSize: 12 }}>
              Modelo cargado: {quantification?.elementos.length || 0} elementos
            </span>
          </>
        ) : (
          <>
            <div style={{ fontSize: 48, opacity: 0.3 }}>📁</div>
            <span style={{ color: 'var(--text-secondary)', fontSize: 12 }}>
              Importa un archivo IFC para visualizar
            </span>
          </>
        )}
      </div>

      {/* Element list from real quantification */}
      {quantification && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)' }}>
            Elementos del modelo ({quantification.elementos.length} total)
          </div>
          {Object.entries(quantification.resumen_por_tipo).map(([tipo, data]) => (
            <div
              key={tipo}
              style={{
                padding: '8px 12px',
                background: 'var(--bg-tertiary)',
                borderRadius: 6,
                border: '1px solid var(--border-color)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <span style={{ fontSize: 11 }}>{tipo}</span>
              <div style={{ textAlign: 'right' }}>
                <span style={{ fontSize: 10, color: 'var(--text-secondary)' }}>
                  {data.count} elementos
                </span>
                {data.volumen_total > 0 && (
                  <span style={{ fontSize: 10, color: 'var(--text-accent)', marginLeft: 8 }}>
                    {data.volumen_total.toFixed(2)} m³
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// 4D Scheduling — Gantt con CPM real
function Scheduling4D({ modelId, tasks, selectedTask, onSelectTask }: {
  modelId: string | null
  tasks: BIMTask[]
  selectedTask: string | null
  onSelectTask: (id: string | null) => void
}) {
  const [schedule, setSchedule] = useState<bim.ScheduleResult | null>(null)
  const [calculating, setCalculating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleCalculate = useCallback(async () => {
    if (!modelId) {
      setError('Importa un modelo IFC primero')
      return
    }
    setCalculating(true)
    setError(null)
    try {
      const scheduleTasks: bim.ScheduleTask[] = tasks.map(t => ({
        id: t.id,
        name: t.name,
        durationDays: Math.ceil((new Date(t.end).getTime() - new Date(t.start).getTime()) / 86400000),
        dependencies: t.dependencies.map(d => ({
          taskId: d.taskId,
          relation: d.relation,
          lagDays: d.lagDays,
        })),
      }))
      const result = await bim.calculateSchedule(modelId, scheduleTasks, new Date().toISOString())
      setSchedule(result)
    } catch (e: any) {
      setError(e.message || 'Error al calcular cronograma')
    } finally {
      setCalculating(false)
    }
  }, [modelId, tasks])

  const projectStart = new Date('2026-01-01').getTime()
  const projectEnd = new Date('2026-12-31').getTime()
  const totalDuration = projectEnd - projectStart

  const getBarStyle = (task: BIMTask) => {
    const start = new Date(task.start).getTime()
    const end = new Date(task.end).getTime()
    const left = ((start - projectStart) / totalDuration) * 100
    const width = ((end - start) / totalDuration) * 100
    return { left: `${left}%`, width: `${width}%` }
  }

  const getProgressWidth = (task: BIMTask) => {
    const start = new Date(task.start).getTime()
    const end = new Date(task.end).getTime()
    const total = end - start
    const progress = total * (task.progress / 100)
    return `${(progress / totalDuration) * 100}%`
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h4 style={{ fontSize: 12, color: 'var(--text-accent)' }}>📅 Gantt — Cronograma de Construcción</h4>
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            className="tool-btn"
            style={{ fontSize: 10 }}
            onClick={handleCalculate}
            disabled={calculating || !modelId}
          >
            {calculating ? <span className="loading-spinner" style={{ width: 12, height: 12 }} /> : '🧮'} Calcular CPM
          </button>
          <button className="tool-btn" style={{ fontSize: 10 }}>➕ Tarea</button>
        </div>
      </div>

      {error && (
        <div style={{
          padding: '8px 12px', borderRadius: 6,
          background: 'rgba(239,68,68,0.1)', border: '1px solid var(--border-danger)',
          color: 'var(--text-danger)', fontSize: 12,
        }}>
          ❌ {error}
        </div>
      )}

      {schedule && (
        <div style={{
          padding: '8px 12px', background: 'var(--bg-tertiary)',
          borderRadius: 6, fontSize: 11,
        }}>
          <div><strong>Duración proyecto:</strong> {schedule.projectDurationDays} días</div>
          <div><strong>Rutas críticas:</strong> {schedule.criticalPaths.length}</div>
        </div>
      )}

      {/* Timeline header */}
      <div style={{
        display: 'flex',
        borderBottom: '1px solid var(--border-color)',
        paddingBottom: 4,
        fontSize: 10,
        color: 'var(--text-secondary)',
      }}>
        <div style={{ width: 200 }}>Tarea</div>
        <div style={{ flex: 1, display: 'flex', justifyContent: 'space-between' }}>
          <span>Ene</span><span>Feb</span><span>Mar</span><span>Abr</span>
          <span>May</span><span>Jun</span><span>Jul</span><span>Ago</span>
          <span>Sep</span><span>Oct</span><span>Nov</span><span>Dic</span>
        </div>
      </div>

      {/* Tasks */}
      {tasks.map((task) => (
        <div
          key={task.id}
          onClick={() => onSelectTask(task.id === selectedTask ? null : task.id)}
          style={{
            display: 'flex',
            alignItems: 'center',
            padding: '6px 0',
            borderBottom: '1px solid var(--border-color)',
            cursor: 'pointer',
            background: selectedTask === task.id ? 'rgba(56,189,248,0.05)' : 'transparent',
          }}
        >
          <div style={{ width: 200, fontSize: 11 }}>
            <div style={{ fontWeight: 600 }}>{task.name}</div>
            <div style={{ fontSize: 10, color: 'var(--text-secondary)' }}>
              WBS {task.wbs} • {task.progress}%
            </div>
          </div>
          <div style={{ flex: 1, position: 'relative', height: 20 }}>
            <div style={{
              position: 'absolute',
              ...getBarStyle(task),
              height: '100%',
              background: 'var(--bg-tertiary)',
              borderRadius: 4,
              border: '1px solid var(--border-color)',
            }}>
              <div style={{
                position: 'absolute',
                left: 0, top: 0, height: '100%',
                width: `${task.progress}%`,
                background: task.progress === 100 ? 'var(--text-success)' : 'var(--accent-blue)',
                borderRadius: '4px 0 0 4px',
                opacity: 0.7,
              }} />
            </div>
          </div>
        </div>
      ))}

      {/* Task detail */}
      {selectedTask && (
        <div style={{
          padding: 12,
          background: 'var(--bg-tertiary)',
          borderRadius: 8,
          border: '1px solid var(--border-color)',
        }}>
          {(() => {
            const task = tasks.find((t) => t.id === selectedTask)
            if (!task) return null
            return (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div style={{ fontWeight: 600, fontSize: 13 }}>{task.name}</div>
                <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>
                  Inicio: {task.start} • Fin: {task.end} • Progreso: {task.progress}%
                </div>
                <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>
                  Recursos: {task.resources.join(', ')}
                </div>
                <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>
                  Dependencias: {task.dependencies.map(d => `${d.taskId} (${d.relation}${d.lagDays > 0 ? '+' + d.lagDays : ''})`).join(', ') || 'Ninguna'}
                </div>
                <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
                  <button className="tool-btn" style={{ fontSize: 10 }}>▶ Simular</button>
                  <button className="tool-btn" style={{ fontSize: 10 }}>📸 Snapshot</button>
                </div>
              </div>
            )
          })()}
        </div>
      )}
    </div>
  )
}

// 5D Costos — Curva S con backend real
function Costos5D({ modelId, tasks }: { modelId: string | null; tasks: BIMTask[] }) {
  const [cost, setCost] = useState<bim.CostResult | null>(null)
  const [calculating, setCalculating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const totalBudget = tasks.reduce((sum, t) => sum + t.cost, 0)
  const totalActual = tasks.reduce((sum, t) => sum + (t.cost * t.progress / 100), 0)

  const handleCalculate = useCallback(async () => {
    if (!modelId) {
      setError('Importa un modelo IFC primero')
      return
    }
    setCalculating(true)
    setError(null)
    try {
      const costTasks: bim.CostTask[] = tasks.map(t => ({
        id: t.id,
        durationDays: Math.ceil((new Date(t.end).getTime() - new Date(t.start).getTime()) / 86400000),
        costItems: [
          { category: 'Labor', type: 'per_day', amount: String(Math.round(t.cost * 0.4)) },
          { category: 'Materials', type: 'fixed', amount: String(Math.round(t.cost * 0.35)) },
          { category: 'Equipment', type: 'per_day', amount: String(Math.round(t.cost * 0.15)) },
          { category: 'Overhead', type: 'fixed', amount: String(Math.round(t.cost * 0.1)) },
        ],
        resources: [],
      }))
      const result = await bim.calculateCost(modelId, costTasks, [])
      setCost(result)
    } catch (e: any) {
      setError(e.message || 'Error al calcular costos')
    } finally {
      setCalculating(false)
    }
  }, [modelId, tasks])

  // Curva S points
  const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic']
  const plannedPoints = months.map((_, i) => ({
    month: _,
    planned: (totalBudget / 12) * (i + 1),
    actual: cost ? parseFloat(cost.byTask[Object.keys(cost.byTask)[0]] || '0') * (i + 1) / 12 : (totalActual / 12) * (i + 1),
  }))

  const maxValue = Math.max(...plannedPoints.map((p) => Math.max(p.planned, p.actual)))

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h4 style={{ fontSize: 12, color: 'var(--text-accent)' }}>💰 5D — Costos y Curva S</h4>
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            className="tool-btn"
            style={{ fontSize: 10 }}
            onClick={handleCalculate}
            disabled={calculating || !modelId}
          >
            {calculating ? <span className="loading-spinner" style={{ width: 12, height: 12 }} /> : '🧮'} Calcular 5D
          </button>
        </div>
      </div>

      {error && (
        <div style={{
          padding: '8px 12px', borderRadius: 6,
          background: 'rgba(239,68,68,0.1)', border: '1px solid var(--border-danger)',
          color: 'var(--text-danger)', fontSize: 12,
        }}>
          ❌ {error}
        </div>
      )}

      {cost && (
        <div style={{
          padding: '8px 12px', background: 'var(--bg-tertiary)',
          borderRadius: 6, fontSize: 11,
        }}>
          <div><strong>Costo Total:</strong> ${parseFloat(cost.totalCost).toLocaleString()}</div>
          <div><strong>Categorías:</strong> {Object.keys(cost.byCategory).length}</div>
        </div>
      )}

      <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>
        Presupuesto: <span style={{ color: 'var(--text-accent)' }}>${totalBudget.toLocaleString()}</span>
        {' • '}
        Ejecutado: <span style={{ color: 'var(--text-success)' }}>${totalActual.toLocaleString()}</span>
      </div>

      {/* Curva S Chart */}
      <div style={{
        height: 200,
        background: 'var(--bg-tertiary)',
        borderRadius: 8,
        padding: 16,
        position: 'relative',
      }}>
        <svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none">
          {[0, 25, 50, 75, 100].map((y) => (
            <line key={y} x1="0" y1={y} x2="100" y2={y} stroke="var(--border-color)" strokeWidth="0.3" />
          ))}
          <polyline
            fill="none"
            stroke="var(--accent-blue)"
            strokeWidth="0.8"
            points={plannedPoints.map((p, i) => `${(i / 11) * 100},${100 - (p.planned / maxValue) * 100}`).join(' ')}
          />
          <polyline
            fill="none"
            stroke="var(--text-success)"
            strokeWidth="0.8"
            strokeDasharray="2,1"
            points={plannedPoints.map((p, i) => `${(i / 11) * 100},${100 - (p.actual / maxValue) * 100}`).join(' ')}
          />
        </svg>
        <div style={{ position: 'absolute', top: 8, right: 8, display: 'flex', gap: 12, fontSize: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <div style={{ width: 12, height: 2, background: 'var(--accent-blue)' }} />
            <span>Planificado</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <div style={{ width: 12, height: 2, background: 'var(--text-success)', borderStyle: 'dashed' }} />
            <span>Real</span>
          </div>
        </div>
      </div>

      {/* Cost breakdown */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {tasks.map((task) => (
          <div key={task.id} style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '8px 12px',
            background: 'var(--bg-tertiary)',
            borderRadius: 6,
          }}>
            <div>
              <div style={{ fontSize: 11, fontWeight: 600 }}>{task.name}</div>
              <div style={{ fontSize: 10, color: 'var(--text-secondary)' }}>
                {task.progress}% completado
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 11, fontFamily: 'var(--font-mono)' }}>
                ${task.cost.toLocaleString()}
              </div>
              <div style={{ fontSize: 10, color: 'var(--text-success)' }}>
                ${Math.round(task.cost * task.progress / 100).toLocaleString()} ejecutado
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// Clash Detection — Conectado al backend real
function ClashDetection({ modelId, tasks }: { modelId: string | null; tasks: BIMTask[] }) {
  const [clashes, setClashes] = useState<bim.ClashResult[] | null>(null)
  const [running, setRunning] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const clashTasks = tasks.filter((t) => t.clash_check_required)

  const handleRun = useCallback(async () => {
    if (!modelId) {
      setError('Importa un modelo IFC primero')
      return
    }
    setRunning(true)
    setError(null)
    try {
      const result = await bim.runClashDetection(modelId, 50)
      setClashes(result)
    } catch (e: any) {
      setError(e.message || 'Error al detectar interferencias')
    } finally {
      setRunning(false)
    }
  }, [modelId])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <h4 style={{ fontSize: 12, color: 'var(--text-accent)' }}>💥 Clash Detection</h4>
      
      {error && (
        <div style={{
          padding: '8px 12px', borderRadius: 6,
          background: 'rgba(239,68,68,0.1)', border: '1px solid var(--border-danger)',
          color: 'var(--text-danger)', fontSize: 12,
        }}>
          ❌ {error}
        </div>
      )}

      <div style={{ display: 'flex', gap: 8 }}>
        <button
          className="tool-btn"
          onClick={handleRun}
          disabled={running || !modelId}
        >
          {running ? <span className="loading-spinner" style={{ width: 12, height: 12 }} /> : '🔍'} Detectar interferencias
        </button>
        <button className="tool-btn">📊 Reporte</button>
        <button className="tool-btn">✅ Resolver</button>
      </div>

      {clashes && clashes.length > 0 && (
        <div style={{
          padding: '8px 12px', background: 'var(--bg-tertiary)',
          borderRadius: 6, fontSize: 11,
        }}>
          <div style={{ color: 'var(--text-warning)' }}>
            ⚠️ {clashes.length} interferencias detectadas
          </div>
          <div>
            Críticas: {clashes.filter(c => c.severity === 'CRITICAL').length} |
            Warnings: {clashes.filter(c => c.severity === 'WARNING').length} |
            Info: {clashes.filter(c => c.severity === 'INFO').length}
          </div>
        </div>
      )}

      {clashes && clashes.map((clash) => (
        <div key={clash.id} style={{
          padding: '10px 12px',
          background: 'var(--bg-tertiary)',
          borderRadius: 6,
          border: `1px solid ${clash.severity === 'CRITICAL' ? 'var(--border-danger)' : clash.severity === 'WARNING' ? 'var(--border-warning)' : 'var(--border-color)'}`,
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontSize: 11, fontWeight: 600 }}>{clash.element_a} ↔ {clash.element_b}</div>
              <div style={{ fontSize: 10, color: 'var(--text-secondary)' }}>{clash.descripcion}</div>
            </div>
            <span className={`badge badge-${clash.severity === 'CRITICAL' ? 'red' : clash.severity === 'WARNING' ? 'amber' : 'blue'}`}>
              {clash.severity}
            </span>
          </div>
        </div>
      ))}

      {!clashes && clashTasks.map((task) => (
        <div key={task.id} style={{
          padding: '10px 12px',
          background: 'var(--bg-tertiary)',
          borderRadius: 6,
          border: '1px solid var(--border-color)',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontSize: 11, fontWeight: 600 }}>{task.name}</div>
              <div style={{ fontSize: 10, color: 'var(--text-secondary)' }}>
                {task.elements.length} elementos • Requiere chequeo
              </div>
            </div>
            <div style={{
              padding: '4px 10px',
              borderRadius: 10,
              background: 'rgba(245,158,11,0.1)',
              color: 'var(--text-warning)',
              fontSize: 10,
            }}>
              ⏳ Pendiente
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

// QTO View — Conectado al backend real
function QTOView({ modelId }: { modelId: string | null }) {
  const [qto, setQto] = useState<bim.BIMQuantification | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleLoad = useCallback(async () => {
    if (!modelId) {
      setError('Importa un modelo IFC primero')
      return
    }
    setLoading(true)
    setError(null)
    try {
      const result = await bim.getQuantification(modelId)
      setQto(result)
    } catch (e: any) {
      setError(e.message || 'Error al cargar QTO')
    } finally {
      setLoading(false)
    }
  }, [modelId])

  useEffect(() => {
    if (modelId && !qto) {
      handleLoad()
    }
  }, [modelId, qto, handleLoad])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h4 style={{ fontSize: 12, color: 'var(--text-accent)' }}>📊 Quantity Takeoff (QTO)</h4>
        {modelId && (
          <button
            className="tool-btn"
            onClick={handleLoad}
            disabled={loading}
          >
            {loading ? <span className="loading-spinner" style={{ width: 12, height: 12 }} /> : '🔄'} Recargar
          </button>
        )}
      </div>

      {error && (
        <div style={{
          padding: '8px 12px', borderRadius: 6,
          background: 'rgba(239,68,68,0.1)', border: '1px solid var(--border-danger)',
          color: 'var(--text-danger)', fontSize: 12,
        }}>
          ❌ {error}
        </div>
      )}

      {qto ? (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
            <MetricCard
              label="Volumen Total"
              value={`${qto.total_volumen.toFixed(2)} m³`}
              trend="+12%"
            />
            <MetricCard
              label="Área Total"
              value={`${qto.total_area.toFixed(2)} m²`}
              trend="+5%"
            />
            <MetricCard
              label="Elementos"
              value={`${qto.elementos.length}`}
              trend="0%"
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {Object.entries(qto.resumen_por_tipo).map(([tipo, data]) => (
              <div key={tipo} style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '8px 12px',
                background: 'var(--bg-tertiary)',
                borderRadius: 6,
              }}>
                <span style={{ fontSize: 11 }}>{tipo}</span>
                <div style={{ textAlign: 'right' }}>
                  <span style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--text-accent)' }}>
                    {data.count} elem
                  </span>
                  {data.volumen_total > 0 && (
                    <span style={{ fontSize: 10, color: 'var(--text-secondary)', marginLeft: 8 }}>
                      {data.volumen_total.toFixed(2)} m³
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </>
      ) : (
        <div style={{
          padding: 24, textAlign: 'center',
          background: 'var(--bg-tertiary)', borderRadius: 8,
          color: 'var(--text-secondary)', fontSize: 12,
        }}>
          {modelId ? 'Cargando QTO...' : 'Importa un modelo IFC para ver QTO'}
        </div>
      )}
    </div>
  )
}

function MetricCard({ label, value, trend }: { label: string; value: string; trend: string }) {
  const isPositive = trend.startsWith('+')
  return (
    <div style={{
      padding: 12,
      background: 'var(--bg-tertiary)',
      borderRadius: 8,
      textAlign: 'center',
    }}>
      <div style={{ fontSize: 10, color: 'var(--text-secondary)', marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: 16, fontWeight: 700, fontFamily: 'var(--font-mono)' }}>{value}</div>
      <div style={{ fontSize: 10, color: isPositive ? 'var(--text-success)' : 'var(--text-warning)' }}>
        {trend}
      </div>
    </div>
  )
}
