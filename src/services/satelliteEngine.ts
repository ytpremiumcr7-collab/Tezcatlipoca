// ═══════════════════════════════════════════════════════════════════════════════
// SatelliteEngine — APIs gratuitas reales: CelesTrak, NASA, SatNOGS
// Desktop + Mobile unificado. Sin stubs. Sin placeholders.
// ═══════════════════════════════════════════════════════════════════════════════

// ─── TIPOS ───────────────────────────────────────────────────────────────────
export interface TLE {
  name: string
  noradId: string
  line1: string
  line2: string
  epoch: Date
}

export interface SatellitePosition {
  noradId: string
  name: string
  lat: number
  lon: number
  alt: number // km
  velocity: number // km/s
  timestamp: Date
}

export interface OrbitPrediction {
  noradId: string
  points: Array<{ lat: number; lon: number; alt: number; timestamp: Date }>
}

export interface ISSNow {
  latitude: number
  longitude: number
  altitude: number
  velocity: number
  visibility: string
  timestamp: Date
}

export interface NEO {
  name: string
  approachDate: string
  distanceKm: number
  diameterMin: number
  diameterMax: number
  hazardous: boolean
}

export interface EPICImage {
  identifier: string
  caption: string
  image: string
  date: string
  coords: { lat: number; lon: number }
}

export interface APOD {
  title: string
  explanation: string
  url: string
  hdurl: string
  mediaType: string
  date: string
}

// ─── CELESTRAK — TLEs gratuitos, CORS permitido, sin API key ─────────────────
const CELESTRAK_BASE = 'https://celestrak.org/NORAD/elements/'
const CELESTRAK_CATALOGS: Record<string, string> = {
  stations: 'stations.txt',
  visual: 'visual.txt',
  active: 'gp.php?GROUP=active&FORMAT=tle',
  starlink: 'gp.php?GROUP=starlink&FORMAT=tle',
  oneweb: 'gp.php?GROUP=oneweb&FORMAT=tle',
  iridium: 'gp.php?GROUP=iridium&FORMAT=tle',
  'gps-ops': 'gp.php?GROUP=gps-ops&FORMAT=tle',
  'glonass-ops': 'gp.php?GROUP=glonass-ops&FORMAT=tle',
  galileo: 'gp.php?GROUP=galileo&FORMAT=tle',
  beidou: 'gp.php?GROUP=beidou&FORMAT=tle',
  weather: 'gp.php?GROUP=weather&FORMAT=tle',
  noaa: 'gp.php?GROUP=noaa&FORMAT=tle',
  goes: 'gp.php?GROUP=goes&FORMAT=tle',
  resource: 'gp.php?GROUP=resource&FORMAT=tle',
  sarsat: 'gp.php?GROUP=sarsat&FORMAT=tle',
  dmc: 'gp.php?GROUP=dmc&FORMAT=tle',
  tdrss: 'gp.php?GROUP=tdrss&FORMAT=tle',
  argos: 'gp.php?GROUP=argos&FORMAT=tle',
  planet: 'gp.php?GROUP=planet&FORMAT=tle',
  spire: 'gp.php?GROUP=spire&FORMAT=tle',
}

export async function fetchTLEs(catalog: string = 'active'): Promise<TLE[]> {
  const url = `${CELESTRAK_BASE}${CELESTRAK_CATALOGS[catalog] || CELESTRAK_CATALOGS.active}`
  const resp = await fetch(url, { headers: { Accept: 'text/plain' } })
  if (!resp.ok) throw new Error(`CelesTrak error: ${resp.status}`)
  const text = await resp.text()
  const lines = text.trim().split(/\r?\n/).filter(l => l.trim())
  const tles: TLE[] = []
  for (let i = 0; i < lines.length; i += 3) {
    const name = lines[i]?.trim()
    const line1 = lines[i + 1]?.trim()
    const line2 = lines[i + 2]?.trim()
    if (!name || !line1 || !line2) continue
    const noradId = line2.substring(2, 7).trim()
    const epochYear = parseInt(line1.substring(18, 20))
    const epochDay = parseFloat(line1.substring(20, 32))
    const fullYear = epochYear >= 57 ? 1900 + epochYear : 2000 + epochYear
    const epoch = new Date(Date.UTC(fullYear, 0, 1) + (epochDay - 1) * 86400000)
    tles.push({ name, noradId, line1, line2, epoch })
  }
  return tles
}

export async function fetchAllCatalogs(): Promise<Record<string, TLE[]>> {
  const result: Record<string, TLE[]> = {}
  const keys = Object.keys(CELESTRAK_CATALOGS)
  for (const key of keys) {
    try {
      result[key] = await fetchTLEs(key)
    } catch (e) {
      console.warn(`Failed to fetch ${key}:`, e)
      result[key] = []
    }
  }
  return result
}

// ─── NASA APIs — Gratuitas, CORS permitido ───────────────────────────────────
const NASA_API_BASE = 'https://api.nasa.gov'
const NASA_API_KEY = import.meta.env.VITE_NASA_API_KEY || 'DEMO_KEY'

// ISS Now (sin API key, en tiempo real)
export async function fetchISSNow(): Promise<ISSNow> {
  const resp = await fetch('https://api.wheretheiss.at/v1/satellites/25544')
  if (!resp.ok) throw new Error(`ISS API error: ${resp.status}`)
  const data = await resp.json()
  return {
    latitude: data.latitude,
    longitude: data.longitude,
    altitude: data.altitude,
    velocity: data.velocity,
    visibility: data.visibility,
    timestamp: new Date(data.timestamp * 1000),
  }
}

// NASA NEO (Near Earth Objects)
export async function fetchNEO(startDate?: string, endDate?: string): Promise<NEO[]> {
  const s = startDate || new Date().toISOString().split('T')[0]
  const e = endDate || s
  const url = `${NASA_API_BASE}/neo/rest/v1/feed?start_date=${s}&end_date=${e}&api_key=${NASA_API_KEY}`
  const resp = await fetch(url)
  if (!resp.ok) throw new Error(`NASA NEO error: ${resp.status}`)
  const data = await resp.json()
  const neos: NEO[] = []
  Object.values(data.near_earth_objects).forEach((dayList: any) => {
    dayList.forEach((obj: any) => {
      neos.push({
        name: obj.name,
        approachDate: obj.close_approach_data[0]?.close_approach_date || '',
        distanceKm: parseFloat(obj.close_approach_data[0]?.miss_distance?.kilometers || '0'),
        diameterMin: obj.estimated_diameter?.meters?.estimated_diameter_min || 0,
        diameterMax: obj.estimated_diameter?.meters?.estimated_diameter_max || 0,
        hazardous: obj.is_potentially_hazardous_asteroid,
      })
    })
  })
  return neos.sort((a, b) => a.distanceKm - b.distanceKm)
}

// NASA EPIC (Earth Polychromatic Imaging Camera)
export async function fetchEPIC(): Promise<EPICImage[]> {
  const url = `${NASA_API_BASE}/EPIC/api/natural/images?api_key=${NASA_API_KEY}`
  const resp = await fetch(url)
  if (!resp.ok) throw new Error(`NASA EPIC error: ${resp.status}`)
  const data = await resp.json()
  return data.map((img: any) => ({
    identifier: img.identifier,
    caption: img.caption,
    image: `https://epic.gsfc.nasa.gov/archive/natural/${img.date.split(' ')[0].replace(/-/g, '/')}/png/${img.image}.png`,
    date: img.date,
    coords: { lat: img.centroid_coordinates.lat, lon: img.centroid_coordinates.lon },
  }))
}

// NASA APOD (Astronomy Picture of the Day)
export async function fetchAPOD(date?: string): Promise<APOD> {
  const url = `${NASA_API_BASE}/planetary/apod?api_key=${NASA_API_KEY}${date ? `&date=${date}` : ''}`
  const resp = await fetch(url)
  if (!resp.ok) throw new Error(`NASA APOD error: ${resp.status}`)
  return await resp.json()
}

// NASA SSD/CNEOS (Small-Body Database) — sin API key
export async function fetchNEOApproaches(days: number = 7): Promise<NEO[]> {
  const today = new Date().toISOString().split('T')[0]
  const future = new Date(Date.now() + days * 86400000).toISOString().split('T')[0]
  const url = `https://ssd-api.jpl.nasa.gov/cad.api?date-min=${today}&date-max=${future}&dist-max=10LD&fullname=true`
  const resp = await fetch(url)
  if (!resp.ok) throw new Error(`JPL SSD error: ${resp.status}`)
  const data = await resp.json()
  return data.data.map((row: any[]) => ({
    name: row[0],
    approachDate: row[3],
    distanceKm: parseFloat(row[4]) * 149597870.7,
    diameterMin: 0,
    diameterMax: 0,
    hazardous: parseFloat(row[4]) < 0.05,
  }))
}

// ─── SATNOGS — Observaciones comunitarias ────────────────────────────────────
export async function fetchSatNOGSObservations(noradId?: string, limit: number = 100): Promise<any[]> {
  let url = `https://db.satnogs.org/api/observations/?format=json&limit=${limit}`
  if (noradId) url += `&norad_cat_id=${noradId}`
  const resp = await fetch(url)
  if (!resp.ok) throw new Error(`SatNOGS error: ${resp.status}`)
  return await resp.json()
}

// ─── SGP4 LOCAL — Implementación pura en JS, sin WASM, sin dependencias ──────
// Basado en el algoritmo SGP4/SDP4 simplificado para posiciones aproximadas
// Suficiente para visualización en tiempo real. Para precisión milimétrica usar
// propagadores profesionales en el backend.

const DEG2RAD = Math.PI / 180
const RAD2DEG = 180 / Math.PI
const MINUTES_PER_DAY = 1440
const SECONDS_PER_DAY = 86400
const EARTH_RADIUS_KM = 6378.137
const MU = 398600.5 // km³/s²
const J2 = 0.00108263
const J3 = -0.00000254
const J4 = -0.00000161

function parseTLEEpoch(line1: string): Date {
  const year = parseInt(line1.substring(18, 20))
  const day = parseFloat(line1.substring(20, 32))
  const fullYear = year >= 57 ? 1900 + year : 2000 + year
  return new Date(Date.UTC(fullYear, 0, 1) + (day - 1) * SECONDS_PER_DAY * 1000)
}

function sgp4Propagate(line1: string, line2: string, date: Date): { x: number; y: number; z: number; vx: number; vy: number; vz: number } | null {
  try {
    // Extraer elementos orbitales del TLE
    const epoch = parseTLEEpoch(line1)
    const n0 = parseFloat(line2.substring(52, 63)) * MINUTES_PER_DAY / SECONDS_PER_DAY * 2 * Math.PI // rad/s
    const e0 = parseFloat('0.' + line2.substring(26, 33).trim())
    const i0 = parseFloat(line2.substring(8, 16).trim()) * DEG2RAD
    const M0 = parseFloat(line2.substring(43, 51).trim()) * DEG2RAD
    const omega0 = parseFloat(line2.substring(34, 42).trim()) * DEG2RAD
    const raan0 = parseFloat(line2.substring(17, 25).trim()) * DEG2RAD
    const ndot = parseFloat(line1.substring(33, 43).trim()) || 0
    const nddot = parseFloat('0.' + line1.substring(44, 50).trim()) || 0

    // Tiempo desde época en minutos
    const dt = (date.getTime() - epoch.getTime()) / 1000 / 60

    // Propagación simplificada (perturbaciones J2 principales)
    const a = Math.pow(MU / (n0 * n0), 1 / 3)
    const p = a * (1 - e0 * e0)
    const n = n0 + ndot * dt + 0.5 * nddot * dt * dt

    // Anomalía media
    let M = M0 + n * dt
    M = M % (2 * Math.PI)
    if (M < 0) M += 2 * Math.PI

    // Solución de Kepler (iteración de Newton)
    let E = M
    for (let i = 0; i < 10; i++) {
      const dE = (E - e0 * Math.sin(E) - M) / (1 - e0 * Math.cos(E))
      E -= dE
      if (Math.abs(dE) < 1e-12) break
    }

    const nu = 2 * Math.atan2(Math.sqrt(1 + e0) * Math.sin(E / 2), Math.sqrt(1 - e0) * Math.cos(E / 2))
    const r = a * (1 - e0 * Math.cos(E))

    // Perturbaciones J2 en RAAN y argumento del perigeo
    const cosi = Math.cos(i0)
    const J2_factor = -1.5 * J2 * (EARTH_RADIUS_KM / p) * (EARTH_RADIUS_KM / p) * n
    const raan_dot = J2_factor * cosi
    const omega_dot = J2_factor * (2.5 * cosi * cosi - 0.5)

    const raan = raan0 + raan_dot * dt
    const omega = omega0 + omega_dot * dt

    // Posición en el plano orbital
    const u = nu + omega
    const x_orb = r * Math.cos(u)
    const y_orb = r * Math.sin(u)
    const z_orb = 0

    // Rotación al sistema ECI
    const cosRAAN = Math.cos(raan)
    const sinRAAN = Math.sin(raan)
    const cosI = Math.cos(i0)
    const sinI = Math.sin(i0)

    const x = x_orb * cosRAAN - y_orb * sinRAAN * cosI
    const y = x_orb * sinRAAN + y_orb * cosRAAN * cosI
    const z = y_orb * sinI

    // Velocidad aproximada
    const v = Math.sqrt(MU * (2 / r - 1 / a))
    const vx = -v * Math.sin(u) * cosRAAN - v * Math.cos(u) * sinRAAN * cosI
    const vy = -v * Math.sin(u) * sinRAAN + v * Math.cos(u) * cosRAAN * cosI
    const vz = v * Math.cos(u) * sinI

    return { x, y, z, vx, vy, vz }
  } catch (e) {
    return null
  }
}

export async function propagateSGP4(tle: TLE, date: Date = new Date()): Promise<SatellitePosition | null> {
  const pos = sgp4Propagate(tle.line1, tle.line2, date)
  if (!pos) return null

  // ECI a geodésico
  const r = Math.sqrt(pos.x * pos.x + pos.y * pos.y + pos.z * pos.z)
  const lon = Math.atan2(pos.y, pos.x) * RAD2DEG
  const lat = Math.asin(pos.z / r) * RAD2DEG
  const alt = r - EARTH_RADIUS_KM
  const velocity = Math.sqrt(pos.vx * pos.vx + pos.vy * pos.vy + pos.vz * pos.vz)

  return {
    noradId: tle.noradId,
    name: tle.name,
    lat,
    lon,
    alt,
    velocity,
    timestamp: date,
  }
}

export async function predictOrbit(tle: TLE, hours: number = 24, stepMinutes: number = 10): Promise<OrbitPrediction> {
  const points: OrbitPrediction['points'] = []
  const now = new Date()
  const steps = Math.ceil((hours * 60) / stepMinutes)
  for (let i = 0; i <= steps; i++) {
    const t = new Date(now.getTime() + i * stepMinutes * 60000)
    const pos = await propagateSGP4(tle, t)
    if (pos) {
      points.push({ lat: pos.lat, lon: pos.lon, alt: pos.alt, timestamp: t })
    }
  }
  return { noradId: tle.noradId, points }
}

// ─── FUNCIONES DE ALTO NIVEL ────────────────────────────────────────────────
export interface SatelliteGroup {
  id: string
  name: string
  color: string
  tles: TLE[]
  positions?: SatellitePosition[]
}

export const SATELLITE_GROUPS: Omit<SatelliteGroup, 'tles' | 'positions'>[] = [
  { id: 'stations', name: 'Estaciones Espaciales', color: '#38bdf8' },
  { id: 'starlink', name: 'Starlink', color: '#22d3ee' },
  { id: 'oneweb', name: 'OneWeb', color: '#818cf8' },
  { id: 'iridium', name: 'Iridium', color: '#a78bfa' },
  { id: 'gps-ops', name: 'GPS', color: '#34d399' },
  { id: 'glonass-ops', name: 'GLONASS', color: '#fbbf24' },
  { id: 'galileo', name: 'Galileo', color: '#fb923c' },
  { id: 'beidou', name: 'BeiDou', color: '#f87171' },
  { id: 'visual', name: 'Visibles a Ojo', color: '#e879f9' },
  { id: 'weather', name: 'Meteorológicos', color: '#60a5fa' },
  { id: 'active', name: 'Todos Activos', color: '#94a3b8' },
]

export async function loadSatelliteGroup(groupId: string): Promise<SatelliteGroup> {
  const groupDef = SATELLITE_GROUPS.find(g => g.id === groupId) || SATELLITE_GROUPS[0]
  const tles = await fetchTLEs(groupId)
  return { ...groupDef, tles }
}

export async function refreshPositions(group: SatelliteGroup): Promise<SatelliteGroup> {
  const positions: SatellitePosition[] = []
  for (const tle of group.tles.slice(0, 100)) {
    const pos = await propagateSGP4(tle)
    if (pos) positions.push(pos)
  }
  return { ...group, positions }
}

export async function getISS(): Promise<{ position: ISSNow; orbit: OrbitPrediction }> {
  const [position, tles] = await Promise.all([
    fetchISSNow(),
    fetchTLEs('stations'),
  ])
  const issTle = tles.find(t => t.name.toLowerCase().includes('iss') || t.noradId === '25544')
  let orbit: OrbitPrediction = { noradId: '25544', points: [] }
  if (issTle) {
    orbit = await predictOrbit(issTle, 1.5, 5)
  }
  return { position, orbit }
}

// ─── UTILIDADES ──────────────────────────────────────────────────────────────
export function formatDistance(km: number): string {
  if (km >= 1e6) return `${(km / 1e6).toFixed(2)}M km`
  if (km >= 1e3) return `${(km / 1e3).toFixed(1)}k km`
  return `${km.toFixed(1)} km`
}

export function formatVelocity(kmps: number): string {
  return `${kmps.toFixed(2)} km/s`
}

export function formatAltitude(km: number): string {
  if (km >= 1000) return `${(km / 1000).toFixed(1)}k km`
  return `${km.toFixed(1)} km`
}
