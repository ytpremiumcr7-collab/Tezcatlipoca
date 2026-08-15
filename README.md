# Tezcatlipoca

> Sistema de Inteligencia Geoespacial y Topografia Avanzada

[![CI/CD](https://github.com/TU_USUARIO/tezcatlipoca/actions/workflows/ci.yml/badge.svg)](https://github.com/TU_USUARIO/tezcatlipoca/actions/workflows/ci.yml)

## Descripcion

Tezcatlipoca es un sistema geoespacial determinista que integra visualizacion 3D, topografia computacional, astronomia y simulacion fisica en una sola interfaz.

## Stack Tecnologico

| Tecnologia | Uso |
|-----------|-----|
| React 19 | UI components |
| TypeScript | Tipado estatico |
| Vite 8 | Build tool |
| Three.js | Renderizado 3D |
| Cesium | Globo terraqueo |
| D3 + Force Graph | Visualizacion de grafos |

## Modulos

- **Geoespacial**: Globo Cesium 3D con terreno y satelites (ISS, Hubble, GPS, GOES)
- **Topografia**: Puntos de levantamiento, triangulacion Delaunay, curvas de nivel, volumenes
- **Astronomia**: Sistema Solar del Conocimiento - grafo 3D de papers cientificos con clustering Louvain
- **Simulacion**: Raytracing de agujero negro Schwarzschild con parametros fisicos ajustables

## Scripts

```bash
npm install    # Instalar dependencias
npm run dev    # Desarrollo local
npm run build  # Build de produccion
npm run lint   # Linting con Oxlint
```

## Arquitectura

```
src/
  components/     # 15 componentes React
  engines/        # 4 motores: Camera, Layer, Selection, Time
  hooks/          # useFps
  utils/          # math, louvain (clustering)
  shaders/        # gargantua.vert, gargantua.frag
  data/           # Dataset de papers cientificos
```

## CI/CD

Cada push a `main` o `master` dispara:
1. Lint + Build
2. Deploy automatico a GitHub Pages

## Licencia

MIT
