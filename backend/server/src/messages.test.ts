import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { cleanText, MAX_LENGTH, MessageStore } from './messages.ts';

const folders: string[] = [];

function store(): MessageStore {
  const folder = mkdtempSync(join(tmpdir(), 'chat-'));
  folders.push(folder);
  return new MessageStore(join(folder, 'chat.db'));
}

afterEach(() => {
  for (const folder of folders.splice(0)) {
    rmSync(folder, { recursive: true, force: true });
  }
});

describe('cleanText', () => {
  it('trims and refuses empty or too long texts', () => {
    expect(cleanText('  hi  ')).toBe('hi');
    expect(cleanText('   ')).toBeNull();
    expect(cleanText(42)).toBeNull();
    expect(cleanText('x'.repeat(MAX_LENGTH + 1))).toBeNull();
  });
});

describe('MessageStore', () => {
  it('keeps messages in order and lists the newest after an id', () => {
    const messages = store();
    const first = messages.add('rita', 'Hello', new Date('2026-10-08T10:00:00Z'));
    messages.add('tom', 'Hi Rita');
    messages.add('rita', 'Lunch?');

    expect(first).toEqual({ id: 1, user: 'rita', text: 'Hello', sentAt: '2026-10-08T10:00:00.000Z' });
    expect(messages.list().map((message) => message.text)).toEqual(['Hello', 'Hi Rita', 'Lunch?']);
    expect(messages.list(1).map((message) => message.user)).toEqual(['tom', 'rita']);
    expect(messages.list(0, 2).map((message) => message.text)).toEqual(['Hi Rita', 'Lunch?']);
    messages.close();
  });
});
