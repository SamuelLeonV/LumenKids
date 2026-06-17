# LumenKids Unified App — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Unify the children's login and the Aventura Bíblica voxel game into one Vite + React app with shared Bible content, Three.js bundled (no CDN/eval), deployed to GitHub Pages.

**Architecture:** A single React SPA. `App` holds session state (screen, character, progress) and swaps between a `Login` screen (ported from the dc-runtime prototype to React) and an `Aventura` screen (a thin React wrapper that mounts the existing vanilla Three.js engine on a canvas). All Bible content (stories/questions, characters, login modals) lives in one shared module. Vite bundles `three` so there is no CDN, no `eval`, no dc-runtime.

**Tech Stack:** Vite, React 18, JavaScript (JSX), `three@0.128.0`, Vitest (logic tests), GitHub Actions → Pages.

## Global Constraints

- Stack: **Vite + React 18 + JavaScript (JSX)**. No TypeScript.
- Three.js pinned to **`three@0.128.0`** (matches the r128 API the game was written for). Imported as a module — never from a CDN.
- **No CDN, no `eval`, no dc-runtime / `support.js`** in the shipped app.
- Repo: `SamuelLeonV/LumenKids`. Current static files archived under `legacy/` (not deleted).
- All Bible content consolidated in `src/data/content.js` — no duplication. No new content invented.
- Vite `base: '/LumenKids/'`. Final URL unchanged: `https://samuelleonv.github.io/LumenKids/`.
- Source of truth for the port = the archived files in `legacy/` (`legacy/index.html` login, `legacy/aventura-biblica.html` game).
- Login is **visual/mock** (no auth backend).

---

### Task 0: Archive legacy + scaffold Vite/React project

**Files:**
- Create: `legacy/` (move existing `index.html`, `aventura-biblica.html`, `support.js`, `vendor/`, `login-monolitico.html`, `Login Discipulado.dc.html`, `HANDOFF.md`, `assets/`, `uploads/`, `scraps/`, `.thumbnail` into it)
- Create: `package.json`, `vite.config.js`, `index.html`, `.gitignore`, `src/main.jsx`, `src/App.jsx` (placeholder)
- Keep at root: `README.md`, `.nojekyll`, `docs/`, `project/`

**Interfaces:**
- Produces: a runnable Vite app (`npm run dev`, `npm run build`) mounting `<App/>` into `#root`.

- [ ] **Step 1: Move current static site into `legacy/`**

```bash
cd /home/sleon/Documentos/GitHub/LumenKids
mkdir -p legacy
git mv index.html aventura-biblica.html support.js login-monolitico.html "Login Discipulado.dc.html" HANDOFF.md .thumbnail legacy/ 2>/dev/null || true
git mv vendor assets uploads scraps legacy/ 2>/dev/null || true
git mv project legacy/project 2>/dev/null || true
ls legacy/
```
Expected: the old files now live under `legacy/`.

- [ ] **Step 2: Create `package.json`**

```json
{
  "name": "lumenkids",
  "version": "1.0.0",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview",
    "test": "vitest run"
  },
  "dependencies": {
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "three": "0.128.0"
  },
  "devDependencies": {
    "@vitejs/plugin-react": "^4.3.4",
    "vite": "^5.4.11",
    "vitest": "^2.1.8"
  }
}
```

- [ ] **Step 3: Create `vite.config.js`**

```js
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  base: '/LumenKids/',
  plugins: [react()],
  test: { environment: 'jsdom' },
});
```

- [ ] **Step 4: Create root `index.html` (Vite entry shell)**

```html
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
  <title>Pequeños Discípulos — LumenKids</title>
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Baloo+2:wght@500;600;700;800&family=Nunito:ital,wght@0,400;0,600;0,700;0,800;1,600&display=swap" rel="stylesheet" />
</head>
<body>
  <div id="root"></div>
  <script type="module" src="/src/main.jsx"></script>
</body>
</html>
```

- [ ] **Step 5: Create `.gitignore`**

```
node_modules/
dist/
*.log
```

- [ ] **Step 6: Create `src/main.jsx`**

```jsx
import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.jsx';
import './styles/global.css';

createRoot(document.getElementById('root')).render(<App />);
```

- [ ] **Step 7: Create placeholder `src/App.jsx` and `src/styles/global.css`**

```jsx
// src/App.jsx
export default function App() {
  return <div style={{ padding: 40, fontFamily: 'Nunito, sans-serif' }}>LumenKids — scaffold OK</div>;
}
```
```css
/* src/styles/global.css */
* { box-sizing: border-box; }
html, body { margin: 0; padding: 0; }
```

- [ ] **Step 8: Install and verify dev server boots**

Run:
```bash
npm install
npm run build
```
Expected: `npm run build` finishes with a `dist/` folder and no errors. (Optionally `npm run dev` and confirm "scaffold OK" renders.)

- [ ] **Step 9: Commit**

```bash
git add -A
git commit -m "chore: scaffold Vite+React app, archive legacy static site"
```

---

### Task 1: Shared content module

**Files:**
- Create: `src/data/content.js`
- Test: `src/data/content.test.js`
- Read for source values: `legacy/aventura-biblica.html` (the `STORIES` array, ~lines 453-475), `legacy/index.html` (the `modals` object in the dc-script, and the character labels in the select screen)

**Interfaces:**
- Produces:
  - `export const STORIES` — array of 7 objects, each `{ id, emoji, name, beacon, robe, skin, story, q, opts: string[3], answer: number }`.
  - `export const CHARACTERS` — `{ ovejita, discipulo, nino }`, each `{ key, name, desc }`.
  - `export const MODALS` — `{ cross, dove, jesus, sheep }`, each `{ emoji, title, text, verse, c1, c2 }`.

- [ ] **Step 1: Write the failing test**

```js
// src/data/content.test.js
import { describe, it, expect } from 'vitest';
import { STORIES, CHARACTERS, MODALS } from './content.js';

describe('content', () => {
  it('has 7 stories, each well-formed', () => {
    expect(STORIES).toHaveLength(7);
    for (const s of STORIES) {
      expect(typeof s.id).toBe('string');
      expect(s.opts).toHaveLength(3);
      expect(s.answer).toBeGreaterThanOrEqual(0);
      expect(s.answer).toBeLessThan(3);
      expect(typeof s.story).toBe('string');
      expect(typeof s.q).toBe('string');
    }
  });
  it('has unique story ids', () => {
    expect(new Set(STORIES.map(s => s.id)).size).toBe(7);
  });
  it('has 3 characters and 4 modals', () => {
    expect(Object.keys(CHARACTERS)).toEqual(['ovejita', 'discipulo', 'nino']);
    expect(Object.keys(MODALS)).toEqual(['cross', 'dove', 'jesus', 'sheep']);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test -- content`
Expected: FAIL — `content.js` does not exist.

- [ ] **Step 3: Create `src/data/content.js`**

Copy the 7 stories **verbatim** from `legacy/aventura-biblica.html` (`const STORIES=[...]`). Add a stable `id` to each (kebab name): `adan-eva`, `noe`, `moises`, `david`, `jonas`, `daniel`, `nino-jesus`. Copy the 4 login modals verbatim from the `modals` object in `legacy/index.html`'s dc-script (`cross/dove/jesus/sheep` with `emoji,title,text,verse` and the two colors `c1,c2`). Add the 3 characters from the select screen labels.

```js
// src/data/content.js
// Single source of truth for all Bible content. Values copied verbatim from the
// original prototypes (legacy/aventura-biblica.html STORIES, legacy/index.html modals).

export const STORIES = [
  { id: 'adan-eva', emoji: '🌳', name: 'Adán y Eva', beacon: 0x7ed957, robe: 0x4caf50, skin: 0xe7b48a,
    story: 'Al principio, Dios creó los cielos y la tierra: la luz, el mar, las plantas, los animales y, por último, a las personas. Vio que todo era muy bueno.',
    q: '¿En cuántos días creó Dios el mundo y luego descansó?', opts: ['3 días', '7 días', '30 días'], answer: 1 },
  { id: 'noe', emoji: '🚢', name: 'Noé', beacon: 0x4a9eff, robe: 0x8d5a2b, skin: 0xd9a06b,
    story: 'Dios le pidió a Noé construir un arca enorme para salvar a su familia y a los animales del gran diluvio. Noé obedeció y los animales entraron de dos en dos.',
    q: '¿De cuántos en cuántos entraron los animales al arca?', opts: ['De uno en uno', 'De dos en dos', 'De diez en diez'], answer: 1 },
  { id: 'moises', emoji: '🌊', name: 'Moisés', beacon: 0x29c7c7, robe: 0x9e3b3b, skin: 0xc98a5a,
    story: 'Dios usó a Moisés para sacar a su pueblo de Egipto. Al llegar al Mar Rojo, Dios abrió las aguas para que cruzaran caminando por tierra seca.',
    q: '¿Qué hizo Dios para que el pueblo cruzara el mar?', opts: ['Un puente de madera', 'Abrió las aguas', 'Secó el mar para siempre'], answer: 1 },
  { id: 'david', emoji: '🪨', name: 'David', beacon: 0xffd23f, robe: 0x3f6fb0, skin: 0xe7b48a,
    story: 'David era un joven pastor. Con fe en Dios y una honda con una piedra, venció al gigante Goliat. Nos enseña que con Dios podemos ser valientes.',
    q: '¿Con qué venció David al gigante Goliat?', opts: ['Una espada enorme', 'Una honda y una piedra', 'Un gran escudo'], answer: 1 },
  { id: 'jonas', emoji: '🐟', name: 'Jonás', beacon: 0x5a8f3a, robe: 0x2e7d6b, skin: 0xd9a06b,
    story: 'Jonás no quería obedecer a Dios y huyó en un barco. Un gran pez se lo tragó. Tras tres días, Jonás oró y el pez lo dejó en la orilla. Aprendió a obedecer.',
    q: '¿Qué se tragó a Jonás?', opts: ['Una ola gigante', 'Un gran pez', 'Una tormenta'], answer: 1 },
  { id: 'daniel', emoji: '🦁', name: 'Daniel', beacon: 0xff9d3a, robe: 0x7b4fae, skin: 0xc98a5a,
    story: 'Daniel amaba orar a Dios. Lo echaron a un foso con leones, pero Dios envió un ángel que cerró la boca de los leones. Daniel salió sano y salvo.',
    q: '¿Quién protegió a Daniel de los leones?', opts: ['Un cazador', 'Dios envió un ángel', 'Los guardias'], answer: 1 },
  { id: 'nino-jesus', emoji: '⭐', name: 'El Niño Jesús', beacon: 0xffe066, robe: 0xfff3c4, skin: 0xe7b48a,
    story: 'Jesús nació en un pesebre en Belén. Una estrella muy brillante guió a los reyes magos para encontrarlo y llevarle regalos.',
    q: '¿En qué ciudad nació Jesús?', opts: ['Jerusalén', 'Belén', 'Nazaret'], answer: 1 },
];

export const CHARACTERS = {
  ovejita:   { key: 'ovejita',   name: 'Ovejita',        desc: 'Tierna y lanudita 🐑' },
  discipulo: { key: 'discipulo', name: 'Discípulo',      desc: 'Sigue a Jesús ✨' },
  nino:      { key: 'nino',      name: 'Niño Cristiano', desc: 'Lleno de fe ❤️' },
};

export const MODALS = {
  cross: { emoji: '✝️', title: 'La Cruz', verse: 'Juan 3:16', c1: '#3a9b63', c2: '#1f5d39',
    text: 'La cruz nos recuerda que Jesús nos ama muchísimo. Dio su vida por nosotros y al tercer día ¡resucitó! La tela roja nos habla de su amor que nos hace libres.' },
  dove: { emoji: '🕊️', title: 'La Paloma', verse: 'Mateo 3:16', c1: '#5fa0d8', c2: '#2f6fae',
    text: 'La palomita lleva una ramita de olivo: es señal de paz. También nos recuerda al Espíritu Santo, el amigo que Dios pone en nuestro corazón para acompañarnos siempre.' },
  jesus: { emoji: '👑', title: 'Jesús, el Buen Pastor', verse: 'Juan 10:11', c1: '#e3aa52', c2: '#bf8129',
    text: 'Jesús es como un pastor bueno que cuida a cada una de sus ovejas. Te conoce por tu nombre, te protege y nunca te deja solo.' },
  sheep: { emoji: '🐑', title: 'La Oveja Perdida', verse: 'Lucas 15:4-7', c1: '#e3886a', c2: '#c8523f',
    text: 'Cuando una ovejita se pierde, el pastor la busca hasta encontrarla. ¡Así te busca Jesús a ti! Eres tan importante que Él nunca se rinde.' },
};
```
(Verify each story's `story/q/opts/answer` against `legacy/aventura-biblica.html` before saving — copy exactly.)

- [ ] **Step 4: Run test to verify it passes**

Run: `npm run test -- content`
Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add src/data/content.js src/data/content.test.js
git commit -m "feat: shared Bible content module (stories, characters, modals)"
```

---

### Task 2: App shell — screen state + persistence

**Files:**
- Modify: `src/App.jsx` (replace placeholder)
- Create: `src/lib/save.js`
- Test: `src/lib/save.test.js`

**Interfaces:**
- Consumes: nothing yet (Login/Aventura are added in later tasks; until then App renders a stub for the `game` screen).
- Produces:
  - `src/lib/save.js`: `export function loadSave()` → `{ character: string|null, stars: number, solved: string[] }` (defaults when absent/corrupt); `export function persist(save)` (writes to `localStorage['lumenkids.save']`); `export function clearSave()`.
  - `App` renders `<Login onChoose={fn} savedCharacter={...} />` when `screen==='login'`, and `<Aventura .../>` when `screen==='game'`. It owns `progress = { stars, solved }`. `onChoose(key)` sets `character` + `screen='game'`. `onStar(storyId)` adds to `solved`/increments `stars` and persists. `onExit()` returns to login.

- [ ] **Step 1: Write the failing test for save/load**

```js
// src/lib/save.test.js
import { describe, it, expect, beforeEach } from 'vitest';
import { loadSave, persist, clearSave } from './save.js';

beforeEach(() => localStorage.clear());

describe('save', () => {
  it('returns defaults when empty', () => {
    expect(loadSave()).toEqual({ character: null, stars: 0, solved: [] });
  });
  it('round-trips a save', () => {
    persist({ character: 'nino', stars: 2, solved: ['noe', 'david'] });
    expect(loadSave()).toEqual({ character: 'nino', stars: 2, solved: ['noe', 'david'] });
  });
  it('returns defaults on corrupt data', () => {
    localStorage.setItem('lumenkids.save', 'not json');
    expect(loadSave()).toEqual({ character: null, stars: 0, solved: [] });
  });
  it('clearSave wipes it', () => {
    persist({ character: 'nino', stars: 1, solved: ['noe'] });
    clearSave();
    expect(loadSave().character).toBe(null);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test -- save`
Expected: FAIL — `save.js` not found.

- [ ] **Step 3: Implement `src/lib/save.js`**

```js
const KEY = 'lumenkids.save';
const DEFAULTS = { character: null, stars: 0, solved: [] };

export function loadSave() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return { ...DEFAULTS };
    const o = JSON.parse(raw);
    return {
      character: typeof o.character === 'string' ? o.character : null,
      stars: Number.isFinite(o.stars) ? o.stars : 0,
      solved: Array.isArray(o.solved) ? o.solved : [],
    };
  } catch {
    return { ...DEFAULTS };
  }
}

export function persist(save) {
  try { localStorage.setItem(KEY, JSON.stringify(save)); } catch {}
}

export function clearSave() {
  try { localStorage.removeItem(KEY); } catch {}
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm run test -- save`
Expected: PASS (4 tests).

- [ ] **Step 5: Implement `src/App.jsx` (with temporary stubs for Login/Aventura)**

```jsx
import { useState, useCallback } from 'react';
import { loadSave, persist, clearSave } from './lib/save.js';
import { STORIES } from './data/content.js';

export default function App() {
  const [save, setSave] = useState(loadSave);
  const [screen, setScreen] = useState('login');
  const [character, setCharacter] = useState(save.character);

  const choose = useCallback((key) => {
    setCharacter(key);
    setSave((s) => { const next = { ...s, character: key }; persist(next); return next; });
    setScreen('game');
  }, []);

  const onStar = useCallback((storyId) => {
    setSave((s) => {
      if (s.solved.includes(storyId)) return s;
      const next = { ...s, solved: [...s.solved, storyId], stars: s.stars + 1 };
      persist(next);
      return next;
    });
  }, []);

  const onExit = useCallback(() => setScreen('login'), []);
  const reset = useCallback(() => { clearSave(); setSave(loadSave()); setCharacter(null); }, []);

  if (screen === 'game') {
    // Placeholder until Task 5 adds <Aventura/>.
    return (
      <div style={{ padding: 40, fontFamily: 'Nunito, sans-serif' }}>
        <p>Juego (personaje: {character}) — pendiente Task 5</p>
        <button onClick={onExit}>⟵ Menú</button>
      </div>
    );
  }
  // Placeholder until Task 3 adds <Login/>.
  return (
    <div style={{ padding: 40, fontFamily: 'Nunito, sans-serif' }}>
      <p>Login — pendiente Task 3. Total historias: {STORIES.length}. Estrellas: {save.stars}</p>
      <button onClick={() => choose('nino')}>Entrar como Niño (stub)</button>
      <button onClick={reset}>Reiniciar progreso</button>
    </div>
  );
}
```

- [ ] **Step 6: Build to verify it compiles**

Run: `npm run build`
Expected: success, no errors.

- [ ] **Step 7: Commit**

```bash
git add src/App.jsx src/lib/save.js src/lib/save.test.js
git commit -m "feat: app shell with screen state and localStorage persistence"
```

---

### Task 3: Login screen ported to React

**Files:**
- Create: `src/screens/Login.jsx`
- Create: `src/lib/style.js` (the `s()` CSS-string→object helper)
- Modify: `src/styles/global.css` (add the `@keyframes` from the dc `<style>`)
- Modify: `src/App.jsx` (import and render `<Login>`)
- Read for source: `legacy/index.html` (template inside `<x-dc>` and the `DCLogic` class in the `<script type="text/x-dc">`)

**Interfaces:**
- Consumes: `MODALS`, `CHARACTERS` from `src/data/content.js`; `App`'s `onChoose(key)` and `savedCharacter` props.
- Produces: `export default function Login({ onChoose, savedCharacter })` — renders the parallax scene, the lost-sheep minigame, the clickable Bible modals, the login form (mock), and the character-select; calling `onChoose(characterKey)` when a character is chosen.

> **Port strategy.** This is the largest task. The dc template is HTML with `{{ }}`
> bindings; the logic is the `DCLogic` class (already React-shaped: `state`,
> `setState`, refs, `componentDidMount`, `renderVals`). Convert mechanically:
>
> | dc form | React form |
> |---|---|
> | `class Component extends DCLogic` | `class LoginInner extends React.Component` |
> | `style="..."` (string) | `style={s("...")}` using the helper below — keep the string verbatim |
> | `class="x"` | `className="x"` |
> | `onClick="{{ fn }}"` | `onClick={this.fn}` |
> | `ref="{{ x }}"` | `ref={this.x}` |
> | `{{ expr }}` (text/attr) | `{expr}` / `{this.state...}` |
> | `<sc-if value="{{ c }}">…</sc-if>` | `{c && (<>…</>)}` |
> | `<sc-for list="{{ xs }}" as="x">…</sc-for>` | `{xs.map((x, i) => (<React.Fragment key={i}>…</React.Fragment>))}` |
> | `renderVals()` returns | compute the same values as `const`s inside `render()` |
>
> Keep the minigame loop (`tick`, `componentDidMount`/`componentWillUnmount`,
> refs, key handlers) **verbatim** — it already uses delta-time. Drop everything
> related to the embedded 3D world (`initVoxel`, `voxelStep`, `buildWorld`,
> `PARTS`/`MODEL3D`, `worldRootRef`, the `showWorld` branch): in this app the game
> is a separate screen. `chooseChar(type)` becomes `() => this.props.onChoose(type)`.
> Read modal text/verse/colors from `MODALS` (imported) instead of the inline
> `modals` object. Wrap the class in a default-export function component if you
> prefer, or export the class directly.

- [ ] **Step 1: Create the style helper `src/lib/style.js`**

```js
// Parse a CSS declaration string into a React style object so the prototype's
// inline style strings can be reused verbatim (React does not accept style strings).
export function s(css) {
  const out = {};
  if (!css) return out;
  for (const decl of css.split(';')) {
    const i = decl.indexOf(':');
    if (i < 0) continue;
    const key = decl.slice(0, i).trim().replace(/-([a-z])/g, (_, c) => c.toUpperCase());
    const val = decl.slice(i + 1).trim();
    if (key) out[key] = val;
  }
  return out;
}
```

- [ ] **Step 2: Add a unit test for `s()`**

```js
// src/lib/style.test.js
import { describe, it, expect } from 'vitest';
import { s } from './style.js';

describe('s()', () => {
  it('parses declarations and camel-cases props', () => {
    expect(s('position: absolute; background-color: #fff; z-index: 4'))
      .toEqual({ position: 'absolute', backgroundColor: '#fff', zIndex: '4' });
  });
  it('ignores empties', () => {
    expect(s('')).toEqual({});
    expect(s('color:red;;')).toEqual({ color: 'red' });
  });
});
```

Run: `npm run test -- style`
Expected: PASS (2 tests).

- [ ] **Step 3: Move the dc `@keyframes` + helpers into `src/styles/global.css`**

Copy the entire contents of the `<style>` block in `legacy/index.html` (all `@keyframes ld-*` and the `.ld-pl` rule and the `*{box-sizing}` reset) into `src/styles/global.css`, appended after the existing reset. These animations are referenced by name in the inline styles, so they must be global.

- [ ] **Step 4: Create `src/screens/Login.jsx`**

Port the dc template + class per the strategy table above. Structure:

```jsx
import React from 'react';
import { s } from '../lib/style.js';
import { MODALS, CHARACTERS } from '../data/content.js';

class LoginInner extends React.Component {
  state = {
    email: '', password: '', showPass: false, remember: true,
    focus: null, loading: false, error: '', btnHover: false,
    reunited: false, activeModal: null,
  };
  // refs (rootRef, flockRef, playerRef, playerSpriteRef) — copy from dc
  // sheep / fireflies arrays — copy from dc
  // componentDidMount / componentWillUnmount / tick / hop / press* — copy verbatim (login minigame)
  // openCross/openDove/openJesus/openSheep/closeModal/stopProp — copy
  // onSubmit: on success, instead of phase:'select', set state to show the character-select overlay
  // chooseChar = (type) => () => this.props.onChoose(type);
  // emailIsValid — copy

  render() {
    const m = this.state.activeModal ? MODALS[this.state.activeModal] : null;
    // ...compute the same derived values renderVals() produced...
    return (
      <div ref={this.rootRef} style={s("position: relative; width: 100%; min-height: 100vh; overflow: hidden; font-family: 'Nunito', sans-serif; --mx: 0px; --my: 0px; background: linear-gradient(180deg, #bfe6f3 0%, #d6eff0 32%, #e9f6e6 52%, #f7efd9 78%, #f6e3c4 100%);")}>
        {/* parallax scene, dove, cross, Jesus+flock, player, login card,
            modal (uses m.emoji/m.title/m.text/m.verse/m.c1/m.c2),
            character-select (maps CHARACTERS, each Elegir -> this.chooseChar(key)) */}
      </div>
    );
  }
}

export default function Login(props) {
  return <LoginInner {...props} />;
}
```

Port each scene section from `legacy/index.html` lines 84-507 (SKY/CLOUDS/DOVE/MOUNTAINS/HILLS/TREES/PLAYER/CROSS/FLOCK/FOREGROUND/FIREFLIES/LOGIN CARD/MODAL/CHARACTER SELECT), applying the transform table. Omit the OPEN WORLD (`showWorld`) block and the GAME HUD's world-control arrows (keep the lost-sheep hint + the ◀ ↑ ▶ that drive the 2D minigame). The character-select "Elegir" buttons call `this.chooseChar(key)`.

- [ ] **Step 5: Wire `<Login>` into `App.jsx`**

Replace the login placeholder branch:
```jsx
import Login from './screens/Login.jsx';
// ...
return <Login onChoose={choose} savedCharacter={save.character} />;
```

- [ ] **Step 6: Build + manual smoke**

Run: `npm run build` (expect success), then `npm run dev`.
Verify in the browser: the parallax login renders; the cross/dove/Jesús/sheep open the correct modals with the right verse; the lost-sheep minigame moves with arrows/buttons; submitting the form (valid email + ≥4 char password) reveals the character-select; clicking a character calls `onChoose` and the app switches to the (stub) game screen.

- [ ] **Step 7: Commit**

```bash
git add src/screens/Login.jsx src/lib/style.js src/lib/style.test.js src/styles/global.css src/App.jsx
git commit -m "feat: port login screen to React (no dc-runtime)"
```

---

### Task 4: Game engine module (vanilla Three → `engine.js`)

**Files:**
- Create: `src/game/engine.js`
- Read for source: `legacy/aventura-biblica.html` (the big inline `<script>` after the Three tag)

**Interfaces:**
- Consumes: `three` (npm); `STORIES` from `src/data/content.js`.
- Produces: `export function createGame({ canvas, character, stories, onStar, onWin })` → returns `{ dispose() }`. Internally builds the renderer on the provided `canvas`, runs the existing loop, calls `onStar(storyId)` when a question is answered correctly and `onWin()` when all 7 stars are collected, and drives the existing HUD DOM (`#stars`, `#overlay`, option buttons) which Task 5 renders.

> **Port strategy.** Copy the entire inline game script from
> `legacy/aventura-biblica.html` into `engine.js`. Apply these changes only:
> 1. Add at the top: `import * as THREE from 'three';` (replaces the CDN global).
> 2. Remove the WebGL feature-detect IIFE at the top — Task 5's wrapper does the
>    detection before calling `createGame`.
> 3. Wrap the whole thing in `export function createGame({ canvas, character, stories, onStar, onWin }) { ... }`.
>    - Use the passed `canvas` for the renderer: `new THREE.WebGLRenderer({ canvas, antialias: !IS_TOUCH })` instead of creating/appending its own canvas.
>    - Replace the module-level `STORIES` const with the `stories` parameter.
>    - Replace the `?char=` query read (`new URLSearchParams(location.search).get('char')`) with the `character` argument.
>    - Where the game increments the star count / completes a story, also call `onStar(story.id)`; on reaching 7, call `onWin()`. (Map the game's internal story object to its `id` via the `stories` array order.)
> 4. Track every `requestAnimationFrame` id, every `window`/`document`
>    `addEventListener`, and the renderer; return a `dispose()` that cancels the
>    RAF loop, removes the listeners, and calls `renderer.dispose()`.
> 5. Do **not** touch the simulation math (chunks, voxel, NPC, gravity, the
>    delta-time loop) — it already behaves correctly.

- [ ] **Step 1: Create `src/game/engine.js` per the strategy**

Bring the script over, apply the 5 changes. Export shape:
```js
import * as THREE from 'three';
import { STORIES } from '../data/content.js'; // default stories if none passed

export function createGame({ canvas, character, stories = STORIES, onStar = () => {}, onWin = () => {} }) {
  // ...ported game body, using `canvas`, `character`, `stories`, and calling onStar/onWin...
  return {
    dispose() {
      // cancelAnimationFrame(rafId); remove listeners; renderer.dispose();
    },
  };
}
```

- [ ] **Step 2: Build to verify it bundles (catches missing `THREE.*` symbols)**

Run: `npm run build`
Expected: success. (If Vite reports an undefined export from `three`, it means the game used an r-specific symbol; confirm `three@0.128.0` is installed — the pinned version matches.)

- [ ] **Step 3: Commit**

```bash
git add src/game/engine.js
git commit -m "feat: vanilla Three.js game engine as bundled module (createGame)"
```

---

### Task 5: Aventura wrapper (React) + HUD + WebGL guard

**Files:**
- Create: `src/game/Aventura.jsx`
- Modify: `src/App.jsx` (render `<Aventura>` for the `game` screen)
- Read for source: `legacy/aventura-biblica.html` (the HUD markup: `#stars`, `#overlay`, `#hud`, intro/win panels, option buttons — lines ~140-192)

**Interfaces:**
- Consumes: `createGame` from `src/game/engine.js`; `STORIES` from content; App's `character`, `onStar`, `onWin`, `onExit` props.
- Produces: `export default function Aventura({ character, onStar, onWin, onExit })` — renders a full-screen `<canvas>` + the ported HUD DOM (same ids the engine drives) + a React "⟵ Menú" button (`onExit`) + a WebGL fallback card.

- [ ] **Step 1: Create `src/game/Aventura.jsx`**

```jsx
import { useEffect, useRef, useState } from 'react';
import { createGame } from './engine.js';
import { STORIES } from '../data/content.js';

function webglOK() {
  try {
    const c = document.createElement('canvas');
    return !!(window.WebGLRenderingContext && (c.getContext('webgl') || c.getContext('experimental-webgl')));
  } catch { return false; }
}

export default function Aventura({ character, onStar, onWin, onExit }) {
  const canvasRef = useRef(null);
  const [noWebgl, setNoWebgl] = useState(false);

  useEffect(() => {
    if (!webglOK()) { setNoWebgl(true); return; }
    const game = createGame({
      canvas: canvasRef.current,
      character,
      stories: STORIES,
      onStar,
      onWin,
    });
    return () => game.dispose();
  }, [character, onStar, onWin]);

  if (noWebgl) {
    return (
      <div style={{ position: 'fixed', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 32, textAlign: 'center', background: '#aee3ff', fontFamily: 'system-ui, sans-serif' }}>
        <div style={{ maxWidth: 380, background: '#fff', borderRadius: 24, padding: '28px 26px' }}>
          <div style={{ fontSize: 46 }}>🐑</div>
          <h2>El juego 3D no se puede mostrar</h2>
          <p>Tu navegador no tiene WebGL activo. Probá en Chrome o Firefox de escritorio, o activá la aceleración por hardware.</p>
          <button onClick={onExit}>⟵ Menú</button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ position: 'fixed', inset: 0, overflow: 'hidden' }}>
      <canvas ref={canvasRef} style={{ display: 'block', width: '100%', height: '100%' }} />
      {/* Ported HUD DOM with the SAME ids the engine queries (#stars, #overlay, #hud, ...). */}
      <button onClick={onExit} style={{ position: 'fixed', top: 14, left: 14, zIndex: 10 }}>⟵ Menú</button>
    </div>
  );
}
```

- [ ] **Step 2: Port the HUD markup**

Copy the HUD DOM from `legacy/aventura-biblica.html` (the `#hud`, `#crosshair`, `#stars`, `#overlay` intro/win panels, the option-button container) into `Aventura.jsx`'s returned JSX, keeping every `id` and `class`→`className` intact so `engine.js`'s `getElementById`/`querySelector` calls still find them. Convert inline styles with `s()` if present, or move them to `global.css`.

- [ ] **Step 3: Wire `<Aventura>` into `App.jsx`**

Replace the game placeholder branch:
```jsx
import Aventura from './game/Aventura.jsx';
// ...
if (screen === 'game') {
  return <Aventura character={character} onStar={onStar} onWin={() => {}} onExit={onExit} />;
}
```

- [ ] **Step 4: Build + manual smoke**

Run: `npm run build` (expect success), then `npm run dev`.
Verify: choosing a character in the login enters the game; the voxel world renders on the canvas; movement (WASD / touch) and look work; finding an NPC opens the question; a correct answer increments ⭐ and (via `onStar`) the App progress; "⟵ Menú" returns to login; on a browser with WebGL disabled, the fallback card shows.

- [ ] **Step 5: Commit**

```bash
git add src/game/Aventura.jsx src/App.jsx src/styles/global.css
git commit -m "feat: Aventura React wrapper mounting the Three engine + WebGL fallback"
```

---

### Task 6: Deploy via GitHub Actions to Pages

**Files:**
- Create: `.github/workflows/deploy.yml`
- Modify: `README.md` (update run/deploy instructions for the Vite app)

**Interfaces:**
- Consumes: the buildable app (`npm run build` → `dist/`).
- Produces: an Actions workflow that builds and publishes `dist/` to Pages on push to `main`.

- [ ] **Step 1: Create `.github/workflows/deploy.yml`**

```yaml
name: Deploy to GitHub Pages
on:
  push:
    branches: [main]
  workflow_dispatch:
permissions:
  contents: read
  pages: write
  id-token: write
concurrency:
  group: pages
  cancel-in-progress: true
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 20, cache: npm }
      - run: npm ci
      - run: npm run build
      - uses: actions/upload-pages-artifact@v3
        with: { path: dist }
  deploy:
    needs: build
    runs-on: ubuntu-latest
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    steps:
      - id: deployment
        uses: actions/deploy-pages@v4
```

- [ ] **Step 2: Switch Pages to "GitHub Actions" build mode**

Run:
```bash
gh api -X PUT repos/SamuelLeonV/LumenKids/pages -f build_type=workflow
```
Expected: JSON with `"build_type": "workflow"`.

- [ ] **Step 3: Update `README.md`**

Replace the "Cómo correr local" / "Estructura" sections to describe the Vite app:
`npm install` → `npm run dev` (local) / `npm run build` (prod); structure under `src/`; legacy static prototype under `legacy/`; deploy is automatic via Actions on push to `main`.

- [ ] **Step 4: Commit and push**

```bash
git add .github/workflows/deploy.yml README.md
git commit -m "ci: build and deploy Vite app to GitHub Pages via Actions"
git push origin main
```

- [ ] **Step 5: Verify the live deploy**

```bash
# wait for the workflow, then:
gh run watch
curl -s -o /dev/null -w "%{http_code}\n" https://samuelleonv.github.io/LumenKids/
```
Expected: workflow success; HTTP 200. Open the URL: login → character → game works, with no CDN requests for React/Three (all bundled).

---

## Self-Review

**1. Spec coverage:**
- §3.1 structure → Tasks 0,1,2,3,4,5 create exactly those files. ✓
- §3.2 components (App/Login/Aventura/engine) → Tasks 2,3,5,4. ✓
- §3.3 flow (login→game, no `?char=`) → Task 2 (state), Task 3 (`onChoose`), Task 5 (render). ✓
- §4 content (STORIES/CHARACTERS/MODALS) → Task 1. ✓
- §5 persistence (localStorage) → Task 2 (`save.js`). ✓
- §6 deploy (Actions, base path, Pages mode) → Task 6 + Task 0 (`vite.config.js` base). ✓
- §2 no CDN/eval/dc-runtime → Task 4 (`import three`), Task 3 (login off dc-runtime), Task 0 (legacy archived). ✓
- WebGL fallback → Task 5. ✓

**2. Placeholder scan:** Login (Task 3) and engine (Task 4) reference the verbatim source in `legacy/` plus explicit transform rules and the glue code — not "implement later". App stubs in Task 2 are explicitly temporary and replaced in Tasks 3/5. No "TBD"/"add error handling"-style gaps.

**3. Type consistency:** `onChoose(key)` (Task 2 produces, Task 3 consumes); `createGame({canvas,character,stories,onStar,onWin})` (Task 4 produces, Task 5 consumes); `loadSave/persist/clearSave` (Task 2); `onStar(storyId)` uses `story.id` from `content.js` (Task 1) — consistent across tasks.
