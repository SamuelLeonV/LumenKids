import { useState, useCallback } from 'react';
import { loadSave, persist, clearSave } from './lib/save.js';
import Login from './screens/Login.jsx';
import Aventura from './game/Aventura.jsx';
import Recompensas from './screens/Recompensas.jsx';

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

  const onWin = useCallback(() => {}, []);

  const recordScore = useCallback((key, score) => setSave(s => {
    const best = Math.max(s.rewards?.[key] || 0, score);
    const next = { ...s, rewards: { ...(s.rewards || { quiz: 0, memoria: 0, quien: 0 }), [key]: best } };
    persist(next);
    return next;
  }), []);

  const openRewards = useCallback(() => setScreen('rewards'), []);

  if (screen === 'game') {
    return (
      <Aventura
        character={character}
        onStar={onStar}
        onWin={onWin}
        onExit={onExit}
      />
    );
  }
  if (screen === 'rewards') {
    return <Recompensas save={save} onScore={recordScore} onExit={() => setScreen('login')} />;
  }
  return <Login onChoose={choose} savedCharacter={save.character} onReset={reset} onOpenRewards={openRewards} />;
}
