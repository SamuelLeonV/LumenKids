# Pequeños Discípulos — Login infantil interactivo

Login gamificado para niños de la plataforma **Lumen** (LMS cristiano / discipulado).
Escena parallax con cruz, paloma, Jesús y el rebaño; un mini-juego donde guías a la
oveja perdida hasta Jesús; modales bíblicos (Juan 3:16, Mateo 3:16, Juan 10:11,
Lucas 15:4-7); selección de personaje y un mundo abierto voxel 2D/3D (Three.js).

## Demo en vivo

➡️ **https://samuelleonv.github.io/LumenKids/**

## Cómo correr local

Es estático y se auto-arranca. Cualquier servidor estático sirve:

```bash
python3 -m http.server 8000
# abrir http://localhost:8000/
```

> Debe servirse por HTTP (no `file://`): el runtime hace `fetch()` y carga
> React/ReactDOM y Three.js desde CDN.

## Estructura

- `index.html` — prototipo DesignCode (`<x-dc>` + lógica `DCLogic`). Entry de Pages.
- `support.js` — runtime `dc-runtime`: parsea la plantilla, carga React (CDN) y monta.
- `.nojekyll` — sirve los archivos tal cual en GitHub Pages.
- `project/` — bundle original del handoff de Claude Design (fuente, assets, capturas).
  Ver `project/HANDOFF.md` para las notas del bundle.

## Origen

Diseñado en [Claude Design](https://claude.ai/design) y exportado como handoff.
