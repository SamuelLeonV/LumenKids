// src/minigames/QuizRapido.jsx
// Quiz Rápido — rapid-fire Bible quiz minigame for LumenKids.
// Props: onComplete(score 0-100), onExit()

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { STORIES } from '../data/content.js';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------
const TOTAL_Q = STORIES.length; // 7
const SECONDS_PER_Q = 10;
const TICK_MS = 100;
const POINTS_CORRECT = 10;
const MAX_TIME_BONUS = 5;
const ADVANCE_DELAY_MS = 700;

// Max raw score: 7 × (10 + 5 + combo_bonus)
// Combo bonus per question = streak (capped at 3) — max total combo = 3*7=21 but realistic ~21
// We normalize to 0..100 by dividing by MAX_POSSIBLE (7*(10+5+3)) = 126 → capped at 100.
const MAX_POSSIBLE = TOTAL_Q * (POINTS_CORRECT + MAX_TIME_BONUS + 3); // 126

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function seededShuffle(arr, seed) {
  // Simple deterministic LCG shuffle — seed is a positive integer.
  const a = [...arr];
  let s = seed >>> 0;
  for (let i = a.length - 1; i > 0; i--) {
    s = (Math.imul(1664525, s) + 1013904223) >>> 0;
    const j = s % (i + 1);
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// ---------------------------------------------------------------------------
// Sub-components (pure, no hooks at module level — safe)
// ---------------------------------------------------------------------------
function TimerBar({ fraction }) {
  const pct = Math.max(0, Math.min(1, fraction));
  const color = pct > 0.5 ? '#4cde80' : pct > 0.25 ? '#f5a623' : '#e74c3c';
  return (
    <div
      style={{
        width: '100%',
        height: 16,
        background: '#dde3f0',
        borderRadius: 8,
        overflow: 'hidden',
        margin: '10px 0 18px',
      }}
    >
      <div
        style={{
          width: `${pct * 100}%`,
          height: '100%',
          background: color,
          borderRadius: 8,
          transition: 'width 0.1s linear, background 0.3s',
        }}
      />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------
export default function QuizRapido({ onComplete, onExit }) {
  // --- Seed is set once on mount ---
  const [seed] = useState(() => (Date.now() % 0xffff) + 1);
  const [order] = useState(() => seededShuffle(STORIES.map((_, i) => i), (Date.now() % 0xffff) + 1));

  // Game phases: 'playing' | 'finished'
  const [phase, setPhase] = useState('playing');

  // Current question index within `order` array (0-6)
  const [qi, setQi] = useState(0);

  // Countdown ticks remaining (each tick = TICK_MS ms)
  const maxTicks = (SECONDS_PER_Q * 1000) / TICK_MS;
  const [ticks, setTicks] = useState(maxTicks);

  // Feedback state: null | 'correct' | 'wrong'
  const [feedback, setFeedback] = useState(null);
  const [chosenIdx, setChosenIdx] = useState(null);

  // Score state
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(0);

  // onComplete guard — ensure called exactly once
  const completedRef = useRef(false);

  // Refs to allow stable callbacks
  const ticksRef = useRef(ticks);
  ticksRef.current = ticks;
  const feedbackRef = useRef(feedback);
  feedbackRef.current = feedback;
  const qiRef = useRef(qi);
  qiRef.current = qi;

  // ---------------------------------------------------------------------------
  // Advance to next question (or finish)
  // ---------------------------------------------------------------------------
  const advanceOrFinish = useCallback((nextScore, nextCombo) => {
    const nextQi = qiRef.current + 1;
    if (nextQi >= TOTAL_Q) {
      // Done — normalize score
      const normalized = Math.round(Math.min(100, (nextScore / MAX_POSSIBLE) * 100));
      setScore(nextScore);
      setPhase('finished');
      if (!completedRef.current) {
        completedRef.current = true;
        onComplete(normalized);
      }
    } else {
      setQi(nextQi);
      setTicks(maxTicks);
      setFeedback(null);
      setChosenIdx(null);
      setCombo(nextCombo);
      setScore(nextScore);
    }
  }, [onComplete, maxTicks]);

  // ---------------------------------------------------------------------------
  // Countdown timer
  // ---------------------------------------------------------------------------
  useEffect(() => {
    if (phase !== 'playing') return;
    if (feedback !== null) return; // Paused during feedback display

    const id = setInterval(() => {
      setTicks(prev => {
        if (prev <= 1) {
          // Time's up — treat as wrong answer
          clearInterval(id);
          // We need to trigger feedback from here — use a ref approach
          return 0;
        }
        return prev - 1;
      });
    }, TICK_MS);

    return () => clearInterval(id);
  }, [phase, feedback, qi]); // restart when question changes

  // Watch for ticks hitting 0 → timeout
  useEffect(() => {
    if (phase !== 'playing') return;
    if (feedback !== null) return;
    if (ticks > 0) return;

    // Timeout — wrong
    setFeedback('wrong');
    setChosenIdx(null);
    const newCombo = 0;
    setTimeout(() => {
      advanceOrFinish(score, newCombo);
    }, ADVANCE_DELAY_MS);
  }, [ticks, phase, feedback, score, advanceOrFinish]);

  // ---------------------------------------------------------------------------
  // Answer handler
  // ---------------------------------------------------------------------------
  const handleAnswer = useCallback((optIdx) => {
    if (feedback !== null) return; // Already answered

    const story = STORIES[order[qi]];
    const isCorrect = optIdx === story.answer;

    setFeedback(isCorrect ? 'correct' : 'wrong');
    setChosenIdx(optIdx);

    let gained = 0;
    let newCombo = combo;

    if (isCorrect) {
      const timeBonus = Math.round((ticks / maxTicks) * MAX_TIME_BONUS);
      const comboBonus = Math.min(newCombo + 1, 3); // combo 1-3
      gained = POINTS_CORRECT + timeBonus + comboBonus;
      newCombo = newCombo + 1;
    } else {
      newCombo = 0;
    }

    const nextScore = score + gained;

    setTimeout(() => {
      advanceOrFinish(nextScore, newCombo);
    }, ADVANCE_DELAY_MS);
  }, [feedback, order, qi, combo, ticks, maxTicks, score, advanceOrFinish]);

  // ---------------------------------------------------------------------------
  // Restart handler
  // ---------------------------------------------------------------------------
  const handleRestart = useCallback(() => {
    completedRef.current = false;
    // Re-shuffle by re-mounting: we set phase back but keep same seed for shuffle
    // Instead rebuild state manually.
    const newOrder = seededShuffle(STORIES.map((_, i) => i), (Date.now() % 0xffff) + 1);
    // We can't mutate `order` (it's const from useState), so we use a different key.
    // Easiest: reload via a key prop passed from parent? We don't control that.
    // Use a remountKey trick with a state counter to force re-init.
    setRemountKey(k => k + 1);
  }, []);

  const [remountKey, setRemountKey] = useState(0);

  // When remountKey changes, we want to reset everything.
  // We handle this by deriving the order from remountKey seed.
  const stableOrder = useRef(order);
  useEffect(() => {
    if (remountKey === 0) return;
    stableOrder.current = seededShuffle(STORIES.map((_, i) => i), (Date.now() % 0xffff) + remountKey);
    setQi(0);
    setTicks(maxTicks);
    setFeedback(null);
    setChosenIdx(null);
    setScore(0);
    setCombo(0);
    setPhase('playing');
  }, [remountKey, maxTicks]);

  // Use stableOrder.current when remountKey > 0, else the original order
  const effectiveOrder = remountKey > 0 ? stableOrder.current : order;

  // ---------------------------------------------------------------------------
  // Derived display values
  // ---------------------------------------------------------------------------
  const currentStory = STORIES[effectiveOrder[Math.min(qi, TOTAL_Q - 1)]];
  const timerFraction = ticks / maxTicks;

  // ---------------------------------------------------------------------------
  // Styles
  // ---------------------------------------------------------------------------
  const styles = {
    wrapper: {
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #1a1a4e 0%, #2d3578 60%, #1a3a6a 100%)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '16px',
      fontFamily: '"Segoe UI", "Comic Sans MS", Nunito, Arial, sans-serif',
    },
    card: {
      background: 'rgba(255,255,255,0.97)',
      borderRadius: 28,
      padding: '28px 24px',
      maxWidth: 520,
      width: '100%',
      boxShadow: '0 8px 40px rgba(0,0,0,0.35)',
    },
    header: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 4,
    },
    badge: (color) => ({
      background: color,
      color: '#fff',
      borderRadius: 20,
      padding: '4px 14px',
      fontWeight: 800,
      fontSize: 14,
    }),
    qLabel: {
      fontSize: 13,
      color: '#7a85a0',
      fontWeight: 700,
      textAlign: 'center',
      marginBottom: 2,
    },
    emoji: {
      textAlign: 'center',
      fontSize: 48,
      lineHeight: 1.1,
      margin: '6px 0 4px',
    },
    storyName: {
      textAlign: 'center',
      fontWeight: 800,
      fontSize: 20,
      color: '#2d3578',
      marginBottom: 6,
    },
    question: {
      textAlign: 'center',
      fontSize: 17,
      fontWeight: 700,
      color: '#1a1a3a',
      marginBottom: 4,
      lineHeight: 1.4,
    },
    optBtn: (idx, correctIdx, chosen, fb) => {
      let bg = '#eef1fb';
      let border = '2px solid #c8d0ec';
      let color = '#2d3578';
      let transform = 'scale(1)';

      if (fb !== null) {
        if (idx === correctIdx) {
          bg = '#d4f7e0';
          border = '2px solid #4cde80';
          color = '#1a5c34';
        } else if (idx === chosen && fb === 'wrong') {
          bg = '#fde0e0';
          border = '2px solid #e74c3c';
          color = '#7a0000';
        }
      }

      return {
        display: 'block',
        width: '100%',
        padding: '14px 18px',
        marginBottom: 10,
        borderRadius: 16,
        border,
        background: bg,
        color,
        fontSize: 16,
        fontWeight: 700,
        cursor: fb !== null ? 'default' : 'pointer',
        textAlign: 'left',
        transition: 'background 0.2s, border 0.2s, transform 0.1s',
        transform,
        boxShadow: fb === null ? '0 2px 6px rgba(0,0,0,0.07)' : 'none',
      };
    },
    comboTag: {
      textAlign: 'center',
      fontSize: 13,
      fontWeight: 800,
      color: '#e67e22',
      minHeight: 20,
      marginBottom: 2,
    },
    exitBtn: {
      background: 'transparent',
      border: 'none',
      color: '#7a85a0',
      fontSize: 13,
      fontWeight: 700,
      cursor: 'pointer',
      padding: '4px 8px',
      borderRadius: 8,
    },
    // Result screen
    resultWrapper: {
      textAlign: 'center',
    },
    trophy: {
      fontSize: 72,
      marginBottom: 8,
    },
    resultTitle: {
      fontSize: 26,
      fontWeight: 900,
      color: '#2d3578',
      marginBottom: 6,
    },
    resultScore: {
      fontSize: 52,
      fontWeight: 900,
      color: '#e67e22',
      lineHeight: 1,
      marginBottom: 4,
    },
    resultSub: {
      fontSize: 15,
      color: '#555',
      marginBottom: 24,
    },
    primaryBtn: {
      display: 'inline-block',
      background: 'linear-gradient(135deg, #f5a623, #e67e22)',
      color: '#fff',
      border: 'none',
      borderRadius: 20,
      padding: '14px 36px',
      fontSize: 17,
      fontWeight: 800,
      cursor: 'pointer',
      margin: '0 8px 12px',
      boxShadow: '0 4px 12px rgba(230,126,34,0.35)',
    },
    secondaryBtn: {
      display: 'inline-block',
      background: '#eef1fb',
      color: '#2d3578',
      border: '2px solid #c8d0ec',
      borderRadius: 20,
      padding: '12px 30px',
      fontSize: 16,
      fontWeight: 800,
      cursor: 'pointer',
      margin: '0 8px 12px',
    },
  };

  // ---------------------------------------------------------------------------
  // Render — Result screen
  // ---------------------------------------------------------------------------
  if (phase === 'finished') {
    const normalizedDisplay = Math.round(Math.min(100, (score / MAX_POSSIBLE) * 100));
    const stars =
      normalizedDisplay >= 90 ? 5
      : normalizedDisplay >= 70 ? 4
      : normalizedDisplay >= 50 ? 3
      : normalizedDisplay >= 30 ? 2
      : 1;
    const starStr = '⭐'.repeat(stars);

    return (
      <div style={styles.wrapper}>
        <div style={styles.card}>
          <div style={styles.resultWrapper}>
            <div style={styles.trophy}>🏆</div>
            <div style={styles.resultTitle}>¡Quiz terminado!</div>
            <div style={styles.resultScore}>{normalizedDisplay}</div>
            <div style={styles.resultSub}>puntos de sabiduría</div>
            <div style={{ fontSize: 32, marginBottom: 8 }}>{starStr}</div>
            <div style={{ fontSize: 15, color: '#555', marginBottom: 24 }}>
              {normalizedDisplay >= 80
                ? '¡Increíble! ¡Eres un experto bíblico!'
                : normalizedDisplay >= 50
                ? '¡Muy bien! Sigue aprendiendo.'
                : 'Buen intento, ¡practica más!'}
            </div>
            <div>
              <button style={styles.primaryBtn} onClick={handleRestart}>
                🔄 Jugar de nuevo
              </button>
              <button style={styles.secondaryBtn} onClick={onExit}>
                ← Volver
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // Render — Playing screen
  // ---------------------------------------------------------------------------
  const safeQi = Math.min(qi, TOTAL_Q - 1);

  return (
    <div style={styles.wrapper}>
      <div style={styles.card}>
        {/* Header row */}
        <div style={styles.header}>
          <span style={styles.badge('#2d3578')}>
            {safeQi + 1} / {TOTAL_Q}
          </span>
          <span style={styles.badge('#e67e22')}>
            {score} pts
          </span>
          <button style={styles.exitBtn} onClick={onExit}>
            ✕ Volver
          </button>
        </div>

        {/* Timer bar */}
        <TimerBar fraction={timerFraction} />

        {/* Story emoji & name */}
        <div style={styles.emoji}>{currentStory.emoji}</div>
        <div style={styles.storyName}>{currentStory.name}</div>

        {/* Question */}
        <div style={styles.question}>{currentStory.q}</div>

        {/* Combo indicator */}
        <div style={styles.comboTag}>
          {combo >= 2 ? `🔥 ¡Racha de ${combo}!` : ' '}
        </div>

        {/* Options */}
        <div style={{ marginTop: 8 }}>
          {currentStory.opts.map((opt, idx) => (
            <button
              key={`${currentStory.id}-opt-${idx}`}
              style={styles.optBtn(idx, currentStory.answer, chosenIdx, feedback)}
              onClick={() => handleAnswer(idx)}
              disabled={feedback !== null}
            >
              {['A', 'B', 'C'][idx]}. {opt}
            </button>
          ))}
        </div>

        {/* Feedback message */}
        <div
          style={{
            textAlign: 'center',
            fontSize: 16,
            fontWeight: 800,
            minHeight: 24,
            color: feedback === 'correct' ? '#1a5c34' : feedback === 'wrong' ? '#c0392b' : 'transparent',
          }}
        >
          {feedback === 'correct' && '✅ ¡Correcto!'}
          {feedback === 'wrong' && (chosenIdx === null ? '⏰ ¡Tiempo!' : '❌ Incorrecto')}
          {feedback === null && ' '}
        </div>
      </div>
    </div>
  );
}
