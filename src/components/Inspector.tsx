import type { Alert, VolumeData, RiskIndicators, Workspace } from '../engines/types'

interface Props {
  entity: any
  alerts: Alert[]
  volumeData: VolumeData
  riskIndicators: RiskIndicators
  collapsed: boolean
  onToggle: () => void
  workspace: Workspace
}

export default function Inspector({ alerts, volumeData, riskIndicators, collapsed, onToggle }: Props) {
  if (collapsed) return (
    <button onClick={onToggle} style={{
      width: '40px', background: '#111118', border: 'none',
      borderLeft: '1px solid rgba(255,165,0,0.1)', color: '#888',
      cursor: 'pointer', fontSize: '18px'
    }}>←</button>
  )

  return (
    <aside style={{
      width: '340px', background: '#111118',
      borderLeft: '1px solid rgba(255,165,0,0.1)',
      display: 'flex', flexDirection: 'column',
      overflow: 'auto', flexShrink: 0,
    }}>
      <div style={{ padding: '16px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '20px' }}>👁️</span>
            <div>
              <div style={{ fontSize: '14px', fontWeight: 600, color: '#fff' }}>Espejo</div>
              <div style={{ fontSize: '11px', color: '#2ecc71', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#2ecc71' }} />
                Activo
              </div>
            </div>
          </div>
          <button onClick={onToggle} style={{ background: 'transparent', border: 'none', color: '#888', cursor: 'pointer' }}>→</button>
        </div>
      </div>

      {/* Alerts */}
      <div style={{ padding: '16px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
          <span style={{ fontSize: '11px', color: '#888', textTransform: 'uppercase', letterSpacing: '1px' }}>Alertas Activas</span>
          <span style={{ background: '#e74c3c', color: '#fff', fontSize: '11px', padding: '2px 8px', borderRadius: '10px' }}>{alerts.length}</span>
        </div>
        {alerts.map(a => (
          <div key={a.id} style={{
            background: a.severity === 'high' ? 'rgba(231,76,60,0.1)' : a.severity === 'medium' ? 'rgba(243,156,18,0.1)' : 'rgba(52,152,219,0.1)',
            borderRadius: '8px', padding: '12px', marginBottom: '8px',
            borderLeft: `3px solid ${a.severity === 'high' ? '#e74c3c' : a.severity === 'medium' ? '#f39c12' : '#3498db'}`
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <span style={{ fontSize: '16px' }}>{a.severity === 'high' ? '🔺' : a.severity === 'medium' ? '⚠️' : 'ℹ️'}</span>
              <span style={{ fontSize: '12px', fontWeight: 600, color: '#fff' }}>{a.title}</span>
              <span style={{
                marginLeft: 'auto', fontSize: '10px', padding: '2px 8px',
                borderRadius: '4px', background: a.severity === 'high' ? '#e74c3c' : a.severity === 'medium' ? '#f39c12' : '#3498db',
                color: '#fff'
              }}>{a.severity === 'high' ? 'ALTA' : a.severity === 'medium' ? 'MEDIA' : 'BAJA'}</span>
            </div>
            <div style={{ fontSize: '11px', color: '#aaa' }}>{a.description}</div>
            <div style={{ fontSize: '10px', color: '#666', marginTop: '4px' }}>{a.time}</div>
          </div>
        ))}
      </div>

      {/* Volume Analysis */}
      <div style={{ padding: '16px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
          <span style={{ fontSize: '11px', color: '#888', textTransform: 'uppercase', letterSpacing: '1px' }}>Analisis de Volumen</span>
          <select style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '4px', color: '#ddd', fontSize: '11px', padding: '4px 8px' }}>
            <option>Corte / Relleno</option>
          </select>
        </div>
        <div style={{ display: 'flex', gap: '16px', marginBottom: '12px' }}>
          <div>
            <div style={{ fontSize: '11px', color: '#888' }}>Corte</div>
            <div style={{ fontSize: '18px', fontWeight: 700, color: '#3498db' }}>{volumeData.cut.toLocaleString()} m³</div>
          </div>
          <div>
            <div style={{ fontSize: '11px', color: '#888' }}>Relleno</div>
            <div style={{ fontSize: '18px', fontWeight: 700, color: '#2ecc71' }}>+{volumeData.fill.toLocaleString()} m³</div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: '2px', height: '60px', marginBottom: '12px' }}>
          {volumeData.chartData.map((d, i) => (
            <div key={i} style={{
              flex: 1, background: d.color, borderRadius: '2px 2px 0 0',
              height: `${(d.value / 100) * 100}%`, opacity: 0.8
            }} title={d.label} />
          ))}
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#666' }}>
          <span>-5 m</span><span>0 m</span><span>+5 m</span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px', marginTop: '12px' }}>
          <MetricBox label="Volumen neto" value={`${volumeData.net.toLocaleString()} m³`} />
          <MetricBox label="Area afectada" value={`${volumeData.area} ha`} />
          <MetricBox label="Precision" value={`± ${volumeData.precision}%`} />
        </div>
      </div>

      {/* Risk Indicators */}
      <div style={{ padding: '16px' }}>
        <span style={{ fontSize: '11px', color: '#888', textTransform: 'uppercase', letterSpacing: '1px' }}>Indicadores de Riesgo</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginTop: '12px', marginBottom: '16px' }}>
          <div style={{
            width: '80px', height: '80px', borderRadius: '50%',
            background: `conic-gradient(${riskIndicators.overall > 60 ? '#e74c3c' : riskIndicators.overall > 40 ? '#f39c12' : '#2ecc71'} ${riskIndicators.overall * 3.6}deg, rgba(255,255,255,0.05) 0deg)`,
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column'
          }}>
            <div style={{ fontSize: '24px', fontWeight: 700, color: '#fff' }}>{riskIndicators.overall}</div>
            <div style={{ fontSize: '10px', color: '#888' }}>/100</div>
          </div>
          <div>
            <div style={{ fontSize: '14px', fontWeight: 600, color: riskIndicators.overall > 60 ? '#e74c3c' : riskIndicators.overall > 40 ? '#f39c12' : '#2ecc71' }}>
              {riskIndicators.level}
            </div>
          </div>
        </div>
        {riskIndicators.items.map(item => (
          <div key={item.name} style={{ marginBottom: '10px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', marginBottom: '4px' }}>
              <span style={{ color: '#aaa' }}>{item.name}</span>
              <span style={{ color: item.level === 'Alto' ? '#e74c3c' : item.level === 'Medio' ? '#f39c12' : '#2ecc71' }}>{item.value} {item.level}</span>
            </div>
            <div style={{ height: '4px', background: 'rgba(255,255,255,0.05)', borderRadius: '2px', overflow: 'hidden' }}>
              <div style={{
                width: `${item.value}%`, height: '100%',
                background: item.level === 'Alto' ? '#e74c3c' : item.level === 'Medio' ? '#f39c12' : '#2ecc71',
                borderRadius: '2px'
              }} />
            </div>
          </div>
        ))}
        <button style={{
          width: '100%', marginTop: '12px', padding: '10px',
          background: 'transparent', border: '1px solid rgba(255,165,0,0.2)',
          borderRadius: '8px', color: '#ffa500', fontSize: '12px',
          cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px'
        }}>
          Ver analisis completo →
        </button>
      </div>
    </aside>
  )
}

function MetricBox({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ textAlign: 'center', padding: '8px', background: 'rgba(255,255,255,0.03)', borderRadius: '6px' }}>
      <div style={{ fontSize: '10px', color: '#888' }}>{label}</div>
      <div style={{ fontSize: '13px', fontWeight: 600, color: '#ddd', marginTop: '2px' }}>{value}</div>
    </div>
  )
}
