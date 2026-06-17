import { useState, useCallback } from 'react';
import { loadSave, persist } from './lib/save.js';
import Login from './screens/Login.jsx';
import Aventura from './game/Aventura.jsx';

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

  const onWin = useCallback(() => {}, []);

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
  return <Login onChoose={choose} savedCharacter={save.character} />;
}
