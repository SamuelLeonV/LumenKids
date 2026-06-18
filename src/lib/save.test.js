// @vitest-environment jsdom
// src/lib/save.test.js
import { describe, it, expect, beforeEach } from 'vitest';
import { loadSave, persist, clearSave } from './save.js';

beforeEach(() => localStorage.clear());

describe('save', () => {
  it('returns defaults when empty', () => {
    expect(loadSave()).toEqual({ character: null, stars: 0, solved: [], rewards: { quiz: 0, memoria: 0, quien: 0 } });
  });
  it('round-trips a save', () => {
    persist({ character: 'nino', stars: 2, solved: ['noe', 'david'], rewards: { quiz: 0, memoria: 0, quien: 0 } });
    expect(loadSave()).toEqual({ character: 'nino', stars: 2, solved: ['noe', 'david'], rewards: { quiz: 0, memoria: 0, quien: 0 } });
  });
  it('round-trips rewards best-scores', () => {
    persist({ character: 'nino', stars: 1, solved: ['noe'], rewards: { quiz: 80, memoria: 45, quien: 100 } });
    expect(loadSave().rewards).toEqual({ quiz: 80, memoria: 45, quien: 100 });
  });
  it('defaults missing/corrupt rewards to zeros', () => {
    localStorage.setItem('lumenkids.save', JSON.stringify({ character: 'nino', stars: 1, solved: [], rewards: { quiz: 'x' } }));
    expect(loadSave().rewards).toEqual({ quiz: 0, memoria: 0, quien: 0 });
  });
  it('returns defaults on corrupt data', () => {
    localStorage.setItem('lumenkids.save', 'not json');
    expect(loadSave()).toEqual({ character: null, stars: 0, solved: [], rewards: { quiz: 0, memoria: 0, quien: 0 } });
  });
  it('clearSave wipes it', () => {
    persist({ character: 'nino', stars: 1, solved: ['noe'] });
    clearSave();
    expect(loadSave().character).toBe(null);
  });
});
