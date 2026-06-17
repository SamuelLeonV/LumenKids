# Pequeños Discípulos — Login infantil + Aventura Bíblica

App infantil de la plataforma **Lumen** (LMS cristiano / discipulado): login gamificado
con selección de personaje y juego de mundo voxel bíblico con Three.js, empaquetada
como una **Vite + React** SPA.

## Demo en vivo

➡️ **https://samuelleonv.github.io/LumenKids/**

## Desarrollo local

```bash
npm install
npm run dev      # servidor HMR en http://localhost:5173/LumenKids/
npm run build    # genera dist/ (producción)
npm run preview  # sirve dist/ localmente para verificar
```

## Estructura

```
src/
  main.jsx          — punto de entrada React
  App.jsx           — shell de la app (estado: pantalla activa, personaje)
  screens/
    Login.jsx       — login gamificado: parallax, oveja perdida, selección de personaje
    Aventura.jsx    — wrapper React del motor Three.js
  game/
    engine.js       — motor voxel Three.js (mundo abierto, sin eval)
  data/
    content.js      — STORIES, CHARACTERS, MODALS (contenido bíblico)
  lib/              — utilidades (save.js para localStorage)
  styles/           — CSS global

legacy/             — prototipo estático anterior (solo referencia, no se sirve)
index.html          — entry point de Vite
vite.config.js      — base: '/LumenKids/', plugin React, config de tests
```

## Despliegue

El despliegue es **automático**: cada `push` a `main` dispara el workflow
`.github/workflows/deploy.yml`, que ejecuta `npm ci && npm run build` y publica
`dist/` en GitHub Pages con `actions/deploy-pages`.

No se necesita correr ningún comando manual para publicar.

> **Primera vez:** hay que configurar el repositorio en Settings → Pages → Source: **GitHub Actions** para que el workflow pueda publicar.

## Robustez

- **Sin CDN en runtime**: todas las dependencias (React, Three.js) van en el bundle.
  Funciona con adblock / firewall / offline.
- **Fallback WebGL**: si el navegador no soporta WebGL se muestra un aviso amistoso.
- Único externo restante: Google Fonts (degrada a fuente del sistema si se bloquea).
