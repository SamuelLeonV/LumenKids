// src/lib/style.js
// Parse a CSS declaration string into a React style object so the prototype's
// inline style strings can be reused verbatim (React does not accept style strings).
export function s(css) {
  const out = {};
  if (!css) return out;
  for (const decl of css.split(';')) {
    const i = decl.indexOf(':');
    if (i < 0) continue;
    const rawKey = decl.slice(0, i).trim();
    const key = rawKey.startsWith('--') ? rawKey : rawKey.replace(/-([a-z])/g, (_, c) => c.toUpperCase());
    const val = decl.slice(i + 1).trim();
    if (key) out[key] = val;
  }
  return out;
}
