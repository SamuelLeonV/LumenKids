# LumenKids — App unificada (login + Aventura Bíblica)

> Diseño aprobado 2026-06-17. Unifica el login infantil y el juego voxel en un
> solo proyecto Vite + React, con contenido bíblico compartido y deploy a GitHub
> Pages vía build.

## 1. Objetivo

Hoy son dos archivos HTML estáticos sueltos:
- `index.html` — login (React renderizado por el runtime propietario `dc-runtime` /
  `support.js`, que carga React por CDN y compila la clase con `new Function`/eval).
- `aventura-biblica.html` — juego voxel (Three.js vanilla). El login navega a él con
  `window.location.href = "aventura-biblica.html?char=..."`.

El contenido bíblico está duplicado/separado (versículos en el login; historias y
preguntas en el juego). Se quiere **un solo proyecto cohesivo**: login + juego + su
temática (historias, preguntas, mapa, personajes) bajo una misma base de código,
con flujo continuo y un único artefacto desplegable.

## 2. Decisiones (acordadas en brainstorming)

1. **Stack:** Vite + React 18 + JavaScript (JSX). Sin TypeScript (minimiza fricción
   al portar el juego vanilla; conmutable a TS más adelante).
2. **Three.js como dependencia npm** `three@0.128.0` (fija — coincide con la API r128
   que usa el juego). Empaquetada por Vite. Resultado: **sin CDN, sin `eval`, sin
   dc-runtime** → elimina las causas de fallo entre navegadores.
3. **Motor del juego:** envolver el Three vanilla existente en un componente React;
   se conserva su lógica interna (chunks, voxel, NPCs, loop con delta-time correcto).
4. **Contenido:** consolidar lo existente en una sola fuente compartida. No se inventa
   contenido nuevo en este trabajo.
5. **Repo:** mismo `SamuelLeonV/LumenKids`. Los HTML actuales se archivan en `legacy/`.

## 3. Arquitectura

### 3.1 Estructura de archivos

```
package.json
vite.config.js          # base: '/LumenKids/'
index.html              # shell mínimo: <div id="root">, <script src=/src/main.jsx>
src/
  main.jsx              # ReactDOM.createRoot(...).render(<App/>)
  App.jsx               # estado global: screen, character, progress; conmuta pantallas
  screens/
    Login.jsx           # login portado del dc a React: escena parallax, minijuego
                        # de la oveja perdida, modales bíblicos, selección de personaje
  game/
    Aventura.jsx        # wrapper React: monta engine en <canvas> vía useEffect; HUD React
    engine.js           # juego Three vanilla portado; export createGame(opts) -> { dispose }
  data/
    content.js          # FUENTE ÚNICA de contenido (ver §4)
  styles/
    global.css          # @keyframes y estilos globales (de los <style> actuales)
legacy/                 # index.html, aventura-biblica.html, support.js, vendor/ (respaldo)
docs/superpowers/specs/ # este diseño
.github/workflows/deploy.yml   # build + deploy a Pages
```

### 3.2 Componentes y responsabilidades

- **App.jsx** — fuente de verdad del estado de la sesión:
  - `screen`: `'login' | 'game'`.
  - `character`: `'ovejita' | 'discipulo' | 'nino' | null`.
  - `progress`: `{ stars: number, solved: string[] }` (ids de historias resueltas).
  - Persiste `character` y `progress` en `localStorage` (clave `lumenkids.save`).
  - Pasa callbacks a las pantallas; conmuta `screen` al elegir personaje / volver al menú.
  - No conoce internals de Login ni del motor: solo intercambia datos por props/callbacks.

- **screens/Login.jsx** — toda la experiencia de login (visual idéntica a la actual):
  - Escena parallax (cielo, colinas, nubes, paloma, cruz, Jesús + rebaño).
  - Minijuego 2D de la oveja perdida (loop con `requestAnimationFrame` + delta-time;
    ya normalizado por frame en el código actual).
  - Modales bíblicos (cruz / paloma / Jesús / oveja) leídos de `data/content.js`.
  - Formulario de login **visual/mock** (sin backend): valida email/clave en cliente.
  - Selección de personaje → invoca `onChoose(character)` (prop de App).
  - Implementado como componente(s) React con hooks; sin dc-runtime ni eval.

- **game/Aventura.jsx** — puente React ↔ motor:
  - Render: `<canvas ref>` a pantalla completa + HUD React (estrellas, botón menú,
    panel de pregunta) que refleja el estado del motor.
  - `useEffect`: detecta WebGL; si falta, muestra aviso amistoso y no inicializa.
    Si hay WebGL, llama `createGame({ canvas, character, stories, onStar, onWin })`
    y guarda el handle; en cleanup llama `dispose()`.
  - Recibe estrellas/victoria del motor por callbacks y los sube a App.

- **game/engine.js** — el juego Three vanilla portado:
  - `import * as THREE from 'three'` (en vez del global por CDN).
  - `export function createGame({ canvas, character, stories, onStar, onWin })`
    que arma escena/render/loop sobre `canvas` y devuelve `{ dispose() }`.
  - Lógica interna intacta: generación de chunks/voxel, NPCs, colisiones, loop con
    `dt` (frame-rate independiente). Las preguntas/historias llegan por `stories`
    (no hardcodeadas) y el personaje del jugador por `character`.

### 3.3 Flujo (SPA, sin recarga)

```
[Login] --onChoose(character)--> App.setScreen('game')
[Aventura] --onStar / onWin--> App.progress (persistido)
[Aventura] --onExit--> App.setScreen('login')
```

Se elimina la navegación por archivo y el query `?char=`: el personaje viaja en
memoria (estado de React).

## 4. Modelo de contenido (`data/content.js`)

Fuente única, consolidando lo que ya existe. Exporta:

- `STORIES`: array de 7 objetos. Forma:
  ```js
  { id, emoji, name, beacon, robe, skin, story, q, opts:[3], answer }
  ```
  (las 7 actuales: Adán y Eva, Noé, Moisés, David, Jonás, Daniel, Niño Jesús).
- `CHARACTERS`: `{ ovejita, discipulo, nino }` con `{ name, descripcion, visual }`
  (parámetros usados por el preview del login y por el jugador del juego).
- `MODALS`: los 4 del login `{ cross, dove, jesus, sheep }` con
  `{ emoji, title, text, verse, color }`.

Login y juego importan de aquí; no hay contenido duplicado.

## 5. Persistencia

`localStorage["lumenkids.save"] = { character, stars, solved }`. Al cargar, App
rehidrata; el login puede ofrecer "continuar" con el personaje guardado. Botón de
reinicio limpia la clave.

## 6. Deploy (GitHub Actions → Pages)

- `vite.config.js` con `base: '/LumenKids/'` (subruta de Pages del usuario).
- Workflow `.github/workflows/deploy.yml`: en push a `main`, `npm ci && npm run build`,
  sube `dist/` con `actions/upload-pages-artifact` + `actions/deploy-pages`.
- Cambiar el modo de Pages del repo de "rama" a "GitHub Actions".
- URL final sin cambios: `https://samuelleonv.github.io/LumenKids/`.

## 7. Fuera de alcance

- Contenido bíblico nuevo (más preguntas, más mapa): no en este trabajo.
- Integración con el monorepo Lumen (`apps/web`).
- Backend de autenticación real (el login es visual/mock).
- TypeScript.

## 8. Criterios de éxito

1. `npm run dev` levanta login + juego en una sola app; elegir personaje entra al
   juego sin recargar ni query `?char=`.
2. El juego carga Three desde el bundle (sin CDN), conserva el comportamiento actual
   (movimiento correcto, NPCs, estrellas 0/7, build), y muestra fallback si no hay WebGL.
3. Login y juego leen el contenido desde `data/content.js` (sin duplicación).
4. `npm run build` produce `dist/` y el workflow publica en Pages; la URL funciona en
   navegadores donde antes fallaba (sin dependencia de CDN ni `eval`).
5. Progreso (personaje + estrellas) persiste entre recargas.
