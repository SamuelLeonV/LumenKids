// @vitest-environment jsdom
// src/lib/save.test.js
import { describe, it, expect, beforeEach } from 'vitest';
import { loadSave, persist, clearSave } from './save.js';

beforeEach(() => localStorage.clear());

describe('save', () => {
  it('returns defaults when empty', () => {
    expect(loadSave()).toEqual({ character: null, stars: 0, solved: [] });
  });
  it('round-trips a save', () => {
    persist({ character: 'nino', stars: 2, solved: ['noe', 'david'] });
    expect(loadSave()).toEqual({ character: 'nino', stars: 2, solved: ['noe', 'david'] });
  });
  it('returns defaults on corrupt data', () => {
    localStorage.setItem('lumenkids.save', 'not json');
    expect(loadSave()).toEqual({ character: null, stars: 0, solved: [] });
  });
  it('clearSave wipes it', () => {
    persist({ character: 'nino', stars: 1, solved: ['noe'] });
    clearSave();
    expect(loadSave().character).toBe(null);
  });
});
