// src/minigames/QuienEs.jsx
// "¿Quién es?" — guessing-game minigame
// Props: onComplete(score: 0..100), onExit()

import { useState, useEffect, useRef } from 'react';
import { STORIES } from '../data/content.js';

// ------------------------------------------------------------------
// Helpers
// ------------------------------------------------------------------

/** Fisher-Yates shuffle — returns a NEW array */
function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** Build one round descriptor from a story + full story list */
function buildRound(story, allStories) {
  const correctName = story.name;
  // Pick 2 distinct distractors (names different from correct)
  const pool = shuffle(allStories.filter((s) => s.name !== correctName));
  const distractors = pool.slice(0, 2).map((s) => s.name);
  const options = shuffle([correctName, ...distractors]);
  return { story, options, correctName };
}

/** Build all 7 rounds in shuffled order */
function buildAllRounds() {
  return shuffle(STORIES).map((story) => buildRound(story, STORIES));
}

// Score: 7 correct = 98; each correct adds Math.floor(100/7) = 14 pts,
// last correct adds 100 - 14*6 = 16 pts so total is exactly 100.
const PTS_PER_ROUND = Math.floor(100 / STORIES.length); // 14
function computeScore(correctCount, totalRounds) {
  if (correctCount === 0) return 0;
  if (correctCount === totalRounds) return 100;
  return correctCount * PTS_PER_ROUND;
}

// ------------------------------------------------------------------
// Styles
// ------------------------------------------------------------------
const S = {
  root: {
    minHeight: '100vh',
    background: 'linear-gradient(160deg, #1a1a4e 0%, #2d2d8e 60%, #0f3460 100%)',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '24px 16px',
    fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
    color: '#fff',
    boxSizing: 'border-box',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    maxWidth: 600,
    marginBottom: 18,
  },
  title: {
    fontSize: 28,
    fontWeight: 900,
    letterSpacing: 1,
    textShadow: '0 2px 8px #0008',
    margin: 0,
  },
  progress: {
    fontSize: 16,
    fontWeight: 700,
    background: '#ffffff22',
    borderRadius: 999,
    padding: '4px 14px',
    whiteSpace: 'nowrap',
  },
  card: {
    background: 'rgba(255,255,255,0.10)',
    backdropFilter: 'blur(8px)',
    borderRadius: 24,
    padding: '30px 28px',
    maxWidth: 600,
    width: '100%',
    boxShadow: '0 8px 32px #0005',
    boxSizing: 'border-box',
  },
  emoji: {
    fontSize: 64,
    textAlign: 'center',
    marginBottom: 14,
    lineHeight: 1,
    display: 'block',
    filter: 'drop-shadow(0 4px 8px #0008)',
  },
  clueLabel: {
    fontSize: 13,
    fontWeight: 700,
    letterSpacing: 2,
    textTransform: 'uppercase',
    color: '#ffe066',
    marginBottom: 8,
  },
  clueText: {
    fontSize: 18,
    lineHeight: 1.6,
    color: '#f0f4ff',
    marginBottom: 22,
    background: '#ffffff0f',
    borderRadius: 12,
    padding: '14px 16px',
  },
  question: {
    fontSize: 20,
    fontWeight: 800,
    textAlign: 'center',
    marginBottom: 20,
    color: '#ffe066',
    textShadow: '0 1px 6px #0007',
  },
  optionsGrid: {
    display: 'flex',
    flexDirection: 'column',
    gap: 12,
  },
  optionBtn: (state) => ({
    padding: '16px 20px',
    borderRadius: 16,
    border: 'none',
    fontSize: 18,
    fontWeight: 800,
    cursor: state === 'idle' ? 'pointer' : 'default',
    transition: 'transform 0.12s, box-shadow 0.12s',
    outline: 'none',
    letterSpacing: 0.5,
    background:
      state === 'correct'
        ? 'linear-gradient(135deg, #38e05a, #1bab3c)'
        : state === 'wrong'
        ? 'linear-gradient(135deg, #ff5555, #c0181a)'
        : state === 'reveal'
        ? 'linear-gradient(135deg, #38e05a, #1bab3c)'
        : 'linear-gradient(135deg, #4f46e5, #7c3aed)',
    color: '#fff',
    boxShadow:
      state === 'idle'
        ? '0 4px 14px #0005'
        : '0 2px 8px #0004',
    transform: state === 'idle' ? 'translateY(0)' : 'translateY(2px)',
  }),
  feedback: (correct) => ({
    textAlign: 'center',
    marginTop: 18,
    fontSize: 22,
    fontWeight: 900,
    color: correct ? '#7fff9a' : '#ff8a8a',
    textShadow: '0 2px 8px #0007',
    minHeight: 32,
  }),
  nextBtn: {
    marginTop: 20,
    width: '100%',
    padding: '15px 0',
    borderRadius: 16,
    border: 'none',
    background: 'linear-gradient(135deg, #ffe066, #ffc200)',
    color: '#1a1a2e',
    fontSize: 18,
    fontWeight: 900,
    cursor: 'pointer',
    boxShadow: '0 4px 16px #ffc20055',
    letterSpacing: 0.5,
  },
  // Result screen
  resultRoot: {
    minHeight: '100vh',
    background: 'linear-gradient(160deg, #1a1a4e 0%, #2d2d8e 60%, #0f3460 100%)',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '32px 20px',
    fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
    color: '#fff',
    boxSizing: 'border-box',
    textAlign: 'center',
  },
  resultEmoji: {
    fontSize: 80,
    marginBottom: 10,
    display: 'block',
    filter: 'drop-shadow(0 4px 16px #0008)',
  },
  resultTitle: {
    fontSize: 36,
    fontWeight: 900,
    margin: '0 0 6px',
    textShadow: '0 2px 10px #0008',
    color: '#ffe066',
  },
  resultScore: {
    fontSize: 64,
    fontWeight: 900,
    lineHeight: 1,
    margin: '10px 0 6px',
    textShadow: '0 4px 16px #ffc20077',
    color: '#fff',
  },
  resultSub: {
    fontSize: 18,
    color: '#ccd6ff',
    marginBottom: 30,
  },
  resultBtnGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: 14,
    width: '100%',
    maxWidth: 340,
  },
  replayBtn: {
    padding: '16px 0',
    borderRadius: 16,
    border: 'none',
    background: 'linear-gradient(135deg, #ffe066, #ffc200)',
    color: '#1a1a2e',
    fontSize: 19,
    fontWeight: 900,
    cursor: 'pointer',
    boxShadow: '0 4px 16px #ffc20055',
  },
  exitBtn: {
    padding: '14px 0',
    borderRadius: 16,
    border: '2px solid #ffffff44',
    background: 'transparent',
    color: '#dde4ff',
    fontSize: 17,
    fontWeight: 700,
    cursor: 'pointer',
  },
  volverTopBtn: {
    padding: '8px 18px',
    borderRadius: 999,
    border: '2px solid #ffffff44',
    background: 'transparent',
    color: '#dde4ff',
    fontSize: 14,
    fontWeight: 700,
    cursor: 'pointer',
    flexShrink: 0,
  },
};

// ------------------------------------------------------------------
// Result Screen
// ------------------------------------------------------------------
function ResultScreen({ score, correct, total, onReplay, onExit }) {
  const pct = score;
  const star = pct === 100 ? '🌟' : pct >= 70 ? '🎉' : pct >= 40 ? '👍' : '💪';
  const msg =
    pct === 100
      ? '¡Perfecto! ¡Conoces todas las historias!'
      : pct >= 70
      ? '¡Muy bien hecho!'
      : pct >= 40
      ? '¡Buen intento, sigue practicando!'
      : '¡Sigue leyendo las historias!';

  return (
    <div style={S.resultRoot}>
      <span style={S.resultEmoji}>{star}</span>
      <h2 style={S.resultTitle}>¡Fin del juego!</h2>
      <div style={S.resultScore}>{pct}</div>
      <p style={S.resultSub}>
        {msg}
        <br />
        {correct} de {total} correctas
      </p>
      <div style={S.resultBtnGroup}>
        <button style={S.replayBtn} onClick={onReplay}>
          Jugar de nuevo
        </button>
        <button style={S.exitBtn} onClick={onExit}>
          Volver
        </button>
      </div>
    </div>
  );
}

// ------------------------------------------------------------------
// Main Component
// ------------------------------------------------------------------
export default function QuienEs({ onComplete, onExit }) {
  const [rounds, setRounds] = useState(() => buildAllRounds());
  const [roundIdx, setRoundIdx] = useState(0);
  // 'idle' | 'answered'
  const [phase, setPhase] = useState('idle');
  const [selectedOption, setSelectedOption] = useState(null);
  const [correctCount, setCorrectCount] = useState(0);
  const [finished, setFinished] = useState(false);
  const completedRef = useRef(false);

  const totalRounds = rounds.length; // always 7

  // When finished, fire onComplete exactly once
  useEffect(() => {
    if (finished && !completedRef.current) {
      completedRef.current = true;
      const finalScore = computeScore(correctCount, totalRounds);
      onComplete(finalScore);
    }
  }, [finished, correctCount, totalRounds, onComplete]);

  function handleOptionClick(optionName) {
    if (phase !== 'idle') return;
    const round = rounds[roundIdx];
    const isCorrect = optionName === round.correctName;
    setSelectedOption(optionName);
    setPhase('answered');
    if (isCorrect) {
      setCorrectCount((c) => c + 1);
    }
  }

  function handleNext() {
    const nextIdx = roundIdx + 1;
    if (nextIdx >= totalRounds) {
      setFinished(true);
    } else {
      setRoundIdx(nextIdx);
      setPhase('idle');
      setSelectedOption(null);
    }
  }

  function handleReplay() {
    completedRef.current = false;
    setRounds(buildAllRounds());
    setRoundIdx(0);
    setPhase('idle');
    setSelectedOption(null);
    setCorrectCount(0);
    setFinished(false);
  }

  if (finished) {
    const score = computeScore(correctCount, totalRounds);
    return (
      <ResultScreen
        score={score}
        correct={correctCount}
        total={totalRounds}
        onReplay={handleReplay}
        onExit={onExit}
      />
    );
  }

  const round = rounds[roundIdx];
  const isCorrect = phase === 'answered' && selectedOption === round.correctName;

  return (
    <div style={S.root}>
      {/* Header */}
      <div style={S.header}>
        <h1 style={S.title}>¿Quién es?</h1>
        <span style={S.progress}>
          {roundIdx + 1} / {totalRounds}
        </span>
        <button
          style={S.volverTopBtn}
          onClick={onExit}
          aria-label="Volver"
        >
          Volver
        </button>
      </div>

      {/* Game card */}
      <div style={S.card}>
        {/* Story emoji */}
        <span style={S.emoji} role="img" aria-label={round.story.name}>
          {round.story.emoji}
        </span>

        {/* Clue */}
        <div style={S.clueLabel}>Pista</div>
        <div style={S.clueText}>{round.story.story}</div>

        {/* Question */}
        <div style={S.question}>¿De quién habla esta historia?</div>

        {/* Options */}
        <div style={S.optionsGrid}>
          {round.options.map((optName) => {
            let state = 'idle';
            if (phase === 'answered') {
              if (optName === round.correctName) {
                state = selectedOption === optName ? 'correct' : 'reveal';
              } else if (optName === selectedOption) {
                state = 'wrong';
              }
            }
            return (
              <button
                key={optName}
                style={S.optionBtn(state)}
                onClick={() => handleOptionClick(optName)}
                disabled={phase === 'answered'}
              >
                {optName}
              </button>
            );
          })}
        </div>

        {/* Feedback */}
        {phase === 'answered' && (
          <>
            <div style={S.feedback(isCorrect)}>
              {isCorrect ? '¡Correcto! 🎉' : `¡Era ${round.correctName}! 😊`}
            </div>
            <button style={S.nextBtn} onClick={handleNext}>
              {roundIdx + 1 < totalRounds ? 'Siguiente →' : '¡Ver resultado!'}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
