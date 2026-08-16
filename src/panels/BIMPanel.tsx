import { useState } from 'react'

interface BIMTask {
  id: string
  name: string
  start: string
  end: string
  progress: number
  cost: number
  currency: string
  wbs: string
  dependencies: string[]
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
    dependencies: ['task-001'],
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
    dependencies: ['task-001'],
    resources: ['electricista', 'plomero'],
    clash_check_required: true,
    elements: ['pipe-001', 'cable-001'],
  },
]

export default function BIMPanel() {
  const [activeTab, setActiveTab] = useState<'3d' | '4d' | '5d' | 'clash' | 'qto'>('3d')
  const [selectedTask, setSelectedTask] = useState<string | null>(null)

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
        {activeTab === '3d' && <Model3DView />}
        {activeTab === '4d' && <Scheduling4D tasks={MOCK_TASKS} selectedTask={selectedTask} onSelectTask={setSelectedTask} />}
        {activeTab === '5d' && <Costos5D tasks={MOCK_TASKS} />}
        {activeTab === 'clash' && <ClashDetection tasks={MOCK_TASKS} />}
        {activeTab === 'qto' && <QTOView />}
      </div>
    </div>
  )
}

// 3D Model View
function Model3DView() {
  return (
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
      <div style={{ fontSize: 48 }}>🏗️</div>
      <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
        Modelo IFC 3D — Cargar archivo .ifc
      </div>
      <div style={{ display: 'flex', gap: 8 }}>
        <button className="tool-btn">📁 Cargar IFC</button>
        <button className="tool-btn">👁️ Por nivel</button>
        <button className="tool-btn">📋 Por categoría</button>
      </div>
    </div>
  )
}

// 4D Scheduling — Gantt
function Scheduling4D({ tasks, selectedTask, onSelectTask }: {
  tasks: BIMTask[]
  selectedTask: string | null
  onSelectTask: (id: string | null) => void
}) {
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
          <button className="tool-btn" style={{ fontSize: 10 }}>➕ Tarea</button>
          <button className="tool-btn" style={{ fontSize: 10 }}>🔗 Dependencias</button>
        </div>
      </div>

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
                  Dependencias: {task.dependencies.join(', ') || 'Ninguna'}
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

// 5D Costos — Curva S
function Costos5D({ tasks }: { tasks: BIMTask[] }) {
  const totalBudget = tasks.reduce((sum, t) => sum + t.cost, 0)
  const totalActual = tasks.reduce((sum, t) => sum + (t.cost * t.progress / 100), 0)

  // Curva S points
  const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic']
  const plannedPoints = months.map((_, i) => ({
    month: _,
    planned: (totalBudget / 12) * (i + 1),
    actual: (totalActual / 12) * (i + 1) * (0.8 + Math.random() * 0.4),
  }))

  const maxValue = Math.max(...plannedPoints.map((p) => Math.max(p.planned, p.actual)))

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h4 style={{ fontSize: 12, color: 'var(--text-accent)' }}>💰 5D — Costos y Curva S</h4>
        <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>
          Presupuesto: <span style={{ color: 'var(--text-accent)' }}>${totalBudget.toLocaleString()}</span>
          {' • '}
          Ejecutado: <span style={{ color: 'var(--text-success)' }}>${totalActual.toLocaleString()}</span>
        </div>
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
          {/* Grid */}
          {[0, 25, 50, 75, 100].map((y) => (
            <line key={y} x1="0" y1={y} x2="100" y2={y} stroke="var(--border-color)" strokeWidth="0.3" />
          ))}
          
          {/* Planned curve */}
          <polyline
            fill="none"
            stroke="var(--accent-blue)"
            strokeWidth="0.8"
            points={plannedPoints.map((p, i) => `${(i / 11) * 100},${100 - (p.planned / maxValue) * 100}`).join(' ')}
          />
          
          {/* Actual curve */}
          <polyline
            fill="none"
            stroke="var(--text-success)"
            strokeWidth="0.8"
            strokeDasharray="2,1"
            points={plannedPoints.map((p, i) => `${(i / 11) * 100},${100 - (p.actual / maxValue) * 100}`).join(' ')}
          />
        </svg>
        
        {/* Legend */}
        <div style={{
          position: 'absolute',
          top: 8, right: 8,
          display: 'flex',
          gap: 12,
          fontSize: 10,
        }}>
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

// Clash Detection
function ClashDetection({ tasks }: { tasks: BIMTask[] }) {
  const clashTasks = tasks.filter((t) => t.clash_check_required)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <h4 style={{ fontSize: 12, color: 'var(--text-accent)' }}>💥 Clash Detection</h4>
      
      <div style={{ display: 'flex', gap: 8 }}>
        <button className="tool-btn">🔍 Detectar interferencias</button>
        <button className="tool-btn">📊 Reporte</button>
        <button className="tool-btn">✅ Resolver</button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {clashTasks.map((task) => (
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
    </div>
  )
}

// QTO View
function QTOView() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <h4 style={{ fontSize: 12, color: 'var(--text-accent)' }}>📊 Quantity Takeoff (QTO)</h4>
      
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
        <MetricCard label="Volumen Total" value="1,245 m³" trend="+12%" />
        <MetricCard label="Área Total" value="3,420 m²" trend="+5%" />
        <MetricCard label="Longitud" value="890 m" trend="0%" />
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {['Muros', 'Losas', 'Columnas', 'Vigas', 'Escaleras'].map((element) => (
          <div key={element} style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '8px 12px',
            background: 'var(--bg-tertiary)',
            borderRadius: 6,
          }}>
            <span style={{ fontSize: 11 }}>{element}</span>
            <span style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--text-accent)' }}>
              {Math.round(Math.random() * 500)} m³
            </span>
          </div>
        ))}
      </div>
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
