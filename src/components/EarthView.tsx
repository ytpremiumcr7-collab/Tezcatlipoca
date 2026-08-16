import { useEffect, useRef } from 'react'

export default function EarthView() {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!containerRef.current) return

    // Cesium se carga dinámicamente para evitar problemas de build
    const initCesium = async () => {
      try {
        const Cesium = await import('cesium')
        Cesium.Ion.defaultAccessToken = import.meta.env.VITE_CESIUM_ION_TOKEN || ''

        const viewer = new Cesium.Viewer(containerRef.current!, {
          terrainProvider: await Cesium.createWorldTerrainAsync(),
          baseLayerPicker: true,
          geocoder: true,
          homeButton: true,
          sceneModePicker: true,
          navigationHelpButton: false,
          animation: false,
          timeline: false,
          fullscreenButton: false,
        })

        // Añadir satélites de ejemplo
        const entities = [
          { name: 'ISS', lat: 51.6413, lon: -120.2331, alt: 408000 },
          { name: 'Hubble', lat: 28.4696, lon: -80.5278, alt: 540000 },
          { name: 'GPS IIR-1', lat: 55.0, lon: -100.0, alt: 20200000 },
        ]

        entities.forEach((sat) => {
          viewer.entities.add({
            name: sat.name,
            position: Cesium.Cartesian3.fromDegrees(sat.lon, sat.lat, sat.alt),
            point: { pixelSize: 8, color: Cesium.Color.CYAN },
            label: {
              text: sat.name,
              font: '12px sans-serif',
              fillColor: Cesium.Color.WHITE,
              outlineColor: Cesium.Color.BLACK,
              outlineWidth: 2,
              pixelOffset: new Cesium.Cartesian2(0, -15),
            },
          })
        })

        viewer.camera.flyTo({
          destination: Cesium.Cartesian3.fromDegrees(-99.1332, 19.4326, 2000000),
          duration: 2,
        })
      } catch (e) {
        console.error('Cesium error:', e)
      }
    }

    initCesium()
  }, [])

  return (
    <div ref={containerRef} style={{ width: '100%', height: '100%' }} />
  )
}
