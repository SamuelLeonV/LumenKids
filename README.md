# Pequeños Discípulos — Login infantil + Aventura Bíblica

App infantil de la plataforma **Lumen** (LMS cristiano / discipulado), en **dos páginas**:

1. **`index.html`** — login gamificado (React vía dc-runtime). Escena parallax con
   cruz, paloma, Jesús y el rebaño; mini-juego de la oveja perdida; modales bíblicos
   (Juan 3:16, Mateo 3:16, Juan 10:11, Lucas 15:4-7); selección de personaje.
2. **`aventura-biblica.html`** — el juego: mundo abierto voxel estilo Minecraft en
   **Three.js puro (vanilla JS, sin React/eval)**. El login navega aquí con
   `?char=ovejita|discipulo|nino`.

Separar el juego pesado (solo Three.js) del login (React) lo hace más liviano y
robusto entre navegadores.

## Demo en vivo

➡️ **https://samuelleonv.github.io/LumenKids/**

## Cómo correr local

Estático. Cualquier servidor sirve (HTTP, no `file://`):

```bash
python3 -m http.server 8000
# abrir http://localhost:8000/
```

## Robustez entre navegadores

- **Deps auto-hospedadas** en `vendor/` (React 18.3.1, ReactDOM, Three.js r128).
  React carga antes de `support.js` → el runtime no llama a ningún CDN. Sin
  dependencia de unpkg/cdnjs (funciona con adblock / firewall / offline).
- **Fallback WebGL**: si el navegador no tiene WebGL, ambas páginas muestran un
  aviso amistoso en vez de romperse.
- Único externo restante: Google Fonts (degradan a fuente del sistema si se bloquean).

## Estructura

- `index.html` — login (DesignCode `<x-dc>` + `DCLogic`). Entry de Pages.
- `aventura-biblica.html` — juego voxel vanilla + Three.js.
- `support.js` — runtime `dc-runtime` del login.
- `vendor/` — React + ReactDOM + Three.js auto-hospedados.
- `login-monolitico.html` — versión anterior todo-en-uno (respaldo).
- `.nojekyll` — sirve archivos tal cual en Pages.
- `project/` — bundle original del handoff de Claude Design.

## Origen

Diseñado en [Claude Design](https://claude.ai/design) y exportado como handoff.
