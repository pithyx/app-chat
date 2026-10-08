import { describe, expect, it } from 'vitest';
import { arrive, displayName } from './unread';

describe('arrive', () => {
  it('counts and notifies only for others while the window is hidden', () => {
    expect(arrive(0, false, false)).toEqual({ badge: 1, notify: true });
    expect(arrive(2, false, false)).toEqual({ badge: 3, notify: true });
    expect(arrive(2, true, false)).toEqual({ badge: 2, notify: false });
    expect(arrive(0, false, true)).toEqual({ badge: null, notify: false });
  });
});

describe('displayName', () => {
  it('prefers the directory display name', () => {
    const directory = new Map([
      ['rita', 'Rita Weber'],
      ['tom', null],
    ]);
    expect(displayName('rita', directory)).toBe('Rita Weber');
    expect(displayName('tom', directory)).toBe('tom');
    expect(displayName('ann', directory)).toBe('ann');
  });
});
