import { useState, useCallback } from 'react';
import { loadSave, persist, clearSave } from './lib/save.js';
import Login from './screens/Login.jsx';

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

  if (screen === 'game') {
    // Placeholder until Task 5 adds <Aventura/>.
    return (
      <div style={{ padding: 40, fontFamily: 'Nunito, sans-serif' }}>
        <p>Juego (personaje: {character}) — pendiente Task 5</p>
        <button onClick={onExit}>⟵ Menú</button>
      </div>
    );
  }
  return <Login onChoose={choose} savedCharacter={save.character} />;
}
