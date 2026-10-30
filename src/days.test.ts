import { describe, expect, it } from 'vitest';
import { byDay } from './days';

describe('byDay', () => {
  it('starts a group whenever the day changes and keeps the order', () => {
    const days = byDay(['1a', '1b', '2a', '1c'], (item) => item.slice(0, 1));
    expect(days).toEqual([
      { day: '1', items: ['1a', '1b'] },
      { day: '2', items: ['2a'] },
      { day: '1', items: ['1c'] },
    ]);
  });

  it('has no group without items', () => {
    expect(byDay([], String)).toEqual([]);
  });
});
