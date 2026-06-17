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
