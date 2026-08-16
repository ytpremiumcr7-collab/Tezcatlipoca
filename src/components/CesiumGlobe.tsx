import { useEffect, useRef, useState } from 'react'
import * as Cesium from 'cesium'
import type { QualityProfile } from '../engines/types'

interface Props {
  quality: QualityProfile
  onTelemetry: (t: { entities: number }) => void
}

interface SatData {
  name: string
  lat: number
  lon: number
  height: number
  color: Cesium.Color
  entity?: Cesium.Entity
}

Cesium.Ion.defaultAccessToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiJlYWE3ZDQ1ZC05YjM3LTRkYjMtODNiYS1iNDJhY2YzY2YzNGEiLCJpZCI6NjA3MTcsImlhdCI6MTcyODU1MzY3OH0.MmK0RXva9E8Z7aW3F9X7v3z9z9z9z9z9z9z9z9z9z9z'

export default function CesiumGlobe({ onTelemetry }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const viewerRef = useRef<Cesium.Viewer | null>(null)
  const [satellites, setSatellites] = useState<SatData[]>([])
  const [selectedSat, setSelectedSat] = useState<SatData | null>(null)

  useEffect(() => {
    if (!containerRef.current) return
    let viewer: Cesium.Viewer | null = null
    let handler: Cesium.ScreenSpaceEventHandler | null = null

    const init = async () => {
      const terrainProvider = await Cesium.createWorldTerrainAsync({
        requestWaterMask: true,
        requestVertexNormals: true
      })

      viewer = new Cesium.Viewer(containerRef.current!, {
        terrainProvider,
        baseLayerPicker: false,
        geocoder: false,
        homeButton: false,
        sceneModePicker: false,
        navigationHelpButton: false,
        animation: false,
        timeline: false,
        fullscreenButton: false,
        vrButton: false,
        creditContainer: document.createElement('div')
      })

      const imageryLayer = await Cesium.IonImageryProvider.fromAssetId(2)
      viewer.imageryLayers.addImageryProvider(imageryLayer)
      viewerRef.current = viewer

      const sats: SatData[] = [
        { name: 'ISS', lat: 51.6, lon: -50, height: 408000, color: Cesium.Color.CYAN },
        { name: 'Hubble', lat: 28.5, lon: -80, height: 540000, color: Cesium.Color.GOLD },
        { name: 'Starlink-1', lat: 53, lon: 100, height: 550000, color: Cesium.Color.WHITE },
        { name: 'GPS-IIR', lat: 55, lon: -120, height: 20200000, color: Cesium.Color.GREEN },
        { name: 'GOES-16', lat: 0, lon: -75, height: 35786000, color: Cesium.Color.RED },
      ]

      sats.forEach(sat => {
        const entity = viewer!.entities.add({
          name: sat.name,
          position: Cesium.Cartesian3.fromDegrees(sat.lon, sat.lat, sat.height),
          point: { pixelSize: 10, color: sat.color },
          label: {
            text: sat.name,
            font: '12px monospace',
            fillColor: Cesium.Color.WHITE,
            outlineColor: Cesium.Color.BLACK,
            outlineWidth: 2,
            verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
            pixelOffset: new Cesium.Cartesian2(0, -10)
          }
        })
        sat.entity = entity
      })

      setSatellites(sats)
      onTelemetry({ entities: sats.length })

      viewer.camera.flyTo({
        destination: Cesium.Cartesian3.fromDegrees(-100, 30, 20000000),
        duration: 2
      })

      handler = new Cesium.ScreenSpaceEventHandler(viewer.canvas)
      handler.setInputAction((click: any) => {
        const picked = viewer!.scene.pick(click.position)
        if (Cesium.defined(picked) && picked.id) {
          const satName = picked.id.name as string
          const sat = sats.find(s => s.name === satName)
          if (sat) setSelectedSat({ ...sat })
        }
      }, Cesium.ScreenSpaceEventType.LEFT_CLICK)
    }

    init()

    return () => {
      if (handler) handler.destroy()
      if (viewer) viewer.destroy()
    }
  }, [onTelemetry])

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative' }}>
      <div ref={containerRef} style={{ width: '100%', height: '100%' }} />
      <div style={{
        position: 'absolute', top: 80, left: 12,
        background: 'rgba(10,10,20,0.9)', color: '#ffa500',
        padding: '12px', borderRadius: '8px', border: '1px solid rgba(255,165,0,0.3)',
        fontFamily: 'monospace', fontSize: '0.75rem', width: '200px'
      }}>
        <h4 style={{ margin: '0 0 8px 0' }}>SATELLITES</h4>
        {satellites.map(s => (
          <div key={s.name} style={{ 
            padding: '4px 0', 
            cursor: 'pointer',
            color: selectedSat?.name === s.name ? '#4ecdc4' : '#ddd'
          }} onClick={() => {
            if (viewerRef.current && s.entity) {
              const pos = s.entity.position?.getValue(Cesium.JulianDate.now())
              if (pos) viewerRef.current.camera.flyTo({ destination: pos })
              setSelectedSat(s)
            }
          }}>
            ● {s.name}
          </div>
        ))}
      </div>
      {selectedSat && (
        <div style={{
          position: 'absolute', bottom: 80, right: 12,
          background: 'rgba(10,10,20,0.9)', color: '#ddd',
          padding: '12px', borderRadius: '8px', border: '1px solid rgba(255,165,0,0.3)',
          fontFamily: 'monospace', fontSize: '0.75rem'
        }}>
          <strong style={{ color: '#ffa500' }}>{selectedSat.name}</strong>
          <div>Height: {(selectedSat.height / 1000).toFixed(0)} km</div>
          <div>Status: TRACKING</div>
        </div>
      )}
    </div>
  )
}
