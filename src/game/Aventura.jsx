// src/game/Aventura.jsx
// React wrapper that mounts the Three.js voxel engine on a <canvas> and renders
// the game's HUD. The engine (src/game/engine.js) drives the HUD purely by
// id/class lookups (getElementById / querySelector), so the markup below must
// keep EVERY id/class the engine queries intact, or the quiz/HUD breaks.
import { useEffect, useRef, useState } from 'react';
import { createGame } from './engine.js';
import { STORIES } from '../data/content.js';

function webglOK() {
  try {
    const c = document.createElement('canvas');
    return !!(
      window.WebGLRenderingContext &&
      (c.getContext('webgl') || c.getContext('experimental-webgl'))
    );
  } catch {
    return false;
  }
}

export default function Aventura({ character, onStar, onWin, onExit }) {
  const canvasRef = useRef(null);
  const [noWebgl, setNoWebgl] = useState(false);

  useEffect(() => {
    if (!webglOK()) {
      setNoWebgl(true);
      return undefined;
    }
    const game = createGame({
      canvas: canvasRef.current,
      character,
      stories: STORIES,
      onStar,
      onWin,
    });
    // Returning dispose() lets React unmount tear down the engine. Unmounting
    // also removes the canvas + HUD nodes, GC-ing the element-level listeners
    // the engine attached to them.
    return () => game.dispose();
  }, [character, onStar, onWin]);

  if (noWebgl) {
    return (
      <div className="webgl-fallback">
        <div className="webgl-fallback-card">
          <div className="webgl-fallback-sheep">🐑</div>
          <h2>El juego 3D no se puede mostrar</h2>
          <p>
            Tu navegador no tiene <b>WebGL</b> activo. Probá en Chrome o Firefox de
            escritorio, o activá la aceleración por hardware.
          </p>
          <button className="webgl-fallback-btn" onClick={onExit}>
            ⟵ Menú
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="aventura-root">
      <canvas ref={canvasRef} className="aventura-canvas" />

      {/* ---- HUD (ported verbatim from legacy/aventura-biblica.html) ---- */}
      <div id="hud">
        <div id="crosshair"></div>
        <div id="info">cargando…</div>
        <div id="stars">⭐ 0 / {STORIES.length}</div>
        <button className="aventura-back" onClick={onExit}>⟵ Menú</button>
        <div id="prompt"></div>
        <div id="hotbar"></div>
        <div id="touch" className="hidden">
          <div id="joy"><div id="knob"></div></div>
          <button id="btnPlace" className="tbtn" aria-label="Poner bloque">🧱</button>
          <button id="btnBreak" className="tbtn" aria-label="Romper bloque">⛏️</button>
          <button id="btnJump" className="tbtn" aria-label="Saltar">⤒</button>
          <button id="btnTalk" className="tbtn talk hidden">💬 Hablar</button>
        </div>
      </div>

      {/* Pantalla de inicio */}
      <div id="overlay" className="screen">
        <h1>Aventura <span>Bíblica</span></h1>
        <p className="sub">¡Explora, construye y aprende historias de la Biblia!</p>
        <button id="playBtn" className="bigbtn">▶  Empezar</button>
        <div id="controls">
          <div className="ctlDesktop">
            <b>WASD</b> moverte &nbsp;·&nbsp; <b>Ratón</b> mirar &nbsp;·&nbsp; <b>Espacio</b> saltar<br />
            Los personajes <b>caminan</b> por el mundo (¡siguen una luz de colores!) — pulsa <b>E</b> para hablar<br />
            Responde bien para ganar <b>⭐ estrellas</b> &nbsp;·&nbsp; <b>Clic</b> para construir
          </div>
          <div className="ctlTouch hidden">
            <b>Palanca</b> para moverte &nbsp;·&nbsp; <b>arrastra</b> la pantalla para mirar<br />
            Los personajes <b>caminan</b> por el mundo (¡siguen una luz de colores!)<br />
            <b>⤒</b> saltar &nbsp;·&nbsp; <b>⛏</b> romper &nbsp;·&nbsp; <b>🧱</b> poner &nbsp;·&nbsp; toca <b>💬 Hablar</b>
          </div>
        </div>
      </div>

      {/* Diálogo con personajes */}
      <div id="dialog" className="screen">
        <div className="card">
          <div className="head"><div className="emoji" id="demoji">🙂</div><h2 id="dname">Nombre</h2></div>
          <p id="dstory"></p>
          <p id="dq"></p>
          <div id="dopts"></div>
          <div id="dfeedback"></div>
          <button id="dcontinue" className="bigbtn hidden">Continuar ▶</button>
        </div>
      </div>

      {/* Victoria */}
      <div id="win" className="screen">
        <h1>🎉 ¡Lo lograste! 🎉</h1>
        <p>Reuniste las {STORIES.length} estrellas y aprendiste {STORIES.length} historias de la Biblia.<br />¡Eres un gran explorador!</p>
        <button id="winBtn" className="bigbtn">Seguir jugando</button>
      </div>
    </div>
  );
}
