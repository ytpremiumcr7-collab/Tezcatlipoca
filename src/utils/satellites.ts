// Satellite data model: TLE parsing, validation, classification, grouping.
// Merged from five CelesTrak feeds.

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

/** UI layers, in render order. */
export const UI_GROUPS: UiGroupDef[] = [
  { key: 'stations', label: 'Space Stations', color: '#ffd166', size: 2.6 },
  { key: 'gps', label: 'GPS', color: '#4ade80', size: 1.5 },
  { key: 'glonass', label: 'GLONASS', color: '#a3e635', size: 1.5 },
  { key: 'galileo', label: 'Galileo', color: '#2dd4bf', size: 1.5 },
  { key: 'weather', label: 'Weather', color: '#f472b6', size: 1.5 },
  { key: 'oneweb', label: 'OneWeb', color: '#a78bfa', size: 1.35 },
  { key: 'starlink', label: 'Starlink', color: '#38bdf8', size: 1.15 },
  { key: 'brightest', label: 'Brightest', color: '#e8eef7', size: 1.7 },
  { key: 'debris-cosmos', label: 'Debris · Cosmos-2251', color: '#fb7185', size: 1.0 },
  { key: 'debris-iridium', label: 'Debris · Iridium-33', color: '#fb923c', size: 1.0 },
  { key: 'debris-fengyun', label: 'Debris · Fengyun-1C', color: '#ef4444', size: 1.0 },
  { key: 'other', label: 'Other Active', color: '#9aa7bd', size: 1.0 },
]

const G = {
  Stations: 0, Gps: 1, Glonass: 2, Galileo: 3, Weather: 4,
  OneWeb: 5, Starlink: 6, Brightest: 7, DebrisCosmos: 8,
  DebrisIridium: 9, DebrisFengyun: 10, Other: 11,
} as const

const WEATHER_PREFIXES = ['NOAA', 'GOES', 'METEOSAT', 'METOP', 'AQUA', 'TERRA', 'SNPP', 'JPSS']
const STARLINK_PREFIX = 'STARLINK'
const ONEWEB_PREFIX = 'ONEWEB'
const GPS_PREFIXES = ['GPS', 'NAVSTAR']
const GLONASS_PREFIX = 'GLONASS'
const GALILEO_PREFIX = 'GALILEO'
const STATION_NAMES = ['ISS', 'TIANGONG', 'CSS', 'HST', 'HUBBLE']

export function classifySatellite(name: string): number {
  const n = name.toUpperCase()
  if (STATION_NAMES.some(s => n.includes(s))) return G.Stations
  if (GPS_PREFIXES.some(s => n.includes(s))) return G.Gps
  if (n.includes(GLONASS_PREFIX)) return G.Glonass
  if (n.includes(GALILEO_PREFIX)) return G.Galileo
  if (WEATHER_PREFIXES.some(s => n.includes(s))) return G.Weather
  if (n.includes(ONEWEB_PREFIX)) return G.OneWeb
  if (n.includes(STARLINK_PREFIX)) return G.Starlink
  return G.Other
}

export function parseTLE(text: string): SatInfo[] {
  const lines = text.trim().split('\n')
  const sats: SatInfo[] = []
  for (let i = 0; i < lines.length; i += 3) {
    if (i + 2 >= lines.length) break
    const name = lines[i].trim()
    const l1 = lines[i + 1].trim()
    const l2 = lines[i + 2].trim()
    const norad = parseInt(l2.substring(2, 7), 10)
    const epochDay = parseFloat(l1.substring(20, 32))
    const epochYear = parseInt(l1.substring(18, 20), 10)
    const fullYear = epochYear >= 57 ? 1900 + epochYear : 2000 + epochYear
    const epochMs = new Date(fullYear, 0, 1).getTime() + (epochDay - 1) * 86400000
    sats.push({ name, norad, l1, l2, group: classifySatellite(name), epochMs })
  }
  return sats
}

// SGP4 simplified propagator (position approximation)
export function propagateSGP4(l1: string, l2: string, date: Date): {
  x: number; y: number; z: number
  lat: number; lon: number; alt: number
  velocity: number
} {
  const epoch = new Date(2000 + parseInt(l1.substring(18, 20)), 0,
    parseFloat(l1.substring(20, 32)) * 365.25 / 12)
  const meanMotion = parseFloat(l2.substring(52, 63))
  const inclination = parseFloat(l2.substring(8, 16)) * (Math.PI / 180)
  const raan = parseFloat(l2.substring(17, 25)) * (Math.PI / 180)
  const eccentricity = parseFloat('0.' + l2.substring(26, 33))
  const argPerigee = parseFloat(l2.substring(34, 42)) * (Math.PI / 180)
  const meanAnomaly = parseFloat(l2.substring(43, 51)) * (Math.PI / 180)

  const minutesSinceEpoch = (date.getTime() - epoch.getTime()) / 60000
  const period = 1440 / meanMotion
  const meanMotionRad = (2 * Math.PI) / period
  const meanAnomalyCurrent = meanAnomaly + meanMotionRad * minutesSinceEpoch

  // Solve Kepler's equation (simplified)
  let E = meanAnomalyCurrent
  for (let i = 0; i < 5; i++) {
    E = meanAnomalyCurrent + eccentricity * Math.sin(E)
  }

  const trueAnomaly = 2 * Math.atan2(
    Math.sqrt(1 + eccentricity) * Math.sin(E / 2),
    Math.sqrt(1 - eccentricity) * Math.cos(E / 2)
  )

  const semiMajorAxis = Math.pow(398600.4418 / Math.pow(meanMotionRad * 60, 2), 1 / 3)
  const distance = semiMajorAxis * (1 - eccentricity * Math.cos(E))

  // Position in orbital plane
  const xOrbital = distance * Math.cos(trueAnomaly)
  const yOrbital = distance * Math.sin(trueAnomaly)

  // Transform to ECI
  const cosRaan = Math.cos(raan)
  const sinRaan = Math.sin(raan)
  const cosInc = Math.cos(inclination)
  const sinInc = Math.sin(inclination)
  const cosArg = Math.cos(argPerigee)
  const sinArg = Math.sin(argPerigee)

  const x = (cosRaan * cosArg - sinRaan * sinArg * cosInc) * xOrbital +
            (-cosRaan * sinArg - sinRaan * cosArg * cosInc) * yOrbital
  const y = (sinRaan * cosArg + cosRaan * sinArg * cosInc) * xOrbital +
            (-sinRaan * sinArg + cosRaan * cosArg * cosInc) * yOrbital
  const z = (sinInc * sinArg) * xOrbital + (sinInc * cosArg) * yOrbital

  // ECI to lat/lon/alt
  const lat = Math.asin(z / Math.sqrt(x * x + y * y + z * z)) * (180 / Math.PI)
  const lon = Math.atan2(y, x) * (180 / Math.PI)
  const alt = Math.sqrt(x * x + y * y + z * z) - 6371

  return { x, y, z, lat, lon, alt, velocity: Math.sqrt(398600.4418 / distance) }
}
