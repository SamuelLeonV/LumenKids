// src/data/content.test.js
import { describe, it, expect } from 'vitest';
import { STORIES, CHARACTERS, MODALS } from './content.js';

describe('content', () => {
  it('has 7 stories, each well-formed', () => {
    expect(STORIES).toHaveLength(7);
    for (const s of STORIES) {
      expect(typeof s.id).toBe('string');
      expect(s.opts).toHaveLength(3);
      expect(s.answer).toBeGreaterThanOrEqual(0);
      expect(s.answer).toBeLessThan(3);
      expect(typeof s.story).toBe('string');
      expect(typeof s.q).toBe('string');
    }
  });
  it('has unique story ids', () => {
    expect(new Set(STORIES.map(s => s.id)).size).toBe(7);
  });
  it('has 3 characters and 4 modals', () => {
    expect(Object.keys(CHARACTERS)).toEqual(['ovejita', 'discipulo', 'nino']);
    expect(Object.keys(MODALS)).toEqual(['cross', 'dove', 'jesus', 'sheep']);
  });
});
