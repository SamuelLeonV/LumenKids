// src/lib/style.test.js
import { describe, it, expect } from 'vitest';
import { s } from './style.js';

describe('s()', () => {
  it('parses declarations and camel-cases props', () => {
    expect(s('position: absolute; background-color: #fff; z-index: 4'))
      .toEqual({ position: 'absolute', backgroundColor: '#fff', zIndex: '4' });
  });
  it('ignores empties', () => {
    expect(s('')).toEqual({});
    expect(s('color:red;;')).toEqual({ color: 'red' });
  });
  it('preserves CSS custom properties verbatim', () => {
    expect(s('--mx: 0px; color: red')).toEqual({ '--mx': '0px', color: 'red' });
  });
});
