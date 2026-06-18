const KEY = 'lumenkids.save';
const DEFAULTS = { character: null, stars: 0, solved: [], rewards: { quiz: 0, memoria: 0, quien: 0 } };

function num(v) {
  return Number.isFinite(v) ? v : 0;
}

export function loadSave() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return { ...DEFAULTS, rewards: { ...DEFAULTS.rewards } };
    const o = JSON.parse(raw);
    const r = o.rewards && typeof o.rewards === 'object' ? o.rewards : {};
    return {
      character: typeof o.character === 'string' ? o.character : null,
      stars: Number.isFinite(o.stars) ? o.stars : 0,
      solved: Array.isArray(o.solved) ? o.solved : [],
      rewards: { quiz: num(r.quiz), memoria: num(r.memoria), quien: num(r.quien) },
    };
  } catch {
    return { ...DEFAULTS, rewards: { ...DEFAULTS.rewards } };
  }
}

export function persist(save) {
  try { localStorage.setItem(KEY, JSON.stringify(save)); } catch {}
}

export function clearSave() {
  try { localStorage.removeItem(KEY); } catch {}
}
