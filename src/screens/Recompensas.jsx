// src/screens/Recompensas.jsx
// Centro de Recompensas — missions journal + minigame hub.
// Props: { save, onScore(key, score), onExit() }
import { useState } from 'react';
import { STORIES } from '../data/content.js';
import QuizRapido from '../minigames/QuizRapido.jsx';
import MemoriaVersiculos from '../minigames/MemoriaVersiculos.jsx';
import QuienEs from '../minigames/QuienEs.jsx';

const GREEN_DARK = '#1f5d39';
const GREEN = '#2f7d4f';
const CREAM = '#f7efd9';
const CREAM_SOFT = '#fdf8ec';

const GAMES = [
  { key: 'quiz', emoji: '⚡', name: 'Quiz Rápido', desc: 'Responde antes que se acabe el tiempo', Comp: QuizRapido },
  { key: 'memoria', emoji: '🧠', name: 'Memoria de Versículos', desc: 'Une cada símbolo con su versículo', Comp: MemoriaVersiculos },
  { key: 'quien', emoji: '🔍', name: '¿Quién es?', desc: 'Adivina el personaje por su pista', Comp: QuienEs },
];

const styles = {
  wrapper: {
    minHeight: '100vh',
    background: `linear-gradient(180deg, ${CREAM} 0%, #f0f6ea 60%, #e9f6e6 100%)`,
    fontFamily: "'Nunito', 'Segoe UI', sans-serif",
    padding: '24px 16px 48px',
    boxSizing: 'border-box',
  },
  inner: {
    maxWidth: 760,
    margin: '0 auto',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 24,
    flexWrap: 'wrap',
  },
  title: {
    fontFamily: "'Baloo 2', 'Nunito', sans-serif",
    fontWeight: 800,
    fontSize: 30,
    color: GREEN_DARK,
    margin: 0,
  },
  exitBtn: {
    background: '#fff',
    color: GREEN_DARK,
    border: `2px solid ${GREEN}`,
    borderRadius: 999,
    padding: '10px 20px',
    fontSize: 15,
    fontWeight: 800,
    cursor: 'pointer',
    boxShadow: '0 6px 16px -8px rgba(40,75,45,0.35)',
  },
  section: {
    background: CREAM_SOFT,
    border: '1px solid rgba(31,93,57,0.12)',
    borderRadius: 24,
    padding: '22px 22px 24px',
    marginBottom: 22,
    boxShadow: '0 14px 34px -22px rgba(40,75,45,0.4)',
  },
  sectionTitle: {
    fontFamily: "'Baloo 2', 'Nunito', sans-serif",
    fontWeight: 800,
    fontSize: 13,
    letterSpacing: 1.5,
    color: GREEN,
    margin: '0 0 16px',
  },
  storyRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    padding: '10px 14px',
    background: '#fff',
    borderRadius: 16,
    marginBottom: 8,
    border: '1px solid rgba(31,93,57,0.08)',
  },
  storyEmoji: { fontSize: 26, width: 34, textAlign: 'center', flexShrink: 0 },
  storyName: { flex: 1, fontWeight: 700, fontSize: 16, color: '#25361f' },
  statusBadge: (done) => ({
    fontSize: 13,
    fontWeight: 800,
    color: done ? GREEN : '#a7afa1',
    whiteSpace: 'nowrap',
  }),
  progressLabel: {
    fontWeight: 800,
    fontSize: 14,
    color: GREEN_DARK,
    margin: '16px 0 8px',
  },
  progressTrack: {
    width: '100%',
    height: 18,
    background: '#e2ead9',
    borderRadius: 999,
    overflow: 'hidden',
  },
  progressFill: (pct) => ({
    width: `${pct}%`,
    height: '100%',
    background: `linear-gradient(90deg, ${GREEN}, ${GREEN_DARK})`,
    borderRadius: 999,
    transition: 'width 0.4s ease',
  }),
  medal: {
    marginTop: 16,
    textAlign: 'center',
    background: `linear-gradient(145deg, #fff3c4, #ffe066)`,
    border: '2px solid #f5c518',
    borderRadius: 18,
    padding: '14px 16px',
  },
  medalEmoji: { fontSize: 44, lineHeight: 1 },
  medalText: {
    fontFamily: "'Baloo 2', 'Nunito', sans-serif",
    fontWeight: 800,
    fontSize: 18,
    color: '#8a6d00',
    marginTop: 4,
  },
  gamesGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: 14,
  },
  gameCard: {
    background: '#fff',
    border: '1px solid rgba(31,93,57,0.1)',
    borderRadius: 20,
    padding: '18px 16px',
    textAlign: 'center',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 6,
    boxShadow: '0 12px 28px -20px rgba(40,75,45,0.5)',
  },
  gameEmoji: { fontSize: 40, lineHeight: 1 },
  gameName: {
    fontFamily: "'Baloo 2', 'Nunito', sans-serif",
    fontWeight: 800,
    fontSize: 17,
    color: '#25361f',
  },
  gameDesc: { fontSize: 12.5, fontWeight: 600, color: '#6b7566', minHeight: 32 },
  bestScore: {
    fontSize: 13,
    fontWeight: 800,
    color: GREEN,
    background: '#eaf4ea',
    borderRadius: 999,
    padding: '4px 14px',
    margin: '4px 0',
  },
  playBtn: {
    width: '100%',
    marginTop: 4,
    padding: '11px',
    border: 'none',
    borderRadius: 14,
    cursor: 'pointer',
    fontFamily: "'Baloo 2', 'Nunito', sans-serif",
    fontWeight: 700,
    fontSize: 15,
    color: '#fff',
    background: `linear-gradient(145deg, #36925c, ${GREEN_DARK})`,
    boxShadow: '0 10px 20px -10px rgba(31,93,57,0.6)',
  },
};

export default function Recompensas({ save, onScore, onExit }) {
  const [active, setActive] = useState(null);

  if (active) {
    const game = GAMES.find((g) => g.key === active);
    if (game) {
      const Comp = game.Comp;
      return (
        <Comp
          onComplete={(score) => {
            onScore(active, score);
            setActive(null);
          }}
          onExit={() => setActive(null)}
        />
      );
    }
  }

  const stars = save?.stars || 0;
  const solved = Array.isArray(save?.solved) ? save.solved : [];
  const rewards = save?.rewards || { quiz: 0, memoria: 0, quien: 0 };
  const progressPct = Math.min(100, Math.round((stars / 7) * 100));

  return (
    <div style={styles.wrapper}>
      <div style={styles.inner}>
        {/* Header */}
        <div style={styles.header}>
          <h1 style={styles.title}>🎖️ Centro de Recompensas</h1>
          <button style={styles.exitBtn} onClick={onExit}>
            ⟵ Menú
          </button>
        </div>

        {/* DIARIO DE MISIONES */}
        <div style={styles.section}>
          <div style={styles.sectionTitle}>📜 DIARIO DE MISIONES</div>
          {STORIES.map((story) => {
            const done = solved.includes(story.id);
            return (
              <div key={story.id} style={styles.storyRow}>
                <span style={styles.storyEmoji}>{story.emoji}</span>
                <span style={styles.storyName}>{story.name}</span>
                <span style={styles.statusBadge(done)}>
                  {done ? '✓ completada' : '🔒 bloqueada'}
                </span>
              </div>
            );
          })}

          <div style={styles.progressLabel}>Estrellas: {stars}/7</div>
          <div style={styles.progressTrack}>
            <div style={styles.progressFill(progressPct)} />
          </div>

          {stars === 7 && (
            <div style={styles.medal}>
              <div style={styles.medalEmoji}>🏅</div>
              <div style={styles.medalText}>¡Pequeño Pastor!</div>
            </div>
          )}
        </div>

        {/* MINIJUEGOS */}
        <div style={styles.section}>
          <div style={styles.sectionTitle}>🎮 MINIJUEGOS</div>
          <div style={styles.gamesGrid}>
            {GAMES.map((game) => (
              <div key={game.key} style={styles.gameCard}>
                <div style={styles.gameEmoji}>{game.emoji}</div>
                <div style={styles.gameName}>{game.name}</div>
                <div style={styles.gameDesc}>{game.desc}</div>
                <div style={styles.bestScore}>
                  ⭐ Mejor: {rewards?.[game.key] || 0}
                </div>
                <button
                  style={styles.playBtn}
                  onClick={() => setActive(game.key)}
                >
                  Jugar
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
