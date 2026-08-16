import { useState, useEffect, useCallback } from 'react'
import * as nasa from '@/services/satelliteEngine'

/* ────────────────────────────────────────────────────────────────────────────
   NASA DATA PANEL
   Datos reales de APIs gratuitas: ISS, NEO, EPIC, APOD
   ──────────────────────────────────────────────────────────────────────────── */

interface Tab { key: 'iss' | 'neo' | 'epic' | 'apod'; label: string; icon: string }

const TABS: Tab[] = [
  { key: 'iss', label: 'ISS', icon: '🛰' },
  { key: 'neo', label: 'NEO', icon: '☄' },
  { key: 'epic', label: 'EPIC', icon: '🌍' },
  { key: 'apod', label: 'APOD', icon: '🌌' },
]

export default function NASADataPanel() {
  const [tab, setTab] = useState<Tab['key']>('iss')
  const [iss, setIss] = useState<nasa.ISSNow | null>(null)
  const [issLoading, setIssLoading] = useState(false)
  const [neo, setNeo] = useState<nasa.NEO[] | null>(null)
  const [neoLoading, setNeoLoading] = useState(false)
  const [epic, setEpic] = useState<nasa.EPICImage[] | null>(null)
  const [epicLoading, setEpicLoading] = useState(false)
  const [apod, setApod] = useState<nasa.APOD | null>(null)
  const [apodLoading, setApodLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  /* ISS polling cada 5 segundos */
  useEffect(() => {
    if (tab !== 'iss') return
    let cancelled = false
    const fetch = async () => {
      setIssLoading(true)
      setError(null)
      try {
        const data = await nasa.fetchISSNow()
        if (!cancelled) setIss(data)
      } catch (e: any) {
        if (!cancelled) setError(e.message || 'Error al cargar ISS')
      } finally {
        if (!cancelled) setIssLoading(false)
      }
    }
    fetch()
    const interval = setInterval(fetch, 5000)
    return () => { cancelled = true; clearInterval(interval) }
  }, [tab])

  /* NEO */
  useEffect(() => {
    if (tab !== 'neo' || neo) return
    let cancelled = false
    ;(async () => {
      setNeoLoading(true)
      setError(null)
      try {
        const data = await nasa.fetchNEO()
        if (!cancelled) setNeo(data.slice(0, 20))
      } catch (e: any) {
        if (!cancelled) setError(e.message || 'Error al cargar NEO')
      } finally {
        if (!cancelled) setNeoLoading(false)
      }
    })()
    return () => { cancelled = true }
  }, [tab, neo])

  /* EPIC */
  useEffect(() => {
    if (tab !== 'epic' || epic) return
    let cancelled = false
    ;(async () => {
      setEpicLoading(true)
      setError(null)
      try {
        const data = await nasa.fetchEPIC()
        if (!cancelled) setEpic(data.slice(0, 10))
      } catch (e: any) {
        if (!cancelled) setError(e.message || 'Error al cargar EPIC')
      } finally {
        if (!cancelled) setEpicLoading(false)
      }
    })()
    return () => { cancelled = true }
  }, [tab, epic])

  /* APOD */
  useEffect(() => {
    if (tab !== 'apod' || apod) return
    let cancelled = false
    ;(async () => {
      setApodLoading(true)
      setError(null)
      try {
        const data = await nasa.fetchAPOD()
        if (!cancelled) setApod(data)
      } catch (e: any) {
        if (!cancelled) setError(e.message || 'Error al cargar APOD')
      } finally {
        if (!cancelled) setApodLoading(false)
      }
    })()
    return () => { cancelled = true }
  }, [tab, apod])

  const refresh = useCallback(() => {
    setIss(null)
    setNeo(null)
    setEpic(null)
    setApod(null)
    setError(null)
  }, [])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, height: '100%' }}>
      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, borderBottom: '1px solid var(--border-color)', paddingBottom: 8 }}>
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`btn btn-xs ${tab === t.key ? 'btn-primary' : 'btn-ghost'}`}
            style={{ flex: 1, justifyContent: 'center' }}
          >
            {t.icon} {t.label}
          </button>
        ))}
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

      {/* ISS Panel */}
      {tab === 'iss' && (
        <div style={{ flex: 1, overflow: 'auto' }}>
          {issLoading && !iss ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 32 }}>
              <div className='loading-spinner' style={{ width: 24, height: 24 }} />
            </div>
          ) : iss ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{
                  background: 'var(--bg-tertiary)', borderRadius: 8, padding: 12,
                  border: '1px solid var(--border-color)',
                }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: '#38bdf8', marginBottom: 8 }}>
                  🛰 ISS — Tiempo Real
                </div>
                <div style={{ fontSize: 11, color: 'var(--text-secondary)', lineHeight: 1.8 }}>
                  <strong>Latitud:</strong> {iss.latitude.toFixed(4)}°<br />
                  <strong>Longitud:</strong> {iss.longitude.toFixed(4)}°<br />
                  <strong>Altitud:</strong> {nasa.formatAltitude(iss.altitude)}<br />
                  <strong>Velocidad:</strong> {nasa.formatVelocity(iss.velocity)}<br />
                  <strong>Visibilidad:</strong>{' '}
                  <span style={{ color: iss.visibility === 'daylight' ? '#fbbf24' : '#38bdf8' }}>
                    {iss.visibility}
                  </span><br />
                  <strong>Actualizado:</strong> {iss.timestamp.toLocaleTimeString()}
                </div>
              </div>
              {/* Mapa simplificado */}
              <div style={{
                  background: 'var(--bg-tertiary)', borderRadius: 8, padding: 12,
                  border: '1px solid var(--border-color)', height: 120,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  position: 'relative', overflow: 'hidden',
                }}>
                <div style={{ width: 200, height: 100, borderRadius: '50%', background: '#1a4d6e', position: 'relative' }}>
                  <div style={{
                    position: 'absolute',
                    left: `${((iss.longitude + 180) / 360) * 100}%`,
                    top: `${((90 - iss.latitude) / 180) * 100}%`,
                    width: 8, height: 8, borderRadius: '50%',
                    background: '#38bdf8', transform: 'translate(-50%, -50%)',
                    boxShadow: '0 0 8px #38bdf8',
                  }} />
                </div>
              </div>
            </div>
          ) : null}
        </div>
      )}

      {/* NEO Panel */}
      {tab === 'neo' && (
        <div style={{ flex: 1, overflow: 'auto' }}>
          {neoLoading && !neo ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 32 }}>
              <div className='loading-spinner' style={{ width: 24, height: 24 }} />
            </div>
          ) : neo ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <div style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 4 }}>
                {neo.length} objetos cercanos a la Tierra
              </div>
              {neo.map((obj, i) => (
                <div key={i} style={{
                  background: 'var(--bg-tertiary)', borderRadius: 6, padding: 8,
                  border: `1px solid ${obj.hazardous ? 'var(--border-danger)' : 'var(--border-color)'}`,
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 11, fontWeight: 600 }}>{obj.name}</span>
                    {obj.hazardous && <span className='badge badge-red'>⚠️ PHA</span>}
                  </div>
                  <div style={{ fontSize: 10, color: 'var(--text-secondary)', marginTop: 4 }}>
                    Aproximación: {obj.approachDate}<br />
                    Distancia: {nasa.formatDistance(obj.distanceKm)}<br />
                    Diámetro: {obj.diameterMin.toFixed(1)} - {obj.diameterMax.toFixed(1)} m
                  </div>
                </div>
              ))}
            </div>
          ) : null}
        </div>
      )}

      {/* EPIC Panel */}
      {tab === 'epic' && (
        <div style={{ flex: 1, overflow: 'auto' }}>
          {epicLoading && !epic ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 32 }}>
              <div className='loading-spinner' style={{ width: 24, height: 24 }} />
            </div>
          ) : epic ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>
                Fotos de la Tierra desde DSCOVR (NASA EPIC)
              </div>
              {epic.map((img) => (
                <div key={img.identifier} style={{
                  background: 'var(--bg-tertiary)', borderRadius: 8, padding: 8,
                  border: '1px solid var(--border-color)',
                }}>
                  <img
                    src={img.image}
                    alt={img.caption}
                    style={{ width: '100%', borderRadius: 4, marginBottom: 6 }}
                    loading='lazy'
                  />
                  <div style={{ fontSize: 10, color: 'var(--text-secondary)' }}>
                    {img.date}<br />
                    {img.caption}
                  </div>
                </div>
              ))}
            </div>
          ) : null}
        </div>
      )}

      {/* APOD Panel */}
      {tab === 'apod' && (
        <div style={{ flex: 1, overflow: 'auto' }}>
          {apodLoading && !apod ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 32 }}>
              <div className='loading-spinner' style={{ width: 24, height: 24 }} />
            </div>
          ) : apod ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{ fontSize: 12, fontWeight: 700 }}>{apod.title}</div>
              <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>{apod.date}</div>
              {apod.mediaType === 'image' ? (
                <img
                  src={apod.hdurl || apod.url}
                  alt={apod.title}
                  style={{ width: '100%', borderRadius: 8, border: '1px solid var(--border-color)' }}
                  loading='lazy'
                />
              ) : (
                <iframe
                  src={apod.url}
                  style={{ width: '100%', height: 200, borderRadius: 8, border: 'none' }}
                  title={apod.title}
                />
              )}
              <div style={{ fontSize: 11, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                {apod.explanation}
              </div>
            </div>
          ) : null}
        </div>
      )}

      <button onClick={refresh} className='btn btn-xs btn-ghost' style={{ alignSelf: 'center' }}>
        🔄 Actualizar datos
      </button>
    </div>
  )
}
