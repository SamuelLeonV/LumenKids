// src/minigames/MemoriaVersiculos.jsx
// "Memoria de Versículos" — match each MODAL emoji card with its verse reference card.
import { useState, useEffect, useRef, useCallback } from 'react';
import { MODALS } from '../data/content.js';

// Build the deck: 8 cards — for each of the 4 modals, one emoji card + one verse card.
function buildDeck() {
  const cards = [];
  Object.entries(MODALS).forEach(([key, modal]) => {
    cards.push({ id: `${key}-emoji`, modalKey: key, type: 'emoji',  label: modal.emoji,   c1: modal.c1, c2: modal.c2 });
    cards.push({ id: `${key}-verse`, modalKey: key, type: 'verse',  label: modal.verse,   c1: modal.c1, c2: modal.c2 });
  });
  // Fisher-Yates shuffle
  for (let i = cards.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [cards[i], cards[j]] = [cards[j], cards[i]];
  }
  return cards;
}

function computeScore(moves) {
  // 4 is the theoretical minimum (one flip pair per modal).
  // Each extra move beyond 4 costs 8 points, floor at 20.
  return Math.max(20, 100 - (moves - 4) * 8);
}

// --- styles ---
const CARD_BACK = '#4a6fa5';
const CARD_BACK_BORDER = '#2d4f82';

const styles = {
  wrapper: {
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #1a1a4e 0%, #2d3a8c 50%, #1a1a4e 100%)',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'flex-start',
    padding: '16px 12px',
    fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
    boxSizing: 'border-box',
  },
  title: {
    color: '#ffe066',
    fontSize: '1.7rem',
    fontWeight: 900,
    textAlign: 'center',
    marginBottom: '6px',
    textShadow: '0 2px 8px rgba(0,0,0,0.5)',
    letterSpacing: '0.02em',
  },
  subtitle: {
    color: '#c8d8ff',
    fontSize: '0.95rem',
    textAlign: 'center',
    marginBottom: '14px',
  },
  movesLabel: {
    color: '#ffe066',
    fontSize: '1rem',
    fontWeight: 700,
    marginBottom: '12px',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gap: '10px',
    maxWidth: '520px',
    width: '100%',
    marginBottom: '18px',
  },
  cardContainer: {
    perspective: '600px',
    cursor: 'pointer',
    userSelect: 'none',
  },
  cardInner: (flipped, matched, c1, c2) => ({
    position: 'relative',
    width: '100%',
    paddingBottom: '100%',
    transformStyle: 'preserve-3d',
    transform: flipped || matched ? 'rotateY(180deg)' : 'rotateY(0deg)',
    transition: 'transform 0.35s ease',
    borderRadius: '14px',
    boxShadow: matched
      ? `0 0 14px 4px ${c1}99`
      : '0 4px 10px rgba(0,0,0,0.35)',
  }),
  cardFace: {
    position: 'absolute',
    inset: 0,
    borderRadius: '14px',
    backfaceVisibility: 'hidden',
    WebkitBackfaceVisibility: 'hidden',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '6px',
    boxSizing: 'border-box',
  },
  cardFront: {
    background: `linear-gradient(145deg, ${CARD_BACK}, ${CARD_BACK_BORDER})`,
    border: `3px solid ${CARD_BACK_BORDER}`,
  },
  cardBack: (c1, c2) => ({
    background: `linear-gradient(145deg, ${c1}, ${c2})`,
    border: `3px solid ${c2}`,
    transform: 'rotateY(180deg)',
    flexDirection: 'column',
    gap: '4px',
  }),
  cardBackText: (isEmoji) => ({
    color: '#fff',
    fontSize: isEmoji ? '2rem' : '0.78rem',
    fontWeight: isEmoji ? 400 : 800,
    textAlign: 'center',
    lineHeight: 1.2,
    textShadow: '0 1px 4px rgba(0,0,0,0.4)',
    wordBreak: 'break-word',
  }),
  cardFrontIcon: {
    fontSize: '2rem',
    color: '#c8d8ff',
    opacity: 0.6,
    textShadow: '0 1px 4px rgba(0,0,0,0.4)',
  },
  // Result overlay
  overlay: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(10,10,40,0.88)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 999,
    padding: '24px',
  },
  resultBox: {
    background: 'linear-gradient(145deg, #1e2d7a, #152060)',
    border: '3px solid #ffe066',
    borderRadius: '24px',
    padding: '32px 28px',
    maxWidth: '360px',
    width: '100%',
    textAlign: 'center',
    boxShadow: '0 8px 40px rgba(0,0,0,0.6)',
  },
  resultTitle: {
    color: '#ffe066',
    fontSize: '2rem',
    fontWeight: 900,
    marginBottom: '8px',
    textShadow: '0 2px 8px rgba(0,0,0,0.5)',
  },
  resultScore: (score) => ({
    color: score >= 80 ? '#4cff8a' : score >= 50 ? '#ffe066' : '#ff8a8a',
    fontSize: '3.5rem',
    fontWeight: 900,
    margin: '10px 0',
    textShadow: '0 2px 12px rgba(0,0,0,0.4)',
  }),
  resultMoves: {
    color: '#c8d8ff',
    fontSize: '1rem',
    marginBottom: '20px',
  },
  btnPrimary: {
    background: 'linear-gradient(135deg, #ffe066, #ffb700)',
    color: '#1a1a4e',
    border: 'none',
    borderRadius: '50px',
    padding: '13px 28px',
    fontSize: '1.05rem',
    fontWeight: 800,
    cursor: 'pointer',
    margin: '6px 4px',
    boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
    transition: 'transform 0.1s',
    display: 'inline-block',
  },
  btnSecondary: {
    background: 'linear-gradient(135deg, #4a6fa5, #2d4f82)',
    color: '#fff',
    border: 'none',
    borderRadius: '50px',
    padding: '13px 28px',
    fontSize: '1.05rem',
    fontWeight: 800,
    cursor: 'pointer',
    margin: '6px 4px',
    boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
    transition: 'transform 0.1s',
    display: 'inline-block',
  },
  exitBtn: {
    background: 'rgba(255,255,255,0.1)',
    color: '#c8d8ff',
    border: '2px solid rgba(255,255,255,0.25)',
    borderRadius: '50px',
    padding: '8px 22px',
    fontSize: '0.9rem',
    fontWeight: 700,
    cursor: 'pointer',
    marginTop: '4px',
  },
};

// Individual card component
function Card({ card, flipped, matched, disabled, onClick }) {
  const isEmoji = card.type === 'emoji';

  function handleClick() {
    if (!disabled && !flipped && !matched) {
      onClick(card.id);
    }
  }

  return (
    <div
      style={styles.cardContainer}
      onClick={handleClick}
      role="button"
      aria-label={flipped || matched ? card.label : 'Carta boca abajo'}
    >
      <div style={styles.cardInner(flipped, matched, card.c1, card.c2)}>
        {/* Front (face down) */}
        <div style={{ ...styles.cardFace, ...styles.cardFront }}>
          <span style={styles.cardFrontIcon}>✦</span>
        </div>
        {/* Back (face up) */}
        <div style={{ ...styles.cardFace, ...styles.cardBack(card.c1, card.c2) }}>
          <span style={styles.cardBackText(isEmoji)}>{card.label}</span>
          {isEmoji && (
            <span style={{ color: '#fff', fontSize: '0.6rem', opacity: 0.8 }}>
              {MODALS[card.modalKey].title}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

export default function MemoriaVersiculos({ onComplete, onExit }) {
  const [deck, setDeck] = useState(() => buildDeck());
  const [flipped, setFlipped] = useState([]);      // ids of currently face-up (unmatched) cards, max 2
  const [matched, setMatched] = useState(new Set()); // ids of matched cards
  const [moves, setMoves] = useState(0);
  const [showResult, setShowResult] = useState(false);
  const [score, setScore] = useState(0);
  const completedRef = useRef(false);
  const lockRef = useRef(false);        // prevents clicking during flip-back animation
  const flipBackTimerRef = useRef(null); // id of the non-match flip-back timeout

  // Clear any pending flip-back timeout on unmount.
  useEffect(() => {
    return () => {
      if (flipBackTimerRef.current) {
        clearTimeout(flipBackTimerRef.current);
        flipBackTimerRef.current = null;
      }
    };
  }, []);

  // Check for game completion whenever matched set changes
  useEffect(() => {
    if (matched.size === 8 && !completedRef.current) {
      completedRef.current = true;
      const s = computeScore(moves);
      setScore(s);
      setShowResult(true);
      onComplete(s);
    }
  }, [matched, moves, onComplete]);

  const handleCardClick = useCallback((id) => {
    if (lockRef.current) return;

    setFlipped((prev) => {
      // Already flipped (shouldn't happen due to Card guard, but safety check)
      if (prev.includes(id)) return prev;

      const next = [...prev, id];

      if (next.length === 2) {
        lockRef.current = true;
        const [id1, id2] = next;
        const card1 = deck.find((c) => c.id === id1);
        const card2 = deck.find((c) => c.id === id2);

        const isMatch =
          card1 && card2 &&
          card1.modalKey === card2.modalKey &&
          card1.type !== card2.type;

        setMoves((m) => m + 1);

        if (isMatch) {
          setMatched((prevMatched) => {
            const updated = new Set(prevMatched);
            updated.add(id1);
            updated.add(id2);
            return updated;
          });
          // Clear flipped immediately for matched pair
          lockRef.current = false;
          return [];
        } else {
          // Flip back after 800ms
          flipBackTimerRef.current = setTimeout(() => {
            flipBackTimerRef.current = null;
            setFlipped([]);
            lockRef.current = false;
          }, 800);
          return next;
        }
      }

      return next;
    });
  }, [deck]);

  function handleRestart() {
    completedRef.current = false;
    lockRef.current = false;
    setDeck(buildDeck());
    setFlipped([]);
    setMatched(new Set());
    setMoves(0);
    setShowResult(false);
    setScore(0);
  }

  const isDisabled = lockRef.current || flipped.length >= 2;

  return (
    <div style={styles.wrapper}>
      <div style={styles.title}>✝ Memoria de Versículos ✝</div>
      <div style={styles.subtitle}>
        Une cada símbolo con su versículo bíblico
      </div>
      <div style={styles.movesLabel}>
        Intentos: {moves}
      </div>

      <div style={styles.grid}>
        {deck.map((card) => (
          <Card
            key={card.id}
            card={card}
            flipped={flipped.includes(card.id)}
            matched={matched.has(card.id)}
            disabled={isDisabled}
            onClick={handleCardClick}
          />
        ))}
      </div>

      <button
        style={styles.exitBtn}
        onClick={onExit}
      >
        ← Volver
      </button>

      {showResult && (
        <div style={styles.overlay}>
          <div style={styles.resultBox}>
            <div style={styles.resultTitle}>
              {score >= 80 ? '🌟 ¡Excelente!' : score >= 50 ? '👏 ¡Bien hecho!' : '💪 ¡Sigue practicando!'}
            </div>
            <div style={styles.resultScore(score)}>{score}</div>
            <div style={styles.resultMoves}>
              Completado en {moves} {moves === 1 ? 'intento' : 'intentos'}
            </div>

            {/* Show modal titles for review */}
            <div style={{ marginBottom: '18px' }}>
              {Object.entries(MODALS).map(([key, modal]) => (
                <div
                  key={key}
                  style={{
                    background: `linear-gradient(135deg, ${modal.c1}33, ${modal.c2}55)`,
                    border: `1px solid ${modal.c1}`,
                    borderRadius: '10px',
                    padding: '6px 10px',
                    marginBottom: '5px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    color: '#fff',
                    fontSize: '0.85rem',
                  }}
                >
                  <span style={{ fontSize: '1.2rem' }}>{modal.emoji}</span>
                  <span style={{ fontWeight: 700 }}>{modal.verse}</span>
                  <span style={{ opacity: 0.8 }}>— {modal.title}</span>
                </div>
              ))}
            </div>

            <div>
              <button
                style={styles.btnPrimary}
                onClick={handleRestart}
              >
                🔄 Jugar de nuevo
              </button>
              <button
                style={styles.btnSecondary}
                onClick={onExit}
              >
                ← Volver
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
